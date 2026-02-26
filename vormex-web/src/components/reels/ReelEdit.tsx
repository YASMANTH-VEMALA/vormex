'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { 
  X, 
  Loader2, 
  Hash, 
  Globe, 
  Lock, 
  Users,
  MessageCircle,
  Share2,
  Download,
  Music
} from 'lucide-react';
import { reelsApi, Reel } from '@/lib/api/reels';
import { MentionInput } from './MentionInput';

interface ReelEditProps {
  reel: Reel;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedReel: Reel) => void;
}

type Visibility = 'public' | 'followers' | 'private';

export function ReelEdit({ reel, isOpen, onClose, onSave }: ReelEditProps) {
  const [title, setTitle] = useState(reel.title || '');
  const [caption, setCaption] = useState(reel.caption || '');
  const [mentions, setMentions] = useState<string[]>(reel.mentions || []);
  const [hashtags, setHashtags] = useState<string[]>(reel.hashtags || []);
  const [hashtagInput, setHashtagInput] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(reel.visibility as Visibility || 'public');
  const [allowComments, setAllowComments] = useState(reel.allowComments);
  const [allowDuets, setAllowDuets] = useState(reel.allowDuets);
  const [allowStitch, setAllowStitch] = useState(reel.allowStitch);
  const [allowDownload, setAllowDownload] = useState(reel.allowDownload);
  const [allowSharing, setAllowSharing] = useState(reel.allowSharing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(reel.title || '');
      setCaption(reel.caption || '');
      setMentions(reel.mentions || []);
      setHashtags(reel.hashtags || []);
      setVisibility(reel.visibility as Visibility || 'public');
      setAllowComments(reel.allowComments);
      setAllowDuets(reel.allowDuets);
      setAllowStitch(reel.allowStitch);
      setAllowDownload(reel.allowDownload);
      setAllowSharing(reel.allowSharing);
      setError(null);
    }
  }, [isOpen, reel]);

  const handleCaptionChange = useCallback((value: string, extractedMentions: string[]) => {
    setCaption(value);
    setMentions(extractedMentions);
  }, []);

  const addHashtag = useCallback(() => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtagInput('');
    }
  }, [hashtagInput, hashtags]);

  const removeHashtag = useCallback((tag: string) => {
    setHashtags(hashtags.filter((h) => h !== tag));
  }, [hashtags]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addHashtag();
    }
  }, [addHashtag]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await reelsApi.updateReel(reel.id, {
        title: title || null,
        caption: caption || null,
        mentions,
        hashtags,
        visibility,
        allowComments,
        allowDuets,
        allowStitch,
        allowDownload,
        allowSharing,
      });

      onSave(response.data);
      onClose();
    } catch (err) {
      console.error('Failed to update reel:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see this reel' },
    { value: 'followers', label: 'Followers', icon: Users, description: 'Only your followers can see' },
    { value: 'private', label: 'Private', icon: Lock, description: 'Only you can see' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Reel</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Preview */}
          <div className="flex gap-4">
            <div className="w-24 h-36 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0">
              {reel.thumbnailUrl ? (
                <Image
                  src={reel.thumbnailUrl}
                  alt=""
                  width={96}
                  height={144}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-8 h-8 text-neutral-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {reel.viewsCount.toLocaleString()} views · {reel.likesCount.toLocaleString()} likes
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Posted {new Date(reel.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title..."
              maxLength={100}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Caption
            </label>
            <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl">
              <MentionInput
                value={caption}
                onChange={handleCaptionChange}
                placeholder="Write a caption... Use @ to mention people"
                className="min-h-[100px] text-gray-900 dark:text-white"
                maxLength={2200}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{caption.length}/2200</p>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hashtags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm"
                >
                  <Hash className="w-3 h-3" />
                  {tag}
                  <button
                    onClick={() => removeHashtag(tag)}
                    className="ml-1 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add hashtag..."
                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addHashtag}
                disabled={!hashtagInput.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visibility
            </label>
            <div className="space-y-2">
              {visibilityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setVisibility(option.value as Visibility)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    visibility === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                  }`}
                >
                  <option.icon className={`w-5 h-5 ${
                    visibility === option.value ? 'text-blue-500' : 'text-gray-500'
                  }`} />
                  <div className="text-left">
                    <p className={`font-medium ${
                      visibility === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Interaction Settings
            </label>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-900 dark:text-white">Allow comments</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                  className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-900 dark:text-white">Allow duets</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowDuets}
                  onChange={(e) => setAllowDuets(e.target.checked)}
                  className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-900 dark:text-white">Allow sharing</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowSharing}
                  onChange={(e) => setAllowSharing(e.target.checked)}
                  className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-900 dark:text-white">Allow downloads</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                  className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
