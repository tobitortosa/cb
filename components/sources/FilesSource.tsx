'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/alert-dialog';
import { Upload, Search, MoreHorizontal, ChevronRight, AlertTriangle, HelpCircle, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import SourcesSummary from './SourcesSummary';
import { useSources } from '@/contexts/SourcesContext';
import { useParams } from 'next/navigation';

interface UploadedFile {
  id: number;
  name: string;
  size: string;
  sizeInKb: number;
  isNew: boolean;
  isPdf?: boolean;
  selected?: boolean;
  file: File; // Store the actual File object for upload
}

interface ToastMessage {
  id: number;
  message: string;
  type: 'error' | 'success';
}

export default function FilesSource({ showTitle = true } : {showTitle?: boolean }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const params = useParams();
  const chatId = params?.id as string;
  
  const { 
    sources, 
    isLoading,
    addFiles, 
    removeFile, 
    toggleFileSelection, 
    selectAllFiles, 
    deselectAllFiles, 
    removeSelectedFiles,
    cleanupFailedSources
  } = useSources();
  
  const uploadedFiles = sources.files;

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    const id = Math.floor(Date.now() + Math.random() * 10000);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = [];
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    let invalidFiles = 0;
    
    Array.from(files).forEach((file, index) => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isAllowed = allowedTypes.includes(fileExtension);
      
      if (isAllowed) {
        const isPdf = fileExtension === '.pdf';
        const sizeInKb = Math.round(file.size / 1024);
        const size = `${sizeInKb} KB`;
        
        newFiles.push({
          id: Math.floor(Date.now() * Math.random() + index * 1000), // Unique ID based on timestamp and random
          name: file.name,
          size: size,
          sizeInKb: sizeInKb,
          isNew: true,
          isPdf: isPdf,
          selected: false,
          file: file // Store the File object
        });
      } else {
        invalidFiles++;
      }
    });
    
    if (newFiles.length > 0) {
      addFiles(newFiles);
      const pdfCount = newFiles.filter(f => f.isPdf).length;
      const otherCount = newFiles.length - pdfCount;
      
      let message = '';
      if (pdfCount > 0 && otherCount > 0) {
        message = `${pdfCount} PDF and ${otherCount} other file(s) uploaded successfully`;
      } else if (pdfCount > 0) {
        message = `${pdfCount} PDF file(s) uploaded successfully`;
      } else {
        message = `${otherCount} file(s) uploaded successfully`;
      }
      showToast(message, 'success');
    }
    
    if (invalidFiles > 0) {
      showToast(`${invalidFiles} file(s) rejected. Only PDF, DOC, DOCX, and TXT files are allowed`, 'error');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    // Reset input value to allow uploading the same file again
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    processFiles(files);
  };

  const handleRemoveFile = (fileId: number) => {
    removeFile(fileId);
    showToast('File removed', 'success');
  };

  const handleRemoveSelected = () => {
    const selectedCount = uploadedFiles.filter(f => f.selected).length;
    if (selectedCount === 0) {
      showToast('No files selected', 'error');
      return;
    }
    
    // Show confirmation dialog
    setShowDeleteDialog(true);
  };

  const confirmDeleteSelected = async () => {
    const selectedFiles = uploadedFiles.filter(f => f.selected);
    if (selectedFiles.length === 0) return;

    setIsDeleting(true);
    try {
      // If we have a chatId and files have sourceIds, call the API to delete from backend
      if (chatId) {
        const sourceIdsToDelete = selectedFiles
          .filter(f => f.sourceId) // Only files that exist in the database
          .map(f => f.sourceId);

        if (sourceIdsToDelete.length > 0) {
          const response = await fetch(`/api/chats/${chatId}/sources`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              source_ids: sourceIdsToDelete
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to delete files from server');
          }

          console.log(`Deleted ${sourceIdsToDelete.length} files from server`);
        }
      }

      // Remove from local state
      removeSelectedFiles();
      showToast(`${selectedFiles.length} file(s) removed successfully`, 'success');
      
    } catch (error) {
      console.error('Error deleting files:', error);
      showToast(`Error deleting files: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const confirmDeleteSingle = async (fileId: number) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;

    setIsDeleting(true);
    try {
      // If we have a chatId and file has sourceId, call the API to delete from backend
      if (chatId && file.sourceId) {
        const response = await fetch(`/api/chats/${chatId}/sources`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_ids: [file.sourceId]
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete file from server');
        }

        console.log(`Deleted file ${file.name} from server`);
      }

      // Remove from local state
      handleRemoveFile(fileId);
      showToast(`${file.name} removed successfully`, 'success');
      
    } catch (error) {
      console.error('Error deleting file:', error);
      showToast(`Error deleting file: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCleanupFailed = async () => {
    const failedCount = uploadedFiles.filter(f => f.status === 'failed').length;
    if (failedCount === 0) {
      showToast('No failed files to clean up', 'error');
      return;
    }
    
    try {
      await cleanupFailedSources();
      showToast(`${failedCount} failed file(s) cleaned up`, 'success');
    } catch (error) {
      showToast('Failed to clean up files', 'error');
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
    <div className={`max-w-6xl mx-auto ${!showTitle ? 'mt-[20px]' : ''}`}>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="mb-8">
            {showTitle && <h1 className="text-2xl font-bold text-gray-900 mb-2">Files</h1>}
            <p className="text-gray-600">
              Upload documents to train your AI. Extract text from PDFs, DOCX, and TXT files.
            </p>
            <Link href="#" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mt-2">
              <HelpCircle className="w-4 h-4 mr-1" />
              Learn more
            </Link>
          </div>

          {/* Add Files Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add files</h2>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                <p className="text-sm text-orange-800">
                  If you are uploading a PDF, make sure you can select/highlight the text.
                </p>
              </div>
            </div>

            {/* File Upload Area */}
            <div 
              className={`
                border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200
                ${isDragging 
                  ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="mb-4">
                <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className={`mb-2 ${isDragging ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>
                  {isDragging ? 'Drop files here' : 'Drag & drop files here, or click to select files'}
                </p>
                <p className="text-sm text-gray-500">Supported file types: pdf, doc, docx, txt</p>
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button 
                  variant="outline" 
                  className="cursor-pointer"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('file-upload')?.click();
                  }}
                >
                  Select Files
                </Button>
              </label>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Uploaded Files ({uploadedFiles.length})</h3>
                  <div className="flex items-center space-x-2">
                    {uploadedFiles.some(f => f.status === 'failed') && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleCleanupFailed}
                        className="text-red-600 hover:text-red-700"
                      >
                        Clean up failed
                      </Button>
                    )}
                    {uploadedFiles.some(f => f.selected) ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={deselectAllFiles}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Deselect all
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleRemoveSelected}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove selected ({uploadedFiles.filter(f => f.selected).length})
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={selectAllFiles}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Select all
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {uploadedFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                        file.selected 
                          ? 'border-blue-500 bg-blue-50' 
                          : file.status === 'failed' 
                            ? 'border-red-200 bg-red-50'
                            : file.status === 'processing'
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input 
                          type="checkbox" 
                          checked={file.selected || false}
                          onChange={() => toggleFileSelection(file.id)}
                          className="rounded border-gray-300"
                          disabled={file.status === 'failed' || file.status === 'processing'}
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${
                              file.status === 'failed' ? 'text-red-700' : 'text-gray-900'
                            }`}>{file.name}</span>
                            {file.isPdf && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                PDF
                              </Badge>
                            )}
                            {file.isNew && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                New
                              </Badge>
                            )}
                            {file.status === 'failed' && (
                              <Badge variant="destructive" className="text-xs">
                                Failed
                              </Badge>
                            )}
                            {file.status === 'processing' && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                                Processing
                              </Badge>
                            )}
                            {file.status === 'upload_pending' && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                                Pending
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{file.size}</span>
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
                            <AlertDialogTitle>Delete File</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{file.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => confirmDeleteSingle(file.id)}
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
                <ChevronRight className="w-5 h-5" />
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Files</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {uploadedFiles.filter(f => f.selected).length} selected file(s)? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSelected}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
  );
}