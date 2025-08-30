"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useParams } from "next/navigation";
import { useChatContext } from "@/contexts/ChatContext";
import { Copy } from "lucide-react";

export default function GeneralSettingsPage() {
  const params = useParams();
  const chatId = params.id as string;
  const { chatData, updateChatData } = useChatContext();

  const [chatName, setChatName] = useState("");
  const [agentSize] = useState("22 KB");
  const [creditsLimitEnabled, setCreditsLimitEnabled] = useState(false);
  const [creditsLimit, setCreditsLimit] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Update local state when chat data from context changes
  useEffect(() => {
    if (chatData) {
      setChatName(chatData.name || "");
    }
  }, [chatData]);

  const handleSaveDetails = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await updateChatData({ name: chatName });
      
      console.log('Agent details updated successfully');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating agent details:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyAgentId = () => {
    navigator.clipboard.writeText(chatId);
  };

  return (
    <div className="p-6 flex justify-center">
      <div className="w-full max-w-3xl">
        {/* Agent Details Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Agent details</h2>
            <p className="text-sm text-gray-600">Basic information about the agent, including its name, unique ID, and storage size.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Agent ID</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono text-gray-900">{chatId}</span>
                <button
                  onClick={handleCopyAgentId}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Copy Agent ID"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Size</span>
              <span className="text-sm text-gray-900 font-medium">{agentSize}</span>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm text-gray-600 mb-2">Name</label>
              <div className="flex items-center space-x-3">
                <Input
                  type="text"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  className="flex-1"
                  placeholder="Enter agent name"
                  disabled={false}
                />
                <Button
                  onClick={handleSaveDetails}
                  disabled={isSaving}
                  className={`text-white ${
                    saveSuccess 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                >
                  {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Credits Limit Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Credits limit</h2>
            <p className="text-sm text-gray-600">Maximum credits to be used by this agent from the credits available on the workspace.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm text-gray-900">Set credits limit on agent:</label>
              <Switch
                checked={creditsLimitEnabled}
                onCheckedChange={setCreditsLimitEnabled}
              />
            </div>

            <div className="space-y-4">
              <Input
                type="number"
                value={creditsLimit}
                onChange={(e) => setCreditsLimit(e.target.value)}
                placeholder="Enter credit limit"
                className="w-full"
                disabled={!creditsLimitEnabled}
              />
              <div className="flex justify-end">
                <Button
                  disabled={!creditsLimitEnabled || !creditsLimit}
                  className="bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-8">
          <h2 className="text-base font-semibold text-red-600 mb-4 text-center">DANGER ZONE</h2>
          
          {/* Delete all conversations */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete all conversations</h3>
            <p className="text-sm text-gray-600 mb-4">
              Once you delete all your conversations, there is no going back. Please be certain. All the conversations on this agent will be deleted.
            </p>
            <div className="flex justify-end">
              <Button 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
          
          {/* Delete agent */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Delete agent</h3>
            <p className="text-sm text-gray-600 mb-4">
              Once you delete your agent, there is not going back. Please be certain.
            </p>
            <div className="flex justify-end">
              <Button 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}