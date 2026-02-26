'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Crop,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { uploadAvatar, uploadBanner, uploadProjectImage } from '@/lib/api/posts';
import { uploadCompanyLogo } from '@/lib/api/profile';
import ImageCropper from './ImageCropper';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'avatar' | 'banner' | 'project' | 'logo';
  currentImageUrl?: string | null;
  onImageUpdated: (imageUrl: string) => void;
}

export function ImageUploadModal({
  isOpen,
  onClose,
  type,
  currentImageUrl,
  onImageUpdated,
}: ImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAvatar = type === 'avatar';
  const isBanner = type === 'banner';
  const isProject = type === 'project';
  const isLogo = type === 'logo';

  let title = 'Update Image';
  if (isAvatar) title = 'Update Profile Photo';
  if (isBanner) title = 'Update Cover Photo';
  if (isProject) title = 'Add Project Image';
  if (isLogo) title = 'Upload Company Logo';

  const aspectRatio = (isAvatar || isLogo) ? 'aspect-square' : 'aspect-[3/1]';
  const cropAspectRatio = (isAvatar || isLogo) ? 1 : (isProject ? 16 / 9 : 4);
  const maxSize = isAvatar || isLogo ? 5 : 10; // MB

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

      if (isAvatar) {
        const result = await uploadAvatar(fileToUpload);
        imageUrl = result.avatarUrl;
      } else if (isBanner) {
        const result = await uploadBanner(fileToUpload);
        imageUrl = result.bannerUrl;
      } else if (isProject) {
        const result = await uploadProjectImage(fileToUpload);
        imageUrl = result.imageUrl;
      } else {
        const result = await uploadCompanyLogo(fileToUpload);
        imageUrl = result.logoUrl;
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
      {/* Cropper Modal - Wrapped in Dialog to handle interaction/focus trap properly */}
      <Dialog.Root open={showCropper && !!rawImageUrl} onOpenChange={(open) => { if (!open) handleCropCancel(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/90 z-[60]" />
          <Dialog.Content asChild>
            <div className="fixed inset-0 z-[61] flex items-center justify-center">
              <Dialog.Title className="sr-only">Crop image</Dialog.Title>
              {rawImageUrl && (
                <ImageCropper
                  imageSrc={rawImageUrl}
                  aspectRatio={cropAspectRatio}
                  onCropComplete={handleCropComplete}
                  onCancel={handleCropCancel}
                  cropShape={isAvatar ? 'circle' : 'rectangle'}
                />
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

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
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                  />
                </Dialog.Overlay>

                <Dialog.Content asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 px-4"
                  >
                    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-neutral-800">
                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                          {title}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                          <button className="p-2 text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                          </button>
                        </Dialog.Close>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
                          >
                            {error}
                          </motion.div>
                        )}

                        {previewUrl ? (
                          <div className="space-y-4">
                            <div className={`relative ${aspectRatio} w-full overflow-hidden rounded-xl border-2 border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800`}>
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-500 dark:text-neutral-400 truncate max-w-[150px]">
                                {selectedFile?.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={handleReCrop}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                >
                                  <Crop className="w-4 h-4" />
                                  Re-crop
                                </button>
                                <button
                                  onClick={clearSelection}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                              relative ${aspectRatio} w-full rounded-xl border-2 border-dashed cursor-pointer
                              transition-all duration-200
                              ${dragActive
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-neutral-500 bg-gray-50 dark:bg-neutral-800/50'
                              }
                            `}
                          >
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${dragActive
                                ? 'bg-blue-100 dark:bg-blue-900/40'
                                : 'bg-gray-100 dark:bg-neutral-700'
                                }`}>
                                {dragActive ? (
                                  <Upload className="w-7 h-7 text-blue-500" />
                                ) : (
                                  <ImageIcon className="w-7 h-7 text-gray-400 dark:text-neutral-500" />
                                )}
                              </div>
                              <p className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                                {dragActive ? 'Drop image here' : 'Click to upload or drag and drop'}
                              </p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
                                PNG, JPG, GIF, WebP up to {maxSize}MB
                              </p>
                              {isAvatar && (
                                <p className="mt-1 text-xs text-gray-400 dark:text-neutral-500">
                                  Recommended: Square image (1:1)
                                </p>
                              )}
                              {isBanner && (
                                <p className="mt-1 text-xs text-gray-400 dark:text-neutral-500">
                                  Recommended: 1584 x 396 pixels (4:1)
                                </p>
                              )}
                              {isProject && (
                                <p className="mt-1 text-xs text-gray-400 dark:text-neutral-500">
                                  Recommended: 1920 x 1080 pixels (16:9)
                                </p>
                              )}
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleInputChange}
                              className="hidden"
                            />
                          </div>
                        )}

                        {!previewUrl && currentImageUrl && !isProject && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
                            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-2">
                              Current {isAvatar ? 'photo' : 'cover'}:
                            </p>
                            <div className={`relative ${aspectRatio} w-32 ${isAvatar ? '' : 'w-full'} overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700`}>
                              <img
                                src={currentImageUrl}
                                alt="Current"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
                        <Button
                          onClick={handleClose}
                          className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300 dark:hover:bg-neutral-600 text-gray-700 dark:text-neutral-300 rounded-lg transition-colors"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpload}
                          disabled={(!croppedFile && !selectedFile) || uploading}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Save Image
                            </>
                          )}
                        </Button>
                      </div>
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
