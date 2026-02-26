'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Upload,
  X,
  Loader2,
  Hash,
  Music,
  MapPin,
  Code,
  Eye,
  MessageCircle,
  Users,
  Download,
  Share2,
  ChevronDown,
  Save,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { reelsApi } from '@/lib/api/reels';

interface ReelCreateProps {
  onClose?: () => void;
  initialOriginalReelId?: string;
  initialResponseType?: 'duet' | 'stitch';
  initialAudioId?: string;
}

export function ReelCreate({ onClose, initialOriginalReelId, initialResponseType, initialAudioId }: ReelCreateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'connections' | 'private'>('public');
  const [allowComments, setAllowComments] = useState(true);
  const [allowDuets, setAllowDuets] = useState(true);
  const [allowStitch, setAllowStitch] = useState(true);
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);

  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [originalReelId, setOriginalReelId] = useState(initialOriginalReelId || '');
  const [responseType, setResponseType] = useState<'duet' | 'stitch' | ''>(initialResponseType || '');
  const [audioId, setAudioId] = useState(initialAudioId || '');

  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('');
  const [codeFileName, setCodeFileName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [showCodeSection, setShowCodeSection] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const duet = searchParams.get('duet');
    const stitch = searchParams.get('stitch');
    const audio = searchParams.get('audio');
    if (duet) {
      setOriginalReelId(duet);
      setResponseType('duet');
    }
    if (stitch) {
      setOriginalReelId(stitch);
      setResponseType('stitch');
    }
    if (audio) setAudioId(audio);
  }, [searchParams]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    if (file.size > 150 * 1024 * 1024) {
      setError('Video must be less than 150MB');
      return;
    }

    setSelectedFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setSelectedThumbnail(null);
    setThumbnailPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const handleThumbnailSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Thumbnail must be an image (JPEG, PNG, WebP)');
      return;
    }
    if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
    setSelectedThumbnail(file);
    setThumbnailPreviewUrl(URL.createObjectURL(file));
    setError(null);
  }, [thumbnailPreviewUrl]);

  const handleAddHashtag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = hashtagInput.trim().replace(/^#/, '');
      if (tag && !hashtags.includes(tag) && hashtags.length < 10) {
        setHashtags([...hashtags, tag]);
        setHashtagInput('');
      }
    }
  }, [hashtagInput, hashtags]);

  const handleRemoveHashtag = useCallback((tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  }, [hashtags]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(10);

      const formData = new FormData();
      formData.append('video', selectedFile);
      if (selectedThumbnail) formData.append('thumbnail', selectedThumbnail);
      formData.append('title', title);
      formData.append('caption', caption);
      formData.append('hashtags', JSON.stringify(hashtags));
      formData.append('visibility', visibility);
      formData.append('allowComments', String(allowComments));
      formData.append('allowDuets', String(allowDuets));
      formData.append('allowStitch', String(allowStitch));
      formData.append('allowDownload', String(allowDownload));
      formData.append('allowSharing', String(allowSharing));
      formData.append('saveAsDraft', String(saveAsDraft));
      if (scheduledAt) formData.append('scheduledAt', scheduledAt);
      if (originalReelId) formData.append('originalReelId', originalReelId);
      if (responseType) formData.append('responseType', responseType);
      if (audioId) formData.append('audioId', audioId);

      if (codeSnippet) {
        formData.append('codeSnippet', codeSnippet);
        formData.append('codeLanguage', codeLanguage);
        formData.append('codeFileName', codeFileName);
        formData.append('repoUrl', repoUrl);
      }

      setUploadProgress(30);

      const reel = await reelsApi.createReel(formData);
      
      setUploadProgress(100);

      if (saveAsDraft) {
        router.push('/reels/drafts');
      } else {
        router.push(`/reels/${(reel as unknown as { id: string }).id}`);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
      setError(msg || 'Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [
    selectedFile,
    selectedThumbnail,
    title,
    caption,
    hashtags,
    visibility,
    allowComments,
    allowDuets,
    allowStitch,
    allowDownload,
    allowSharing,
    codeSnippet,
    codeLanguage,
    codeFileName,
    repoUrl,
    router,
  ]);

  const handleClose = useCallback(() => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    onClose?.();
  }, [videoPreviewUrl, onClose]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Create Reel</h1>
          {onClose && (
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
          >
            <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">Upload a video</p>
            <p className="text-gray-500 text-sm mb-4">
              MP4, WebM, or MOV. Max 150MB. Recommended 9:16 aspect ratio.
            </p>
            <button className="px-6 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors">
              Select file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-6">
              <div className="w-48 flex-shrink-0 space-y-3">
                <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden relative">
                  <video
                    src={videoPreviewUrl || undefined}
                    className="w-full h-full object-cover"
                    controls
                    muted
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (videoPreviewUrl) {
                        URL.revokeObjectURL(videoPreviewUrl);
                        setVideoPreviewUrl(null);
                      }
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Custom thumbnail (optional)</label>
                  <div
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden border-2 border-dashed border-neutral-300 dark:border-neutral-600 cursor-pointer hover:border-blue-500 flex items-center justify-center"
                  >
                    {thumbnailPreviewUrl ? (
                      <img src={thumbnailPreviewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-neutral-500 text-sm">Add thumbnail</span>
                    )}
                  </div>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                  />
                  {selectedThumbnail && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedThumbnail(null);
                        if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
                        setThumbnailPreviewUrl(null);
                      }}
                      className="mt-1 text-xs text-red-500 hover:underline"
                    >
                      Remove thumbnail
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title (optional)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a title..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Caption</label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption... Use @mentions and #hashtags"
                    rows={3}
                    maxLength={2200}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                  <p className="text-right text-sm text-gray-500 mt-1">
                    {caption.length}/2200
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    <Hash className="w-4 h-4 inline mr-1" />
                    Hashtags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm flex items-center gap-1"
                      >
                        #{tag}
                        <button onClick={() => handleRemoveHashtag(tag)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={handleAddHashtag}
                    placeholder="Add hashtags (press Enter)"
                    disabled={hashtags.length >= 10}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    <Eye className="w-4 h-4 inline mr-1" />
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="public">Public - Anyone can view</option>
                    <option value="connections">Connections - Only connections can view</option>
                    <option value="private">Private - Only you can view</option>
                  </select>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAsDraft}
                      onChange={(e) => setSaveAsDraft(e.target.checked)}
                      className="rounded"
                    />
                    <Save className="w-4 h-4" />
                    <span>Save as draft</span>
                  </label>
                  {!saveAsDraft && (
                    <div>
                      <label className="flex items-center gap-2 text-sm mb-1">
                        <Calendar className="w-4 h-4" />
                        Schedule for later
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCodeSection(!showCodeSection)}
              className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
            >
              <Code className="w-4 h-4" />
              {showCodeSection ? 'Hide code snippet' : 'Add code snippet (for dev reels)'}
              <ChevronDown className={cn("w-4 h-4 transition-transform", showCodeSection && "rotate-180")} />
            </button>

            {showCodeSection && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <textarea
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    placeholder="Paste your code here..."
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Language</label>
                    <input
                      type="text"
                      value={codeLanguage}
                      onChange={(e) => setCodeLanguage(e.target.value)}
                      placeholder="e.g., JavaScript"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">File name</label>
                    <input
                      type="text"
                      value={codeFileName}
                      onChange={(e) => setCodeFileName(e.target.value)}
                      placeholder="e.g., app.js"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Repository URL (optional)</label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Advanced settings
              <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
            </button>

            {showAdvanced && (
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Allow comments
                  </span>
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Allow duets
                  </span>
                  <input
                    type="checkbox"
                    checked={allowDuets}
                    onChange={(e) => setAllowDuets(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Allow stitch
                  </span>
                  <input
                    type="checkbox"
                    checked={allowStitch}
                    onChange={(e) => setAllowStitch(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Allow download
                  </span>
                  <input
                    type="checkbox"
                    checked={allowDownload}
                    onChange={(e) => setAllowDownload(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Allow sharing
                  </span>
                  <input
                    type="checkbox"
                    checked={allowSharing}
                    onChange={(e) => setAllowSharing(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                </label>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
