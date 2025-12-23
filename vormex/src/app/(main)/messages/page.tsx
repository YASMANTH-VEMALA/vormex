'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Send, 
  Loader2,
  MessageSquare,
  Check,
  CheckCheck,
  Crown,
  Lock,
  Shield,
  Phone
} from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { PremiumSvgFilters } from '@/components/premium/PremiumAvatar'

interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  conversation_id?: string
}

interface Conversation {
  user_id: string
  full_name: string | null
  avatar_url: string | null
  last_message: string
  last_message_time: string
  unread_count: number
  is_last_from_them: boolean
  is_premium?: boolean
  premium_type?: 'basic' | 'super' | 'admin' | null
  is_admin?: boolean
  is_blurred?: boolean
}

interface UserInfo {
  id: string
  full_name: string | null
  avatar_url: string | null
  is_premium?: boolean
  premium_type?: 'basic' | 'super' | 'admin' | null
}

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const targetUserId = searchParams.get('user')
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserIsPremium, setCurrentUserIsPremium] = useState(false)
  const [currentUserPremiumType, setCurrentUserPremiumType] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [blurredMessageCount, setBlurredMessageCount] = useState(0)
  
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  
  const [adminInfo, setAdminInfo] = useState<UserInfo | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getAdminInfo = useCallback(async (): Promise<UserInfo | null> => {
    const { data: adminRole } = await supabase
      .from('roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (adminRole) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, is_premium, premium_type')
        .eq('id', adminRole.user_id)
        .single()

      if (profile) {
        return {
          id: profile.id,
          full_name: profile.full_name || 'Admin',
          avatar_url: profile.avatar_url,
          is_premium: profile.is_premium,
          premium_type: profile.premium_type
        }
      }
    }
    return null
  }, [supabase])

  const loadConversations = useCallback(async (
    userId: string, 
    isPremium: boolean, 
    userIsAdmin: boolean,
    adminId?: string
  ) => {
    const { data: allMessages } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (!allMessages || allMessages.length === 0) {
      if (!userIsAdmin && adminId) {
        const admin = await getAdminInfo()
        if (admin) {
          setConversations([{
            user_id: admin.id,
            full_name: admin.full_name,
            avatar_url: admin.avatar_url,
            last_message: 'Start a conversation with support',
            last_message_time: new Date().toISOString(),
            unread_count: 0,
            is_last_from_them: false,
            is_admin: true
          }])
        }
      }
      return
    }

    const conversationMap = new Map<string, {
      messages: DirectMessage[]
      lastMessage: DirectMessage
    }>()

    allMessages.forEach(msg => {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          messages: [msg],
          lastMessage: msg
        })
      } else {
        conversationMap.get(otherUserId)!.messages.push(msg)
      }
    })

    const userIds = Array.from(conversationMap.keys())
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, is_premium, premium_type')
      .in('id', userIds)

    const profileMap = new Map(
      (profiles || []).map(p => [p.id, p])
    )

    const convos: Conversation[] = []
    let blurredCount = 0

    conversationMap.forEach((data, otherUserId) => {
      const profile = profileMap.get(otherUserId)
      
      const unreadCount = data.messages.filter(
        m => m.receiver_id === userId && !m.is_read
      ).length

      const isAdminConvo = adminId === otherUserId
      
      // Determine if conversation should be blurred:
      // - Current user is NOT premium AND NOT admin
      // - AND the other user is NOT admin
      const shouldBlur = !isPremium && !userIsAdmin && !isAdminConvo

      if (shouldBlur) {
        blurredCount += unreadCount > 0 ? unreadCount : (data.messages.length > 0 ? 1 : 0)
      }

      // Include ALL conversations, but mark blurred ones
      convos.push({
        user_id: otherUserId,
        full_name: profile?.full_name || 'Unknown',
        avatar_url: profile?.avatar_url || null,
        last_message: data.lastMessage.content,
        last_message_time: data.lastMessage.created_at,
        unread_count: unreadCount,
        is_last_from_them: data.lastMessage.sender_id !== userId,
        is_premium: profile?.is_premium || false,
        premium_type: profile?.premium_type as 'basic' | 'super' | 'admin' | null,
        is_admin: isAdminConvo,
        is_blurred: shouldBlur
      })
    })

    setBlurredMessageCount(blurredCount)

    convos.sort((a, b) => {
      if (a.is_admin && !b.is_admin) return -1
      if (b.is_admin && !a.is_admin) return 1
      
      if (a.premium_type === 'admin' && b.premium_type !== 'admin') return -1
      if (b.premium_type === 'admin' && a.premium_type !== 'admin') return 1
      if (a.premium_type === 'super' && b.premium_type !== 'super') return -1
      if (b.premium_type === 'super' && a.premium_type !== 'super') return 1
      if (a.is_premium && !b.is_premium) return -1
      if (b.is_premium && !a.is_premium) return 1
      
      return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
    })

    if (!userIsAdmin && adminId && !convos.some(c => c.is_admin)) {
      const admin = await getAdminInfo()
      if (admin) {
        convos.unshift({
          user_id: admin.id,
          full_name: admin.full_name,
          avatar_url: admin.avatar_url,
          last_message: 'Start a conversation with support',
          last_message_time: new Date().toISOString(),
          unread_count: 0,
          is_last_from_them: false,
          is_admin: true
        })
      }
    }

    setConversations(convos)
  }, [supabase, getAdminInfo])

  const loadMessages = useCallback(async (userId: string, otherUserId: string) => {
    const { data: messagesData } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })

    if (messagesData) {
      setMessages(messagesData)

      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', userId)
        .eq('is_read', false)

      setConversations(prev => prev.map(c => 
        c.user_id === otherUserId ? { ...c, unread_count: 0 } : c
      ))
    }
  }, [supabase])

  const initialize = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setCurrentUserId(user.id)

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('is_premium, premium_type')
        .eq('id', user.id)
        .single()

      const isPremium = currentProfile?.is_premium || false
      setCurrentUserIsPremium(isPremium)
      setCurrentUserPremiumType(currentProfile?.premium_type || null)

      const adminEmails = ['yasmanthvemala007@gmail.com']
      // ONLY yasmanthvemala007@gmail.com is admin
      const userIsAdmin = adminEmails.includes(user.email || '')
      
      setIsAdmin(userIsAdmin)

      const admin = await getAdminInfo()
      setAdminInfo(admin)

      if (targetUserId && targetUserId !== user.id) {
        const { data: targetProfile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, is_premium, premium_type')
          .eq('id', targetUserId)
          .single()

        if (targetProfile) {
          setSelectedUser({
            id: targetProfile.id,
            full_name: targetProfile.full_name,
            avatar_url: targetProfile.avatar_url,
            is_premium: targetProfile.is_premium,
            premium_type: targetProfile.premium_type
          })
          await loadMessages(user.id, targetUserId)
        }
      }

      await loadConversations(user.id, isPremium, userIsAdmin, admin?.id)

    } catch (error) {
      console.error('Error initializing:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, router, targetUserId, getAdminInfo, loadConversations, loadMessages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !selectedUser || sending) return

    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedUser.id,
          content
        })
        .select()
        .single()

      if (error) throw error

      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev
        return [...prev, data]
      })

      inputRef.current?.focus()
    } catch (error) {
      console.error('Error sending message:', error)
      setNewMessage(content)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const selectConversation = async (convo: Conversation) => {
    if (convo.is_blurred && !currentUserIsPremium) {
      router.push('/premium?context=view_message')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, is_premium, premium_type')
      .eq('id', convo.user_id)
      .single()

    if (profile) {
      setSelectedUser({
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        is_premium: profile.is_premium,
        premium_type: profile.premium_type
      })
      await loadMessages(currentUserId!, convo.user_id)
    }
  }

  const requestCall = async () => {
    if (!currentUserId || !selectedUser || currentUserPremiumType !== 'super') return

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', currentUserId)
        .single()

      const { error } = await supabase
        .from('call_requests')
        .insert({
          requester_id: currentUserId,
          admin_id: selectedUser.id,
          requester_name: profile?.full_name,
          requester_avatar: profile?.avatar_url,
          status: 'pending'
        })

      if (error) throw error

      alert('Call request sent to admin. You will be notified when admin responds.')
    } catch (error) {
      console.error('Error requesting call:', error)
      alert('Failed to send call request. Please try again.')
    }
  }

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel('direct-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages'
        },
        async (payload) => {
          const newMsg = payload.new as DirectMessage
          
          if (newMsg.sender_id === currentUserId || newMsg.receiver_id === currentUserId) {
            if (selectedUser && (
              newMsg.sender_id === selectedUser.id || 
              newMsg.receiver_id === selectedUser.id
            )) {
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev
                return [...prev, newMsg]
              })
              
              if (newMsg.sender_id === selectedUser.id) {
                supabase
                  .from('direct_messages')
                  .update({ is_read: true })
                  .eq('id', newMsg.id)
              }
            }
            
            await loadConversations(currentUserId, currentUserIsPremium, isAdmin, adminInfo?.id)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages'
        },
        (payload) => {
          const updatedMsg = payload.new as DirectMessage
          setMessages(prev => prev.map(m => 
            m.id === updatedMsg.id ? { ...m, is_read: updatedMsg.is_read } : m
          ))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, currentUserId, selectedUser, currentUserIsPremium, isAdmin, adminInfo, loadConversations])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-black">
        <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-gray-800/50">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Messages</h1>
              <p className="text-gray-500 text-xs">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </header>

        <PremiumSvgFilters />

        {!currentUserIsPremium && blurredMessageCount > 0 && (
          <div 
            onClick={() => router.push('/premium?context=view_message')}
            className="mx-4 mt-4 p-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{blurredMessageCount} new message{blurredMessageCount !== 1 ? 's' : ''}</p>
                <p className="text-gray-400 text-sm">Upgrade to Premium to view</p>
              </div>
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        )}

        <div className="p-4 space-y-2 pb-24">
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-gray-600 text-sm">
                {isAdmin ? 'User messages will appear here' : 'Start a conversation!'}
              </p>
            </div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.user_id}
                onClick={() => selectConversation(convo)}
                className={`w-full rounded-2xl p-4 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left relative overflow-hidden ${
                  convo.is_blurred
                    ? 'bg-gray-900/80 border border-gray-700/50'
                    : convo.is_admin
                    ? 'bg-indigo-500/10 border-2 border-indigo-500/30'
                    : convo.is_premium && convo.premium_type === 'admin'
                    ? 'bg-purple-500/5 border-2 border-purple-500/30'
                    : convo.is_premium && convo.premium_type === 'super'
                    ? 'bg-amber-500/5 border-2 border-amber-500/30'
                    : convo.is_premium
                    ? 'bg-blue-500/5 border-2 border-blue-500/30'
                    : 'bg-gray-900/50 border border-gray-800/50'
                }`}
              >
                {/* Blurred overlay for non-premium users */}
                {convo.is_blurred && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2 bg-indigo-500/20 px-4 py-2 rounded-full">
                      <Lock className="w-4 h-4 text-indigo-400" />
                      <span className="text-indigo-400 text-sm font-medium">Tap to unlock</span>
                    </div>
                  </div>
                )}

                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full overflow-hidden ${
                    convo.is_blurred
                      ? 'blur-md'
                      : convo.is_admin
                      ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-black'
                      : convo.is_premium && convo.premium_type === 'admin'
                      ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black'
                      : convo.is_premium && convo.premium_type === 'super'
                      ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-black'
                      : convo.is_premium
                      ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black'
                      : 'bg-gray-800'
                  }`}>
                    {convo.avatar_url ? (
                      <Image
                        src={convo.avatar_url}
                        alt=""
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        {convo.is_admin ? (
                          <Shield className="w-6 h-6 text-indigo-400" />
                        ) : (
                          <span className="text-gray-400 text-lg font-semibold">
                            {convo.full_name?.[0] || '?'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`flex-1 min-w-0 ${convo.is_blurred ? 'blur-md' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-white font-medium truncate">
                        {convo.is_admin ? 'Admin Support' : convo.full_name}
                      </h3>
                      {convo.is_admin && (
                        <Shield className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      )}
                      {!convo.is_admin && convo.is_premium && convo.premium_type && (
                        <Crown className={`w-4 h-4 flex-shrink-0 ${
                          convo.premium_type === 'admin' ? 'text-purple-400' : 
                          convo.premium_type === 'super' ? 'text-amber-400' : 'text-blue-400'
                        }`} />
                      )}
                    </div>
                    <span className="text-gray-500 text-xs">
                      {formatDistanceToNow(new Date(convo.last_message_time), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${convo.unread_count > 0 ? 'text-white font-medium' : 'text-gray-500'}`}>
                    {!convo.is_last_from_them && <span className="text-gray-600">You: </span>}
                    {convo.last_message}
                  </p>
                </div>

                {convo.unread_count > 0 && !convo.is_blurred && (
                  <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{convo.unread_count}</span>
                  </div>
                )}
                
                {convo.is_blurred && convo.unread_count > 0 && (
                  <div className="w-6 h-6 bg-indigo-500/50 rounded-full flex items-center justify-center flex-shrink-0 z-20">
                    <span className="text-white text-xs font-bold">{convo.unread_count}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  const isAdminChat = adminInfo?.id === selectedUser.id

  return (
    <div className="h-[calc(100vh-5rem)] lg:h-screen bg-black flex flex-col">
      <header className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-800/50 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => {
            setSelectedUser(null)
            setMessages([])
            router.replace('/messages')
          }}
          className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        
        <div className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ${
          isAdminChat
            ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-900'
            : selectedUser.is_premium && selectedUser.premium_type === 'admin'
            ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900'
            : selectedUser.is_premium && selectedUser.premium_type === 'super'
            ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-gray-900'
            : selectedUser.is_premium
            ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900'
            : 'bg-gray-800'
        }`}>
          {selectedUser.avatar_url ? (
            <Image src={selectedUser.avatar_url} alt="" width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              {isAdminChat ? (
                <Shield className="w-5 h-5 text-indigo-400" />
              ) : (
                <span className="text-gray-400 font-semibold">{selectedUser.full_name?.[0] || '?'}</span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-white font-semibold truncate">
              {isAdminChat ? 'Admin Support' : selectedUser.full_name}
            </h1>
            {isAdminChat && <Shield className="w-4 h-4 text-indigo-400" />}
            {!isAdminChat && selectedUser.is_premium && selectedUser.premium_type && (
              <Crown className={`w-4 h-4 flex-shrink-0 ${
                selectedUser.premium_type === 'admin' ? 'text-purple-400' : 
                selectedUser.premium_type === 'super' ? 'text-amber-400' : 'text-blue-400'
              }`} />
            )}
          </div>
          <p className="text-gray-500 text-xs">
            {isAdminChat 
              ? 'Support' 
              : selectedUser.is_premium 
                ? selectedUser.premium_type === 'admin'
                  ? 'Admin Premium'
                  : selectedUser.premium_type === 'super' 
                    ? 'Super Supporter' 
                    : 'Premium User'
                : 'User'}
          </p>
        </div>

        {isAdminChat && currentUserPremiumType === 'super' && (
          <button
            onClick={requestCall}
            className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center"
            title="Request Call"
          >
            <Phone className="w-5 h-5 text-green-400" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-16 h-16 text-gray-700 mb-4" />
            <p className="text-gray-500">No messages yet</p>
            <p className="text-gray-600 text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId
            
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-indigo-500 text-white rounded-br-md'
                      : 'bg-gray-800 text-white rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-[10px] ${isOwn ? 'text-indigo-200' : 'text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isOwn && (
                      msg.is_read ? (
                        <CheckCheck className="w-3 h-3 text-indigo-200" />
                      ) : (
                        <Check className="w-3 h-3 text-indigo-300" />
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-gray-900/95 backdrop-blur-xl border-t border-gray-800/50 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-800 rounded-full flex items-center px-4">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-transparent py-3 text-white placeholder-gray-500 outline-none"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
