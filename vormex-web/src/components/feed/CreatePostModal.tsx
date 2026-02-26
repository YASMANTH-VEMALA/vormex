'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Image as ImageIcon,
  Video,
  FileText,
  Link as LinkIcon,
  BarChart3,
  Sparkles,
  Trophy,
  Globe,
  Users,
  Lock,
  ChevronDown,
  Loader2,
  Plus,
  Trash2,
  Bold,
  Italic,
  List,
  Code,
  AtSign,
  Palette,
  Pencil,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { createPost } from '@/lib/api/posts';
import { searchUsersForMention } from '@/lib/api/posts';
import { ImageEditor } from './ImageEditor';
import { FormattedContent } from './FormattedContent';
import type { PostType, PostVisibility, CelebrationType, MentionUser } from '@/types/post';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post?: import('@/types/post').Post) => void;
}

const POST_TYPES = [
  { type: 'TEXT' as PostType, icon: FileText, label: 'Text' },
  { type: 'IMAGE' as PostType, icon: ImageIcon, label: 'Image' },
  { type: 'VIDEO' as PostType, icon: Video, label: 'Video' },
  { type: 'LINK' as PostType, icon: LinkIcon, label: 'Link' },
  { type: 'POLL' as PostType, icon: BarChart3, label: 'Poll' },
  { type: 'ARTICLE' as PostType, icon: Sparkles, label: 'Article' },
  { type: 'CELEBRATION' as PostType, icon: Trophy, label: 'Celebration' },
];

const VISIBILITY_OPTIONS: { value: PostVisibility; label: string; icon: React.ElementType }[] = [
  { value: 'PUBLIC', label: 'Anyone', icon: Globe },
  { value: 'CONNECTIONS', label: 'Connections only', icon: Users },
  { value: 'PRIVATE', label: 'Only me', icon: Lock },
];

const CELEBRATION_TYPES: { value: CelebrationType; label: string; emoji: string }[] = [
  { value: 'NEW_JOB', label: 'Started a new job', emoji: '🎉' },
  { value: 'PROMOTION', label: 'Got promoted', emoji: '🚀' },
  { value: 'GRADUATION', label: 'Graduated', emoji: '🎓' },
  { value: 'CERTIFICATION', label: 'Earned a certification', emoji: '📜' },
  { value: 'WORK_ANNIVERSARY', label: 'Work anniversary', emoji: '🎊' },
  { value: 'BIRTHDAY', label: 'Birthday', emoji: '🎂' },
];

