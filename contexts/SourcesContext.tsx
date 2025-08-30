"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UploadedFile {
  id: number;
  name: string;
  size: string;
  sizeInKb: number;
  isNew: boolean;
  isPdf?: boolean;
  selected?: boolean;
  file: File;
  sourceId?: string; // Database source ID
  status?: "active" | "processing" | "failed" | "disabled" | "upload_pending"; // Source status
}

interface QAPair {
  id: number;
  question: string;
  answer: string;
}

interface TextSnippet {
  id: string;
  title: string;
  content: string;
  size: number;
  selected?: boolean;
  isNew?: boolean; // To track newly added text snippets
}

interface KnowledgeSource {
  id: string;
  chat_id: string;
  type: "file" | "text" | "website" | "qa";
  name: string;
  content?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  character_count?: number;
  status: "active" | "processing" | "failed" | "disabled" | "upload_pending";
  error_message?: string;
  created_at: string;
  updated_at: string;
}

interface SourcesState {
  files: UploadedFile[];
  text: TextSnippet[];
  websites: {
    id: string;
    url: string;
  }[];
  notion: {
    id: string;
    url: string;
  }[];
  qa: QAPair[];
  // Database sources
  dbSources: KnowledgeSource[];
  isLoading: boolean;
}

interface SourcesContextValue {
  sources: SourcesState;
  isLoading: boolean;
  refreshSources: () => Promise<void>;

  // Files methods
  addFiles: (files: UploadedFile[]) => void;
  removeFile: (fileId: number) => void;
  toggleFileSelection: (fileId: number) => void;
  selectAllFiles: () => void;
  deselectAllFiles: () => void;
  removeSelectedFiles: () => void;
  updateFiles: (files: UploadedFile[]) => void;

  // Text methods
  addTextSnippet: (snippet: TextSnippet) => void;
  removeTextSnippet: (snippetId: string) => void;
  toggleTextSnippetSelection: (snippetId: string) => void;
  selectAllTextSnippets: () => void;
  deselectAllTextSnippets: () => void;
  removeSelectedTextSnippets: () => void;

  // Website methods
  setWebsite: (url: string) => void;

  // Notion methods
  setNotion: (url: string) => void;

  // Q&A methods
  setQAPairs: (pairs: QAPair[]) => void;

  // Utility methods
  clearAllSources: () => void;
  cleanupFailedSources: () => Promise<void>;
  getValidSources: () => {
    files: UploadedFile[];
    texts: TextSnippet[];
  };
  getSourcesSummary: () => {
    files: {
      count: number;
      pdfCount: number;
      otherCount: number;
      totalSize: number;
    };
    text: {
      count: number;
      totalChars: number;
    };
    website: {
      count: number;
      urls: string[];
    };
    notion: {
      count: number;
      pages: string[];
    };
    qa: {
      count: number;
      pairs: number;
    };
  };
}

const SourcesContext = createContext<SourcesContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "dashboard-sources-data";

const initialState: SourcesState = {
  files: [],
  text: [],
  websites: [],
  notion: [],
  qa: [],
  dbSources: [],
  isLoading: true,
};

