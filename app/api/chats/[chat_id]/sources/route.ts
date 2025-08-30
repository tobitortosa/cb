import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: { chat_id: string } }
) {
  try {
    const supabase = await createClient();
    const chatId = params.chat_id;

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    // Verify chat belongs to user
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id, user_id')
      .eq('id', chatId)
      .eq('user_id', user.id)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Chat not found or access denied' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { source_ids } = body;

    if (!source_ids || !Array.isArray(source_ids) || source_ids.length === 0) {
      return NextResponse.json({ error: 'source_ids array is required' }, { status: 400 });
    }

    console.log(`Deleting ${source_ids.length} sources from chat ${chatId}`);

    // Verify all sources belong to this chat and user
    const { data: sourcesToDelete, error: sourcesError } = await supabase
      .from('knowledge_sources')
      .select('id, name, type')
      .eq('chat_id', chatId)
      .in('id', source_ids);

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError);
      return NextResponse.json({ error: 'Error fetching sources' }, { status: 500 });
    }

    if (!sourcesToDelete || sourcesToDelete.length === 0) {
      return NextResponse.json({ error: 'No sources found to delete' }, { status: 404 });
    }

    // Delete sources from database (chunks will be deleted automatically via CASCADE)
    const { error: deleteError } = await supabase
      .from('knowledge_sources')
      .delete()
      .eq('chat_id', chatId)
      .in('id', source_ids);

    if (deleteError) {
      console.error('Error deleting sources from database:', deleteError);
      return NextResponse.json({ error: 'Failed to delete sources' }, { status: 500 });
    }

    console.log(`Successfully deleted ${sourcesToDelete.length} sources from database`);

    return NextResponse.json({
      success: true,
      deleted_count: sourcesToDelete.length,
      deleted_sources: sourcesToDelete,
      message: `Successfully deleted ${sourcesToDelete.length} source(s)`
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /chats/[chat_id]/sources:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
