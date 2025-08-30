'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

export default function UsagePage() {
  const dates = Array.from({ length: 20 }, (_, i) => `Aug ${i + 1}`);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Usage</h1>
        <div className="flex items-center space-x-4">
          <Select defaultValue="all-agents">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-agents">All agents</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Aug 01, 2025 - Aug 20, 2025</span>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="0, 100"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-500">/ 100</div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Credits used</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="0, 100"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-500">/ 1</div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Agents used</div>
          </div>
        </div>
      </div>

      {/* Usage History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Usage history</h3>
        
        {/* Chart Area */}
        <div className="h-64 flex items-end justify-between px-4 border-b border-gray-100">
          {dates.map((date, index) => (
            <div key={date} className="flex flex-col items-center">
              <div className="w-2 h-0 bg-blue-500 rounded-t mb-2"></div>
              <span className="text-xs text-gray-500 transform -rotate-45 origin-top-left">
                {date}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}