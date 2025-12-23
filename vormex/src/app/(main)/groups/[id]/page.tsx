'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  Users, 
  Image as ImageIcon,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  X,
  Settings,
  UserPlus,
  LogOut,
  Trash2,
  Loader2,
  Palette,
  Reply,
  Copy,
  Forward,
  Flag,
  Edit3,
  Pin,
  MoreHorizontal,
  AtSign,
  Mic
} from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

interface Message {
  id: string
  group_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'file' | 'system'
  file_url: string | null
  image_url: string | null
  reply_to: string | null
  is_edited: boolean
  is_deleted: boolean
  created_at: string
  deleted_for?: string[]
  sender?: {
    full_name: string | null
    avatar_url: string | null
  }
  profile?: {
    full_name: string | null
    avatar_url: string | null
  }
  reply_message?: {
    content: string
    sender_name: string | null
  }
  reactions?: { emoji: string; count: number; users: string[] }[]
}

interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
}

interface GroupInfo {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  visibility: 'public' | 'private'
  created_by: string
  member_count: number
}

interface GroupMember {
  user_id: string
  role: 'admin' | 'member'
  profile: {
    full_name: string | null
    avatar_url: string | null
  }
}

interface Wallpaper {
  id: string
  name: string
  image_url: string
  is_default: boolean
}

