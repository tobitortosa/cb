"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  ChevronDown,
  Plane,
  Activity,
  BarChart3,
  FileText,
  Zap,
  Users,
  MessageSquare,
  Settings as SettingsIcon,
} from "lucide-react";

const sidebarItems = [
  { icon: Plane, label: "Playground", href: "playground" },
  { icon: Activity, label: "Activity" },
  { icon: BarChart3, label: "Analytics" },
  { icon: FileText, label: "Sources" },
  { icon: Zap, label: "Actions" },
  { icon: Users, label: "Contacts" },
  { icon: MessageSquare, label: "Deploy" },
  { icon: SettingsIcon, label: "Settings" },
];

const settingsItems = [
  { label: "General", href: "general" },
  { label: "AI", href: "ai" },
  { label: "Chat interface", href: "chat-interface" },
  { label: "Security", href: "security" },
  { label: "Custom domains", href: "custom-domains" },
  { label: "Webhooks", href: "webhooks" },
  { label: "Notifications", href: "notifications" },
];

const sourcesItems = [
  { label: "Files", href: "files" },
  { label: "Text", href: "text" },
  { label: "Website", href: "website" },
  { label: "Q&A", href: "qa" },
  { label: "Notion", href: "notion" },
];

interface ChatbotSidebarProps {
  activeSection?: string;
  activeSettingsItem?: string;
  activeSourcesItem?: string;
}

export function ChatbotSidebar({
  activeSection = "playground",
  activeSettingsItem,
  activeSourcesItem,
}: ChatbotSidebarProps) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const chatId = params.id as string;

  const [expandedSections, setExpandedSections] = useState({
    activity: false,
    analytics: false,
    sources: activeSection === "sources",
    actions: false,
    contacts: false,
    deploy: false,
    settings: activeSection === "settings",
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-semibold text-gray-900">
              {user?.user_metadata?.full_name ||
                user?.user_metadata?.name ||
                user?.email?.split("@")[0] ||
                "User"}
              's works...
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              Free
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {sidebarItems.map((item, index) => {
            const Icon = item.icon;
            const sectionKey = item.label.toLowerCase();
            const isExpandable = [
              "activity",
              "analytics",
              "sources",
              "actions",
              "contacts",
              "deploy",
              "settings",
            ].includes(sectionKey);
            const isExpanded =
              expandedSections[sectionKey as keyof typeof expandedSections];
            const isActive = activeSection === sectionKey;

            return (
              <div key={index}>
                <div
                  className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => {
                    if (item.href) {
                      router.push(`/chatbot/${chatId}/${item.href}`);
                    } else if (sectionKey === "settings") {
                      toggleSection(sectionKey);
                    } else if (isExpandable) {
                      toggleSection(sectionKey);
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {isExpandable && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </div>

                {/* Settings submenu with animation */}
                {sectionKey === "settings" && (
                  <div
                    className={`ml-6 mt-2 space-y-1 overflow-hidden transition-all duration-200 ease-in-out ${
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    {settingsItems.map((settingItem, idx) => (
                      <div
                        key={idx}
                        className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                          activeSettingsItem === settingItem.href
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                        onClick={() => {
                          router.push(`/chatbot/${chatId}/settings/${settingItem.href}`);
                        }}
                      >
                        {settingItem.label}
                      </div>
                    ))}
                  </div>
                )}

                {/* Sources submenu with animation */}
                {sectionKey === "sources" && (
                  <div
                    className={`ml-6 space-y-1 overflow-hidden transition-all duration-200 ease-in-out ${
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    {sourcesItems.map((sourceItem, idx) => (
                      <div
                        key={idx}
                        className={`px-3 py-2 mt-2 text-sm rounded-lg cursor-pointer transition-colors ${
                          activeSourcesItem === sourceItem.href
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                        onClick={() => {
                          router.push(`/chatbot/${chatId}/sources/${sourceItem.href}`);
                        }}
                      >
                        {sourceItem.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
