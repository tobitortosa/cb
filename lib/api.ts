import { createClient } from '@/lib/supabase/client';

export interface CreateTextSnippetRequest {
  title: string;
  content: string;
}

export interface CreateTextSnippetResponse {
  ok: boolean;
  source_id: string;
  characters: number;
}

export async function createTextSnippet(
  chatId: string,
  request: CreateTextSnippetRequest
): Promise<CreateTextSnippetResponse> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`/api/chats/${chatId}/sources:text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to create text snippet: ${response.statusText}`);
  }

  return response.json();
}