'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Image as ImageIcon,
  Video,
  Type,
  Sparkles,
  Link2,
  Users,
  Globe,
  Lock,
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { createStory, createStoryWithMedia, type CreateStoryInput, type StoryCategory, type StoryVisibility } from '@/lib/api/stories';

interface StoryCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated?: () => void;
}

type StoryType = 'image' | 'video' | 'text';
type CreatorStep = 'select-type' | 'upload-media' | 'edit' | 'details';

const STORY_CATEGORIES: { value: StoryCategory; label: string; icon: string }[] = [
  { value: 'DAY_AT_WORK', label: 'Day at Work', icon: '💼' },
  { value: 'LEARNING', label: 'Learning', icon: '📚' },
  { value: 'ACHIEVEMENT', label: 'Achievement', icon: '🏆' },
  { value: 'PROJECT', label: 'Project', icon: '📢' },
  { value: 'BEHIND_SCENES', label: 'Behind the Scenes', icon: '🎬' },
  { value: 'TIPS', label: 'Tips', icon: '💭' },
  { value: 'EVENT', label: 'Event', icon: '📅' },
  { value: 'QNA', label: 'Q&A', icon: '🎯' },
  { value: 'GENERAL', label: 'General', icon: '✨' },
];

const VISIBILITY_OPTIONS: { value: StoryVisibility; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'PUBLIC', label: 'Public', icon: <Globe className="w-5 h-5" />, desc: 'Anyone can view' },
  { value: 'CONNECTIONS', label: 'Connections', icon: <Users className="w-5 h-5" />, desc: 'Only connections' },
  { value: 'CLOSE_FRIENDS', label: 'Close Friends', icon: <Lock className="w-5 h-5" />, desc: 'Selected people only' },
];

const TEXT_BACKGROUNDS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
];

