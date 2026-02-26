'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Globe,
  Users,
  Lock,
  ChevronDown,
  Loader2,
  Bold,
  Italic,
  List,
  Code,
  AtSign,
  Palette,
  Pencil,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { updatePost } from '@/lib/api/posts';
import { searchUsersForMention } from '@/lib/api/posts';
import type { Post, PostVisibility, MentionUser } from '@/types/post';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onPostUpdated?: (updatedPost: Post) => void;
}

const VISIBILITY_OPTIONS: { value: PostVisibility; label: string; icon: React.ElementType }[] = [
  { value: 'PUBLIC', label: 'Anyone', icon: Globe },
  { value: 'CONNECTIONS', label: 'Connections only', icon: Users },
  { value: 'PRIVATE', label: 'Only me', icon: Lock },
];

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

export function EditPostModal({ isOpen, onClose, post, onPostUpdated }: EditPostModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState(post.content || '');
  const [visibility, setVisibility] = useState<PostVisibility>(post.visibility);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mention state
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  
  // Color picker state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  
  // Refs
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

  // Update content when post prop changes
  useEffect(() => {
    setContent(post.content || '');
    setVisibility(post.visibility);
  }, [post]);

  // Mention search
  useEffect(() => {
    const searchMentions = async () => {
      if (mentionQuery.length >= 2) {
        try {
          const results = await searchUsersForMention(mentionQuery);
          setMentionResults(results);
          setShowMentionDropdown(true);
        } catch (error) {
          console.error('Error searching mentions:', error);
        }
      } else {
        setMentionResults([]);
        setShowMentionDropdown(false);
      }
    };

    const debounce = setTimeout(searchMentions, 300);
    return () => clearTimeout(debounce);
  }, [mentionQuery]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Check for @ mentions
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 1) {
        setMentionQuery(textAfterAt);
      } else {
        setMentionQuery('');
        setShowMentionDropdown(false);
      }
    } else {
      setMentionQuery('');
      setShowMentionDropdown(false);
    }
  };

  const insertMention = (user: MentionUser) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = content.slice(cursorPos);

    const newContent = 
      content.slice(0, lastAtIndex) + 
      `@${user.username} ` + 
      textAfterCursor;

    setContent(newContent);
    setMentionQuery('');
    setShowMentionDropdown(false);

    setTimeout(() => {
      const newCursorPos = lastAtIndex + user.username.length + 2;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Text formatting helpers
  const formatText = (wrapper: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);

    let newContent: string;
    let newCursorPos: number;

    if (selectedText) {
      newContent = content.slice(0, start) + wrapper + selectedText + wrapper + content.slice(end);
      newCursorPos = end + wrapper.length * 2;
    } else {
      newContent = content.slice(0, start) + wrapper + wrapper + content.slice(end);
      newCursorPos = start + wrapper.length;
    }

    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBold = () => formatText('**');
  const handleItalic = () => formatText('*');
  const handleCode = () => formatText('`');

  const handleList = () => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const beforeCursor = content.slice(0, start);
    const afterCursor = content.slice(start);
    const lineStart = beforeCursor.lastIndexOf('\n') + 1;
    const lineContent = beforeCursor.slice(lineStart);
    
    let newContent: string;
    let newCursorPos: number;

    if (lineContent.startsWith('- ')) {
      newContent = content.slice(0, lineStart) + lineContent.slice(2) + afterCursor;
      newCursorPos = start - 2;
    } else {
      newContent = content.slice(0, lineStart) + '- ' + lineContent + afterCursor;
      newCursorPos = start + 2;
    }

    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

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
      newContent = content.slice(0, start) + openTag + selectedText + closeTag + content.slice(end);
      newCursorPos = start + openTag.length + selectedText.length + closeTag.length;
    } else {
      newContent = content.slice(0, start) + openTag + closeTag + content.slice(start);
      newCursorPos = start + openTag.length;
    }

    setContent(newContent);
    setShowColorPicker(false);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Submit update
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      const updatedPost = await updatePost(post.id, {
        content,
        visibility,
      });
      
      onPostUpdated?.(updatedPost);
      onClose();
    } catch (err: any) {
      console.error('Update post error:', err);
      setError(err.message || 'Failed to update post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVisibility = VISIBILITY_OPTIONS.find(v => v.value === visibility) || VISIBILITY_OPTIONS[0];
  const VisibilityIcon = selectedVisibility.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{
              background: '#ecf0f3',
              boxShadow: '20px 20px 60px #c9ccd1, -20px -20px 60px #ffffff',
            }}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: '#d1d9e6' }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{
                    background: '#ecf0f3',
                    boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9',
                  }}
                >
                  <Pencil className="w-5 h-5 text-blue-600" />
                </div>
                <h2 
                  className="text-xl font-bold"
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    color: '#2d3748',
                  }}
                >
                  Edit Post
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full transition-all hover:scale-105"
                style={{
                  background: '#ecf0f3',
                  boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9',
                }}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* User Info & Visibility */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full overflow-hidden"
                    style={{
                      boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9',
                    }}
                  >
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{user?.name}</p>
                    <div className="relative">
                      <button
                        onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                      >
                        <VisibilityIcon className="w-3 h-3" />
                        <span>{selectedVisibility.label}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      
                      {showVisibilityDropdown && (
                        <div 
                          className="absolute top-full left-0 mt-1 py-1 rounded-lg z-20 min-w-[140px]"
                          style={{
                            background: '#ecf0f3',
                            boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9',
                          }}
                        >
                          {VISIBILITY_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setVisibility(option.value);
                                setShowVisibilityDropdown(false);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                            >
                              <option.icon className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  {post.type}
                </span>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
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
                    placeholder="What do you want to share?"
                    className="w-full min-h-[180px] p-5 rounded-xl text-gray-800 placeholder-gray-400 resize-none outline-none text-base leading-relaxed"
                    style={{
                      background: '#ecf0f3',
                      boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #f9f9f9',
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  />
                  
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

              {/* Post type note */}
              <p className="text-xs text-gray-400 text-center">
                Note: Only text content and visibility can be edited. Media, polls, and links cannot be changed.
              </p>
            </div>

            {/* Footer */}
            <div 
              className="flex justify-end gap-3 p-6 border-t"
              style={{ borderColor: '#d1d9e6' }}
            >
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-gray-600 font-medium transition-all hover:scale-105"
                style={{
                  background: '#ecf0f3',
                  boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
                className="px-8 py-2.5 rounded-xl text-white font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #f9f9f9',
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
