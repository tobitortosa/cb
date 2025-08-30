'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useSources } from '@/contexts/SourcesContext';
import { useRouter, usePathname, useParams } from 'next/navigation';

interface ToastMessage {
  id: number;
  message: string;
  type: 'error' | 'success';
}

interface SourcesSummaryProps {
  canCreate?: boolean;
}

export default function SourcesSummary({ 
  canCreate 
}: SourcesSummaryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isCreating, setIsCreating] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [persistentSuccessToast, setPersistentSuccessToast] = useState<string | null>(null);
  const { getSourcesSummary, sources, refreshSources, getValidSources, cleanupFailedSources } = useSources();
  const sourcesData = getSourcesSummary();
  
  // Detect if we're in chatbot context (retraining) or dashboard create context
  const isRetrainingMode = pathname?.includes('/chatbot/') && params?.id;
  const chatId = isRetrainingMode ? params.id as string : null;
  
  const totalSources = sourcesData.files.count + 
                      sourcesData.text.count + 
                      sourcesData.website.count + 
                      sourcesData.notion.count + 
                      sourcesData.qa.count;

  // Calculate if there are new sources for retraining
  const newFilesCount = sources.files.filter(file => file.isNew).length;
  const newTextsCount = sources.text.length; // Assuming texts are always "new" when added
  const hasNewContent = newFilesCount > 0 || newTextsCount > 0;

  // Auto-calculate canCreate if not provided
  let shouldEnableCreate;
  if (canCreate !== undefined) {
    shouldEnableCreate = canCreate;
  } else if (isRetrainingMode) {
    // For retraining, only enable if there's new content to add
    shouldEnableCreate = hasNewContent;
  } else {
    // For creating, enable if there are any sources
    shouldEnableCreate = totalSources > 0;
  }

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    const id = Math.floor(Date.now() + Math.random() * 10000);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds (increased from 4 for success messages)
    const duration = type === 'success' ? 5000 : 4000;
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleCreateAgent = async () => {
    console.log('🔄 handleCreateAgent started, isCreating:', isCreating);
    
    // Get valid sources only
    const validSources = getValidSources();
    const uploadedFiles = validSources.files;
    const textSnippets = validSources.texts;
    const totalSources = uploadedFiles.length + textSnippets.length;
    
    if (isRetrainingMode) {
      // For retraining, check if there's new content
      const newFiles = uploadedFiles.filter(file => file.isNew);
      const newContent = newFiles.length + textSnippets.length;
      
      if (newContent === 0) {
        showToast('Please add new files or text content to retrain the agent', 'error');
        return;
      }
    } else {
      // For creating, check if there are any sources
      if (totalSources === 0) {
        showToast('Please add at least one source (file or text) before creating an agent', 'error');
        return;
      }
    }

    // If we're in retrain mode, clean up failed sources first
    let cleanupOccurred = false;
    if (isRetrainingMode) {
      try {
        console.log('🧹 Cleaning up failed sources before retraining...');
        const failedCount = sources.dbSources.filter(s => 
          s.status === 'failed' || s.status === 'upload_pending'
        ).length;
        
        if (failedCount > 0) {
          await cleanupFailedSources();
          cleanupOccurred = true;
          console.log(`🧹 Cleaned up ${failedCount} failed sources`);
        } else {
          console.log('ℹ️ No failed sources to clean up');
        }
      } catch (error) {
        console.error('Error cleaning up failed sources:', error);
        // Continue anyway
      }
    }
    
    console.log('⏳ Setting isCreating to true');
    setIsCreating(true);

    let shouldShowSuccessToast = false;
    let successMessage = '';

    try {
      // Prepare files array - only include new files that need to be uploaded
      const newFiles = uploadedFiles.filter(file => file.isNew);
      const filesData = newFiles.map(file => ({
        name: file.name,
        size: file.sizeInKb * 1024, // Convert back to bytes
      }));
      
      // Prepare texts array
      const textsData = textSnippets.map(snippet => ({
        title: snippet.title,
        content: snippet.content,
      }));

      console.log(`📋 Preparing to ${isRetrainingMode ? 'retrain' : 'create'} agent with:`, {
        newFiles: filesData.length,
        existingFiles: uploadedFiles.length - newFiles.length,
        texts: textsData.length
      });
      
      let response;
      let finalChatId = chatId;
      
      console.log('🌐 Making API call...');
      if (isRetrainingMode && chatId) {
        // Retrain existing agent - use existing chat ID
        response = await fetch('/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: chatId, // Use existing chat ID
            name: 'Retrained Chatbot',
            description: `Chatbot retrained with ${uploadedFiles.length} file(s) and ${textSnippets.length} text(s)`,
            files: filesData,
            texts: textsData,
          })
        });
      } else {
        // Create new agent
        response = await fetch('/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'New Chatbot',
            description: `Chatbot created from ${uploadedFiles.length} file(s) and ${textSnippets.length} text(s)`,
            files: filesData,
            texts: textsData,
          })
        });
      }

      const data = await response.json();

      console.log('✅ API call completed, response ok:', response.ok);

      if (!response.ok) {
        console.error('API Error:', data);
        if (response.status === 401) {
          showToast('Please log in to create an agent', 'error');
          router.push('/auth/login');
        } else {
          showToast(data.error || `Failed to ${isRetrainingMode ? 'retrain' : 'create'} agent. Please try again.`, 'error');
        }
        return;
      }

      const { chat, files: fileResults, texts: textResults } = data;
      finalChatId = chat.id;
      console.log(`${isRetrainingMode ? 'Retrained' : 'Created'} chat with ID:`, finalChatId);
      
      // Log file processing results
      if (fileResults && fileResults.length > 0) {
        const uploadPending = fileResults.filter((f: any) => f.status === 'upload_pending').length;
        const existing = fileResults.filter((f: any) => f.status === 'existing').length;
        const processing = fileResults.filter((f: any) => f.status === 'processing').length;
        
        console.log(`File processing summary: ${uploadPending} pending upload, ${existing} existing re-processed, ${processing} processing`);
      }
      
      // Upload files if any have upload_pending status
      console.log('📂 Checking for files to upload...');
      if (fileResults && fileResults.length > 0) {
        const pendingFiles = fileResults.filter((f: any) => f.status === 'upload_pending');
        console.log(`📋 File results: ${fileResults.length} total, ${pendingFiles.length} pending upload`);
        
        if (pendingFiles.length > 0) {
          console.log('⬆️ Starting file uploads...');
          // Upload each pending file (only new files that need uploading)
          for (const fileResult of pendingFiles) {
            // Find the corresponding file data - only look for new files
            const fileData = uploadedFiles.find(f => f.name === fileResult.name && f.isNew);
            
            if (fileData && fileData.file && fileResult.source_id) {
              try {
                console.log(`📤 Uploading new file: ${fileData.name}`);
                const uploadFormData = new FormData();
                uploadFormData.append('file', fileData.file);
                uploadFormData.append('chatId', finalChatId!);
                uploadFormData.append('sourceId', fileResult.source_id);

                const uploadResponse = await fetch('/api/upload', {
                  method: 'POST',
                  body: uploadFormData
                });

                const uploadData = await uploadResponse.json();

                if (!uploadResponse.ok) {
                  console.error(`❌ Upload error for ${fileData.name}:`, uploadData);
                  showToast(`Failed to upload ${fileData.name}`, 'error');
                } else {
                  console.log(`✅ File ${fileData.name} uploaded successfully`);
                }
              } catch (uploadError) {
                console.error(`💥 Error uploading file ${fileData.name}:`, uploadError);
                showToast(`Error uploading ${fileData.name}`, 'error');
              }
            } else {
              console.log(`⏭️ Skipping upload for existing file: ${fileResult.name} (already in storage)`);
            }
          }
          console.log('✅ All file uploads completed');
        } else {
          console.log('ℹ️ No files need uploading');
        }
      } else {
        console.log('ℹ️ No file results to process');
      }
      
      if (textResults && textResults.length > 0) {
        const successfulTexts = textResults.filter((t: any) => t.ok);
        const failedTexts = textResults.filter((t: any) => !t.ok);
        
        if (successfulTexts.length > 0) {
          console.log(`Created ${successfulTexts.length} text source(s) successfully`);
        }
        
        if (failedTexts.length > 0) {
          console.error('Some text sources failed:', failedTexts);
          showToast('Some text sources failed to process', 'error');
        }
      }
      
                  // Final operations - redirect or refresh
      console.log('🏁 Starting final operations...');
      if (isRetrainingMode) {
        // For retraining, only refresh if we cleaned up failed sources
        console.log('🔄 Agent retrained successfully.');
        
        if (cleanupOccurred) {
          console.log('🔄 Refreshing sources (cleanup occurred)...');
          await refreshSources();
          console.log('✅ Sources refreshed');
          // Toast will be shown in finally block after refresh
          shouldShowSuccessToast = true;
          successMessage = 'Agent retrained successfully!';
        } else {
          console.log('ℹ️ Skipping refresh (no cleanup needed, backend already updated)');
          // Show toast immediately since no refresh will happen
          console.log('🎉 Showing success toast immediately');
          showToast('Agent retrained successfully!', 'success');
        }
      } else {
        // New chat, redirect to playground
        console.log('🎉 Agent created successfully, will redirect');
        shouldShowSuccessToast = true;
        successMessage = 'Agent created successfully!';
        // Show toast immediately for new chat since no refresh
        showToast('Agent created successfully!', 'success');
        setTimeout(() => {
          router.push(`/chatbot/${finalChatId}/playground`);
        }, 1000); // Short delay to show the toast
      }
      console.log('🏁 Final operations completed');
      
    } catch (error) {
      console.error('💥 Error in handleCreateAgent:', error);
      showToast(`Unexpected error occurred while ${isRetrainingMode ? 'retraining' : 'creating'} agent`, 'error');
    } finally {
      // This will only run after EVERYTHING is done
      console.log('🔚 Setting isCreating to false');
      setIsCreating(false);
      
      // Show success toast AFTER all re-renders are done
      if (shouldShowSuccessToast) {
        setTimeout(() => {
          console.log('🎉 Showing success toast:', successMessage);
          showToast(successMessage, 'success');
        }, 100); // Small delay to ensure component has re-rendered
      }
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sources</h3>
        
        <div className="space-y-4 mb-6">
          {/* Total Sources */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Total Sources</span>
            <span className="text-sm font-semibold text-gray-900">
              {totalSources}
            </span>
          </div>

        {/* Files */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Files</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              {sourcesData.files.count}
            </span>
            {isRetrainingMode && newFilesCount > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {newFilesCount} new
              </span>
            )}
          </div>
        </div>

        {/* Text */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Text</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              {sourcesData.text.count}
            </span>
            {isRetrainingMode && newTextsCount > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {newTextsCount} new
              </span>
            )}
          </div>
        </div>          {/* Website */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Website</span>
            <span className="text-sm font-medium text-gray-900">
              {sourcesData.website.count}
            </span>
          </div>

          {/* Notion */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Notion</span>
            <span className="text-sm font-medium text-gray-900">
              {sourcesData.notion.count}
            </span>
          </div>

          {/* Q&A */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Q&A</span>
            <span className="text-sm font-medium text-gray-900">
              {sourcesData.qa.count}
            </span>
          </div>
          
          {/* Total Size */}
          {sourcesData.files.totalSize > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Total size</span>
                <span className="text-sm text-gray-600">
                  {sourcesData.files.totalSize} KB
                </span>
              </div>
            </div>
          )}
        </div>

        <Button 
          className="w-full bg-black hover:bg-gray-800 text-white disabled:bg-gray-300 disabled:text-gray-500"
          onClick={handleCreateAgent}
          disabled={isCreating || !shouldEnableCreate}
          title={
            isRetrainingMode && !hasNewContent 
              ? "Add new files or text content to retrain the agent"
              : undefined
          }
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isRetrainingMode ? 'Retraining...' : 'Creating...'}
            </>
          ) : (
            isRetrainingMode ? 'Retrain agent' : 'Create agent'
          )}
        </Button>
      </div>

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center justify-between p-4 rounded-lg shadow-lg 
              transform transition-all duration-300 ease-in-out
              animate-in slide-in-from-bottom-5 fade-in-0
              ${toast.type === 'error' 
                ? 'bg-red-50 border border-red-200 text-red-800' 
                : 'bg-green-50 border border-green-200 text-green-800'
              }
              min-w-[300px] max-w-md
            `}
          >
            <div className="flex items-center space-x-2">
              {toast.type === 'error' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}