export function StoryCreator({ isOpen, onClose, onStoryCreated }: StoryCreatorProps) {
  const [step, setStep] = useState<CreatorStep>('select-type');
  const [storyType, setStoryType] = useState<StoryType | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [textBackground, setTextBackground] = useState(TEXT_BACKGROUNDS[0]);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [category, setCategory] = useState<StoryCategory>('GENERAL');
  const [visibility, setVisibility] = useState<StoryVisibility>('PUBLIC');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (storyType === 'image' && !isImage) {
      setError('Please select an image file');
      return;
    }
    if (storyType === 'video' && !isVideo) {
      setError('Please select a video file');
      return;
    }

    // Validate file size (50MB max for video, 10MB for image)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File too large. Max size: ${isVideo ? '50MB' : '10MB'}`);
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setError(null);
    setStep('edit');
  }, [storyType]);

  const handleTypeSelect = (type: StoryType) => {
    setStoryType(type);
    if (type === 'text') {
      setStep('edit');
    } else {
      setStep('upload-media');
    }
  };

  const handleRemoveMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview(null);
    setStep('upload-media');
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    setError(null);

    try {
      if (storyType === 'text') {
        // Text-only story - use JSON API
        await createStory({
          mediaType: 'TEXT',
          textContent,
          backgroundColor: textBackground,
          category,
          visibility,
          linkUrl: linkUrl || undefined,
          linkTitle: linkTitle || undefined,
        });
      } else {
        // Media story - use FormData for file upload
        const formData = new FormData();
        formData.append('mediaType', storyType === 'video' ? 'VIDEO' : 'IMAGE');
        
        if (mediaFile) {
          formData.append('media', mediaFile);
        }
        if (textContent) {
          formData.append('textContent', textContent);
        }
        
        formData.append('category', category);
        formData.append('visibility', visibility);

        if (linkUrl) {
          formData.append('linkUrl', linkUrl);
          if (linkTitle) {
            formData.append('linkTitle', linkTitle);
          }
        }

        await createStoryWithMedia(formData);
      }
      
      onStoryCreated?.();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create story');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Cleanup
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }
    setStep('select-type');
    setStoryType(null);
    setMediaFile(null);
    setMediaPreview(null);
    setTextContent('');
    setTextBackground(TEXT_BACKGROUNDS[0]);
    setLinkUrl('');
    setLinkTitle('');
    setCategory('GENERAL');
    setVisibility('PUBLIC');
    setError(null);
    onClose();
  };

  const goBack = () => {
    switch (step) {
      case 'upload-media':
        setStep('select-type');
        setStoryType(null);
        break;
      case 'edit':
        if (storyType === 'text') {
          setStep('select-type');
          setStoryType(null);
        } else {
          handleRemoveMedia();
        }
        break;
      case 'details':
        setStep('edit');
        break;
    }
  };

  const canProceed = () => {
    if (step === 'edit') {
      if (storyType === 'text') {
        return textContent.trim().length > 0;
      }
      return !!mediaFile;
    }
    return true;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-lg h-[90vh] max-h-[700px] bg-neutral-900 rounded-3xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              {step !== 'select-type' && (
                <button
                  onClick={goBack}
                  className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5 text-neutral-400" />
                </button>
              )}
              <h2 className="text-lg font-semibold text-white">
                {step === 'select-type' && 'Create Story'}
                {step === 'upload-media' && 'Upload Media'}
                {step === 'edit' && 'Edit Story'}
                {step === 'details' && 'Story Details'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Step 1: Select Type */}
            {step === 'select-type' && (
              <div className="p-6">
                <p className="text-neutral-400 text-sm mb-6">
                  Choose how you want to share your moment
                </p>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Image Option */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTypeSelect('image')}
                    className="flex items-center gap-4 p-4 bg-neutral-800/50 rounded-2xl border border-neutral-700/50 hover:border-blue-500/50 transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <ImageIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors">
                        Photo
                      </h3>
                      <p className="text-neutral-500 text-sm">
                        Share an image from your gallery
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-600 ml-auto group-hover:text-blue-400 transition-colors" />
                  </motion.button>

                  {/* Video Option */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTypeSelect('video')}
                    className="flex items-center gap-4 p-4 bg-neutral-800/50 rounded-2xl border border-neutral-700/50 hover:border-pink-500/50 transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center">
                      <Video className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-medium group-hover:text-pink-400 transition-colors">
                        Video
                      </h3>
                      <p className="text-neutral-500 text-sm">
                        Share a short video clip
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-600 ml-auto group-hover:text-pink-400 transition-colors" />
                  </motion.button>

                  {/* Text Option */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTypeSelect('text')}
                    className="flex items-center gap-4 p-4 bg-neutral-800/50 rounded-2xl border border-neutral-700/50 hover:border-green-500/50 transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Type className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-white font-medium group-hover:text-green-400 transition-colors">
                        Text
                      </h3>
                      <p className="text-neutral-500 text-sm">
                        Share a thought or quote
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-600 ml-auto group-hover:text-green-400 transition-colors" />
                  </motion.button>
                </div>

                {/* AI Story Suggestion */}
                <div className="mt-8 p-4 bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-2xl border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h4 className="text-white font-medium">AI Story Ideas</h4>
                  </div>
                  <p className="text-neutral-400 text-sm">
                    Coming soon: Let AI help you create engaging professional stories!
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Upload Media */}
            {step === 'upload-media' && (
              <div className="p-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={storyType === 'video' ? 'video/*' : 'image/*'}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[9/16] max-h-[400px] rounded-2xl border-2 border-dashed border-neutral-700 hover:border-blue-500 transition-colors flex flex-col items-center justify-center gap-4 bg-neutral-800/30"
                >
                  <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-neutral-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">
                      Tap to upload {storyType === 'video' ? 'video' : 'image'}
                    </p>
                    <p className="text-neutral-500 text-sm mt-1">
                      {storyType === 'video' ? 'MP4, MOV up to 50MB' : 'JPG, PNG up to 10MB'}
                    </p>
                  </div>
                </motion.button>

                {error && (
                  <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
                )}
              </div>
            )}

            {/* Step 3: Edit */}
            {step === 'edit' && (
              <div className="flex flex-col h-full">
                {/* Preview */}
                <div className="relative flex-1 min-h-[300px]">
                  {storyType === 'text' ? (
                    <div
                      className="absolute inset-0 flex items-center justify-center p-8"
                      style={{ background: textBackground }}
                    >
                      <textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Type your story..."
                        className="w-full h-full bg-transparent text-white text-2xl font-bold text-center resize-none focus:outline-none placeholder-white/50"
                        maxLength={280}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black flex items-center justify-center">
                      {storyType === 'video' && mediaPreview ? (
                        <video
                          src={mediaPreview}
                          className="max-w-full max-h-full object-contain"
                          controls
                        />
                      ) : mediaPreview ? (
                        <Image
                          src={mediaPreview}
                          alt="Preview"
                          fill
                          className="object-contain"
                        />
                      ) : null}

                      {/* Remove button */}
                      <button
                        onClick={handleRemoveMedia}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Text Background Picker (for text stories) */}
                {storyType === 'text' && (
                  <div className="p-4 border-t border-neutral-800">
                    <p className="text-neutral-400 text-sm mb-3">Background</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {TEXT_BACKGROUNDS.map((bg, idx) => (
                        <button
                          key={idx}
                          onClick={() => setTextBackground(bg)}
                          className={`w-10 h-10 rounded-xl flex-shrink-0 ${
                            textBackground === bg ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : ''
                          }`}
                          style={{ background: bg }}
                        />
                      ))}
                    </div>
                    <p className="text-neutral-500 text-xs mt-2">
                      {textContent.length}/280 characters
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Details */}
            {step === 'details' && (
              <div className="p-6 space-y-6">
                {/* Category */}
                <div>
                  <label className="text-white font-medium mb-3 block">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {STORY_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className={`p-3 rounded-xl border transition-colors flex flex-col items-center gap-1 ${
                          category === cat.value
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                            : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                        }`}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-xs">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="text-white font-medium mb-3 block">Who can view</label>
                  <div className="space-y-2">
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setVisibility(opt.value)}
                        className={`w-full p-3 rounded-xl border transition-colors flex items-center gap-3 ${
                          visibility === opt.value
                            ? 'bg-blue-500/20 border-blue-500'
                            : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600'
                        }`}
                      >
                        <div className={`${visibility === opt.value ? 'text-blue-400' : 'text-neutral-400'}`}>
                          {opt.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-medium ${visibility === opt.value ? 'text-blue-400' : 'text-white'}`}>
                            {opt.label}
                          </p>
                          <p className="text-neutral-500 text-sm">{opt.desc}</p>
                        </div>
                        {visibility === opt.value && (
                          <Check className="w-5 h-5 text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Link (optional) */}
                <div>
                  <label className="text-white font-medium mb-3 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Add Link (optional)
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                  />
                  {linkUrl && (
                    <input
                      type="text"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                      placeholder="Link title (optional)"
                      className="w-full px-4 py-3 mt-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                    />
                  )}
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {(step === 'edit' || step === 'details') && (
            <div className="p-4 border-t border-neutral-800">
              {step === 'edit' ? (
                <button
                  onClick={() => setStep('details')}
                  disabled={!canProceed()}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Share Story
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
