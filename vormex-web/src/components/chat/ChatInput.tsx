'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { sendChatMessage, sendChatTyping } from '@/lib/socket';
import { uploadChatMedia, getMessageLimitStatus, type MessageLimitStatus } from '@/lib/api/chat';
import { sendConnectionRequest } from '@/lib/api/connections';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Paperclip,
  Image as ImageIcon,
  FileText,
  Video,
  Mic,
  X,
  Send,
  Smile,
  File,
  Square,
  Trash2,
  Sparkles,
  Pencil,
  Loader2,
  UserPlus,
  Lock,
  MessageCircle,
  Zap,
} from 'lucide-react';
import AIChatAssistant from './AIChatAssistant';
import { fixGrammar } from '@/lib/api/ai-chat';

// File type configurations
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_DURATION = 60; // 60 seconds

// Uploading message interface for optimistic UI
export interface UploadingMessage {
  id: string;
  type: 'image' | 'video' | 'document' | 'audio';
  preview?: string;
  fileName?: string;
  progress: number;
}

// Optimistic message for immediate display
export interface OptimisticMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  contentType: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToId?: string;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  status: 'SENDING';
  createdAt: string;
}

interface ChatInputProps {
  conversationId: string;
  currentUserId?: string;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  onCancelReply?: () => void;
  disabled?: boolean;
  onUploadingMessagesChange?: (messages: UploadingMessage[]) => void;
  onOptimisticMessage?: (message: OptimisticMessage) => void;
  // AI Assistant props
  otherUserId?: string;
  otherUserName?: string;
  lastReceivedMessage?: string;
  enabledMessageEffects?: {
    confetti: boolean;
    fireworks: boolean;
    voiceSfx: boolean;
  };
}

interface FilePreview {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'document' | 'audio';
}

