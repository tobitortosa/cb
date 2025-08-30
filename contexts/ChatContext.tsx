'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';

interface ChatData {
  id: string;
  name: string;
  model: string;
  temperature: number;
  description?: string;
  welcome_message?: string;
  placeholder_text?: string;
  system_prompt?: string;
  system_prompt_type?: string;
  max_tokens?: number;
  primary_color?: string;
  background_color?: string;
  font_family?: string;
  enable_web_search?: boolean;
  enable_file_search?: boolean;
  collect_emails?: boolean;
  show_sources?: boolean;
  enable_voice?: boolean;
  status?: string;
}

interface ChatContextType {
  chatData: ChatData | null;
  isLoading: boolean;
  error: string | null;
  updateChatData: (updates: Partial<ChatData>) => Promise<void>;
  refreshChatData: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const chatId = params?.id as string;
  const supabase = createClient();

  const fetchChatData = async () => {
    if (!chatId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/chats/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load chat data');
      }

      const data = await response.json();
      if (data.success && data.chat) {
        setChatData(data.chat);
      } else {
        throw new Error('Invalid chat data received');
      }
    } catch (err) {
      console.error('Error loading chat data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chat data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateChatData = async (updates: Partial<ChatData>) => {
    if (!chatId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update chat data');
      }

      const data = await response.json();
      if (data.success && data.chat) {
        // Update local state with the returned data
        setChatData(prev => ({
          ...prev,
          ...data.chat
        } as ChatData));
      }
    } catch (err) {
      console.error('Error updating chat data:', err);
      throw err;
    }
  };

  const refreshChatData = async () => {
    await fetchChatData();
  };

  // Load chat data on mount and when chatId changes
  useEffect(() => {
    fetchChatData();
  }, [chatId]);

  return (
    <ChatContext.Provider value={{
      chatData,
      isLoading,
      error,
      updateChatData,
      refreshChatData
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}