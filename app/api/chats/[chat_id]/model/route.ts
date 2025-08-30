import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { chat_id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { model } = body ?? {};

    if (!model || typeof model !== 'string') {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 });
    }

    // Update the chat model in the database
    const { data: chat, error: updateError } = await supabase
      .from('chats')
      .update({ 
        model,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.chat_id)
      .eq('user_id', session.user.id) // Ensure user owns the chat
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ error: 'Failed to update chat model' }, { status: 500 });
    }

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      chat: {
        id: chat.id,
        model: chat.model,
        updated_at: chat.updated_at
      }
    });

  } catch (error) {
    console.error('Chat model update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}