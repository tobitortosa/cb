"use client";

import { ChatProvider, useChatContext } from "@/contexts/ChatContext";
import { SourcesProvider } from "@/contexts/SourcesContext";
import { ChatbotSidebar } from "@/components/chatbot/ChatbotSidebar";
import { ChatbotHeader } from "@/components/chatbot/ChatbotHeader";
import { usePathname } from "next/navigation";

export default function ChatbotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Determine active section and page title based on pathname
  const getPageInfo = () => {
    if (pathname.includes("/playground/compare")) {
      return {
        section: "playground",
        title: "Compare",
        settingsItem: null,
        sourcesItem: null,
        sourceItem: null,
      };
    }
    if (pathname.includes("/playground")) {
      return {
        section: "playground",
        title: "Playground",
        settingsItem: null,
        sourcesItem: null,
        sourceItem: null,
      };
    }
    if (pathname.includes("/sources/files")) {
      return {
        section: "sources",
        title: "Files",
        settingsItem: null,
        sourcesItem: "files",
        sourceItem: null,
      };
    }
    if (pathname.includes("/sources/text")) {
      return {
        section: "sources",
        title: "Text",
        settingsItem: null,
        sourcesItem: "text",
        sourceItem: null,
      };
    }
    if (pathname.includes("/sources/website")) {
      return {
        section: "sources",
        title: "Website",
        settingsItem: null,
        sourcesItem: "website",
        sourceItem: null,
      };
    }
    if (pathname.includes("/sources/qa")) {
      return {
        section: "sources",
        title: "Q&A",
        settingsItem: null,
        sourcesItem: "qa",
        sourceItem: null,
      };
    }
    if (pathname.includes("/sources/notion")) {
      return {
        section: "sources",
        title: "Notion",
        settingsItem: null,
        sourcesItem: "notion",
        sourceItem: null,
      };
    }
    if (pathname.includes("/settings/general")) {
      return {
        section: "settings",
        title: "General",
        settingsItem: "general",
        sourcesItem: null,
        sourceItem: null,
      };
    }
    if (pathname.includes("/settings/ai")) {
      return {
        section: "settings",
        title: "AI",
        settingsItem: "ai",
        sourcesItem: null,
        sourceItem: null,
      };
    }
    if (pathname.includes("/settings/chat-interface")) {
      return {
        section: "settings",
        title: "Chat Interface",
        settingsItem: "chat-interface",
        sourcesItem: null,
        sourceItem: null,
      };
    }
    if (pathname.includes("/settings/security")) {
      return {
        section: "settings",
        title: "Security",
        settingsItem: "security",
        sourcesItem: null,
        sourceItem: null,
      };
    }
    if (pathname.includes("/settings/custom-domains")) {
      return {
        section: "settings",
        title: "Custom Domains",
        settingsItem: "custom-domains",
        sourcesItem: null,
        sourceItem: null,
      };
    }
    if (pathname.includes("/settings/webhooks")) {
      return {
        section: "settings",
        title: "Webhooks",
        settingsItem: "webhooks",
        sourcesItem: null,
        sourceItem: null,
      };
    }
    if (pathname.includes("/settings/notifications")) {
      return {
        section: "settings",
        title: "Notifications",
        settingsItem: "notifications",
        sourcesItem: null,
        sourceItem: null,
      };
    }
    return {
      section: "playground",
      title: "Playground",
      settingsItem: null,
      sourcesItem: null,
      sourceItem: null,
    };
  };

  const { section, title, settingsItem, sourcesItem, sourceItem } = getPageInfo();

  return (
    <ChatProvider>
      <SourcesProvider>
        <ChatbotLayoutContent
          section={section}
          title={title}
          settingsItem={settingsItem}
          sourcesItem={sourcesItem}
          sourceItem={sourceItem}
        >
          {children}
        </ChatbotLayoutContent>
      </SourcesProvider>
    </ChatProvider>
  );
}

function ChatbotLayoutContent({
  section,
  title,
  settingsItem,
  sourcesItem,
  sourceItem,
  children,
}: {
  section: string;
  title: string;
  settingsItem: string | null;
  sourcesItem: string | null;
  sourceItem: string | null;
  children: React.ReactNode;
}) {
  const { isLoading } = useChatContext();

  // Show loading state while chat context is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-medium">
            Loading chat data...
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="h-screen bg-gray-50 flex">
      <ChatbotSidebar
        activeSection={section}
        activeSettingsItem={settingsItem || undefined}
        activeSourcesItem={sourcesItem || undefined}
      />

      <div className="flex-1 flex flex-col">
        <ChatbotHeader title={title} />

        <div className="flex-1 min-h-0 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
