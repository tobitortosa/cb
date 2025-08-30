"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import SourcesSummary from "./SourcesSummary";
import { useSources } from "@/contexts/SourcesContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface TextSnippet {
  id: string;
  title: string;
  content: string;
  size: number;
  selected?: boolean;
  isNew?: boolean;
}

export default function TextSource({ showTitle = true }: { showTitle?: boolean }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const params = useParams();
  const router = useRouter();
  const chatId = params?.id as string;
  const { toast } = useToast();

  const {
    sources,
    isLoading,
    addTextSnippet,
    removeTextSnippet,
    toggleTextSnippetSelection,
    selectAllTextSnippets,
    deselectAllTextSnippets,
    removeSelectedTextSnippets,
  } = useSources();

  const textSnippets = sources.text;

  // No need to load text from context since we're managing snippets directly

  const handleTextChange = (value: string) => {
    setText(value);
    // Clear messages when user starts typing
    if (error || success) {
      setError(null);
      setSuccess(null);
    }
  };

  const handleAddTextSnippet = async () => {
    if (!title.trim() || !text.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Create text snippet locally first
      const newSnippet: TextSnippet = {
        id: Date.now().toString(),
        title: title.trim(),
        content: text.trim(),
        size: text.trim().length,
        selected: false,
        isNew: true, // Mark as new
      };

      // Add to local state immediately
      addTextSnippet(newSnippet);

      // Reset form
      setTitle("");
      setText("");
      setSuccess("Text snippet added successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create text snippet"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteSelected = async () => {
    const selectedSnippets = textSnippets.filter((s) => s.selected);
    if (selectedSnippets.length === 0) return;

    setIsDeleting(true);
    
    try {
      // Get source IDs from database sources (not local snippets)
      const sourceIds = selectedSnippets
        .map(snippet => {
          // Find matching source in database by title and content
          const dbSource = sources.dbSources?.find(s => 
            s.name === snippet.title && s.type === 'text'
          );
          return dbSource?.id;
        })
        .filter(Boolean);

      if (sourceIds.length > 0) {
        // Call API to delete from database
        const response = await fetch(`/api/chats/${chatId}/sources`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_ids: sourceIds
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete sources');
        }

        const result = await response.json();
        console.log('Delete result:', result);
      }

      // Remove from local state
      selectedSnippets.forEach(snippet => {
        removeTextSnippet(snippet.id);
      });

      // Show success toast
      setTimeout(() => {
        toast({
          title: "Success",
          description: `Successfully deleted ${selectedSnippets.length} text snippet(s)`,
        });
      }, 100);

    } catch (error) {
      console.error('Error deleting text snippets:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete text snippets',
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteSingle = async (snippetId: string) => {
    const snippet = textSnippets.find(s => s.id === snippetId);
    if (!snippet) return;

    setIsDeleting(true);
    
    try {
      // Find matching source in database by title and content
      const dbSource = sources.dbSources?.find(s => 
        s.name === snippet.title && s.type === 'text'
      );

      if (dbSource?.id) {
        // Call API to delete from database
        const response = await fetch(`/api/chats/${chatId}/sources`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_ids: [dbSource.id]
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete source');
        }

        const result = await response.json();
        console.log('Delete result:', result);
      }

      // Remove from local state
      removeTextSnippet(snippetId);

      // Show success toast
      setTimeout(() => {
        toast({
          title: "Success",
          description: `Successfully deleted "${snippet.title}"`,
        });
      }, 100);

    } catch (error) {
      console.error('Error deleting text snippet:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete text snippet',
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Text</h1>
            )}
            <p className="text-gray-600">
              Add plain text-based sources to train your AI Agent with precise
              information.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Add text snippet
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="text-title"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Title
                </Label>
                <Input
                  id="text-title"
                  placeholder="Ex: Refund requests"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error || success) {
                      setError(null);
                      setSuccess(null);
                    }
                  }}
                />
              </div>

              <div className="relative">
                <div className="absolute top-2 right-3 z-10 text-sm text-gray-500">
                  {text.length} B
                </div>
                <Textarea
                  placeholder="Enter your text"
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="min-h-[300px] resize-none pr-16"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleAddTextSnippet}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                  disabled={!title.trim() || !text.trim() || isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add text snippet"}
                </Button>
              </div>
            </div>

            {/* Text Snippets List */}
            {textSnippets.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Text Snippets ({textSnippets.length})
                  </h3>
                  <div className="flex items-center space-x-2">
                    {textSnippets.some((s) => s.selected) ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={deselectAllTextSnippets}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Deselect all
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  Remove selected (
                                  {textSnippets.filter((s) => s.selected).length})
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Text Snippets</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the {textSnippets.filter((s) => s.selected).length} selected text snippet(s)? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={confirmDeleteSelected}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Deleting...
                                  </>
                                ) : (
                                  'Delete'
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAllTextSnippets}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Select all
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {textSnippets.map((snippet) => (
                    <div
                      key={snippet.id}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                        snippet.selected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={snippet.selected || false}
                          onChange={() =>
                            toggleTextSnippetSelection(snippet.id)
                          }
                          className="rounded border-gray-300"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {snippet.title}
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-800 text-xs"
                            >
                              TEXT
                            </Badge>
                            {snippet.isNew && (
                              <Badge
                                variant="secondary"
                                className="bg-emerald-100 text-emerald-800 text-xs"
                              >
                                New
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {snippet.size} B
                          </span>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-600"
                            disabled={isDeleting}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Text Snippet</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{snippet.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => confirmDeleteSingle(snippet.id)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  Deleting...
                                </>
                              ) : (
                                'Delete'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