export default function GroupChatPage() {
  const params = useParams()
  const groupId = params.id as string
  const router = useRouter()
  const supabase = createClient()
  
  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [members, setMembers] = useState<GroupMember[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false)
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
  const [currentWallpaper, setCurrentWallpaper] = useState<string | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [isGroupAdmin, setIsGroupAdmin] = useState(false)
  
  // New feature states
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMessageMenu, setShowMessageMenu] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionIndex, setMentionIndex] = useState(0)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [swipeX, setSwipeX] = useState(0)
  const [swipingMessageId, setSwipingMessageId] = useState<string | null>(null)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const touchStartX = useRef(0)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Common emoji reactions
  const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡']
  
  // Edit time limit (10 minutes)
  const EDIT_TIME_LIMIT = 10 * 60 * 1000

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Scroll to a specific message and highlight it (like WhatsApp)
  const scrollToMessage = (messageId: string) => {
    const messageElement = messageRefs.current.get(messageId)
    if (messageElement) {
      // Scroll the message into view
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      
      // Highlight the message
      setHighlightedMessageId(messageId)
      
      // Remove highlight after 1.5 seconds
      setTimeout(() => {
        setHighlightedMessageId(null)
      }, 1500)
    }
  }

  const loadGroup = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setCurrentUserId(user.id)

      // Load group info
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (groupError || !groupData) {
        router.push('/groups')
        return
      }

      // Get member count
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)

      setGroup({
        ...groupData,
        member_count: count || 0
      })

      // Check if user is a member
      const { data: memberData } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

      setIsMember(!!memberData)
      setIsGroupAdmin(memberData?.role === 'admin')

    } catch (error) {
      console.error('Error loading group:', error)
    }
  }, [supabase, groupId, router])

  const loadMessages = useCallback(async () => {
    if (!isMember) return

    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error

      if (messagesData && messagesData.length > 0) {
        // Get sender profiles
        const senderIds = [...new Set(messagesData.map(m => m.sender_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', senderIds)

        const profilesMap = new Map(
          (profiles || []).map(p => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
        )

        // Create a map of all messages for reply lookup
        const messagesMap = new Map(messagesData.map(m => [m.id, m]))

        const messagesWithSenders: Message[] = messagesData.map(m => {
          // Get reply message data if exists
          let reply_message = undefined
          if (m.reply_to && messagesMap.has(m.reply_to)) {
            const repliedMsg = messagesMap.get(m.reply_to)!
            const repliedSender = profilesMap.get(repliedMsg.sender_id)
            reply_message = {
              content: repliedMsg.content || (repliedMsg.message_type === 'image' ? '📷 Photo' : '📎 File'),
              sender_name: repliedSender?.full_name || 'Unknown'
            }
          }

          return {
            ...m,
            sender: profilesMap.get(m.sender_id) || undefined,
            reply_message
          }
        })

        setMessages(messagesWithSenders)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [supabase, groupId, isMember])

  const loadMembers = useCallback(async () => {
    try {
      const { data: membersData } = await supabase
        .from('group_members')
        .select('user_id, role')
        .eq('group_id', groupId)

      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds)

        const profilesMap = new Map(
          (profiles || []).map(p => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
        )

        const membersWithProfiles: GroupMember[] = membersData.map(m => ({
          user_id: m.user_id,
          role: m.role as 'admin' | 'member',
          profile: profilesMap.get(m.user_id) || { full_name: null, avatar_url: null }
        }))

        // Sort: admins first
        membersWithProfiles.sort((a, b) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1
          if (a.role !== 'admin' && b.role === 'admin') return 1
          return 0
        })

        setMembers(membersWithProfiles)
      }
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }, [supabase, groupId])

  const loadWallpapers = useCallback(async () => {
    try {
      // Load available wallpapers
      const { data: wallpapersData } = await supabase
        .from('wallpapers')
        .select('id, name, image_url, is_default')
        .eq('is_active', true)
        .order('is_default', { ascending: false })

      if (wallpapersData) {
        setWallpapers(wallpapersData)
      }

      // Load user's current wallpaper preference
      if (currentUserId) {
        const { data: settings } = await supabase
          .from('user_settings')
          .select('chat_wallpaper_id')
          .eq('user_id', currentUserId)
          .single()

        if (settings?.chat_wallpaper_id) {
          const selectedWallpaper = wallpapersData?.find(w => w.id === settings.chat_wallpaper_id)
          if (selectedWallpaper) {
            setCurrentWallpaper(selectedWallpaper.image_url)
          }
        }
      }
    } catch (error) {
      console.error('Error loading wallpapers:', error)
    }
  }, [supabase, currentUserId])

  const setWallpaperPreference = async (wallpaperId: string | null) => {
    if (!currentUserId) return

    try {
      // Update or insert user settings
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: currentUserId,
          chat_wallpaper_id: wallpaperId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error

      // Update local state
      if (wallpaperId) {
        const selectedWallpaper = wallpapers.find(w => w.id === wallpaperId)
        setCurrentWallpaper(selectedWallpaper?.image_url || null)
      } else {
        setCurrentWallpaper(null)
      }

      setShowWallpaperPicker(false)
    } catch (error) {
      console.error('Error setting wallpaper:', error)
      alert('Failed to set wallpaper')
    }
  }

  // Mark messages as read when entering the group
  const markMessagesAsRead = useCallback(async () => {
    if (!currentUserId || !groupId) return

    try {
      // Update last_read_at in group_members
      await supabase
        .from('group_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', currentUserId)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }, [supabase, groupId, currentUserId])

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await loadGroup()
      setLoading(false)
    }
    init()
  }, [loadGroup])

  // Load messages when membership is confirmed
  useEffect(() => {
    if (isMember) {
      loadMessages()
      loadMembers()
      loadWallpapers()
      // Mark messages as read when entering the chat
      markMessagesAsRead()
    }
  }, [isMember, loadMessages, loadMembers, loadWallpapers, markMessagesAsRead])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!isMember || !groupId) return

    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          const newMsg = payload.new as Message
          
          // Get sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single()

          // Get reply message data if exists
          let reply_message = undefined
          if (newMsg.reply_to) {
            // Check if we already have the message in state
            const repliedMsg = messages.find(m => m.id === newMsg.reply_to)
            if (repliedMsg) {
              reply_message = {
                content: repliedMsg.content || (repliedMsg.message_type === 'image' ? '📷 Photo' : '📎 File'),
                sender_name: repliedMsg.sender?.full_name || 'Unknown'
              }
            } else {
              // Fetch from database
              const { data: repliedMsgData } = await supabase
                .from('messages')
                .select('content, message_type, sender_id')
                .eq('id', newMsg.reply_to)
                .single()
              
              if (repliedMsgData) {
                const { data: repliedProfile } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', repliedMsgData.sender_id)
                  .single()
                
                reply_message = {
                  content: repliedMsgData.content || (repliedMsgData.message_type === 'image' ? '📷 Photo' : '📎 File'),
                  sender_name: repliedProfile?.full_name || 'Unknown'
                }
              }
            }
          }

          setMessages(prev => [...prev, {
            ...newMsg,
            sender: profile || undefined,
            reply_message
          }])

          // Mark as read since user is viewing the chat
          markMessagesAsRead()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, groupId, isMember, messages, markMessagesAsRead])

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')
    const replyToId = replyingTo?.id || null
    setReplyingTo(null)

    try {
      if (editingMessage) {
        // Update existing message
        const { error } = await supabase
          .from('messages')
          .update({
            content: messageContent,
            is_edited: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMessage.id)

        if (error) throw new Error(error.message)
        
        // Update local state
        setMessages(prev => prev.map(m => 
          m.id === editingMessage.id 
            ? { ...m, content: messageContent, is_edited: true }
            : m
        ))
        setEditingMessage(null)
      } else {
        // Send new message
        const { error } = await supabase
          .from('messages')
          .insert({
            group_id: groupId,
            sender_id: currentUserId,
            content: messageContent,
            message_type: 'text',
            reply_to: replyToId
          })

        if (error) {
          console.error('Supabase error:', error.message, error.code, error.details)
          throw new Error(error.message || 'Failed to send message')
        }
      }
      inputRef.current?.focus()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error sending message:', errorMessage)
      alert(`Failed to send message: ${errorMessage}`)
      setNewMessage(messageContent)
      setReplyingTo(replyToId ? replyingTo : null)
    } finally {
      setSending(false)
    }
  }

  // Handle @mention input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewMessage(value)

    // Check for @mention
    const lastAtIndex = value.lastIndexOf('@')
    if (lastAtIndex !== -1) {
      const textAfterAt = value.slice(lastAtIndex + 1)
      const hasSpaceAfter = textAfterAt.includes(' ')
      
      if (!hasSpaceAfter && textAfterAt.length >= 0) {
        setMentionSearch(textAfterAt.toLowerCase())
        setShowMentions(true)
        setMentionIndex(0)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  // Filter members for mention dropdown
  const filteredMentionMembers = members.filter(m => 
    m.profile.full_name?.toLowerCase().includes(mentionSearch)
  ).slice(0, 5)

  // Insert mention
  const insertMention = (member: GroupMember) => {
    const lastAtIndex = newMessage.lastIndexOf('@')
    const newText = newMessage.slice(0, lastAtIndex) + `@${member.profile.full_name} `
    setNewMessage(newText)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  // Handle reactions
  const addReaction = async (messageId: string, emoji: string) => {
    if (!currentUserId) return

    try {
      const { error } = await supabase
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: currentUserId,
          emoji
        }, { onConflict: 'message_id,user_id,emoji' })

      if (error) {
        // If table doesn't exist yet, just update local state
        if (error.code === '42P01') {
          console.warn('message_reactions table not found. Run the SQL migration.')
        } else {
          throw error
        }
      }

      // Update local state regardless (optimistic update)
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m
        
        const reactions = [...(m.reactions || [])]
        const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji)
        
        if (existingReactionIndex >= 0) {
          const existingReaction = reactions[existingReactionIndex]
          if (!existingReaction.users.includes(currentUserId)) {
            reactions[existingReactionIndex] = {
              ...existingReaction,
              count: existingReaction.count + 1,
              users: [...existingReaction.users, currentUserId]
            }
          }
        } else {
          reactions.push({ emoji, count: 1, users: [currentUserId] })
        }
        
        return { ...m, reactions }
      }))
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error adding reaction:', errorMessage)
    }
    
    setShowEmojiPicker(false)
    setSelectedMessage(null)
  }

  // Remove reaction
  const removeReaction = async (messageId: string, emoji: string) => {
    if (!currentUserId) return

    try {
      await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', currentUserId)
        .eq('emoji', emoji)

      // Update local state
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m
        
        const reactions = (m.reactions || []).map(r => {
          if (r.emoji !== emoji) return r
          return {
            ...r,
            count: r.count - 1,
            users: r.users.filter(u => u !== currentUserId)
          }
        }).filter(r => r.count > 0)
        
        return { ...m, reactions }
      }))
    } catch (error) {
      console.error('Error removing reaction:', error)
    }
  }

  // Delete message
  const deleteMessage = async (messageId: string, forEveryone: boolean) => {
    if (!currentUserId) return

    try {
      if (forEveryone) {
        // Mark as deleted for everyone
        await supabase
          .from('messages')
          .update({ is_deleted: true })
          .eq('id', messageId)

        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, is_deleted: true } : m
        ))
      } else {
        // Delete for me only (add to deleted_for array)
        const message = messages.find(m => m.id === messageId)
        const deletedFor = [...(message?.deleted_for || []), currentUserId]
        
        await supabase
          .from('messages')
          .update({ deleted_for: deletedFor })
          .eq('id', messageId)

        setMessages(prev => prev.filter(m => m.id !== messageId))
      }
    } catch (error) {
      console.error('Error deleting message:', error)
    }
    
    setShowMessageMenu(false)
    setSelectedMessage(null)
  }

  // Check if message can be edited/deleted for everyone
  const canEditOrDelete = (message: Message) => {
    if (message.sender_id !== currentUserId) return false
    const messageTime = new Date(message.created_at).getTime()
    const now = Date.now()
    return now - messageTime < EDIT_TIME_LIMIT
  }

  // Start editing message
  const startEditing = (message: Message) => {
    setEditingMessage(message)
    setNewMessage(message.content)
    setShowMessageMenu(false)
    setSelectedMessage(null)
    inputRef.current?.focus()
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingMessage(null)
    setNewMessage('')
  }

  // Copy message
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
    setShowMessageMenu(false)
    setSelectedMessage(null)
  }

  // Report message
  const reportMessage = async (reason: string, description?: string) => {
    if (!selectedMessage || !currentUserId) return

    try {
      await supabase
        .from('message_reports')
        .insert({
          message_id: selectedMessage.id,
          reporter_id: currentUserId,
          reason,
          description
        })

      alert('Message reported successfully')
    } catch (error) {
      console.error('Error reporting message:', error)
      alert('Failed to report message')
    }

    setShowReportModal(false)
    setSelectedMessage(null)
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !currentUserId) return

    const file = e.target.files[0]
    const isImage = file.type.startsWith('image/')
    
    setUploadingFile(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUserId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName)

      // Send message with file
      await supabase
        .from('messages')
        .insert({
          group_id: groupId,
          sender_id: currentUserId,
          content: file.name,
          message_type: isImage ? 'image' : 'file',
          file_url: publicUrl,
          reply_to: replyingTo?.id || null
        })

      setReplyingTo(null)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file')
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Touch handlers for swipe to reply
  const handleTouchStart = (e: React.TouchEvent, messageId: string) => {
    touchStartX.current = e.touches[0].clientX
    setSwipingMessageId(messageId)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingMessageId) return
    const currentX = e.touches[0].clientX
    const diff = currentX - touchStartX.current
    
    // Only allow right swipe, max 80px
    if (diff > 0 && diff <= 80) {
      setSwipeX(diff)
    }
  }

  const handleTouchEnd = (message: Message) => {
    if (swipeX > 50) {
      // Trigger reply
      setReplyingTo(message)
      inputRef.current?.focus()
    }
    setSwipeX(0)
    setSwipingMessageId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return

    try {
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUserId!)

      router.push('/groups')
    } catch (error) {
      console.error('Error leaving group:', error)
    }
  }

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return format(date, 'HH:mm')
  }

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMMM d, yyyy')
  }

  const shouldShowDateHeader = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return true
    const currentDate = new Date(currentMsg.created_at).toDateString()
    const prevDate = new Date(prevMsg.created_at).toDateString()
    return currentDate !== prevDate
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <p className="text-gray-400 mb-4">Group not found</p>
        <button
          onClick={() => router.push('/groups')}
          className="bg-indigo-500 text-white px-6 py-2 rounded-xl"
        >
          Back to Groups
        </button>
      </div>
    )
  }

  if (!isMember) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
          {group.avatar_url ? (
            <Image src={group.avatar_url} alt="" width={80} height={80} className="rounded-full" />
          ) : (
            <Users className="w-10 h-10 text-gray-500" />
          )}
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{group.name}</h2>
        <p className="text-gray-400 text-center mb-6">
          You need to join this group to see messages
        </p>
        <button
          onClick={() => router.push('/groups')}
          className="bg-indigo-500 text-white px-6 py-2 rounded-xl"
        >
          Back to Groups
        </button>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-5rem)] lg:h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-800/50 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => router.push('/groups')}
          className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        
        <div 
          className="flex items-center gap-3 flex-1 cursor-pointer"
          onClick={() => setShowMembers(true)}
        >
          <div className="w-10 h-10 bg-gray-800 rounded-full overflow-hidden flex-shrink-0">
            {group.avatar_url ? (
              <Image src={group.avatar_url} alt="" width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-500" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-semibold truncate">{group.name}</h1>
            <p className="text-gray-500 text-xs">{group.member_count} members</p>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
          >
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </header>

      {/* Options Dropdown Menu - Rendered outside header for proper z-index */}
      {showOptions && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 9990 }}
            onClick={() => setShowOptions(false)}
          />
          <div 
            style={{ 
              position: 'fixed', 
              top: '60px', 
              right: '16px', 
              zIndex: 9995,
              width: '200px'
            }}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl"
          >
            <button
              type="button"
              onClick={() => {
                setShowOptions(false)
                setShowMembers(true)
              }}
              className="w-full px-4 py-3.5 text-left text-white hover:bg-gray-800 active:bg-gray-700 flex items-center gap-3 transition-colors"
            >
              <Users className="w-5 h-5 text-gray-400" />
              <span>View Members</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowOptions(false)
                setShowWallpaperPicker(true)
              }}
              className="w-full px-4 py-3.5 text-left text-white hover:bg-gray-800 active:bg-gray-700 flex items-center gap-3 transition-colors"
            >
              <Palette className="w-5 h-5 text-gray-400" />
              <span>Chat Wallpaper</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowOptions(false)
                handleLeaveGroup()
              }}
              className="w-full px-4 py-3.5 text-left text-red-400 hover:bg-gray-800 active:bg-gray-700 flex items-center gap-3 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Leave Group</span>
            </button>
          </div>
        </>
      )}

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 relative"
        style={currentWallpaper ? {
          backgroundImage: `url(${currentWallpaper})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        } : undefined}
      >
        {/* Dark overlay for readability when wallpaper is set */}
        {currentWallpaper && (
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        )}
        
        <div className="relative z-10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-500">No messages yet</p>
            <p className="text-gray-600 text-sm">Be the first to say hello!</p>
          </div>
        ) : (
          messages.filter(m => !m.deleted_for?.includes(currentUserId || '')).map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null
            const isOwnMessage = message.sender_id === currentUserId
            const showSender = !isOwnMessage && (
              !prevMessage || 
              prevMessage.sender_id !== message.sender_id ||
              shouldShowDateHeader(message, prevMessage)
            )
            const isBeingSwiped = swipingMessageId === message.id

            return (
              <div 
                key={message.id}
                ref={(el) => {
                  if (el) messageRefs.current.set(message.id, el)
                }}
              >
                {shouldShowDateHeader(message, prevMessage) && (
                  <div className="flex justify-center my-4">
                    <span className="px-3 py-1 bg-gray-900 rounded-full text-xs text-gray-500">
                      {formatDateHeader(message.created_at)}
                    </span>
                  </div>
                )}

                {/* Message with swipe to reply */}
                <div 
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} relative ${
                    highlightedMessageId === message.id ? 'animate-highlight-message' : ''
                  }`}
                  onTouchStart={(e) => handleTouchStart(e, message.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(message)}
                  style={{
                    transform: isBeingSwiped ? `translateX(${swipeX}px)` : 'none',
                    transition: isBeingSwiped ? 'none' : 'transform 0.2s ease-out'
                  }}
                >
                  {/* Reply indicator on swipe */}
                  {isBeingSwiped && swipeX > 20 && (
                    <div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center"
                      style={{ opacity: swipeX / 80 }}
                    >
                      <Reply className="w-5 h-5 text-indigo-400" />
                    </div>
                  )}

                  <div 
                    className={`max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'}`}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setSelectedMessage(message)
                      setShowMessageMenu(true)
                    }}
                    onClick={() => {
                      if (showMessageMenu && selectedMessage?.id === message.id) {
                        setShowMessageMenu(false)
                        setSelectedMessage(null)
                      }
                    }}
                  >
                    {showSender && (
                      <p className="text-xs text-indigo-400 mb-1 px-1">
                        {message.sender?.full_name || 'Unknown'}
                      </p>
                    )}

                    {/* Reply preview - clickable to scroll to original message */}
                    {message.reply_to && message.reply_message && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          scrollToMessage(message.reply_to!)
                        }}
                        className={`mb-1 px-3 py-1.5 rounded-lg border-l-2 border-indigo-500 text-left w-full cursor-pointer hover:opacity-80 transition-opacity ${
                          isOwnMessage ? 'bg-indigo-600/30' : 'bg-gray-700/50'
                        }`}
                      >
                        <p className="text-xs text-indigo-300 font-medium">{message.reply_message.sender_name}</p>
                        <p className="text-xs text-gray-400 truncate">{message.reply_message.content}</p>
                      </button>
                    )}

                    <div
                      className={`rounded-2xl overflow-hidden ${
                        isOwnMessage
                          ? 'bg-indigo-500 text-white rounded-br-md'
                          : 'bg-gray-800 text-white rounded-bl-md'
                      } ${highlightedMessageId === message.id ? 'ring-2 ring-indigo-400 ring-opacity-75' : ''}`}
                    >
                      {message.is_deleted ? (
                        <p className="px-4 py-2 italic text-gray-400 text-sm">Message deleted</p>
                      ) : (
                        <>
                          {/* Image message */}
                          {message.message_type === 'image' && message.file_url && (
                            <div className="relative">
                              <Image
                                src={message.file_url}
                                alt=""
                                width={300}
                                height={200}
                                className="max-w-full rounded-t-2xl"
                                unoptimized
                              />
                            </div>
                          )}

                          {/* File message */}
                          {message.message_type === 'file' && message.file_url && (
                            <a 
                              href={message.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 hover:bg-black/10"
                            >
                              <Paperclip className="w-4 h-4" />
                              <span className="text-sm underline">{message.content}</span>
                            </a>
                          )}

                          {/* Text content */}
                          {(message.message_type === 'text' || message.message_type === 'image') && (
                            <div className="px-4 py-2">
                              {message.message_type === 'text' && (
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.content.split(/(@\w+)/g).map((part, i) => 
                                    part.startsWith('@') ? (
                                      <span key={i} className="text-indigo-300 font-medium">{part}</span>
                                    ) : part
                                  )}
                                </p>
                              )}
                              <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                <span className={`text-[10px] ${isOwnMessage ? 'text-indigo-200' : 'text-gray-500'}`}>
                                  {formatMessageTime(message.created_at)}
                                </span>
                                {message.is_edited && (
                                  <span className={`text-[10px] ${isOwnMessage ? 'text-indigo-200' : 'text-gray-500'}`}>
                                    · edited
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Reactions display */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        {message.reactions.map((reaction) => (
                          <button
                            key={reaction.emoji}
                            onClick={() => {
                              if (reaction.users.includes(currentUserId || '')) {
                                removeReaction(message.id, reaction.emoji)
                              } else {
                                addReaction(message.id, reaction.emoji)
                              }
                            }}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                              reaction.users.includes(currentUserId || '')
                                ? 'bg-indigo-500/30 border border-indigo-500'
                                : 'bg-gray-800 border border-gray-700'
                            }`}
                          >
                            <span>{reaction.emoji}</span>
                            <span className="text-gray-400">{reaction.count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick reaction button */}
                    {!message.is_deleted && (
                      <button
                        onClick={() => {
                          setSelectedMessage(message)
                          setShowEmojiPicker(true)
                        }}
                        className={`absolute ${isOwnMessage ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity`}
                      >
                        <Smile className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Context Menu */}
      {showMessageMenu && selectedMessage && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 9990 }}
            onClick={() => {
              setShowMessageMenu(false)
              setSelectedMessage(null)
            }}
          />
          <div 
            style={{ 
              position: 'fixed', 
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9995,
              width: '280px'
            }}
            className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Quick reactions */}
            <div className="p-3 flex justify-center gap-2 border-b border-gray-800">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addReaction(selectedMessage.id, emoji)}
                  className="w-10 h-10 rounded-full hover:bg-gray-800 flex items-center justify-center text-xl transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Menu options */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(selectedMessage)
                  setShowMessageMenu(false)
                  setSelectedMessage(null)
                  inputRef.current?.focus()
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 flex items-center gap-3"
              >
                <Reply className="w-5 h-5 text-gray-400" />
                Reply
              </button>
              
              <button
                type="button"
                onClick={() => copyMessage(selectedMessage.content)}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 flex items-center gap-3"
              >
                <Copy className="w-5 h-5 text-gray-400" />
                Copy
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForwardModal(true)
                  setShowMessageMenu(false)
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 flex items-center gap-3"
              >
                <Forward className="w-5 h-5 text-gray-400" />
                Forward
              </button>

              {selectedMessage.sender_id === currentUserId && canEditOrDelete(selectedMessage) && (
                <button
                  type="button"
                  onClick={() => startEditing(selectedMessage)}
                  className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 flex items-center gap-3"
                >
                  <Edit3 className="w-5 h-5 text-gray-400" />
                  Edit
                </button>
              )}

              {selectedMessage.sender_id !== currentUserId && (
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(true)
                    setShowMessageMenu(false)
                  }}
                  className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 flex items-center gap-3"
                >
                  <Flag className="w-5 h-5 text-gray-400" />
                  Report
                </button>
              )}

              {/* Delete options */}
              <button
                type="button"
                onClick={() => deleteMessage(selectedMessage.id, false)}
                className="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-800 flex items-center gap-3"
              >
                <Trash2 className="w-5 h-5" />
                Delete for me
              </button>

              {selectedMessage.sender_id === currentUserId && canEditOrDelete(selectedMessage) && (
                <button
                  type="button"
                  onClick={() => deleteMessage(selectedMessage.id, true)}
                  className="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-800 flex items-center gap-3"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete for everyone
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && selectedMessage && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 9990 }}
            onClick={() => {
              setShowEmojiPicker(false)
              setSelectedMessage(null)
            }}
          />
          <div 
            style={{ 
              position: 'fixed', 
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9995
            }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-3 shadow-2xl"
          >
            <div className="flex gap-2">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addReaction(selectedMessage.id, emoji)}
                  className="w-12 h-12 rounded-xl hover:bg-gray-800 flex items-center justify-center text-2xl transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Report Modal */}
      {showReportModal && selectedMessage && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 9990, backgroundColor: 'rgba(0,0,0,0.8)' }}
            onClick={() => {
              setShowReportModal(false)
              setSelectedMessage(null)
            }}
          />
          <div 
            style={{ 
              position: 'fixed', 
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9995,
              width: '320px'
            }}
            className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Report Message</h3>
              <p className="text-gray-500 text-sm">Why are you reporting this message?</p>
            </div>
            <div className="py-2">
              {['Spam', 'Harassment', 'Hate speech', 'Violence', 'False information', 'Other'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => reportMessage(reason)}
                  className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Wallpaper Picker Modal */}
      {showWallpaperPicker && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            style={{ zIndex: 9998 }}
            onClick={() => setShowWallpaperPicker(false)}
          />
          
          {/* Modal Content */}
          <div 
            className="fixed bottom-0 left-0 right-0 flex justify-center"
            style={{ zIndex: 9999 }}
          >
            <div className="w-full max-w-lg bg-gray-900 rounded-t-3xl max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
                <h3 className="text-lg font-bold text-white">Chat Wallpaper</h3>
                <button
                  type="button"
                  onClick={() => setShowWallpaperPicker(false)}
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="p-4 overflow-y-auto flex-1">
                {/* No Wallpaper Option */}
                <button
                  type="button"
                  onClick={() => setWallpaperPreference(null)}
                  className={`w-full mb-4 p-4 rounded-2xl border-2 flex items-center gap-3 transition-colors hover:bg-gray-800/70 active:bg-gray-800 ${
                    !currentWallpaper 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-gray-700 bg-gray-800/50'
                  }`}
                >
                  <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <X className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-white font-medium">No Wallpaper</p>
                    <p className="text-gray-400 text-sm">Use default dark background</p>
                  </div>
                  {!currentWallpaper && (
                    <Check className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  )}
                </button>

                {/* Wallpaper Grid */}
                {wallpapers.length === 0 ? (
                  <div className="text-center py-8">
                    <Palette className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No wallpapers available</p>
                    <p className="text-gray-500 text-sm">Check back later!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {wallpapers.map((wallpaper) => {
                      const isSelected = currentWallpaper === wallpaper.image_url
                      return (
                        <button
                          type="button"
                          key={wallpaper.id}
                          onClick={() => setWallpaperPreference(wallpaper.id)}
                          className={`relative rounded-2xl overflow-hidden border-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                            isSelected ? 'border-indigo-500' : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <div className="aspect-[3/4] relative">
                            <Image
                              src={wallpaper.image_url}
                              alt={wallpaper.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          {/* Gradient overlay - doesn't block clicks */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          {/* Wallpaper name */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-white text-sm font-medium truncate">{wallpaper.name}</p>
                          </div>
                          {/* Selected checkmark */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Message Input */}
      <div className="bg-gray-900/95 backdrop-blur-xl border-t border-gray-800/50 flex-shrink-0">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="px-4 pt-3 pb-0">
            <div className="bg-gray-800 rounded-xl p-3 flex items-start gap-3 border-l-4 border-indigo-500">
              <div className="flex-1 min-w-0">
                <p className="text-indigo-400 text-sm font-medium mb-0.5">
                  Replying to {replyingTo.sender_id === currentUserId ? 'yourself' : replyingTo.sender?.full_name || 'Unknown'}
                </p>
                <p className="text-gray-400 text-sm truncate">
                  {replyingTo.content || (replyingTo.image_url ? '📷 Photo' : replyingTo.file_url ? '📎 File' : '')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Edit Preview */}
        {editingMessage && (
          <div className="px-4 pt-3 pb-0">
            <div className="bg-gray-800 rounded-xl p-3 flex items-start gap-3 border-l-4 border-yellow-500">
              <div className="flex-1 min-w-0">
                <p className="text-yellow-400 text-sm font-medium mb-0.5">
                  Editing message
                </p>
                <p className="text-gray-400 text-sm truncate">
                  {editingMessage.content}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingMessage(null)
                  setNewMessage('')
                }}
                className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* @Mentions Dropdown */}
        {showMentions && filteredMentionMembers.length > 0 && (
          <div className="px-4 pt-3 pb-0">
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 max-h-48 overflow-y-auto">
              {filteredMentionMembers.map((member) => (
                <button
                  key={member.user_id}
                  type="button"
                  onClick={() => insertMention(member)}
                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-600 rounded-full overflow-hidden flex-shrink-0">
                    {member.profile.avatar_url ? (
                      <Image
                        src={member.profile.avatar_url}
                        alt=""
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-xs font-semibold">
                          {member.profile.full_name?.[0] || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-white text-sm">{member.profile.full_name || 'Unknown'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Row */}
        <div className="px-4 py-3 flex items-center gap-2">
          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {uploadingFile ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <ImageIcon className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Text Input */}
          <div className="flex-1 bg-gray-800 rounded-full flex items-center px-4">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
              className="flex-1 bg-transparent py-3 text-white placeholder-gray-500 outline-none"
            />
          </div>

          {/* Voice Message Button (shown when no text) */}
          {!newMessage.trim() && !editingMessage && (
            <button
              type="button"
              onClick={() => {
                // Voice recording would be implemented here
                // For now, show a toast or alert
                alert('Voice messages coming soon!')
              }}
              className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              <Mic className="w-5 h-5 text-gray-400" />
            </button>
          )}

          {/* Send Button (shown when there's text or editing) */}
          {(newMessage.trim() || editingMessage) && (
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : editingMessage ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Members Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-gray-900 w-full sm:w-96 max-h-[80vh] rounded-t-3xl sm:rounded-2xl overflow-hidden">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Members ({members.length})</h3>
              <button
                onClick={() => setShowMembers(false)}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
              {members.map((member) => (
                <div 
                  key={member.user_id}
                  className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl"
                >
                  <div className="w-10 h-10 bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                    {member.profile.avatar_url ? (
                      <Image 
                        src={member.profile.avatar_url} 
                        alt="" 
                        width={40} 
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm font-semibold">
                          {member.profile.full_name?.[0] || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {member.profile.full_name || 'Unknown'}
                      {member.user_id === currentUserId && (
                        <span className="text-gray-500 text-sm ml-1">(You)</span>
                      )}
                    </p>
                    {member.role === 'admin' && (
                      <span className="text-xs text-indigo-400">Admin</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
