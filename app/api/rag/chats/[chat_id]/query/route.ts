// app/api/rag/chats/[chat_id]/query/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type RagSource = {
  chunk_id: string;
  kind: 'text' | 'table' | 'img_text';
  page?: number | null;
  score: number;
  // Para UI: contenido mostrable directo
  preview?: string;        // texto para 'text' o 'img_text'
  html?: string;           // HTML para 'table'
  plain_preview?: string;  // versión textual de la tabla si viene
  // (metadata opcional; no usamos para devolver imágenes)
  image_uid?: string;
  bbox?: number[];
  bbox_norm?: number[];
  order_index?: number;
  tags?: string[];
  objects?: string[];
  colors?: Record<string, any>;
  w?: number;
  h?: number;
  dpi_used?: number;
};

type RagResponse = {
  answer: string;          // HTML simple
  sources: RagSource[];
  used_top_k: number;
  img_mix_k?: number;
  model_used: string;
  // nuevos campos del service (opcionales para compat)
  temperature_used?: number;
  max_tokens_used?: number;
  prompt_mode_used?: 'merge' | 'replace' | 'core_only';
  system_messages_count?: number;
};

type ClientSource = RagSource & {
  content: string; // campo conveniente para el front (preview/plain_preview/html)
};

export async function POST(
  request: NextRequest,
  { params }: { params: { chat_id: string } }
) {
  console.log('RAG Query endpoint called for chat:', params.chat_id);

  try {
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    console.log('Auth check:', { hasSession: !!session, authError });

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      messages,
      top_k = 8,
      model,
      temperature,
      system_prompt,
      system_prompt_mode = 'merge',
      max_tokens,
    } = body ?? {};

    console.log('Request body:', {
      messagesCount: messages?.length,
      top_k,
      hasSystemPrompt: !!system_prompt,
      system_prompt_mode,
      model,
      temperature,
      max_tokens,
    });

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user') {
      return NextResponse.json({ error: 'Last message must be from user' }, { status: 400 });
    }

    const API_BASE = process.env.INGEST_SERVICE_URL!;
    const url = `${API_BASE}/rag/chats/${params.chat_id}/query`;
    console.log('Calling backend service:', url);

    // Armamos el body solo con los campos definidos (evitamos mandar undefined)
    const reqPayload: Record<string, any> = { messages, top_k };

    if (model) reqPayload.model = model;
    if (typeof temperature === 'number') reqPayload.temperature = temperature;
    if (typeof max_tokens === 'number') reqPayload.max_tokens = max_tokens;

    // Si viene un template/persona, lo pasamos; si es string vacío/whitespace, NO lo mandamos
    if (typeof system_prompt === 'string' && system_prompt.trim().length > 0) {
      reqPayload.system_prompt = system_prompt;
    }
    if (typeof system_prompt_mode === 'string') {
      reqPayload.system_prompt_mode = system_prompt_mode; // 'merge' | 'replace' | 'core_only'
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(reqPayload),
    });

    console.log('Backend response status:', resp.status);

    const data: RagResponse | { detail?: string; error?: string } = await resp.json().catch((err) => {
      console.error('Failed to parse response JSON:', err);
      return {} as any;
    });

    if (!resp.ok) {
      console.error('Backend error:', data);
      return NextResponse.json(
        { error: (data as any)?.detail || (data as any)?.error || 'RAG backend error' },
        { status: resp.status }
      );
    }

    const ragData = data as RagResponse;

    // Normalizamos los sources para el front:
    // content = prioridad: preview > plain_preview > html > ''
    const processedSources: ClientSource[] = (ragData.sources || []).map((s) => ({
      ...s,
      content: s.preview || s.plain_preview || s.html || '',
    }));

    const response = {
      answer: ragData.answer,
      sources: processedSources,
      used_top_k: ragData.used_top_k,
      model_used: ragData.model_used,
      img_mix_k: ragData.img_mix_k,
      temperature_used: ragData.temperature_used,
      max_tokens_used: ragData.max_tokens_used,
      prompt_mode_used: ragData.prompt_mode_used,
      system_messages_count: ragData.system_messages_count,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('RAG proxy error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}