export function SourcesProvider({ children }: { children: ReactNode }) {
  const [sources, setSources] = useState<SourcesState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialLoad = useRef(true);
  const params = useParams();
  const supabase = createClient();
  const chatId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  // Function to fetch sources from database
  const fetchSourcesFromDB = async () => {
    if (!chatId || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Use session for client-side operations
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        setIsLoading(false);
        return;
      }
      
      const userId = session.user.id;      // First verify the user has access to this chat
      const { data: chatData, error: chatError } = await supabase
        .from("chats")
        .select("id, user_id")
        .eq("id", chatId)
        .single();
      
      if (chatError || !chatData) {
        setIsLoading(false);
        return;
      }
      
      // Verify ownership
      if (chatData.user_id !== userId) {
        setIsLoading(false);
        return;
      }

      // Fetch the knowledge sources
      const { data: knowledgeSources, error } = await supabase
        .from("knowledge_sources")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false });

      console.log("knowledgeSources")
      console.log(knowledgeSources)

      if (error) {
        setIsLoading(false);
        return;
      }

      if (knowledgeSources && knowledgeSources.length > 0) {
        // Convert database sources to local format
        const files: UploadedFile[] = [];
        const texts: TextSnippet[] = [];
        const websites: { id: string; url: string }[] = [];
        const qaList: QAPair[] = [];

        knowledgeSources.forEach((source: KnowledgeSource) => {

          switch (source.type) {
            case "file":
              // Use file_name if available, otherwise fall back to name
              const fileName = source.file_name || source.name;
              const fileSize = source.file_size || 0;
              
              if (fileName) {
                // Note: We can't recreate the File object from DB, but we can show the info
                files.push({
                  id: Date.now() + Math.random(),
                  name: fileName,
                  size: fileSize > 0 ? `${Math.round(fileSize / 1024)} KB` : "Unknown size",
                  sizeInKb: fileSize > 0 ? Math.round(fileSize / 1024) : 0,
                  isNew: false,
                  isPdf: fileName.toLowerCase().endsWith(".pdf"),
                  selected: false,
                  file: new File([], fileName), // Placeholder file
                  sourceId: source.id, // Store the database source ID
                  status: source.status, // Store the source status
                });
              }
              break;
            case "text":
              if (source.content) {
                texts.push({
                  id: source.id,
                  title: source.name,
                  content: source.content,
                  size: source.character_count || source.content.length,
                  selected: false,
                  isNew: false, // Existing texts from DB are not new
                });
              }
              break;
            case "website":
              if (source.content) {
                websites.push({
                  id: source.id,
                  url: source.content,
                });
              }
              break;
            case "qa":
              // Parse Q&A pairs from content if stored as JSON
              if (source.content) {
                try {
                  const parsed = JSON.parse(source.content);
                  if (Array.isArray(parsed)) {
                    parsed.forEach((pair, index) => {
                      qaList.push({
                        id: index,
                        question: pair.question || "",
                        answer: pair.answer || "",
                      });
                    });
                  }
                } catch (e) {
                  // If not JSON, treat as single Q&A
                  qaList.push({
                    id: 0,
                    question: source.name,
                    answer: source.content,
                  });
                }
              }
              break;
          }
        });

        setSources((prev) => ({
          ...prev,
          files,
          text: texts,
          websites,
          qa: qaList,
          dbSources: knowledgeSources,
          isLoading: false,
        }));
        console.log(`Loaded: ${files.length} files, ${texts.length} texts, ${websites.length} websites, ${qaList.length} Q&A pairs`);
      } else {
        setSources((prev) => ({
          ...prev,
          files: [],
          text: [],
          websites: [],
          qa: [],
          dbSources: [],
          isLoading: false,
        }));
      }
    } catch (error) {
      // Reset to empty state on error
      setSources((prev) => ({
        ...prev,
        files: [],
        text: [],
        websites: [],
        qa: [],
        dbSources: [],
        isLoading: false,
      }));
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
    }
  };

  // Load from localStorage and database on mount
  useEffect(() => {
    if (!chatId) {
      setIsLoading(false);
      return;
    }
    
    // Wait for auth to be ready
    if (authLoading) {
      return;
    }
    
    // If no user, don't try to fetch
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    // First try to load from localStorage for quick initial state
    try {
      const storageKey = `${STORAGE_KEY}-${chatId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSources(prev => ({
          ...prev,
          ...parsed,
          files: [], // Files are handled separately since File objects can't be serialized
          isLoading: true, // Keep loading true while we fetch from DB
        }));
      }
    } catch (error) {
      // Ignore localStorage errors
    }

    // Now fetch from database
    fetchSourcesFromDB();
  }, [chatId, user, authLoading]);

  // Save to localStorage whenever sources change (exclude initial load)
  useEffect(() => {
    // Skip saving during the initial load to prevent infinite loop
    if (isInitialLoad.current || !chatId) return;

    try {
      const storageKey = `${STORAGE_KEY}-${chatId}`;
      // Don't save files with File objects to localStorage
      const toSave = {
        ...sources,
        files: sources.files.map(({ file, ...rest }) => rest), // Remove File objects
      };
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch (error) {
      // Ignore localStorage errors
    }
  }, [sources, chatId]);

  // Files methods
  const addFiles = (newFiles: UploadedFile[]) => {
    setSources((prev) => ({
      ...prev,
      files: [...prev.files, ...newFiles],
    }));
  };

  const removeFile = (fileId: number) => {
    setSources((prev) => ({
      ...prev,
      files: prev.files.filter((file) => file.id !== fileId),
    }));
  };

  const toggleFileSelection = (fileId: number) => {
    setSources((prev) => ({
      ...prev,
      files: prev.files.map((file) =>
        file.id === fileId ? { ...file, selected: !file.selected } : file
      ),
    }));
  };

  const selectAllFiles = () => {
    setSources((prev) => ({
      ...prev,
      files: prev.files.map((file) => ({ ...file, selected: true })),
    }));
  };

  const deselectAllFiles = () => {
    setSources((prev) => ({
      ...prev,
      files: prev.files.map((file) => ({ ...file, selected: false })),
    }));
  };

  const removeSelectedFiles = () => {
    setSources((prev) => ({
      ...prev,
      files: prev.files.filter((file) => !file.selected),
    }));
  };

  const updateFiles = (files: UploadedFile[]) => {
    setSources((prev) => ({
      ...prev,
      files,
    }));
  };

  // Text methods
  const addTextSnippet = (snippet: TextSnippet) => {
    setSources((prev) => ({
      ...prev,
      text: [...prev.text, { ...snippet, isNew: true }],
    }));
  };

  const removeTextSnippet = (snippetId: string) => {
    setSources((prev) => ({
      ...prev,
      text: prev.text.filter((snippet) => snippet.id !== snippetId),
    }));
  };

  const toggleTextSnippetSelection = (snippetId: string) => {
    setSources((prev) => ({
      ...prev,
      text: prev.text.map((snippet) =>
        snippet.id === snippetId
          ? { ...snippet, selected: !snippet.selected }
          : snippet
      ),
    }));
  };

  const selectAllTextSnippets = () => {
    setSources((prev) => ({
      ...prev,
      text: prev.text.map((snippet) => ({ ...snippet, selected: true })),
    }));
  };

  const deselectAllTextSnippets = () => {
    setSources((prev) => ({
      ...prev,
      text: prev.text.map((snippet) => ({ ...snippet, selected: false })),
    }));
  };

  const removeSelectedTextSnippets = () => {
    setSources((prev) => ({
      ...prev,
      text: prev.text.filter((snippet) => !snippet.selected),
    }));
  };

  // Website methods
  const setWebsite = (url: string) => {
    setSources((prev) => ({
      ...prev,
      websites: url.trim() ? [{ id: "main-website", url }] : [],
    }));
  };

  // Notion methods
  const setNotion = (url: string) => {
    setSources((prev) => ({
      ...prev,
      notion: url.trim() ? [{ id: "main-notion", url }] : [],
    }));
  };

  // Q&A methods
  const setQAPairs = (pairs: QAPair[]) => {
    setSources((prev) => ({
      ...prev,
      qa: pairs,
    }));
  };

  // Utility methods
  const clearAllSources = () => {
    setSources(initialState);
    if (chatId) {
      const storageKey = `${STORAGE_KEY}-${chatId}`;
      localStorage.removeItem(storageKey);
    }
  };

  const getSourcesSummary = () => {
    const { files, text, websites, notion, qa } = sources;

    return {
      files: {
        count: files.length,
        pdfCount: files.filter((f) => f.isPdf).length,
        otherCount: files.filter((f) => !f.isPdf).length,
        totalSize: files.reduce((acc, file) => acc + file.sizeInKb, 0),
      },
      text: {
        count: text.length,
        totalChars: text.reduce((acc, t) => acc + t.content.length, 0),
      },
      website: {
        count: websites.length,
        urls: websites.map((w) => w.url),
      },
      notion: {
        count: notion.length,
        pages: notion.map((n) => n.url),
      },
      qa: {
        count: qa.filter((pair) => pair.question.trim() && pair.answer.trim())
          .length,
        pairs: qa.length,
      },
    };
  };

  const refreshSources = async () => {
    if (user && chatId) {
      await fetchSourcesFromDB();
    }
  };

  const cleanupFailedSources = async () => {
    if (!chatId || !user) return;

    try {
      const failedSources = sources.dbSources.filter(source => 
        source.status === 'failed' || source.status === 'upload_pending'
      );

      for (const source of failedSources) {
        try {
          // Delete failed source from database
          await supabase
            .from('knowledge_sources')
            .delete()
            .eq('id', source.id)
            .eq('chat_id', chatId);
          
          console.log(`Cleaned up failed source: ${source.name}`);
        } catch (error) {
          console.error(`Error cleaning up source ${source.name}:`, error);
        }
      }

      // Refresh sources after cleanup
      await fetchSourcesFromDB();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  const getValidSources = () => {
    const validFiles = sources.files.filter(file => 
      file.status === 'active' || file.status === undefined || file.isNew
    );
    
    const validTexts = sources.text; // Text sources are generally always valid
    
    return {
      files: validFiles,
      texts: validTexts
    };
  };

  const value: SourcesContextValue = {
    sources,
    isLoading,
    refreshSources,
    addFiles,
    removeFile,
    toggleFileSelection,
    selectAllFiles,
    deselectAllFiles,
    removeSelectedFiles,
    updateFiles,
    addTextSnippet,
    removeTextSnippet,
    toggleTextSnippetSelection,
    selectAllTextSnippets,
    deselectAllTextSnippets,
    removeSelectedTextSnippets,
    setWebsite,
    setNotion,
    setQAPairs,
    clearAllSources,
    cleanupFailedSources,
    getValidSources,
    getSourcesSummary,
  };

  return (
    <SourcesContext.Provider value={value}>{children}</SourcesContext.Provider>
  );
}

export function useSources() {
  const context = useContext(SourcesContext);
  if (context === undefined) {
    throw new Error("useSources must be used within a SourcesProvider");
  }
  return context;
}
