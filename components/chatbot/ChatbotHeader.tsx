'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';

interface ChatbotHeaderProps {
  title: string;
}

export function ChatbotHeader({ title }: ChatbotHeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <div className="flex items-center space-x-4">
          <Link href="/changelog" className="text-sm text-gray-600 hover:text-gray-900">
            Changelog
          </Link>
          <Link href="/docs" className="text-sm text-gray-600 hover:text-gray-900">
            Docs
          </Link>
          <Link href="/help" className="text-sm text-gray-600 hover:text-gray-900">
            Help
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all">
                <AvatarImage
                  src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || undefined}
                />
                <AvatarFallback>
                  {(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'U')
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="p-3 border-b">
                <p className="font-medium text-sm text-gray-900">
                  {user?.user_metadata?.full_name ||
                    user?.user_metadata?.name ||
                    user?.email?.split('@')[0] ||
                    'User'}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center w-full cursor-pointer">
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center w-full cursor-pointer">
                  Account settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center gap-2 text-red-600 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}