export function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const { user } = useAuth();
  const [postType, setPostType] = useState<PostType>('TEXT');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('PUBLIC');
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Image state
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  
  // Video state
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  
  // Link state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPreview, setLinkPreview] = useState<any>(null);
  const [fetchingLinkPreview, setFetchingLinkPreview] = useState(false);
  
  // Poll state
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDuration, setPollDuration] = useState(24); // hours
  const [showResultsBeforeVote, setShowResultsBeforeVote] = useState(false);
  
  // Article state
  const [articleTitle, setArticleTitle] = useState('');
  const [articleCoverImage, setArticleCoverImage] = useState<File | null>(null);
  const [articleCoverPreview, setArticleCoverPreview] = useState<string | null>(null);
  const [articleTags, setArticleTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Celebration state
  const [celebrationType, setCelebrationType] = useState<CelebrationType | null>(null);
  
  // Mention state
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentions, setMentions] = useState<string[]>([]);
  
  // Color picker state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setPostType('TEXT');
    setContent('');
    setVisibility('PUBLIC');
    setImages([]);
    setImagePreviews([]);
    setVideo(null);
    setVideoPreview(null);
    setLinkUrl('');
    setLinkPreview(null);
    setPollOptions(['', '']);
    setPollDuration(24);
    setShowResultsBeforeVote(false);
    setArticleTitle('');
    setArticleCoverImage(null);
    setArticleCoverPreview(null);
    setArticleTags([]);
    setCelebrationType(null);
    setMentions([]);
    setError(null);
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }
    
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be under 10MB');
        return false;
      }
      return true;
    });
    
    setImages(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle video selection
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 500 * 1024 * 1024) {
      setError('Video size must be under 500MB');
      return;
    }
    
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle edited image save
  const handleEditedImageSave = (blob: Blob) => {
    if (editingImageIndex === null) return;
    
    // Create a new File from the blob
    const editedFile = new File([blob], images[editingImageIndex].name, { type: 'image/jpeg' });
    
    // Update the images array
    setImages(prev => {
      const newImages = [...prev];
      newImages[editingImageIndex] = editedFile;
      return newImages;
    });
    
    // Update the preview
    const newPreviewUrl = URL.createObjectURL(blob);
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      newPreviews[editingImageIndex] = newPreviewUrl;
      return newPreviews;
    });
    
    setEditingImageIndex(null);
  };

  // Handle poll option change
  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // Add poll option
  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  // Remove poll option
  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  // Handle article tag add
  const handleAddTag = () => {
    if (tagInput.trim() && articleTags.length < 5) {
      setArticleTags([...articleTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Search for mentions
  const searchMentions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setMentionResults([]);
      setShowMentionDropdown(false);
      return;
    }
    
    try {
      const results = await searchUsersForMention(query);
      setMentionResults(results);
      setShowMentionDropdown(results.length > 0);
    } catch (err) {
      console.error('Error searching mentions:', err);
    }
  }, []);

  // Handle content change with mention detection
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    
    // Detect @mention
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = value.slice(lastAtIndex + 1);
      const spaceIndex = textAfterAt.indexOf(' ');
      const query = spaceIndex === -1 ? textAfterAt : textAfterAt.slice(0, spaceIndex);
      
      if (query && !textAfterAt.includes(' ')) {
        setMentionQuery(query);
        searchMentions(query);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  // Insert mention
  const insertMention = (user: MentionUser) => {
    const lastAtIndex = content.lastIndexOf('@');
    const newContent = content.slice(0, lastAtIndex) + `@${user.username} `;
    setContent(newContent);
    setMentions([...mentions, user.id]);
    setShowMentionDropdown(false);
    contentRef.current?.focus();
  };

  // Text formatting helper - wraps selected text or inserts at cursor
  const formatText = (prefix: string, suffix: string = prefix) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);
    
    let newContent: string;
    let newCursorPos: number;

    if (selectedText) {
      // Wrap selected text
      newContent = content.slice(0, start) + prefix + selectedText + suffix + content.slice(end);
      newCursorPos = end + prefix.length + suffix.length;
    } else {
      // Insert placeholder at cursor
      newContent = content.slice(0, start) + prefix + suffix + content.slice(end);
      newCursorPos = start + prefix.length;
    }

    setContent(newContent);
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Format bold: **text**
  const handleBold = () => {
    formatText('**');
  };

  // Format italic: *text*
  const handleItalic = () => {
    formatText('*');
  };

  // Format code: `code`
  const handleCode = () => {
    formatText('`');
  };

  // Format list: add "- " at start of line
  const handleList = () => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const beforeCursor = content.slice(0, start);
    const afterCursor = content.slice(start);
    
    // Find the start of the current line
    const lineStart = beforeCursor.lastIndexOf('\n') + 1;
    const lineContent = beforeCursor.slice(lineStart);
    
    let newContent: string;
    let newCursorPos: number;

    // Check if line already starts with "- "
    if (lineContent.startsWith('- ')) {
      // Remove the list marker
      newContent = content.slice(0, lineStart) + lineContent.slice(2) + afterCursor;
      newCursorPos = start - 2;
    } else {
      // Add the list marker
      newContent = content.slice(0, lineStart) + '- ' + lineContent + afterCursor;
      newCursorPos = start + 2;
    }

    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Trigger mention search
  const handleMentionClick = () => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newContent = content.slice(0, start) + '@' + content.slice(start);
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, start + 1);
    }, 0);
  };

  // Color presets for the color picker
  const COLOR_PRESETS = [
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
  ];

  // Insert color formatting: [color:#hex]text[/color]
  const handleColorInsert = (colorValue: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);
    const openTag = `[color:${colorValue}]`;
    const closeTag = '[/color]';

    let newContent: string;
    let newCursorPos: number;

    if (selectedText) {
      // Wrap selected text
      newContent = content.slice(0, start) + openTag + selectedText + closeTag + content.slice(end);
      newCursorPos = start + openTag.length + selectedText.length + closeTag.length;
    } else {
      // Insert placeholder and position cursor between tags
      newContent = content.slice(0, start) + openTag + closeTag + content.slice(start);
      newCursorPos = start + openTag.length;
    }

    setContent(newContent);
    setShowColorPicker(false);
    
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      } else {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Submit post
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('type', postType);
      formData.append('visibility', visibility);
      
      if (content) {
        formData.append('content', content);
      }
      
      if (mentions.length > 0) {
        formData.append('mentions', JSON.stringify(mentions));
      }
      
      switch (postType) {
        case 'IMAGE':
          if (images.length === 0) {
            setError('Please add at least one image');
            setIsSubmitting(false);
            return;
          }
          images.forEach((img) => {
            formData.append('media', img);
          });
          break;
          
        case 'VIDEO':
          if (!video) {
            setError('Please add a video');
            setIsSubmitting(false);
            return;
          }
          formData.append('video', video);
          break;
          
        case 'LINK':
          if (!linkUrl) {
            setError('Please add a link');
            setIsSubmitting(false);
            return;
          }
          formData.append('linkUrl', linkUrl);
          break;
          
        case 'POLL':
          const validOptions = pollOptions.filter(opt => opt.trim());
          if (validOptions.length < 2) {
            setError('Please add at least 2 poll options');
            setIsSubmitting(false);
            return;
          }
          validOptions.forEach((option) => {
            formData.append('pollOptions', option);
          });
          formData.append('pollDuration', String(pollDuration));
          break;
          
        case 'ARTICLE':
          if (!articleTitle) {
            setError('Please add an article title');
            setIsSubmitting(false);
            return;
          }
          formData.append('articleTitle', articleTitle);
          if (articleCoverImage) {
            formData.append('articleCoverImage', articleCoverImage);
          }
          if (articleTags.length > 0) {
            articleTags.forEach((tag) => {
              formData.append('articleTags', tag);
            });
          }
          break;
          
        case 'CELEBRATION':
          if (!celebrationType) {
            setError('Please select a celebration type');
            setIsSubmitting(false);
            return;
          }
          formData.append('celebrationType', celebrationType);
          break;
          
        case 'TEXT':
        default:
          if (!content.trim()) {
            setError('Please add some content');
            setIsSubmitting(false);
            return;
          }
          break;
      }
      
      const createdPost = await createPost(formData);
      onPostCreated?.(createdPost);
      onClose();
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl max-h-[85vh] flex flex-col"
          style={{
            background: '#ecf0f3',
            borderRadius: '24px',
            boxShadow: '10px 10px 20px #d1d9e6, -10px -10px 20px #f9f9f9',
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-5 border-b flex-shrink-0"
            style={{ borderColor: '#d1d9e6' }}
          >
            <h2 className="text-2xl font-bold text-gray-800">Create Post</h2>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full transition-all hover:scale-105"
              style={{
                background: '#ecf0f3',
                boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9',
              }}
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          
          {/* User Info */}
          <div className="flex items-center gap-4 p-5 flex-shrink-0">
            <div 
              className="w-14 h-14 rounded-full overflow-hidden"
              style={{
                boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #f9f9f9',
              }}
            >
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{user?.name}</p>
              {/* Visibility Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {(() => {
                    const opt = VISIBILITY_OPTIONS.find(o => o.value === visibility);
                    const Icon = opt?.icon || Globe;
                    return (
                      <>
                        <Icon className="w-4 h-4" />
                        <span>{opt?.label}</span>
                        <ChevronDown className="w-3 h-3" />
                      </>
                    );
                  })()}
                </button>
                
                {showVisibilityDropdown && (
                  <div 
                    className="absolute top-full left-0 mt-1 py-1 rounded-lg z-10"
                    style={{
                      background: '#ecf0f3',
                      boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9',
                    }}
                  >
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setVisibility(opt.value);
                          setShowVisibilityDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Post Type Tabs */}
          <div 
            className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide flex-shrink-0"
            style={{ scrollbarWidth: 'none' }}
          >
            {POST_TYPES.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => setPostType(type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  postType === type ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'
                }`}
                style={{
                  background: '#ecf0f3',
                  boxShadow: postType === type 
                    ? 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #f9f9f9'
                    : '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9',
                }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          
          {/* Content Area */}
          <div className="flex-1 p-5 overflow-y-auto">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
                {error}
              </div>
            )}
            
            {/* Rich Text Editor Area */}
            <div className="relative">
              {/* Formatting Toolbar */}
              <div 
                className="flex items-center gap-2 p-2 mb-2 rounded-lg"
                style={{
                  background: '#ecf0f3',
                  boxShadow: 'inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #f9f9f9',
                }}
              >
                <button 
                  type="button"
                  onClick={handleBold}
                  className="p-2 rounded hover:bg-gray-200 transition-colors" 
                  title="Bold (**text**)"
                >
                  <Bold className="w-4 h-4 text-gray-600" />
                </button>
                <button 
                  type="button"
                  onClick={handleItalic}
                  className="p-2 rounded hover:bg-gray-200 transition-colors" 
                  title="Italic (*text*)"
                >
                  <Italic className="w-4 h-4 text-gray-600" />
                </button>
                <button 
                  type="button"
                  onClick={handleList}
                  className="p-2 rounded hover:bg-gray-200 transition-colors" 
                  title="Bullet List"
                >
                  <List className="w-4 h-4 text-gray-600" />
                </button>
                <button 
                  type="button"
                  onClick={handleCode}
                  className="p-2 rounded hover:bg-gray-200 transition-colors" 
                  title="Code (`code`)"
                >
                  <Code className="w-4 h-4 text-gray-600" />
                </button>
                <div className="w-px h-5 bg-gray-300 mx-1" />
                <button 
                  type="button"
                  onClick={handleMentionClick}
                  className="p-2 rounded hover:bg-gray-200 transition-colors" 
                  title="Mention someone (@)"
                >
                  <AtSign className="w-4 h-4 text-gray-600" />
                </button>
                <div className="relative" ref={colorPickerRef}>
                  <button 
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="p-2 rounded hover:bg-gray-200 transition-colors" 
                    title="Text Color"
                  >
                    <Palette className="w-4 h-4 text-gray-600" />
                  </button>
                  {/* Color Picker Dropdown */}
                  {showColorPicker && (
                    <div 
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 rounded-xl z-30 min-w-[200px]"
                      style={{
                        background: '#ecf0f3',
                        boxShadow: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff',
                      }}
                    >
                      <p className="text-xs font-medium text-gray-500 mb-2 text-center">Choose Color</p>
                      <div className="grid grid-cols-4 gap-2">
                        {COLOR_PRESETS.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => handleColorInsert(color.value)}
                            className="group flex flex-col items-center gap-1"
                          >
                            <div 
                              className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 hover:shadow-lg transition-all duration-200"
                              style={{ backgroundColor: color.value }}
                            />
                            <span className="text-[10px] text-gray-500 group-hover:text-gray-700">{color.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Content Textarea */}
              <div className="relative">
                <textarea
                  ref={contentRef}
                  value={content}
                  onChange={handleContentChange}
                  placeholder="What do you want to share? Use **bold**, *italic*, [color:#22c55e]colored text[/color]"
                  className="w-full min-h-[140px] p-5 rounded-xl text-gray-800 placeholder-gray-400 resize-none outline-none text-base leading-relaxed"
                  style={{
                    background: '#ecf0f3',
                    boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #f9f9f9',
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                />
                {/* Live preview - shows formatted result as you type */}
                {content.trim() && (
                  <div className="mt-3 p-4 rounded-xl border border-gray-200 dark:border-neutral-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-neutral-400 mb-2">Preview</p>
                    <FormattedContent content={content} className="text-gray-800 dark:text-neutral-200 text-base" />
                  </div>
                )}
                
                {/* Mention Dropdown */}
                {showMentionDropdown && (
                  <div 
                    className="absolute bottom-full left-0 w-64 mb-2 py-2 rounded-lg max-h-48 overflow-y-auto z-20"
                    style={{
                      background: '#ecf0f3',
                      boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9',
                    }}
                  >
                    {mentionResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => insertMention(user)}
                        className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300">
                          {user.profileImage && (
                            <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Post Type Specific Content */}
            {postType === 'IMAGE' && (
              <div className="mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                
                {imagePreviews.length > 0 ? (
                  <div className="space-y-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative rounded-xl overflow-hidden bg-gray-100">
                        <img 
                          src={preview} 
                          alt="" 
                          className="w-full max-h-[400px] object-contain mx-auto"
                          style={{ display: 'block' }}
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            onClick={() => setEditingImageIndex(index)}
                            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg"
                            title="Edit image"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeImage(index)}
                            className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-black/50 text-white text-xs">
                          {index + 1} / {imagePreviews.length}
                        </div>
                      </div>
                    ))}
                    {images.length < 10 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-8 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                        style={{
                          background: '#ecf0f3',
                          boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9',
                        }}
                      >
                        <Plus className="w-6 h-6 text-gray-400" />
                        <span className="text-gray-500">Add more images</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-12 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    style={{
                      background: '#ecf0f3',
                      boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9',
                    }}
                  >
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                    <span className="text-gray-500">Click to add images (max 10)</span>
                    <span className="text-xs text-gray-400">Up to 10MB each</span>
                  </button>
                )}
              </div>
            )}
            
            {postType === 'VIDEO' && (
              <div className="mt-4">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                />
                
                {videoPreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <video src={videoPreview} controls className="w-full max-h-64 object-contain bg-black" />
                    <button
                      onClick={() => {
                        setVideo(null);
                        setVideoPreview(null);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-full bg-red-500 text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full py-12 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    style={{
                      background: '#ecf0f3',
                      boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9',
                    }}
                  >
                    <Video className="w-12 h-12 text-gray-400" />
                    <span className="text-gray-500">Click to add video</span>
                    <span className="text-xs text-gray-400">Up to 500MB</span>
                  </button>
                )}
              </div>
            )}
            
            {postType === 'LINK' && (
              <div className="mt-4">
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: '#ecf0f3',
                    boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #f9f9f9',
                  }}
                >
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
                  />
                </div>
                
                {linkPreview && (
                  <div className="mt-4 rounded-xl overflow-hidden" style={{ boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9' }}>
                    {linkPreview.image && (
                      <img src={linkPreview.image} alt="" className="w-full h-40 object-cover" />
                    )}
                    <div className="p-3 bg-white/50">
                      <p className="font-semibold text-gray-800">{linkPreview.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{linkPreview.description}</p>
                      <p className="text-xs text-gray-400 mt-2">{linkPreview.domain}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {postType === 'POLL' && (
              <div className="mt-4 space-y-3">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="flex-1 rounded-xl p-3"
                      style={{
                        background: '#ecf0f3',
                        boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #f9f9f9',
                      }}
                    >
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handlePollOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
                      />
                    </div>
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => removePollOption(index)}
                        className="p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                {pollOptions.length < 6 && (
                  <button
                    onClick={addPollOption}
                    className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add option
                  </button>
                )}
                
                <div className="flex items-center gap-4 pt-4 border-t" style={{ borderColor: '#d1d9e6' }}>
                  <div className="flex-1">
                    <label className="text-sm text-gray-600">Poll duration</label>
                    <select
                      value={pollDuration}
                      onChange={(e) => setPollDuration(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-lg bg-transparent text-gray-800 outline-none"
                      style={{
                        background: '#ecf0f3',
                        boxShadow: 'inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #f9f9f9',
                      }}
                    >
                      <option value={1}>1 hour</option>
                      <option value={6}>6 hours</option>
                      <option value={12}>12 hours</option>
                      <option value={24}>1 day</option>
                      <option value={72}>3 days</option>
                      <option value={168}>1 week</option>
                    </select>
                  </div>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showResultsBeforeVote}
                      onChange={(e) => setShowResultsBeforeVote(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-600">Show results before voting</span>
                  </label>
                </div>
              </div>
            )}
            
            {postType === 'ARTICLE' && (
              <div className="mt-4 space-y-4">
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: '#ecf0f3',
                    boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #f9f9f9',
                  }}
                >
                  <input
                    type="text"
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                    placeholder="Article title"
                    className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400 text-lg font-semibold"
                  />
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {articleTags.map((tag, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                    >
                      {tag}
                      <button onClick={() => setArticleTags(tags => tags.filter((_, i) => i !== index))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {articleTags.length < 5 && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        placeholder="Add tag"
                        className="px-3 py-1 rounded-full text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
                        style={{
                          boxShadow: 'inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #f9f9f9',
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {postType === 'CELEBRATION' && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {CELEBRATION_TYPES.map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setCelebrationType(value)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      celebrationType === value ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{
                      background: '#ecf0f3',
                      boxShadow: celebrationType === value
                        ? 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #f9f9f9'
                        : '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9',
                    }}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <p className="mt-2 text-sm font-medium text-gray-800">{label}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div 
            className="flex items-center justify-between p-5 border-t flex-shrink-0"
            style={{ borderColor: '#d1d9e6' }}
          >
            <div className="flex items-center gap-3">
              {/* Quick add buttons */}
              <button
                onClick={() => setPostType('IMAGE')}
                className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                title="Add image"
              >
                <ImageIcon className="w-6 h-6 text-green-600" />
              </button>
              <button
                onClick={() => setPostType('VIDEO')}
                className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                title="Add video"
              >
                <Video className="w-6 h-6 text-purple-600" />
              </button>
              <button
                onClick={() => setPostType('POLL')}
                className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                title="Create poll"
              >
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </button>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-2.5 rounded-full font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              style={{
                background: 'linear-gradient(145deg, #4B70E2, #3a5bc7)',
                boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9',
              }}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Post'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Image Editor Modal */}
      {editingImageIndex !== null && (
        <ImageEditor
          isOpen={editingImageIndex !== null}
          imageUrl={imagePreviews[editingImageIndex]}
          onClose={() => setEditingImageIndex(null)}
          onSave={handleEditedImageSave}
        />
      )}
    </AnimatePresence>
  );
}

export default CreatePostModal;
