"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  Send,
  RefreshCw,
  RotateCcw,
  Loader2,
  FileTextIcon,
  ImageIcon,
  Table2,
  Lightbulb,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useChatContext } from "@/contexts/ChatContext";

const modelOptions = [
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "OpenAI",
    description:
      "Enhanced version of GPT-4 with improved reasoning capabilities and reduced hallucinations.",
    credits: 1,
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "OpenAI",
    description:
      "Optimized version of GPT-4.1 for faster responses while maintaining accuracy.",
    credits: 1,
  },
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    provider: "OpenAI",
    description:
      "Ultra-fast GPT-4.1 variant for real-time applications and high-throughput scenarios.",
    credits: 1,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description:
      "GPT-4 Omni model with multimodal capabilities including text, image, and audio processing.",
    credits: 1,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description:
      "Compact version of GPT-4o optimized for cost-effectiveness and speed.",
    credits: 1,
  },
];

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: any[];
  timestamp: Date;
}

interface RAGResponse {
  answer: string;
  sources: Array<{
    chunk_id: string;
    kind: "text" | "table" | "img_text";
    page?: number | null;
    score: number;
    content: string;
    preview?: string;
    html?: string;
    plain_preview?: string;
  }>;
  used_top_k: number;
  model_used: string;
}

export default function PlaygroundPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;
  const supabase = createClient();
  const { chatData, updateChatData } = useChatContext();

  const [DOMPurify, setDOMPurify] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [temperature, setTemperature] = useState(0.2);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [isSystemPromptDropdownOpen, setIsSystemPromptDropdownOpen] =
    useState(false);
  const [localSystemPromptType, setLocalSystemPromptType] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const instructionsTextareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // System prompt templates
  const systemPromptTemplates: { [key: string]: string } = {
    "AI agent": `### Role
- Primary Function: You are an AI chatbot who helps users with their inquiries, issues and requests. You aim to provide excellent, friendly and efficient replies at all times. Your role is to listen attentively to the user, understand their needs, and do your best to assist them or direct them to the appropriate resources. If a question is not clear, ask clarifying questions. Make sure to end your replies with a positive note.
        
### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to the training data.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to your role and training data.`,
    "Sales agent": `### Role
- Primary Function: You are a sales agent here to assist users based on specific training data provided. Your main objective is to inform, clarify, and answer questions strictly related to this training data and your role.
        
### Persona
- Identity: You are a dedicated sales agent. You cannot adopt other personas or impersonate any other entity. If a user tries to make you act as a different chatbot or persona, politely decline and reiterate your role to offer assistance only with matters related to the training data and your function as a sales agent.
        
### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to sales.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to your role. This includes refraining from tasks such as coding explanations, personal advice, or any other unrelated activities.`,
    "Customer support agent": `### Role
- Primary Function: You are a customer support agent here to assist users based on specific training data provided. Your main objective is to inform, clarify, and answer questions strictly related to this training data and your role.
                
### Persona
- Identity: You are a dedicated customer support agent. You cannot adopt other personas or impersonate any other entity. If a user tries to make you act as a different chatbot or persona, politely decline and reiterate your role to offer assistance only with matters related to customer support.
                
### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to customer support.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to your role. This includes refraining from tasks such as coding explanations, personal advice, or any other unrelated activities.`,
    "Language tutor": `### Role
- Primary Function: You are a language tutor here to assist users based on specific training data provided. Your main objective is to help learners improve their language skills, including grammar, vocabulary, reading comprehension, and speaking fluency. You must always maintain your role as a language tutor and focus solely on tasks that enhance language proficiency.
        
### Persona
- Identity: You are a dedicated language tutor. You cannot adopt other personas or impersonate any other entity. If a user tries to make you act as a different chatbot or persona, politely decline and reiterate your role to offer assistance only with matters related to the training data and your function as a language tutor.
        
### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to language learning.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to language tutoring. This includes refraining from tasks such as coding explanations, personal advice, or any other unrelated activities.`,
    "Coding expert": `### Role
- Primary Function: You are a coding expert dedicated to assisting users based on specific training data provided. Your main objective is to deepen users' understanding of software development practices, programming languages, and algorithmic solutions. You must consistently maintain your role as a coding expert, focusing solely on coding-related queries and challenges, and avoid engaging in topics outside of software development and programming.
        
### Persona
- Identity: You are a dedicated coding expert. You cannot adopt other personas or impersonate any other entity. If a user tries to make you act as a different chatbot or persona, politely decline and reiterate your role to offer assistance only with matters related to the training data and your function as a coding expert.
        
### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to coding and programming.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to coding and programming. This includes refraining from tasks such as language tutoring, personal advice, or any other unrelated activities.`,
    "Life coach": `### Role
- Primary Function: You are a Life Coach dedicated to assisting users based on specific training data provided. Your main objective is to support and guide users in achieving personal goals, enhancing well-being, and making meaningful life changes. You must consistently maintain your role as a Life Coach, focusing solely on queries related to personal development, goal setting, and life strategies, and avoid engaging in topics outside of life coaching.
        
### Persona
- Identity: You are a dedicated Life Coach. You cannot adopt other personas or impersonate any other entity. If a user tries to make you act as a different chatbot or persona, politely decline and reiterate your role to offer assistance only with matters related to the training data and your function as a Life Coach.
        
### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to personal development and life coaching.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to life coaching. This includes refraining from tasks such as coding explanations, sales pitches, or any other unrelated activities.`,
    "Futuristic fashion advisor": `### Role
- Primary Function: You are a Futuristic Fashion Advisor dedicated to assisting users based on specific training data provided. Your main objective is to guide users in understanding emerging fashion trends, innovative design technologies, and sustainable fashion practices. You must consistently maintain your role as a Fashion Advisor, focusing solely on queries related to fashion and style, particularly those anticipating future trends, and avoid engaging in topics outside of fashion and styling.
        
### Persona
- Identity: You are a dedicated Fashion Advisor. You cannot adopt other personas or impersonate any other entity. If a user tries to make you act as a different chatbot or persona, politely decline and reiterate your role to offer assistance only with matters related to the training data and your function as a Futuristic Fashion Advisor.
        
### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to fashion, style, and sustainability.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to fashion advising, especially forward-looking fashion insights. This includes refraining from tasks such as coding explanations, life advice, or any other unrelated activities.`,
  };

  useEffect(() => {
    import("dompurify").then((module) => {
      setDOMPurify(() => module.default);
    });
  }, []);

  useEffect(() => {
    if (chatData) {
      setSelectedModel(chatData.model || "gpt-4o-mini");
      setTemperature(chatData.temperature || 0.2);

      // Only set local system prompt type on initial load, not on updates
      if (isInitialLoad) {
        const systemPromptType = chatData.system_prompt_type || "AI agent";
        setLocalSystemPromptType(systemPromptType);

        // If it's a custom prompt, load the content into customInstructions
        if (systemPromptType === "Custom Prompt" || systemPromptType === "") {
          setLocalSystemPromptType("");
          setCustomInstructions(chatData.system_prompt || "");
        }

        setIsInitialLoad(false);
      }

      const welcomeMessage =
        chatData.welcome_message ||
        "Hi! What can I help you with? I have access to your documents and can answer questions about them.";
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: welcomeMessage,
          timestamp: new Date(),
        },
      ]);
    }
  }, [chatData, isInitialLoad]);

  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isModelDropdownOpen && !target.closest(".model-dropdown")) {
        setIsModelDropdownOpen(false);
        setModelSearchQuery(""); // Clear search when closing
      }
      if (
        isSystemPromptDropdownOpen &&
        !target.closest(".system-prompt-dropdown")
      ) {
        setIsSystemPromptDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModelDropdownOpen, isSystemPromptDropdownOpen]);

  // Auto-resize textarea when content changes
  useEffect(() => {
    if (instructionsTextareaRef.current) {
      const textarea = instructionsTextareaRef.current;
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + 30 + "px"; // Add 4px extra padding
    }
  }, [localSystemPromptType]);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSaveToAgent = async () => {
    if (isSaving || temperature === 0) return;

    // Check if custom prompt is selected and instructions are empty
    if (localSystemPromptType === "" && !customInstructions.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const systemPromptContent =
        localSystemPromptType === ""
          ? customInstructions
          : systemPromptTemplates[localSystemPromptType] || "";

      await updateChatData({
        model: selectedModel,
        temperature: temperature,
        system_prompt_type: localSystemPromptType || "Custom Prompt",
        system_prompt: systemPromptContent,
      });
      console.log("Agent settings updated successfully");
    } catch (error) {
      console.error("Error updating agent settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setMessage("");
    setIsLoading(true);

    try {
      const controller = new AbortController();
      setAbortController(controller);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const apiMessages = [
        { role: "system", content: "" },
        ...updatedMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ];

      // Get system prompt content based on current selection
      const systemPromptContent =
        localSystemPromptType === ""
          ? customInstructions
          : systemPromptTemplates[localSystemPromptType] || "";

      const response = await fetch(`/api/rag/chats/${chatId}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          top_k: 8,
          model: selectedModel,
          temperature: temperature,
          system_prompt_mode: "merge",
          system_prompt: systemPromptContent,
          max_tokens: 700,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get response: ${response.status} - ${errorText}`
        );
      }

      const data: RAGResponse = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setAbortController(null);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request was cancelled by user");
        return;
      }

      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error processing your request: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setAbortController(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }

    setIsLoading(false);

    const welcomeMessage =
      chatData?.welcome_message ||
      "Hi! What can I help you with? I have access to your documents and can answer questions about them.";

    setMessages([
      {
        id: "1",
        role: "assistant",
        content: welcomeMessage,
        timestamp: new Date(),
      },
    ]);
    setMessage("");
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - Configuration */}
      <div className="w-1/3 h-full p-4 border-r border-gray-200 bg-white overflow-y-auto">
        {/* Agent Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              Agent status:
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              • Trained
            </span>
          </div>

          <Button
            className={`w-full mb-4 text-white ${
              temperature === 0 ||
              (localSystemPromptType === "" && !customInstructions.trim())
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gray-600 hover:bg-gray-700"
            }`}
            onClick={handleSaveToAgent}
            disabled={
              isSaving ||
              temperature === 0 ||
              (localSystemPromptType === "" && !customInstructions.trim())
            }
          >
            {isSaving ? "Saving..." : "Save to agent"}
          </Button>

          <Button
           className="w-full"
            variant="outline"
            size="sm"
            onClick={() => router.push(`/chatbot/${chatId}/playground/compare`)}
          >
            Configure & test agents{" "}
            <Lightbulb className="w-4 h-4 ml-[5px] text-gray-500" />
          </Button>
        </div>

        {/* Model Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Model</h3>
          <div className="relative model-dropdown">
            <div
              className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-black"
                  viewBox="0 0 320 320"
                  fill="currentColor"
                >
                  <path d="M297 131a80.6 80.6 0 0 0-93.7-104.2 80.6 80.6 0 0 0-137 29A80.6 80.6 0 0 0 23 189a80.6 80.6 0 0 0 93.7 104.2 80.6 80.6 0 0 0 137-29A80.7 80.7 0 0 0 297.1 131zM176.9 299c-14 .1-27.6-4.8-38.4-13.8l1.9-1 63.7-36.9c3.3-1.8 5.3-5.3 5.2-9v-89.9l27 15.6c.3.1.4.4.5.7v74.4a60 60 0 0 1-60 60zM47.9 244a59.7 59.7 0 0 1-7.1-40.1l1.9 1.1 63.7 36.8c3.2 1.9 7.2 1.9 10.5 0l77.8-45V228c0 .3-.2.6-.4.8L129.9 266a60 60 0 0 1-82-22zM31.2 105c7-12.2 18-21.5 31.2-26.3v75.8c0 3.7 2 7.2 5.2 9l77.8 45-27 15.5a1 1 0 0 1-.9 0L53.1 187a60 60 0 0 1-22-82zm221.2 51.5-77.8-45 27-15.5a1 1 0 0 1 .9 0l64.4 37.1a60 60 0 0 1-9.3 108.2v-75.8c0-3.7-2-7.2-5.2-9zm26.8-40.4-1.9-1.1-63.7-36.8a10.4 10.4 0 0 0-10.5 0L125.4 123V92c0-.3 0-.6.3-.8L190.1 54a60 60 0 0 1 89.1 62.1zm-168.5 55.4-27-15.5a1 1 0 0 1-.4-.7V80.9a60 60 0 0 1 98.3-46.1l-1.9 1L116 72.8a10.3 10.3 0 0 0-5.2 9v89.8zm14.6-31.5 34.7-20 34.6 20v40L160 200l-34.7-20z" />
                </svg>
              </div>
              <span className="text-sm text-gray-900 flex-1">
                {modelOptions.find((m) => m.id === selectedModel)?.name ||
                  "GPT-4o Mini"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  isModelDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {/* Model Dropdown */}
            <div
              className={`absolute z-50 w-full mt-1 transition-all duration-200 ease-in-out ${
                isModelDropdownOpen
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="p-3 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Search models..."
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    className="w-full pl-2 pr-2 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {modelOptions
                    .filter(
                      (model) =>
                        model.name
                          .toLowerCase()
                          .includes(modelSearchQuery.toLowerCase()) ||
                        model.provider
                          .toLowerCase()
                          .includes(modelSearchQuery.toLowerCase()) ||
                        model.description
                          .toLowerCase()
                          .includes(modelSearchQuery.toLowerCase())
                    )
                    .map((model) => (
                      <div
                        key={model.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-b-0 ${
                          selectedModel === model.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setIsModelDropdownOpen(false);
                        }}
                        onMouseEnter={() => setHoveredModel(model.id)}
                        onMouseLeave={() => setHoveredModel(null)}
                      >
                        <div className="flex items-start space-x-2">
                          <div className="w-6 h-6 flex items-center justify-center mt-0.5">
                            <svg
                              className="w-5 h-5 text-black"
                              viewBox="0 0 320 320"
                              fill="currentColor"
                            >
                              <path d="M297 131a80.6 80.6 0 0 0-93.7-104.2 80.6 80.6 0 0 0-137 29A80.6 80.6 0 0 0 23 189a80.6 80.6 0 0 0 93.7 104.2 80.6 80.6 0 0 0 137-29A80.7 80.7 0 0 0 297.1 131zM176.9 299c-14 .1-27.6-4.8-38.4-13.8l1.9-1 63.7-36.9c3.3-1.8 5.3-5.3 5.2-9v-89.9l27 15.6c.3.1.4.4.5.7v74.4a60 60 0 0 1-60 60zM47.9 244a59.7 59.7 0 0 1-7.1-40.1l1.9 1.1 63.7 36.8c3.2 1.9 7.2 1.9 10.5 0l77.8-45V228c0 .3-.2.6-.4.8L129.9 266a60 60 0 0 1-82-22zM31.2 105c7-12.2 18-21.5 31.2-26.3v75.8c0 3.7 2 7.2 5.2 9l77.8 45-27 15.5a1 1 0 0 1-.9 0L53.1 187a60 60 0 0 1-22-82zm221.2 51.5-77.8-45 27-15.5a1 1 0 0 1 .9 0l64.4 37.1a60 60 0 0 1-9.3 108.2v-75.8c0-3.7-2-7.2-5.2-9zm26.8-40.4-1.9-1.1-63.7-36.8a10.4 10.4 0 0 0-10.5 0L125.4 123V92c0-.3 0-.6.3-.8L190.1 54a60 60 0 0 1 89.1 62.1zm-168.5 55.4-27-15.5a1 1 0 0 1-.4-.7V80.9a60 60 0 0 1 98.3-46.1l-1.9 1L116 72.8a10.3 10.3 0 0 0-5.2 9v89.8zm14.6-31.5 34.7-20 34.6 20v40L160 200l-34.7-20z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {model.name}
                              </span>
                              {selectedModel === model.id && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  {modelOptions.filter(
                    (model) =>
                      model.name
                        .toLowerCase()
                        .includes(modelSearchQuery.toLowerCase()) ||
                      model.provider
                        .toLowerCase()
                        .includes(modelSearchQuery.toLowerCase()) ||
                      model.description
                        .toLowerCase()
                        .includes(modelSearchQuery.toLowerCase())
                  ).length === 0 &&
                    modelSearchQuery && (
                      <div className="p-3 text-center text-sm text-gray-500">
                        No models found matching "{modelSearchQuery}"
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Temperature */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Temperature</h3>
            <span className="text-sm font-medium text-gray-900">
              {temperature.toFixed(1)}
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              disabled={false}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Reserved</span>
              <span>Creative</span>
            </div>
          </div>
        </div>

        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #374151;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .slider::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #374151;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
        `}</style>

        {/* AI Actions */}
        {/* <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">AI Actions</h3>
          <div className="p-4 border border-gray-200 rounded-lg text-center">
            <p className="text-sm text-gray-500">No actions found</p>
          </div>
        </div> */}

        {/* System Prompt */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            System prompt
          </h3>
          <div className="flex items-center space-x-2 mb-3">
            <div className="relative flex-1 system-prompt-dropdown">
              <div
                className="flex items-center justify-between p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors bg-white"
                onClick={() =>
                  setIsSystemPromptDropdownOpen(!isSystemPromptDropdownOpen)
                }
              >
                <span className="text-sm text-gray-900">
                  {localSystemPromptType || "Custom Prompt"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isSystemPromptDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* System Prompt Dropdown */}
              <div
                className={`absolute z-50 w-full bottom-full mb-1 transition-all duration-200 ease-in-out ${
                  isSystemPromptDropdownOpen
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 translate-y-1 pointer-events-none"
                }`}
              >
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <div className="text-xs font-medium text-gray-500 px-2 py-1">
                      Custom prompt
                    </div>
                    <div
                      className="p-2 cursor-pointer hover:bg-gray-50 rounded text-sm text-gray-900"
                      onClick={() => {
                        setLocalSystemPromptType("");
                        setCustomInstructions("");
                        setIsSystemPromptDropdownOpen(false);
                      }}
                    >
                      Custom prompt
                    </div>
                  </div>

                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 px-2 py-1">
                      Examples
                    </div>
                    {[
                      "AI agent",
                      "Customer support agent",
                      "Sales agent",
                      "Language tutor",
                      "Coding expert",
                      "Life coach",
                      "Futuristic fashion advisor",
                    ].map((option) => (
                      <div
                        key={option}
                        className={`p-2 cursor-pointer hover:bg-gray-50 rounded text-sm flex items-center justify-between ${
                          localSystemPromptType === option ? "bg-gray-50" : ""
                        }`}
                        onClick={() => {
                          setLocalSystemPromptType(option);
                          setIsSystemPromptDropdownOpen(false);
                        }}
                      >
                        <span className="text-gray-900">{option}</span>
                        {localSystemPromptType === option && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Instructions
          </h3>
          <Textarea
            ref={instructionsTextareaRef}
            placeholder="### Role
- Primary Function: You are an AI chatbot who helps users with their inquiries, issues and requests."
            className="min-h-[120px] text-sm resize-y"
            value={
              localSystemPromptType === ""
                ? customInstructions
                : systemPromptTemplates[localSystemPromptType] || ""
            }
            onChange={
              localSystemPromptType === ""
                ? (e) => setCustomInstructions(e.target.value)
                : undefined
            }
            readOnly={localSystemPromptType !== ""}
            style={{
              minHeight: "120px",
              overflow: "hidden",
            }}
          />
        </div>
      </div>

      {/* Model Description Tooltip - Outside left panel */}
      {hoveredModel && isModelDropdownOpen && (
        <div
          className="fixed z-[9999] w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
          style={{
            left: "calc(40% + 16px)", // After 1/3 width + some margin
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-5 h-5 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-black"
                viewBox="0 0 320 320"
                fill="currentColor"
              >
                <path d="M297 131a80.6 80.6 0 0 0-93.7-104.2 80.6 80.6 0 0 0-137 29A80.6 80.6 0 0 0 23 189a80.6 80.6 0 0 0 93.7 104.2 80.6 80.6 0 0 0 137-29A80.7 80.7 0 0 0 297.1 131zM176.9 299c-14 .1-27.6-4.8-38.4-13.8l1.9-1 63.7-36.9c3.3-1.8 5.3-5.3 5.2-9v-89.9l27 15.6c.3.1.4.4.5.7v74.4a60 60 0 0 1-60 60zM47.9 244a59.7 59.7 0 0 1-7.1-40.1l1.9 1.1 63.7 36.8c3.2 1.9 7.2 1.9 10.5 0l77.8-45V228c0 .3-.2.6-.4.8L129.9 266a60 60 0 0 1-82-22zM31.2 105c7-12.2 18-21.5 31.2-26.3v75.8c0 3.7 2 7.2 5.2 9l77.8 45-27 15.5a1 1 0 0 1-.9 0L53.1 187a60 60 0 0 1-22-82zm221.2 51.5-77.8-45 27-15.5a1 1 0 0 1 .9 0l64.4 37.1a60 60 0 0 1-9.3 108.2v-75.8c0-3.7-2-7.2-5.2-9zm26.8-40.4-1.9-1.1-63.7-36.8a10.4 10.4 0 0 0-10.5 0L125.4 123V92c0-.3 0-.6.3-.8L190.1 54a60 60 0 0 1 89.1 62.1zm-168.5 55.4-27-15.5a1 1 0 0 1-.4-.7V80.9a60 60 0 0 1 98.3-46.1l-1.9 1L116 72.8a10.3 10.3 0 0 0-5.2 9v89.8zm14.6-31.5 34.7-20 34.6 20v40L160 200l-34.7-20z" />
              </svg>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-gray-900">
                {modelOptions.find((m) => m.id === hoveredModel)?.provider}
              </span>
              <span className="text-gray-400">/</span>
              <span className="text-sm font-bold text-gray-900">
                {modelOptions.find((m) => m.id === hoveredModel)?.name}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            Credits cost:{" "}
            <span className="font-medium">
              {modelOptions.find((m) => m.id === hoveredModel)?.credits}
            </span>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed">
            {modelOptions.find((m) => m.id === hoveredModel)?.description}
          </div>
        </div>
      )}

      {/* Right Panel - Chat */}
      <div
        className="w-2/3 relative p-6"
        style={{
          backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
          backgroundColor: "#fafafa",
        }}
      >
        <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col max-w-sm mx-auto">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">
                {chatData?.name || "Chat"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetChat}
                className="p-1 h-auto hover:bg-gray-100 rounded-full"
                title="Reset chat"
              >
                <RefreshCw className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </Button>
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] ${
                      msg.role === "user" ? "order-2" : ""
                    }`}
                  >
                    <div
                      className={`rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-black text-white"
                          : "bg-gray-50"
                      }`}
                    >
                      {msg.role === "assistant" && DOMPurify ? (
                        <div
                          className="assistant-content"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(msg.content, {
                              ALLOWED_TAGS: [
                                "p",
                                "br",
                                "strong",
                                "em",
                                "u",
                                "h1",
                                "h2",
                                "h3",
                                "ul",
                                "ol",
                                "li",
                                "blockquote",
                                "code",
                                "pre",
                                "a",
                                "table",
                                "thead",
                                "tbody",
                                "tr",
                                "th",
                                "td",
                              ],
                              ALLOWED_ATTR: ["href", "target", "rel", "class"],
                            }),
                          }}
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Ask about the document content..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                size="sm"
                className="bg-black hover:bg-gray-800 text-white"
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim()}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}