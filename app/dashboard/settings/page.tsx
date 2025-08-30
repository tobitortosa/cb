'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("Tobi Tortosa's workspace");
  const [workspaceUrl, setWorkspaceUrl] = useState("tobi-tortosas-workspace2");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">General</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Workspace details</h2>
        
        <div className="space-y-6">
          <div>
            <Label htmlFor="workspace-name" className="text-sm font-medium text-gray-700 mb-2 block">
              Workspace name
            </Label>
            <Input
              id="workspace-name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div>
            <Label htmlFor="workspace-url" className="text-sm font-medium text-gray-700 mb-2 block">
              Workspace URL
            </Label>
            <Input
              id="workspace-url"
              value={workspaceUrl}
              onChange={(e) => setWorkspaceUrl(e.target.value)}
              className="max-w-md"
            />
            <p className="text-sm text-gray-500 mt-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Changing the workspace URL will redirect you to the new address
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button className="bg-gray-600 hover:bg-gray-700 text-white">
            Save
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="text-center text-red-600 text-sm font-medium mb-4">
          DANGER ZONE
        </div>
        
        <div className="border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete workspace</h3>
          <p className="text-gray-600 mb-4">
            Once you delete your workspace, there is no going back. Please be certain.
            <br />
            All your uploaded data and trained agents will be deleted.
          </p>
          
          <div className="flex justify-end">
            <Button variant="destructive">
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}