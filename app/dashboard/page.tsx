'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MessageCircle, Calendar, Settings, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Chat {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  status: 'draft' | 'training' | 'ready' | 'disabled';
  total_messages: number;
  total_conversations: number;
  created_at: string;
  updated_at: string;
}

export default function AgentsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const supabase = createClient();
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Please log in to view your chats');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/chats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const data = await response.json();
      setChats(data.chats || []);
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError('Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: Chat['status']) => {
    const statusConfig = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
      training: { label: 'Training', className: 'bg-yellow-100 text-yellow-800' },
      ready: { label: 'Ready', className: 'bg-green-100 text-green-800' },
      disabled: { label: 'Disabled', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status];
    return (
      <Badge className={`${config.className} text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-left">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Agents</h1>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-left">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Agents</h1>
        </div>
        <div className="text-center py-16">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchChats} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
        <Link href="/dashboard/create/files">
          <Button className="bg-black hover:bg-gray-800 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New AI agent
          </Button>
        </Link>
      </div>

      {chats.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16">
          <div className="mb-8 flex justify-center">
            <img 
              src="/no-agents.webp" 
              alt="No agents illustration" 
              className="w-[35vw] h-auto"
            />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-3">No agents yet..</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Create your first AI Agent to start automating support, 
            generating leads, and answering customer questions.
          </p>
        </div>
      ) : (
        /* Chats Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chats.map((chat) => (
            <div key={chat.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    {chat.avatar_url ? (
                      <img 
                        src={chat.avatar_url} 
                        alt={chat.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {chat.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {chat.description || 'No description'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="p-1">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between mb-4">
                {getStatusBadge(chat.status)}
                <span className="text-xs text-gray-500 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(chat.updated_at)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                <span>{chat.total_conversations} conversations</span>
                <span>{chat.total_messages} messages</span>
              </div>

              <div className="flex space-x-2">
                <Link href={`/chatbot/${chat.id}/playground`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </Link>
                {chat.status === 'ready' && (
                  <Button size="sm" className="bg-black hover:bg-gray-800 text-white">
                    View
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}