export default function ChatInput({
  conversationId,
  currentUserId,
  replyTo,
  onCancelReply,
  disabled = false,
  onUploadingMessagesChange,
  onOptimisticMessage,
  otherUserId,
  otherUserName,
  lastReceivedMessage,
  enabledMessageEffects,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isFixingGrammar, setIsFixingGrammar] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadingMessages, setUploadingMessages] = useState<UploadingMessage[]>([]);
  
  // Message limit state
  const [messageLimitInfo, setMessageLimitInfo] = useState<MessageLimitStatus | null>(null);
  const [showConnectionPrompt, setShowConnectionPrompt] = useState(false);
  const [isSendingConnectionRequest, setIsSendingConnectionRequest] = useState(false);
  const [connectionRequestSent, setConnectionRequestSent] = useState(false);
  const [selectedMessageEffect, setSelectedMessageEffect] = useState<'none' | 'confetti' | 'fireworks'>('none');
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check message limit on mount and when conversation changes
  useEffect(() => {
    const checkMessageLimit = async () => {
      if (!otherUserId) return;
      
      try {
        const limitStatus = await getMessageLimitStatus(otherUserId);
        setMessageLimitInfo(limitStatus);
        
        // Show prompt immediately if limit is reached and not connected
        if (!limitStatus.isConnected && !limitStatus.canSend) {
          setShowConnectionPrompt(true);
        }
      } catch (error) {
        console.error('Failed to check message limit:', error);
      }
    };
    
    checkMessageLimit();
  }, [conversationId, otherUserId]);

  const availableMessageEffects = useMemo<Array<'confetti' | 'fireworks'>>(
    () => [
      ...(enabledMessageEffects?.confetti ? ['confetti' as const] : []),
      ...(enabledMessageEffects?.fireworks ? ['fireworks' as const] : []),
    ],
    [enabledMessageEffects?.confetti, enabledMessageEffects?.fireworks]
  );

  useEffect(() => {
    if (selectedMessageEffect === 'none') return;
    if (!availableMessageEffects.includes(selectedMessageEffect)) {
      setSelectedMessageEffect('none');
    }
  }, [availableMessageEffects, selectedMessageEffect]);

  const cycleMessageEffect = () => {
    const cycle: Array<'none' | 'confetti' | 'fireworks'> = ['none', ...availableMessageEffects];
    if (cycle.length <= 1) return;

    const currentIndex = cycle.indexOf(selectedMessageEffect);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % cycle.length;
    setSelectedMessageEffect(cycle[nextIndex]);
  };

  const triggerMessageEffect = useCallback(async (effect: 'confetti' | 'fireworks') => {
    try {
      const confetti = (await import('canvas-confetti')).default;

      if (effect === 'confetti') {
        confetti({
          particleCount: 60,
          spread: 55,
          origin: { y: 0.7 },
          colors: ['#22c55e', '#38bdf8', '#f59e0b', '#f43f5e'],
        });
        return;
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.2, y: 0.7 },
        colors: ['#f97316', '#facc15', '#fb7185', '#60a5fa'],
      });
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.8, y: 0.7 },
        colors: ['#f97316', '#facc15', '#fb7185', '#60a5fa'],
      });
    } catch {
      // Ignore silently if canvas-confetti cannot load
    }
  }, []);

  const playVoiceSfx = useCallback(() => {
    if (!enabledMessageEffects?.voiceSfx || typeof window === 'undefined') return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.12);

      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.14);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.14);
    } catch {
      // Ignore silently when browser blocks autoplay/audio context
    }
  }, [enabledMessageEffects?.voiceSfx]);

  // Handle sending connection request
  const handleSendConnectionRequest = async () => {
    if (!otherUserId || isSendingConnectionRequest) return;
    
    setIsSendingConnectionRequest(true);
    try {
      await sendConnectionRequest(otherUserId);
      setConnectionRequestSent(true);
      // Don't close prompt, show success message
    } catch (error: unknown) {
      console.error('Failed to send connection request:', error);
      // Check if request already exists
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('already') || errorMessage.includes('pending')) {
        setConnectionRequestSent(true);
      } else {
        alert('Failed to send connection request. Please try again.');
      }
    } finally {
      setIsSendingConnectionRequest(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
      }
    };

    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachMenu]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      sendChatTyping(conversationId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendChatTyping(conversationId, false);
    }, 2000);
  }, [conversationId, isTyping]);

  // Clean up typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Get file type category
  const getFileType = (file: File): 'image' | 'video' | 'document' | 'audio' | null => {
    for (const [type, mimes] of Object.entries(ALLOWED_FILE_TYPES)) {
      if (mimes.includes(file.type)) {
        return type as 'image' | 'video' | 'document' | 'audio';
      }
    }
    return null;
  };

  // Check video duration
  const checkVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION) {
          alert(`Video "${file.name}" is too long. Maximum duration is ${MAX_VIDEO_DURATION} seconds.`);
          resolve(false);
        } else {
          resolve(true);
        }
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(true); // Allow if we can't check duration
      };
      video.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles: FilePreview[] = [];
    
    for (const file of files) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" is too large. Maximum size is 50MB.`);
        continue;
      }

      const fileType = getFileType(file);
      
      if (!fileType) {
        alert(`File type not supported: ${file.name}`);
        continue;
      }

      // Check video duration
      if (fileType === 'video') {
        const isValidDuration = await checkVideoDuration(file);
        if (!isValidDuration) {
          continue;
        }
      }

      // Create preview URL
      let preview = '';
      if (fileType === 'image' || fileType === 'video') {
        preview = URL.createObjectURL(file);
      }

      validFiles.push({
        file,
        preview,
        type: fileType,
      });
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setShowAttachMenu(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      // Revoke object URL to free memory
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Open file picker for specific type
  const openFilePicker = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
    setShowAttachMenu(false);
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Update duration every second
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingDuration(0);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Sync uploading messages to parent via useEffect to avoid setState during render
  useEffect(() => {
    onUploadingMessagesChange?.(uploadingMessages);
  }, [uploadingMessages, onUploadingMessagesChange]);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    const hasFiles = selectedFiles.length > 0;
    const hasAudio = audioBlob !== null;
    
    if (!trimmedMessage && !hasFiles && !hasAudio) return;

    // Check message limit before sending (for non-connected users)
    if (messageLimitInfo && !messageLimitInfo.isConnected && !messageLimitInfo.canSend) {
      setShowConnectionPrompt(true);
      return;
    }

    // Immediately clear typing state and stop broadcasting
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setIsTyping(false);
    sendChatTyping(conversationId, false);

    // Update local message limit tracking
    if (messageLimitInfo && !messageLimitInfo.isConnected) {
      setMessageLimitInfo(prev => prev ? {
        ...prev,
        messagesSent: prev.messagesSent + 1,
        messagesRemaining: Math.max(0, prev.messagesRemaining - 1),
        canSend: prev.messagesRemaining > 1,
      } : null);
    }

    // Clear input immediately for better UX
    const filesToUpload = [...selectedFiles];
    const audioToUpload = audioBlob;
    const textToSend = trimmedMessage;
    const currentReplyTo = replyTo;
    
    setMessage('');
    setSelectedFiles([]);
    setAudioBlob(null);
    setRecordingDuration(0);
    onCancelReply?.();
    inputRef.current?.focus();

    // Upload and send audio message if exists
    if (hasAudio && audioToUpload) {
      const uploadId = `upload-audio-${Date.now()}`;
      
      // Add optimistic uploading message
      setUploadingMessages(prev => [...prev, {
        id: uploadId,
        type: 'audio',
        fileName: 'Voice message',
        progress: 0,
      }]);

      try {
        const audioFile = new globalThis.File([audioToUpload], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        
        const result = await uploadChatMedia(audioFile, 'audio', (progress) => {
          setUploadingMessages(prev => 
            prev.map(m => m.id === uploadId ? { ...m, progress } : m)
          );
        });
        
        // Remove uploading message
        setUploadingMessages(prev => prev.filter(m => m.id !== uploadId));
        
        // Send actual message
        sendChatMessage({
          conversationId,
          content: '🎤 Voice message',
          contentType: 'audio',
          mediaUrl: result.mediaUrl,
          fileName: result.fileName,
          fileSize: result.fileSize,
          replyToId: currentReplyTo?.id,
        });
        playVoiceSfx();
      } catch (error) {
        console.error('Failed to upload audio:', error);
        setUploadingMessages(prev => prev.filter(m => m.id !== uploadId));
        alert('Failed to send voice message');
      }
    }

    // Upload files in parallel with optimistic UI
    if (hasFiles) {
      const uploadPromises = filesToUpload.map(async (filePreview, index) => {
        const uploadId = `upload-${Date.now()}-${index}`;
        
        // Add optimistic uploading message immediately
        setUploadingMessages(prev => [...prev, {
          id: uploadId,
          type: filePreview.type,
          preview: filePreview.preview,
          fileName: filePreview.file.name,
          progress: 0,
        }]);

        try {
          const result = await uploadChatMedia(filePreview.file, filePreview.type, (progress) => {
            setUploadingMessages(prev => 
              prev.map(m => m.id === uploadId ? { ...m, progress } : m)
            );
          });
          
          // Remove uploading message
          setUploadingMessages(prev => prev.filter(m => m.id !== uploadId));
          
          // Send actual message
          sendChatMessage({
            conversationId,
            content: filePreview.type === 'image' ? '📷 Photo' : 
                     filePreview.type === 'video' ? '🎥 Video' :
                     filePreview.type === 'document' ? `📄 ${filePreview.file.name}` :
                     `📎 ${filePreview.file.name}`,
            contentType: filePreview.type,
            mediaUrl: result.mediaUrl,
            fileName: result.fileName,
            fileSize: result.fileSize,
            replyToId: index === 0 ? currentReplyTo?.id : undefined,
          });
          
          // Clean up preview URL
          if (filePreview.preview) {
            URL.revokeObjectURL(filePreview.preview);
          }
        } catch (error) {
          console.error('Failed to upload file:', error);
          setUploadingMessages(prev => prev.filter(m => m.id !== uploadId));
          alert(`Failed to send ${filePreview.file.name}`);
        }
      });

      // Don't await - let uploads happen in background
      Promise.all(uploadPromises);
    }

    // Send text message immediately
    if (textToSend) {
      // Create optimistic message for immediate UI feedback
      if (onOptimisticMessage && currentUserId) {
        const optimisticMsg: OptimisticMessage = {
          id: `optimistic-${Date.now()}`,
          conversationId,
          senderId: currentUserId,
          content: textToSend,
          contentType: 'text',
          replyToId: currentReplyTo?.id,
          replyTo: currentReplyTo ? {
            id: currentReplyTo.id,
            content: currentReplyTo.content,
            senderName: currentReplyTo.senderName,
          } : undefined,
          status: 'SENDING',
          createdAt: new Date().toISOString(),
        };
        onOptimisticMessage(optimisticMsg);
      }

      sendChatMessage({
        conversationId,
        content: textToSend,
        contentType: 'text',
        replyToId: currentReplyTo?.id,
      });

      if (selectedMessageEffect !== 'none') {
        triggerMessageEffect(selectedMessageEffect);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  // Quick grammar fix function
  const handleQuickGrammarFix = async () => {
    if (!message.trim() || isFixingGrammar) return;
    
    setIsFixingGrammar(true);
    try {
      const response = await fixGrammar(message);
      setMessage(response.corrected);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Grammar fix error:', error);
    } finally {
      setIsFixingGrammar(false);
    }
  };

  const commonEmojis = ['😀', '😂', '❤️', '👍', '🔥', '🎉', '😊', '🙏', '💯', '✨', '😍', '🤔', '👀', '🙌', '💪'];

  return (
    <div className="relative border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      {/* AI Assistant Panel - positioned at container level for proper width */}
      <AnimatePresence>
        {showAIAssistant && otherUserId && (
          <AIChatAssistant
            conversationId={conversationId}
            otherUserId={otherUserId}
            otherUserName={otherUserName || 'User'}
            currentMessage={message}
            lastReceivedMessage={lastReceivedMessage}
            onSuggestionSelect={(text) => {
              setMessage(text);
              setShowAIAssistant(false);
              inputRef.current?.focus();
            }}
            onClose={() => setShowAIAssistant(false)}
          />
        )}
      </AnimatePresence>

      {/* Connection Required Prompt - Shows when message limit reached */}
      <AnimatePresence>
        {showConnectionPrompt && messageLimitInfo && !messageLimitInfo.isConnected && !messageLimitInfo.canSend && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-full left-0 right-0 mb-2 mx-4"
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Connect to Continue Messaging
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    You&apos;ve sent {messageLimitInfo.messagesSent} of {messageLimitInfo.limit} messages. 
                    Connect with <span className="font-medium">{otherUserName || 'this user'}</span> to send unlimited messages.
                  </p>
                  
                  <div className="flex items-center gap-2">
                    {connectionRequestSent ? (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="font-medium">Connection request sent!</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleSendConnectionRequest}
                        disabled={isSendingConnectionRequest}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {isSendingConnectionRequest ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            Send Connection Request
                          </>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowConnectionPrompt(false)}
                      className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowConnectionPrompt(false)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Limit Warning Banner - Shows when approaching limit */}
      <AnimatePresence>
        {messageLimitInfo && !messageLimitInfo.isConnected && messageLimitInfo.canSend && messageLimitInfo.messagesRemaining === 1 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <MessageCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <span className="font-medium">Last message!</span> Connect with {otherUserName || 'this user'} to continue the conversation.
              </p>
              <button
                onClick={handleSendConnectionRequest}
                disabled={isSendingConnectionRequest || connectionRequestSent}
                className="ml-auto text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 underline disabled:opacity-50"
              >
                {connectionRequestSent ? 'Request Sent' : 'Connect'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* File previews */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="flex gap-2 overflow-x-auto py-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  {file.type === 'image' ? (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-1">
                      {file.type === 'video' && <Video className="w-6 h-6 text-gray-500" />}
                      {file.type === 'document' && <FileText className="w-6 h-6 text-gray-500" />}
                      {file.type === 'audio' && <Mic className="w-6 h-6 text-gray-500" />}
                      <span className="text-[10px] text-gray-500 truncate w-full text-center mt-1">
                        {file.file.name.slice(0, 10)}...
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center justify-between mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1 h-8 bg-blue-500 rounded-full" />
            <div className="min-w-0">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Replying to {replyTo.senderName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {replyTo.content}
              </p>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Attachment button with menu */}
        <div className="relative" ref={attachMenuRef}>
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={cn(
              "p-2 rounded-full transition-colors",
              showAttachMenu 
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Attachment menu */}
          <AnimatePresence>
            {showAttachMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20"
              >
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => openFilePicker('image/*')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <span>Photos</span>
                  </button>
                  
                  <button
                    onClick={() => openFilePicker('video/*')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <Video className="w-4 h-4 text-red-600" />
                    </div>
                    <span>Videos</span>
                  </button>
                  
                  <button
                    onClick={() => openFilePicker('.pdf,.doc,.docx')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <span>Documents</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowAttachMenu(false);
                      startRecording();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Mic className="w-4 h-4 text-orange-600" />
                    </div>
                    <span>Voice Mail</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Assistant button */}
        {otherUserId && (
          <button
            onClick={() => {
              setShowAIAssistant(!showAIAssistant);
              setShowEmoji(false);
              setShowAttachMenu(false);
            }}
            className={cn(
              "p-2 rounded-full transition-colors",
              showAIAssistant
                ? "bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-600"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            title="AI Assistant"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        )}

        {/* Message effect toggle (premium packs) */}
        {availableMessageEffects.length > 0 && (
          <button
            onClick={cycleMessageEffect}
            className={cn(
              "p-2 rounded-full transition-colors relative",
              selectedMessageEffect !== 'none'
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            title={
              selectedMessageEffect === 'none'
                ? 'Message effect: Off (tap to cycle)'
                : `Message effect: ${selectedMessageEffect} (tap to cycle)`
            }
          >
            <Zap className="w-5 h-5" />
            {selectedMessageEffect !== 'none' && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded bg-orange-600 text-white text-[9px] leading-none uppercase tracking-wide">
                {selectedMessageEffect === 'confetti' ? 'C' : 'F'}
              </span>
            )}
          </button>
        )}

        {/* Emoji button */}
        <div className="relative">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={cn(
              "p-2 rounded-full transition-colors",
              showEmoji
                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Emoji picker */}
          <AnimatePresence>
            {showEmoji && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-2 p-3 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 z-20"
              >
                <div className="grid grid-cols-5 gap-1 w-[200px]">
                  {commonEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xl transition-transform hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Voice Recording UI */}
        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 rounded-2xl">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-600 dark:text-red-400 font-medium">
              {formatDuration(recordingDuration)}
            </span>
            <span className="text-sm text-gray-500 flex-1">Recording...</span>
            <button
              onClick={cancelRecording}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
              title="Cancel"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={stopRecording}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Stop recording"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        ) : audioBlob ? (
          <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 rounded-2xl">
            <Mic className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-400 flex-1">
              Voice message ({formatDuration(recordingDuration)})
            </span>
            <button
              onClick={() => { setAudioBlob(null); setRecordingDuration(0); }}
              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
              title="Delete recording"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Text input */
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={disabled}
              rows={1}
              className={cn(
                'w-full resize-none rounded-2xl px-4 py-2.5',
                'bg-gray-100 dark:bg-gray-800',
                'border border-transparent focus:border-blue-500',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                'text-gray-900 dark:text-white placeholder-gray-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'max-h-32'
              )}
            />
          </div>
        )}

        {/* Mic button (show when no text/files) or Grammar Fix + Send buttons */}
        {!message.trim() && selectedFiles.length === 0 && !audioBlob && !isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled}
            className={cn(
              'p-3 rounded-full transition-all',
              'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-gray-300 dark:hover:bg-gray-600',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title="Record voice message"
          >
            <Mic className="w-5 h-5" />
          </button>
        ) : (
          <>
            {/* Grammar Fix button - shows when there's text */}
            {message.trim() && otherUserId && (
              <button
                onClick={handleQuickGrammarFix}
                disabled={isFixingGrammar || disabled}
                className={cn(
                  'p-3 rounded-full transition-all',
                  'bg-purple-100 dark:bg-purple-900/30 text-purple-600 hover:bg-purple-200 dark:hover:bg-purple-800/40',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                title="Fix grammar with AI"
              >
                {isFixingGrammar ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Pencil className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={(!message.trim() && selectedFiles.length === 0 && !audioBlob) || disabled || isRecording}
              className={cn(
                'p-3 rounded-full transition-all',
                (message.trim() || selectedFiles.length > 0 || audioBlob)
                  ? 'bg-blue-600 text-white hover:bg-blue-700 scale-100'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
