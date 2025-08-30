'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageSquare, Bot, BarChart3, Settings, FileText, Globe, HelpCircle, User, ChevronDown, Plus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { SourcesProvider } from '@/contexts/SourcesContext';

const sidebarItems = [
  { icon: Bot, label: 'Agents', href: '/dashboard' },
  { icon: BarChart3, label: 'Usage', href: '/dashboard/usage' },
  { icon: Settings, label: 'Workspace settings', href: '/dashboard/settings', hasSubmenu: true },
];

const createItems = [
  { icon: FileText, label: 'Files', href: '/dashboard/create/files' },
  { icon: FileText, label: 'Text', href: '/dashboard/create/text' },
  { icon: Globe, label: 'Website', href: '/dashboard/create/website' },
  { icon: HelpCircle, label: 'Q&A', href: '/dashboard/create/qa' },
  { icon: FileText, label: 'Notion', href: '/dashboard/create/notion' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [workspaceSettingsOpen, setWorkspaceSettingsOpen] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();
  
  // Check if we're in create routes
  const isInCreateMode = pathname.startsWith('/dashboard/create');
  const currentSidebarItems = isInCreateMode ? createItems : sidebarItems;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-gray-900">
                {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}'s works...
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Free</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {currentSidebarItems.map((item) => {
              const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard');
              const Icon = item.icon;
              
              // Only show submenu logic for settings in non-create mode
              if (!isInCreateMode && 'hasSubmenu' in item && item.hasSubmenu && item.href === '/dashboard/settings') {
                return (
                  <div key={item.href}>
                    <button
                      onClick={() => setWorkspaceSettingsOpen(!workspaceSettingsOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                        pathname.startsWith('/dashboard/settings')
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${workspaceSettingsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        workspaceSettingsOpen 
                          ? 'max-h-48 opacity-100' 
                          : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="ml-7 mt-1 space-y-1">
                        <Link
                          href="/dashboard/settings"
                          className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                            pathname === '/dashboard/settings'
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          General
                        </Link>
                        <Link
                          href="/dashboard/settings/members"
                          className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                            pathname === '/dashboard/settings/members'
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          Members
                        </Link>
                        <Link
                          href="/dashboard/settings/plans"
                          className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                            pathname === '/dashboard/settings/plans'
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          Plans
                        </Link>
                        <Link
                          href="/dashboard/settings/billing"
                          className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                            pathname === '/dashboard/settings/billing'
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          Billing
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-end">
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
                    <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || undefined} />
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
                      {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
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
                  
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/workspace" className="flex items-center w-full cursor-pointer">
                      Create or join workspace
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 relative">
          {isInCreateMode ? (
            <SourcesProvider>
              {children}
            </SourcesProvider>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}