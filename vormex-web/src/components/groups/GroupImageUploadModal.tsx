'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  Crop,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { uploadGroupIcon, uploadGroupCover } from '@/lib/api/groups';
import ImageCropper from '@/components/profile/ImageCropper';

interface GroupImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'icon' | 'cover';
  groupId: string;
  currentImageUrl?: string | null;
  onImageUpdated: (imageUrl: string) => void;
}

export function GroupImageUploadModal({
  isOpen,
  onClose,
  type,
  groupId,
  currentImageUrl,
  onImageUpdated,
}: GroupImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isIcon = type === 'icon';
  const title = isIcon ? 'Update Group Icon' : 'Update Group Cover';
  const aspectRatio = isIcon ? 'aspect-square' : 'aspect-[4/1]';
  const cropAspectRatio = isIcon ? 1 : 4; // 1:1 for icon, 4:1 for cover
  const maxSize = isIcon ? 5 : 10; // MB

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSize) {
      setError(`Image must be less than ${maxSize}MB`);
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview for cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawImageUrl(e.target?.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  }, [maxSize]);

  const handleCropComplete = useCallback((croppedBlob: Blob) => {
    // Convert blob to file
    const croppedFile = new File(
      [croppedBlob],
      selectedFile?.name || 'cropped-image.jpg',
      { type: 'image/jpeg' }
    );
    
    setCroppedFile(croppedFile);
    
    // Create preview URL from cropped blob
    const url = URL.createObjectURL(croppedBlob);
    setPreviewUrl(url);
    setShowCropper(false);
  }, [selectedFile]);

  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setRawImageUrl(null);
    setSelectedFile(null);
  }, []);

  const handleReCrop = useCallback(() => {
    if (rawImageUrl) {
      setShowCropper(true);
    }
  }, [rawImageUrl]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    const fileToUpload = croppedFile || selectedFile;
    if (!fileToUpload) return;

    setUploading(true);
    setError(null);

    try {
      let imageUrl: string;
      
      if (isIcon) {
        const result = await uploadGroupIcon(groupId, fileToUpload);
        imageUrl = result.iconUrl;
      } else {
        const result = await uploadGroupCover(groupId, fileToUpload);
        imageUrl = result.coverUrl;
      }

      onImageUpdated(imageUrl);
      handleClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setCroppedFile(null);
    setPreviewUrl(null);
    setRawImageUrl(null);
    setShowCropper(false);
    setError(null);
    setDragActive(false);
    onClose();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setCroppedFile(null);
    setPreviewUrl(null);
    setRawImageUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Image Cropper */}
      <AnimatePresence>
        {showCropper && rawImageUrl && (
          <ImageCropper
            imageSrc={rawImageUrl}
            aspectRatio={cropAspectRatio}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
            cropShape={isIcon ? 'rectangle' : 'rectangle'}
          />
        )}
      </AnimatePresence>

      <Dialog.Root open={isOpen && !showCropper} onOpenChange={handleClose}>
        <Dialog.Portal>
          <AnimatePresence>
            {isOpen && !showCropper && (
              <>
                <Dialog.Overlay asChild>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                  />
                </Dialog.Overlay>

                <Dialog.Content asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                      <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                      </Dialog.Title>
                      <Dialog.Close asChild>
                        <button
                          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          aria-label="Close"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </Dialog.Close>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Error Message */}
                      {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                          {error}
                        </div>
                      )}

                      {/* Preview or Upload Area */}
                      {previewUrl ? (
                        <div className="space-y-4">
                          {/* Preview */}
                          <div className={`relative ${aspectRatio} w-full bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden`}>
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              onClick={handleReCrop}
                              className="flex-1"
                            >
                              <Crop className="w-4 h-4 mr-2" />
                              Re-crop
                            </Button>
                            <Button
                              variant="outline"
                              onClick={clearSelection}
                              className="flex-1"
                            >
                              Choose Different
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Upload Area */
                        <div
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                            dragActive
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleInputChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />

                          <div className="flex flex-col items-center gap-4">
                            <div className={`p-4 rounded-full ${
                              dragActive
                                ? 'bg-blue-100 dark:bg-blue-900/40'
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              {dragActive ? (
                                <Upload className="w-8 h-8 text-blue-500" />
                              ) : (
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                              )}
                            </div>

                            <div>
                              <p className="text-gray-700 dark:text-gray-300 font-medium">
                                {dragActive ? 'Drop image here' : 'Drag and drop an image'}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                or click to browse
                              </p>
                            </div>

                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {isIcon
                                ? 'Square image recommended • Max 5MB'
                                : 'Wide image recommended (4:1 ratio) • Max 10MB'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Current Image */}
                      {currentImageUrl && !previewUrl && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Current {isIcon ? 'icon' : 'cover'}:
                          </p>
                          <div className={`relative ${aspectRatio} w-full max-w-[200px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden`}>
                            <img
                              src={currentImageUrl}
                              alt="Current"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <Button
                        variant="ghost"
                        onClick={handleClose}
                        disabled={uploading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpload}
                        disabled={!previewUrl || uploading}
                        className="min-w-[100px]"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                </Dialog.Content>
              </>
            )}
          </AnimatePresence>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

export default GroupImageUploadModal;
