import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { chat_id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the chat data from the database
    const { data: chat, error: fetchError } = await supabase
      .from('chats')
      .select('id, name, model, temperature, description, welcome_message, placeholder_text, system_prompt, system_prompt_type')
      .eq('id', params.chat_id)
      .eq('user_id', session.user.id) // Ensure user owns the chat
      .single();

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch chat data' }, { status: 500 });
    }

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      chat
    });

  } catch (error) {
    console.error('Chat fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { model, temperature, name, system_prompt, system_prompt_type } = body ?? {};

    // Validation
    if (model !== undefined && (typeof model !== 'string' || !model)) {
      return NextResponse.json({ error: 'Model must be a non-empty string' }, { status: 400 });
    }

    if (temperature !== undefined && (typeof temperature !== 'number' || temperature < 0 || temperature > 1)) {
      return NextResponse.json({ error: 'Temperature must be a number between 0 and 1' }, { status: 400 });
    }

    if (name !== undefined && (typeof name !== 'string' || !name)) {
      return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 });
    }

    if (system_prompt !== undefined && typeof system_prompt !== 'string') {
      return NextResponse.json({ error: 'System prompt must be a string' }, { status: 400 });
    }

    if (system_prompt_type !== undefined && typeof system_prompt_type !== 'string') {
      return NextResponse.json({ error: 'System prompt type must be a string' }, { status: 400 });
    }

    // Build update object dynamically
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (model !== undefined) {
      updateData.model = model;
    }
    
    if (temperature !== undefined) {
      updateData.temperature = temperature;
    }
    
    if (name !== undefined) {
      updateData.name = name;
    }

    if (system_prompt !== undefined) {
      updateData.system_prompt = system_prompt;
    }

    if (system_prompt_type !== undefined) {
      updateData.system_prompt_type = system_prompt_type;
    }

    // Update the chat in the database
    const { data: chat, error: updateError } = await supabase
      .from('chats')
      .update(updateData)
      .eq('id', params.chat_id)
      .eq('user_id', session.user.id) // Ensure user owns the chat
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
    }

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      chat: {
        id: chat.id,
        model: chat.model,
        temperature: chat.temperature,
        system_prompt: chat.system_prompt,
        system_prompt_type: chat.system_prompt_type,
        updated_at: chat.updated_at
      }
    });

  } catch (error) {
    console.error('Chat update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}