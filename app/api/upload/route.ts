import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chatId = formData.get('chatId') as string;
    const sourceId = formData.get('sourceId') as string;

    if (!file || !chatId || !sourceId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, chatId, sourceId' },
        { status: 400 }
      );
    }

    console.log('Uploading file:', {
      fileName: file.name,
      fileSize: file.size,
      chatId,
      sourceId,
      userId: user.id
    });

    // Create the storage path: users/{userId}/chats/{chatId}/sources/{sourceId}/filename.pdf
    const storageKey = `users/${user.id}/chats/${chatId}/sources/${sourceId}/${file.name}`;
    
    // Convert file to array buffer
    const fileBuffer = await file.arrayBuffer();

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('docs')
      .upload(storageKey, fileBuffer, {
        contentType: file.type,
        upsert: false // Don't overwrite if exists
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { 
          error: 'Failed to upload file to storage',
          details: uploadError.message
        },
        { status: 500 }
      );
    }

    console.log('File uploaded successfully with key:', uploadData.path);
    console.log('Storage key to save in DB:', storageKey);

    // Update the knowledge_source record with the storage key (not the full URL)
    const { data: updateData, error: updateError } = await supabase
      .from('knowledge_sources')
      .update({
        file_url: storageKey, // Save only the storage key, not the full URL
        status: 'processing' // Change from 'upload_pending' to 'processing'
      })
      .eq('id', sourceId)
      .eq('chat_id', chatId) // Extra security check
      .select()
      .single();

    if (updateError) {
      console.error('Error updating knowledge_source:', updateError);
      return NextResponse.json(
        { 
          error: 'File uploaded but failed to update database',
          details: updateError.message,
          storageKey: storageKey
        },
        { status: 500 }
      );
    }

    console.log('Knowledge source updated:', updateData);

    // Call the ingest microservice to process the file
    try {
      const ingestServiceUrl = process.env.INGEST_SERVICE_URL;
      if (!ingestServiceUrl) {
        console.warn('INGEST_SERVICE_URL not configured, skipping ingest call');
      } else {
        const ingestUrl = `${ingestServiceUrl}/chats/${chatId}/sources/${sourceId}/ingest`;
        console.log('Calling ingest service:', ingestUrl);

        const ingestResponse = await fetch(ingestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (ingestResponse.ok) {
          const ingestData = await ingestResponse.json();
          console.log('Ingest service called successfully:', ingestData);
        } else {
          console.error('Ingest service call failed:', ingestResponse.status, ingestResponse.statusText);
          const errorText = await ingestResponse.text();
          console.error('Ingest service error details:', errorText);
        }
      }
    } catch (ingestError) {
      console.error('Error calling ingest service:', ingestError);
      // Don't fail the whole upload if ingest fails
    }

    return NextResponse.json({ 
      success: true,
      storageKey: storageKey,
      uploadedPath: uploadData.path,
      knowledgeSource: updateData,
      message: 'File uploaded, knowledge source updated, and ingest service called'
    });

  } catch (error) {
    console.error('Unexpected error during upload:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}