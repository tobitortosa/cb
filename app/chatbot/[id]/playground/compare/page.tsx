"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import ComparisonChat from "@/components/chatbot/ComparisonChat";

interface ChatInstance {
  id: number;
  model: string;
  sync: boolean;
}

export default function ComparePage() {
  const router = useRouter();
  const [chatInstances, setChatInstances] = useState<ChatInstance[]>([
    { id: 1, model: "gpt-4o-mini", sync: true },
    { id: 2, model: "gpt-4o-mini", sync: true }
  ]);

  const handleAddInstance = () => {
    if (chatInstances.length < 4) {
      const newInstance: ChatInstance = {
        id: Math.max(...chatInstances.map(c => c.id)) + 1,
        model: "gpt-4o-mini",
        sync: true
      };
      setChatInstances([...chatInstances, newInstance]);
    }
  };

  const handleSyncToggle = (instanceId: number, syncValue: boolean) => {
    setChatInstances(instances => 
      instances.map(instance => 
        instance.id === instanceId 
          ? { ...instance, sync: syncValue }
          : instance
      )
    );
  };

  const handleSyncMessage = (fromInstanceId: number, message: string) => {
    // Find the sender instance
    const senderInstance = chatInstances.find(instance => instance.id === fromInstanceId);
    
    // Only sync if the sender has sync enabled
    if (senderInstance?.sync) {
      // Get all other instances that have sync enabled
      const syncedInstances = chatInstances.filter(
        instance => instance.id !== fromInstanceId && instance.sync
      );
      
      // Send message to all synced instances
      syncedInstances.forEach(instance => {
        // This will be handled by refs to each ComparisonChat component
        const event = new CustomEvent(`sync-message-${instance.id}`, {
          detail: { message }
        });
        window.dispatchEvent(event);
      });
    }
  };

  const handleClearAllChats = () => {
    // Send clear event to all chat instances
    chatInstances.forEach(instance => {
      const event = new CustomEvent(`clear-chat-${instance.id}`);
      window.dispatchEvent(event);
    });
  };

  const handleResetSettings = () => {
    // Send reset settings event to all chat instances
    chatInstances.forEach(instance => {
      const event = new CustomEvent(`reset-settings-${instance.id}`, {
        detail: {
          model: "gpt-4o-mini",
          temperature: 0.7,
          systemPromptType: "AI agent",
          sync: true
        }
      });
      window.dispatchEvent(event);
    });
  };

  const handleMoveLeft = (instanceId: number) => {
    const currentIndex = chatInstances.findIndex(instance => instance.id === instanceId);
    if (currentIndex > 0) {
      const newInstances = [...chatInstances];
      [newInstances[currentIndex], newInstances[currentIndex - 1]] = 
      [newInstances[currentIndex - 1], newInstances[currentIndex]];
      setChatInstances(newInstances);
    }
  };

  const handleMoveRight = (instanceId: number) => {
    const currentIndex = chatInstances.findIndex(instance => instance.id === instanceId);
    if (currentIndex < chatInstances.length - 1) {
      const newInstances = [...chatInstances];
      [newInstances[currentIndex], newInstances[currentIndex + 1]] = 
      [newInstances[currentIndex + 1], newInstances[currentIndex]];
      setChatInstances(newInstances);
    }
  };

  const handleRemoveInstance = (id: number) => {
    if (chatInstances.length > 1) {
      setChatInstances(chatInstances.filter(instance => instance.id !== id));
    }
  };

  const getGridClass = () => {
    const count = chatInstances.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-3";
    if (count === 4) return "grid-cols-4";
    return "grid-cols-2";
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('../playground')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Playground</span>
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleClearAllChats}
            >
              Clear all chats
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                // Reset chat instances to default
                setChatInstances([
                  { id: 1, model: "gpt-4o-mini", sync: true },
                  { id: 2, model: "gpt-4o-mini", sync: true }
                ]);
                // Reset settings of all active instances
                handleResetSettings();
              }}
            >
              Reset
            </Button>
            
            <Button
              onClick={handleAddInstance}
              disabled={chatInstances.length >= 4}
              className="bg-black text-white hover:bg-gray-800"
            >
              Add an instance
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Grid */}
      <div className="flex-1 p-6">
        <div className={`grid ${getGridClass()} gap-4 h-full`}>
          {chatInstances.map((instance) => (
            <ComparisonChat
              key={instance.id}
              instanceId={instance.id}
              initialModel={instance.model}
              initialSync={instance.sync}
              onRemove={chatInstances.length > 1 ? () => handleRemoveInstance(instance.id) : undefined}
              onSyncToggle={(syncValue) => handleSyncToggle(instance.id, syncValue)}
              onSyncMessage={(message) => handleSyncMessage(instance.id, message)}
              onMoveLeft={() => handleMoveLeft(instance.id)}
              onMoveRight={() => handleMoveRight(instance.id)}
              canMoveLeft={chatInstances.findIndex(i => i.id === instance.id) > 0}
              canMoveRight={chatInstances.findIndex(i => i.id === instance.id) < chatInstances.length - 1}
              isLastChat={chatInstances.findIndex(i => i.id === instance.id) === chatInstances.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}