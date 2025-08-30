'use client';

import React from 'react';
import { FileText, Globe, Type, Database } from 'lucide-react';

export type SourceType = 'files' | 'website' | 'text' | 'notion';

interface SourceOption {
  id: SourceType;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface SourcesMenuProps {
  selectedSource: SourceType;
  onSourceSelect: (source: SourceType) => void;
}

const sourceOptions: SourceOption[] = [
  {
    id: 'files',
    label: 'Files',
    icon: <FileText className="w-4 h-4" />,
    description: 'Upload PDF, DOC, DOCX, TXT files'
  },
  {
    id: 'website',
    label: 'Website',
    icon: <Globe className="w-4 h-4" />,
    description: 'Crawl website content'
  },
  {
    id: 'text',
    label: 'Text',
    icon: <Type className="w-4 h-4" />,
    description: 'Add text content directly'
  },
  {
    id: 'notion',
    label: 'Notion',
    icon: <Database className="w-4 h-4" />,
    description: 'Connect Notion workspace'
  }
];

export default function SourcesMenu({ selectedSource, onSourceSelect }: SourcesMenuProps) {
  return (
    <div className="space-y-2">
      {sourceOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => onSourceSelect(option.id)}
          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
            selectedSource === option.id
              ? 'border-blue-500 bg-blue-50 text-blue-900'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={selectedSource === option.id ? 'text-blue-600' : 'text-gray-500'}>
              {option.icon}
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">{option.label}</div>
              {option.description && (
                <div className={`text-xs ${
                  selectedSource === option.id ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  {option.description}
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}