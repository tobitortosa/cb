"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";
import SourcesSummary from "./SourcesSummary";
import { useSources } from "@/contexts/SourcesContext";

interface QAPair {
  id: number;
  question: string;
  answer: string;
}

export default function QASource({ showTitle = true }: { showTitle?: boolean }) {
  const [qaPairs, setQAPairs] = useState<QAPair[]>([
    { id: 1, question: "", answer: "" },
  ]);
  const { sources, isLoading, setQAPairs: setSourceQAPairs } = useSources();

  // Load existing Q&A pairs from context only on mount
  useEffect(() => {
    if (sources.qa.length > 0) {
      setQAPairs(sources.qa);
    }
  }, []); // Empty dependency array - only run on mount

  // Update context whenever qaPairs changes, but skip initial render
  useEffect(() => {
    const isInitialState =
      qaPairs.length === 1 &&
      qaPairs[0].question === "" &&
      qaPairs[0].answer === "" &&
      qaPairs[0].id === 1;
    if (!isInitialState) {
      setSourceQAPairs(qaPairs);
    }
  }, [qaPairs, setSourceQAPairs]);

  const addQAPair = () => {
    const newId = Math.max(...qaPairs.map((qa) => qa.id)) + 1;
    setQAPairs([...qaPairs, { id: newId, question: "", answer: "" }]);
  };

  const removeQAPair = (id: number) => {
    if (qaPairs.length > 1) {
      setQAPairs(qaPairs.filter((qa) => qa.id !== id));
    }
  };

  const updateQAPair = (
    id: number,
    field: "question" | "answer",
    value: string
  ) => {
    setQAPairs(
      qaPairs.map((qa) => (qa.id === id ? { ...qa, [field]: value } : qa))
    );
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Q&A</h1>
            )}
            <p className="text-gray-600">
              Add question and answer pairs to train your AI agent.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Question & Answer Pairs
              </h2>
              <Button onClick={addQAPair} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Q&A
              </Button>
            </div>

            <div className="space-y-6">
              {qaPairs.map((qa, index) => (
                <div
                  key={qa.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">
                      Q&A Pair {index + 1}
                    </span>
                    {qaPairs.length > 1 && (
                      <Button
                        onClick={() => removeQAPair(qa.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor={`question-${qa.id}`}
                        className="text-sm font-medium text-gray-700 mb-2 block"
                      >
                        Question
                      </Label>
                      <Input
                        id={`question-${qa.id}`}
                        placeholder="Enter your question..."
                        value={qa.question}
                        onChange={(e) =>
                          updateQAPair(qa.id, "question", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor={`answer-${qa.id}`}
                        className="text-sm font-medium text-gray-700 mb-2 block"
                      >
                        Answer
                      </Label>
                      <Input
                        id={`answer-${qa.id}`}
                        placeholder="Enter your answer..."
                        value={qa.answer}
                        onChange={(e) =>
                          updateQAPair(qa.id, "answer", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
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
