import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const INGEST_SERVICE_URL = process.env.INGEST_SERVICE_URL ?? '';
const RAG_SERVICE_TOKEN = process.env.RAG_SERVICE_TOKEN ?? '';

type IncomingFile = { name: string; size?: number; file_url?: string | null };
type IncomingText = { title: string; content: string };

async function ragFetch(path: string, opts: RequestInit, userBearer?: string) {
  if (!INGEST_SERVICE_URL) {
    throw new Error('INGEST_SERVICE_URL no configurado');
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string>),
  };
  // Preferimos token del usuario; si no hay, usamos service token
  const bearer = userBearer || RAG_SERVICE_TOKEN;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  const res = await fetch(`${INGEST_SERVICE_URL}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.detail || json?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select(`
        id,
        name,
        description,
        avatar_url,
        status,
        total_messages,
        total_conversations,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (chatsError) {
      console.error('Error fetching chats:', chatsError);
      return NextResponse.json({ error: 'Failed to fetch chats', details: chatsError.message }, { status: 500 });
    }

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // auth + token para reenviar al FastAPI
    const [{ data: { user }, error: userError }, { data: { session } }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ]);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }
    const userBearer = session?.access_token;

    // validar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found. Please complete your profile setup first.', details: profileError?.message },
        { status: 400 }
      );
    }

    // body
    const body = await request.json();
    const {
      chatId,                     // nuevo: para reentrenamiento
      name,
      description,
      file,                       // compat: archivo único
      files = [] as IncomingFile[],
      texts = [] as IncomingText[],
    } = body ?? {};

    // normalizo "file" → files[]
    const allFiles: IncomingFile[] = [
      ...(Array.isArray(files) ? files : []),
      ...(file && file.name ? [file as IncomingFile] : []),
    ];

    let chat;

    if (chatId) {
      // Modo reentrenamiento: verificar que el chat existe y pertenece al usuario
      const { data: existingChat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .eq('user_id', user.id)
        .single();

      if (chatError || !existingChat) {
        return NextResponse.json(
          { error: 'Chat not found or access denied', details: chatError?.message },
          { status: 404 }
        );
      }

      chat = existingChat;
      console.log('Retraining existing chat:', chat.id);
    } else {
      // Modo creación: crear nuevo chat
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          name: (name || 'New Chatbot').toString(),
          description: (description || 'A new AI assistant').toString(),
          system_prompt: `
        ### Role
        - Primary Function: You are an AI chatbot who helps users with their inquiries, issues and requests. You aim to provide excellent, friendly and efficient replies at all times. Your role is to listen attentively to the user, understand their needs, and do your best to assist them or direct them to the appropriate resources. If a question is not clear, ask clarifying questions. Make sure to end your replies with a positive note.
                
        ### Constraints
        1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
        2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to the training data.
        3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
        4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to your role and training data.`,
          system_prompt_type: 'AI agent',
          temperature: 0.20
        })
        .select()
        .single();

      if (chatError || !newChat) {
        return NextResponse.json(
          { error: 'Failed to create chat', details: chatError?.message, code: chatError?.code },
          { status: 500 }
        );
      }

      chat = newChat;
      console.log('Created new chat:', chat.id);
    }

    // ================= TEXTS =================
    // Usa tu ruta: POST /chats/{chat_id}/sources:text  (crea + ingesta)
    const textResults: Array<{ source_id: string; ok?: boolean; error?: string; characters?: number }> = [];
    for (const t of (texts as IncomingText[])) {
      if (!t?.title || !t?.content) continue;
      try {
        const res = await ragFetch(`/chats/${chat.id}/sources:text`, {
          method: 'POST',
          body: JSON.stringify({ title: t.title, content: t.content }),
        }, userBearer);
        textResults.push({ source_id: res.source_id, ok: true, characters: res.characters });
      } catch (e: any) {
        textResults.push({ source_id: '', ok: false, error: e?.message || 'text create failed' });
      }
    }

    // ================= FILES =================
    // Flujo:
    // 1) POST /chats/{chat_id}/sources/init  => source_id (status=upload_pending) para archivos nuevos
    // 2) (si ya tenemos file_url) PATCH /chats/{chat_id}/sources/{source_id} => dispara ingesta en bg
    // 3) En modo retrain, también re-procesar archivos existentes
    const fileResults: Array<{
      name: string;
      source_id?: string;
      status: 'upload_pending' | 'processing' | 'failed' | 'existing';
      error?: string;
    }> = [];

    // Si es modo reentrenamiento, obtener archivos existentes y marcarlos para re-procesamiento
    if (chatId) {
      try {
        const { data: existingSources, error: existingError } = await supabase
          .from('knowledge_sources')
          .select('*')
          .eq('chat_id', chatId)
          .eq('type', 'file')
          .eq('status', 'active');

        if (!existingError && existingSources) {
          for (const existingSource of existingSources) {
            // Disparar re-ingest para archivos existentes
            try {
              await ragFetch(`/chats/${chat.id}/sources/${existingSource.id}/ingest`, {
                method: 'POST',
                body: JSON.stringify({}),
              }, userBearer);
              
              fileResults.push({ 
                name: existingSource.file_name || existingSource.name, 
                source_id: existingSource.id, 
                status: 'existing' 
              });
              console.log(`Re-triggered ingest for existing file: ${existingSource.name}`);
            } catch (e: any) {
              console.error(`Failed to re-trigger ingest for ${existingSource.name}:`, e.message);
              fileResults.push({ 
                name: existingSource.file_name || existingSource.name, 
                source_id: existingSource.id, 
                status: 'failed',
                error: e.message 
              });
            }
          }
        }
      } catch (error) {
        console.error('Error processing existing sources:', error);
      }
    }

    for (const f of allFiles) {
      if (!f?.name) continue;
      try {
        // paso 1: init
        const init = await ragFetch(`/chats/${chat.id}/sources/init`, {
          method: 'POST',
          body: JSON.stringify({ name: f.name }),
        }, userBearer);

        const sourceId = init.source_id as string;

        // si ya vino file_url, confirmamos y disparamos ingesta
        if (f.file_url) {
          try {
            await ragFetch(`/chats/${chat.id}/sources/${sourceId}`, {
              method: 'PATCH',
              body: JSON.stringify({
                file_url: f.file_url,
                file_name: f.name,
                file_size: f.size ?? null,
              }),
            }, userBearer);

            fileResults.push({ name: f.name, source_id: sourceId, status: 'processing' });
          } catch (err: any) {
            fileResults.push({
              name: f.name,
              source_id: sourceId,
              status: 'failed',
              error: err?.message || 'confirm failed',
            });
          }
        } else {
          // si no hay file_url todavía, devolvemos upload_pending para que el cliente suba y luego haga el PATCH
          fileResults.push({ name: f.name, source_id: sourceId, status: 'upload_pending' });
        }
      } catch (e: any) {
        fileResults.push({ name: f.name, status: 'failed', error: e?.message || 'init failed' });
      }
    }

    const uploadPendingCount = fileResults.filter(f => f.status === 'upload_pending').length;
    const existingCount = fileResults.filter(f => f.status === 'existing').length;
    
    let note;
    if (uploadPendingCount > 0) {
      note = 'Hay archivos en upload_pending: subí al bucket y luego llama al PATCH /chats/{chat_id}/sources/{source_id}.';
    } else if (chatId && existingCount > 0) {
      note = `Reentrenamiento iniciado: ${existingCount} archivo(s) existente(s) re-procesándose.`;
    }

    return NextResponse.json({
      chat,
      files: fileResults,
      texts: textResults,
      note,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: `${error}` },
      { status: 500 }
    );
  }
}
