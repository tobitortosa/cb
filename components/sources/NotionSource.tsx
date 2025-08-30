"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import SourcesSummary from "./SourcesSummary";
import { useSources } from "@/contexts/SourcesContext";

export default function NotionSource({ showTitle = true }: { showTitle?: boolean }) {
  const [notionUrl, setNotionUrl] = useState("");
  const { sources, isLoading, setNotion } = useSources();

  // Load existing notion from context on mount
  useEffect(() => {
    if (sources.notion.length > 0) {
      setNotionUrl(sources.notion[0].url);
    }
  }, [sources.notion]);

  const handleNotionUrlChange = (value: string) => {
    setNotionUrl(value);
    setNotion(value);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto mt-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading sources...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto ${!showTitle ? "mt-[20px]" : ""}`}>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="mb-8">
            {showTitle && (
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Notion</h1>
            )}
            <p className="text-gray-600">
              Connect your Notion workspace to train your AI agent with your
              documentation.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Notion Integration
            </h2>

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="notion-url"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Notion Page URL
                </Label>
                <Input
                  id="notion-url"
                  type="url"
                  placeholder="https://notion.so/your-page"
                  value={notionUrl}
                  onChange={(e) => handleNotionUrlChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <SourcesSummary />
        </div>
      </div>
    </div>
  );
}
