"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import SourcesSummary from "./SourcesSummary";
import { useSources } from "@/contexts/SourcesContext";

export default function WebsiteSource({ showTitle = true }: { showTitle?: boolean }) {
  const [url, setUrl] = useState("");
  const { sources, isLoading, setWebsite } = useSources();

  // Load existing website from context on mount
  useEffect(() => {
    if (sources.websites.length > 0) {
      setUrl(sources.websites[0].url);
    }
  }, [sources.websites]);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setWebsite(value);
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Website</h1>
            )}
            <p className="text-gray-600">
              Crawl a website to extract content for training your AI agent.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Website URL
            </h2>

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="website-url"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Enter website URL
                </Label>
                <Input
                  id="website-url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
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
