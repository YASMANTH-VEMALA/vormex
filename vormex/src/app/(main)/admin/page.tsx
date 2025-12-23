'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  Users, 
  Flag, 
  Megaphone, 
  Plus,
  Trash2,
  Loader2,
  Check,
  X,
  ArrowLeft,
  Edit3,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  Eye,
  Ban,
  Crown,
  Phone
} from 'lucide-react'
import Image from 'next/image'

interface Report {
  id: string
  reason: string
  description: string | null
  status: string
  created_at: string
  reporter: { full_name: string | null } | null
  reported_user: { full_name: string | null } | null
}

interface MessageReport {
  id: string
  message_id: string
  reason: string
  description: string | null
  status: string
  created_at: string
  reporter: { id: string; full_name: string | null } | null
  message: {
    content: string
    sender_id: string
    sender_name: string | null
    group_id: string
    group_name: string | null
  } | null
}

interface User {
  id: string
  full_name: string | null
  email: string
  role: string
  is_premium: boolean
  premium_type: 'basic' | 'super' | 'admin' | null
  avatar_url: string | null
  // Moderation fields
  deleted: boolean
  is_suspended: boolean
  suspension_end_date: string | null
  suspension_reason: string | null
  is_banned: boolean
  ban_reason: string | null
}

interface Announcement {
  id: string
  title: string
  content: string
  image_url: string | null
  is_highlighted: boolean
  created_at: string
}

interface Wallpaper {
  id: string
  name: string
  image_url: string
  thumbnail_url?: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
}

interface PremiumUser {
  id: string
  full_name: string | null
  avatar_url: string | null
  is_premium: boolean
  premium_type: 'basic' | 'super' | 'admin' | null
  premium_expires_at: string | null
}

interface CallRequest {
  id: string
  requester_id: string
  admin_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
  requester: { 
    full_name: string | null
    avatar_url: string | null
    premium_type: 'basic' | 'super' | 'admin' | null
  } | null
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<'reports' | 'message-reports' | 'users' | 'announcements' | 'wallpapers' | 'premium' | 'call-requests'>('reports')
  const [reports, setReports] = useState<Report[]>([])
  const [messageReports, setMessageReports] = useState<MessageReport[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
  const [premiumUsers, setPremiumUsers] = useState<PremiumUser[]>([])
  const [currentUserPremium, setCurrentUserPremium] = useState<PremiumUser | null>(null)
  const [callRequests, setCallRequests] = useState<CallRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessageReport, setSelectedMessageReport] = useState<MessageReport | null>(null)
  
  // Announcement form state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementContent, setAnnouncementContent] = useState('')
  const [announcementImageUrl, setAnnouncementImageUrl] = useState<string | null>(null)
  const [announcementHighlighted, setAnnouncementHighlighted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Wallpaper form state
  const [showWallpaperForm, setShowWallpaperForm] = useState(false)
  const [wallpaperName, setWallpaperName] = useState('')
  const [wallpaperImageUrl, setWallpaperImageUrl] = useState<string | null>(null)
  const [uploadingWallpaper, setUploadingWallpaper] = useState(false)
  const [savingWallpaper, setSavingWallpaper] = useState(false)

  // Grant Admin Premium modal state
  const [showGrantAdminModal, setShowGrantAdminModal] = useState(false)
  const [selectedUserForAdmin, setSelectedUserForAdmin] = useState<User | null>(null)
  const [grantingAdmin, setGrantingAdmin] = useState(false)

  // Moderation modal states
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showBanModal, setShowBanModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUserForModeration, setSelectedUserForModeration] = useState<User | null>(null)
  const [suspensionDuration, setSuspensionDuration] = useState<string>('1d')
  const [moderationReason, setModerationReason] = useState('')
  const [processingModeration, setProcessingModeration] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const checkAdmin = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    // ONLY yasmanthvemala007@gmail.com can access admin panel
    const adminEmails = ['yasmanthvemala007@gmail.com']
    
    if (adminEmails.includes(user.email || '')) {
      setIsAdmin(true)
      // Ensure admin role is set in roles table
      await supabase
        .from('roles')
        .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id' })
    } else {
      // Non-admin email - deny access regardless of roles table
      setIsAdmin(false)
    }
  }, [supabase, router])

  const loadReports = useCallback(async () => {
    const { data: reportsData, error } = await supabase
      .from('reports')
      .select('id, reason, status, created_at, reporter_id, reported_user_id')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading reports:', error.message, error.code, error.details)
      return
    }

    if (reportsData && reportsData.length > 0) {
      // Fetch reporter and reported user names
      const reporterIds = [...new Set(reportsData.map(r => r.reporter_id).filter((id): id is string => id !== null))]
      const reportedIds = [...new Set(reportsData.map(r => r.reported_user_id).filter((id): id is string => id !== null))]
      const allIds = [...new Set([...reporterIds, ...reportedIds])]

      let profilesMap: Record<string, { full_name: string | null }> = {}
      if (allIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', allIds)
        
        if (profiles) {
          profilesMap = Object.fromEntries(profiles.map(p => [p.id, { full_name: p.full_name }]))
        }
      }

      const reportsWithNames: Report[] = reportsData.map(r => ({
        id: r.id,
        reason: r.reason,
        description: null,
        status: r.status,
        created_at: r.created_at,
        reporter: r.reporter_id ? profilesMap[r.reporter_id] || null : null,
        reported_user: r.reported_user_id ? profilesMap[r.reported_user_id] || null : null
      }))

      setReports(reportsWithNames)
    } else {
      setReports([])
    }
  }, [supabase])

  const loadUsers = useCallback(async () => {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, is_premium, premium_type')
      .eq('is_profile_complete', true)

    if (profilesData) {
      const userIds = profilesData.map(p => p.id)
      const { data: rolesData } = await supabase
        .from('roles')
        .select('user_id, role')
        .in('user_id', userIds)

      const rolesMap = Object.fromEntries((rolesData || []).map(r => [r.user_id, r.role]))

      const usersWithRoles: User[] = profilesData.map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: '',
        role: rolesMap[p.id] || 'user',
        is_premium: p.is_premium || false,
        premium_type: p.premium_type as 'basic' | 'super' | 'admin' | null,
        avatar_url: p.avatar_url,
        // Moderation fields - default to false until migration is run
        deleted: false,
        is_suspended: false,
        suspension_end_date: null,
        suspension_reason: null,
        is_banned: false,
        ban_reason: null
      }))

      setUsers(usersWithRoles)
    }
  }, [supabase])

  const loadAnnouncements = useCallback(async () => {
    const { data } = await supabase
      .from('announcements')
      .select('id, title, content, image_url, is_highlighted, created_at')
      .is('group_id', null)
      .order('created_at', { ascending: false })

    if (data) {
      setAnnouncements(data)
    }
  }, [supabase])

  const loadWallpapers = useCallback(async () => {
    const { data } = await supabase
      .from('wallpapers')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setWallpapers(data)
    }
  }, [supabase])

  const loadPremiumUsers = useCallback(async () => {
    // Get current admin's premium status
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, is_premium, premium_type, premium_expires_at')
        .eq('id', user.id)
        .single()
      
      if (adminProfile) {
        setCurrentUserPremium({
          id: adminProfile.id,
          full_name: adminProfile.full_name,
          avatar_url: adminProfile.avatar_url,
          is_premium: adminProfile.is_premium || false,
          premium_type: adminProfile.premium_type as 'basic' | 'super' | 'admin' | null,
          premium_expires_at: adminProfile.premium_expires_at
        })
      }
    }

    // Get all premium users
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, is_premium, premium_type, premium_expires_at')
      .eq('is_premium', true)
      .order('premium_type', { ascending: false })

    if (data) {
      // Sort: admin > super > basic
      const sortedPremium = data.sort((a, b) => {
        const priority: Record<string, number> = { admin: 3, super: 2, basic: 1 }
        return (priority[b.premium_type || ''] || 0) - (priority[a.premium_type || ''] || 0)
      })
      
      setPremiumUsers(sortedPremium.map(p => ({
        id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        is_premium: p.is_premium || false,
        premium_type: p.premium_type as 'basic' | 'super' | 'admin' | null,
        premium_expires_at: p.premium_expires_at
      })))
    }
  }, [supabase])

  const loadCallRequests = useCallback(async () => {
    try {
      const { data: requestsData, error } = await supabase
        .from('call_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        // Table might not exist yet
        if (error.code === '42P01') {
          console.warn('call_requests table not found. Run the SQL migration.')
          setCallRequests([])
          return
        }
        console.error('Error loading call requests:', error)
        return
      }

      if (requestsData && requestsData.length > 0) {
        // Get requester profiles
        const requesterIds = [...new Set(requestsData.map(r => r.requester_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, premium_type')
          .in('id', requesterIds)

        const profilesMap = new Map(
          (profiles || []).map(p => [p.id, { 
            full_name: p.full_name, 
            avatar_url: p.avatar_url,
            premium_type: p.premium_type as 'basic' | 'super' | 'admin' | null
          }])
        )

        const requestsWithProfiles: CallRequest[] = requestsData.map(r => ({
          id: r.id,
          requester_id: r.requester_id,
          admin_id: r.admin_id,
          status: r.status,
          created_at: r.created_at,
          updated_at: r.updated_at,
          requester: profilesMap.get(r.requester_id) || null
        }))

        setCallRequests(requestsWithProfiles)
      } else {
        setCallRequests([])
      }
    } catch (error) {
      console.error('Error loading call requests:', error)
      setCallRequests([])
    }
  }, [supabase])

  const loadMessageReports = useCallback(async () => {
    try {
      const { data: reportsData, error } = await supabase
        .from('message_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        // Table might not exist yet
        if (error.code === '42P01') {
          console.warn('message_reports table not found. Run the SQL migration.')
          setMessageReports([])
          return
        }
        console.error('Error loading message reports:', error)
        return
      }

      if (reportsData && reportsData.length > 0) {
        // Get all unique IDs
        const reporterIds = [...new Set(reportsData.map(r => r.reporter_id))]
        const messageIds = [...new Set(reportsData.map(r => r.message_id))]

        // Fetch reporter profiles
        const { data: reporterProfiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', reporterIds)

        const reporterMap = new Map(
          (reporterProfiles || []).map(p => [p.id, { id: p.id, full_name: p.full_name }])
        )

        // Fetch messages with their senders and groups
        const { data: messagesData } = await supabase
          .from('messages')
          .select('id, content, sender_id, group_id')
          .in('id', messageIds)

        // Get sender IDs and group IDs from messages
        const senderIds = [...new Set((messagesData || []).map(m => m.sender_id))]
        const groupIds = [...new Set((messagesData || []).map(m => m.group_id))]

        // Fetch sender profiles
        const { data: senderProfiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', senderIds)

        const senderMap = new Map(
          (senderProfiles || []).map(p => [p.id, p.full_name])
        )

        // Fetch group names
        const { data: groupsData } = await supabase
          .from('groups')
          .select('id, name')
          .in('id', groupIds)

        const groupMap = new Map(
          (groupsData || []).map(g => [g.id, g.name])
        )

        // Create messages map
        const messagesMap = new Map(
          (messagesData || []).map(m => [m.id, {
            content: m.content,
            sender_id: m.sender_id,
            sender_name: senderMap.get(m.sender_id) || null,
            group_id: m.group_id,
            group_name: groupMap.get(m.group_id) || null
          }])
        )

        // Build the final message reports with all related data
        const messageReportsWithData: MessageReport[] = reportsData.map(r => ({
          id: r.id,
          message_id: r.message_id,
          reason: r.reason,
          description: r.description,
          status: r.status,
          created_at: r.created_at,
          reporter: reporterMap.get(r.reporter_id) || null,
          message: messagesMap.get(r.message_id) || null
        }))

        setMessageReports(messageReportsWithData)
      } else {
        setMessageReports([])
      }
    } catch (error) {
      console.error('Error loading message reports:', error)
      setMessageReports([])
    }
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      await checkAdmin()
      setLoading(false)
    }
    init()
  }, [checkAdmin])

  useEffect(() => {
    if (isAdmin) {
      loadReports()
      loadMessageReports()
      loadUsers()
      loadAnnouncements()
      loadWallpapers()
      loadPremiumUsers()
      loadCallRequests()
    }
  }, [isAdmin, loadReports, loadMessageReports, loadUsers, loadAnnouncements, loadWallpapers, loadPremiumUsers, loadCallRequests])

  const updateReportStatus = async (reportId: string, status: 'pending' | 'reviewed' | 'resolved' | 'dismissed') => {
    await supabase
      .from('reports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reportId)
    
    loadReports()
  }

  const updateMessageReportStatus = async (reportId: string, status: 'pending' | 'reviewed' | 'resolved' | 'dismissed') => {
    await supabase
      .from('message_reports')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', reportId)
    
    setSelectedMessageReport(null)
    loadMessageReports()
  }

  const deleteReportedMessage = async (messageId: string, reportId: string) => {
    // Mark the message as deleted
    await supabase
      .from('messages')
      .update({ is_deleted: true })
      .eq('id', messageId)
    
    // Update the report status to resolved
    await updateMessageReportStatus(reportId, 'resolved')
  }

  const updateUserRole = async (userId: string, role: 'user' | 'admin' | 'moderator') => {
    await supabase
      .from('roles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id' })
    
    loadUsers()
  }

  const updateCallRequestStatus = async (requestId: string, status: 'accepted' | 'declined') => {
    await supabase
      .from('call_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId)
    
    loadCallRequests()
  }

  const grantAdminPremium = async (userId: string) => {
    setGrantingAdmin(true)
    try {
      // Calculate expiry date (50 days from now)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 50)

      // Update user's premium status
      const { error } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          premium_type: 'admin',
          premium_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Also set their role to admin
      await supabase
        .from('roles')
        .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' })

      // Reload data
      loadUsers()
      loadPremiumUsers()
      setShowGrantAdminModal(false)
      setSelectedUserForAdmin(null)
      alert('Admin Premium granted successfully!')
    } catch (error) {
      console.error('Error granting admin premium:', error)
      alert('Failed to grant admin premium')
    } finally {
      setGrantingAdmin(false)
    }
  }

  const revokeAdminPremium = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke admin premium from this user?')) return

    try {
      // Remove premium status
      const { error } = await supabase
        .from('profiles')
        .update({
          is_premium: false,
          premium_type: null,
          premium_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Reset role to user
      await supabase
        .from('roles')
        .upsert({ user_id: userId, role: 'user' }, { onConflict: 'user_id' })

      // Reload data
      loadUsers()
      loadPremiumUsers()
      alert('Admin Premium revoked successfully!')
    } catch (error) {
      console.error('Error revoking admin premium:', error)
      alert('Failed to revoke admin premium')
    }
  }

  // Moderation functions
  const calculateSuspensionEndDate = (duration: string): string => {
    const now = new Date()
    switch (duration) {
      case '1d':
        now.setDate(now.getDate() + 1)
        break
      case '3d':
        now.setDate(now.getDate() + 3)
        break
      case '7d':
        now.setDate(now.getDate() + 7)
        break
      case '14d':
        now.setDate(now.getDate() + 14)
        break
      case '30d':
        now.setDate(now.getDate() + 30)
        break
      default:
        now.setDate(now.getDate() + 1)
    }
    return now.toISOString()
  }

  const handleSuspendUser = async () => {
    if (!selectedUserForModeration || !moderationReason.trim()) return

    setProcessingModeration(true)
    try {
      const endDate = calculateSuspensionEndDate(suspensionDuration)
      
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspension_end_date: endDate,
          suspension_reason: moderationReason.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUserForModeration.id)

      if (error) throw error

      setShowSuspendModal(false)
      setSelectedUserForModeration(null)
      setModerationReason('')
      setSuspensionDuration('1d')
      loadUsers()
      alert('User suspended successfully!')
    } catch (error) {
      console.error('Error suspending user:', error)
      alert('Failed to suspend user')
    } finally {
      setProcessingModeration(false)
    }
  }

  const handleUnsuspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to unsuspend this user?')) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspension_end_date: null,
          suspension_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      loadUsers()
      alert('User unsuspended successfully!')
    } catch (error) {
      console.error('Error unsuspending user:', error)
      alert('Failed to unsuspend user')
    }
  }

  const handleBanUser = async () => {
    if (!selectedUserForModeration || !moderationReason.trim()) return

    setProcessingModeration(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          ban_reason: moderationReason.trim(),
          // Clear any suspension when banning
          is_suspended: false,
          suspension_end_date: null,
          suspension_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUserForModeration.id)

      if (error) throw error

      setShowBanModal(false)
      setSelectedUserForModeration(null)
      setModerationReason('')
      loadUsers()
      alert('User banned successfully!')
    } catch (error) {
      console.error('Error banning user:', error)
      alert('Failed to ban user')
    } finally {
      setProcessingModeration(false)
    }
  }

  const handleUnbanUser = async (userId: string) => {
    if (!confirm('Are you sure you want to unban this user?')) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          ban_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      loadUsers()
      alert('User unbanned successfully!')
    } catch (error) {
      console.error('Error unbanning user:', error)
      alert('Failed to unban user')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUserForModeration) return

    setProcessingModeration(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUserForModeration.id)

      if (error) throw error

      setShowDeleteModal(false)
      setSelectedUserForModeration(null)
      loadUsers()
      alert('User marked as deleted!')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    } finally {
      setProcessingModeration(false)
    }
  }

  const handleRestoreUser = async (userId: string) => {
    if (!confirm('Are you sure you want to restore this user?')) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          deleted: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      loadUsers()
      alert('User restored successfully!')
    } catch (error) {
      console.error('Error restoring user:', error)
      alert('Failed to restore user')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      
      if (!e.target.files || e.target.files.length === 0) return

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `announcements/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAnnouncementImageUrl(publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setUploading(false)
    }
  }

  const openNewAnnouncementForm = () => {
    setEditingAnnouncement(null)
    setAnnouncementTitle('')
    setAnnouncementContent('')
    setAnnouncementImageUrl(null)
    setAnnouncementHighlighted(false)
    setShowAnnouncementForm(true)
  }

  const openEditAnnouncementForm = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setAnnouncementTitle(announcement.title)
    setAnnouncementContent(announcement.content)
    setAnnouncementImageUrl(announcement.image_url)
    setAnnouncementHighlighted(announcement.is_highlighted)
    setShowAnnouncementForm(true)
  }

  const closeAnnouncementForm = () => {
    setShowAnnouncementForm(false)
    setEditingAnnouncement(null)
    setAnnouncementTitle('')
    setAnnouncementContent('')
    setAnnouncementImageUrl(null)
    setAnnouncementHighlighted(false)
  }

  const saveAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) return

    setSaving(true)
    
    try {
      if (editingAnnouncement) {
        // Update existing announcement
        const { error } = await supabase
          .from('announcements')
          .update({
            title: announcementTitle.trim(),
            content: announcementContent.trim(),
            image_url: announcementImageUrl,
            is_highlighted: announcementHighlighted,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAnnouncement.id)
        
        if (error) {
          console.error('Error updating announcement:', error)
          alert('Failed to update announcement: ' + error.message)
          return
        }
      } else {
        // Create new announcement
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
          .from('announcements')
          .insert({
            title: announcementTitle.trim(),
            content: announcementContent.trim(),
            image_url: announcementImageUrl,
            is_highlighted: announcementHighlighted,
            created_by: user.id
          })
        
        if (error) {
          console.error('Error creating announcement:', error)
          alert('Failed to create announcement: ' + error.message)
          return
        }
      }

      closeAnnouncementForm()
      loadAnnouncements()
    } catch (error) {
      console.error('Error saving announcement:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    
    await supabase.from('announcements').delete().eq('id', id)
    loadAnnouncements()
  }

  // Wallpaper functions
  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingWallpaper(true)
      
      if (!e.target.files || e.target.files.length === 0) return

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `wallpapers/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setWallpaperImageUrl(publicUrl)
    } catch (error) {
      console.error('Error uploading wallpaper:', error)
      alert('Failed to upload wallpaper')
    } finally {
      setUploadingWallpaper(false)
    }
  }

  const openWallpaperForm = () => {
    setWallpaperName('')
    setWallpaperImageUrl(null)
    setShowWallpaperForm(true)
  }

  const closeWallpaperForm = () => {
    setShowWallpaperForm(false)
    setWallpaperName('')
    setWallpaperImageUrl(null)
  }

  const saveWallpaper = async () => {
    if (!wallpaperName.trim() || !wallpaperImageUrl) return

    setSavingWallpaper(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('wallpapers')
        .insert({
          name: wallpaperName.trim(),
          image_url: wallpaperImageUrl,
          is_default: false,
          is_active: true,
          created_by: user.id
        })
      
      if (error) {
        console.error('Error creating wallpaper:', error)
        alert('Failed to create wallpaper: ' + error.message)
        return
      }

      closeWallpaperForm()
      loadWallpapers()
    } catch (error) {
      console.error('Error saving wallpaper:', error)
    } finally {
      setSavingWallpaper(false)
    }
  }

  const toggleWallpaperActive = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('wallpapers')
      .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    loadWallpapers()
  }

  const deleteWallpaper = async (id: string) => {
    if (!confirm('Are you sure you want to delete this wallpaper?')) return
    
    await supabase.from('wallpapers').delete().eq('id', id)
    loadWallpapers()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <Shield className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 text-center mb-4">You don&apos;t have permission to access this page.</p>
        <button
          onClick={() => router.push('/home')}
          className="bg-indigo-500 text-white px-6 py-2 rounded-xl"
        >
          Go Home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-gray-800/50">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center lg:hidden"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 min-w-[70px] py-3 text-xs font-medium transition-colors ${
              activeTab === 'reports' 
                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-gray-500'
            }`}
          >
            <Flag className="w-4 h-4 mx-auto mb-1" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('message-reports')}
            className={`flex-1 min-w-[70px] py-3 text-xs font-medium transition-colors relative ${
              activeTab === 'message-reports' 
                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-gray-500'
            }`}
          >
            <MessageSquare className="w-4 h-4 mx-auto mb-1" />
            Messages
            {messageReports.filter(r => r.status === 'pending').length > 0 && (
              <span className="absolute top-1 right-1/4 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 min-w-[70px] py-3 text-xs font-medium transition-colors ${
              activeTab === 'users' 
                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-gray-500'
            }`}
          >
            <Users className="w-4 h-4 mx-auto mb-1" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 min-w-[70px] py-3 text-xs font-medium transition-colors ${
              activeTab === 'announcements' 
                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-gray-500'
            }`}
          >
            <Megaphone className="w-4 h-4 mx-auto mb-1" />
            Announce
          </button>
          <button
            onClick={() => setActiveTab('wallpapers')}
            className={`flex-1 min-w-[70px] py-3 text-xs font-medium transition-colors ${
              activeTab === 'wallpapers' 
                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-gray-500'
            }`}
          >
            <ImageIcon className="w-4 h-4 mx-auto mb-1" />
            Walls
          </button>
          <button
            onClick={() => setActiveTab('premium')}
            className={`flex-1 min-w-[70px] py-3 text-xs font-medium transition-colors ${
              activeTab === 'premium' 
                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-gray-500'
            }`}
          >
            <Crown className="w-4 h-4 mx-auto mb-1" />
            Premium
          </button>
          <button
            onClick={() => setActiveTab('call-requests')}
            className={`flex-1 min-w-[70px] py-3 text-xs font-medium transition-colors relative ${
              activeTab === 'call-requests' 
                ? 'text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-gray-500'
            }`}
          >
            <Phone className="w-4 h-4 mx-auto mb-1" />
            Calls
            {callRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="absolute top-1 right-1/4 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <Flag className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">No reports yet</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">{report.reason}</p>
                      <p className="text-gray-500 text-sm">
                        {report.reporter?.full_name || 'Unknown'} reported {report.reported_user?.full_name || 'Unknown'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  {report.description && (
                    <p className="text-gray-400 text-sm mb-3">{report.description}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateReportStatus(report.id, 'resolved')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm"
                    >
                      <Check className="w-4 h-4" />
                      Resolve
                    </button>
                    <button
                      onClick={() => updateReportStatus(report.id, 'dismissed')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded-lg text-sm"
                    >
                      <X className="w-4 h-4" />
                      Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Message Reports Tab */}
        {activeTab === 'message-reports' && (
          <div className="space-y-3">
            {messageReports.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">No message reports yet</p>
                <p className="text-gray-600 text-sm mt-1">Reported messages will appear here</p>
              </div>
            ) : (
              messageReports.map((report) => (
                <div key={report.id} className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          report.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          report.status === 'reviewed' ? 'bg-blue-500/20 text-blue-400' :
                          report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {report.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-indigo-400 font-medium text-sm">{report.reason}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Reported by {report.reporter?.full_name || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Reported Message Preview */}
                  {report.message && (
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400">Message from</span>
                        <span className="text-xs text-white font-medium">{report.message.sender_name || 'Unknown'}</span>
                        <span className="text-xs text-gray-600">in</span>
                        <span className="text-xs text-indigo-400">{report.message.group_name || 'Unknown Group'}</span>
                      </div>
                      <p className="text-gray-300 text-sm bg-gray-900/50 rounded-lg p-2 border-l-2 border-red-500/50">
                        {report.message.content || '[No content]'}
                      </p>
                    </div>
                  )}

                  {report.description && (
                    <p className="text-gray-400 text-sm mb-3 italic">&quot;{report.description}&quot;</p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedMessageReport(report)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateMessageReportStatus(report.id, 'reviewed')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm"
                        >
                          <Check className="w-4 h-4" />
                          Mark Reviewed
                        </button>
                        <button
                          onClick={() => {
                            if (report.message && confirm('Delete this message for everyone?')) {
                              deleteReportedMessage(report.message_id, report.id)
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Message
                        </button>
                      </>
                    )}
                    {report.status !== 'resolved' && report.status !== 'dismissed' && (
                      <>
                        <button
                          onClick={() => updateMessageReportStatus(report.id, 'resolved')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm"
                        >
                          <Check className="w-4 h-4" />
                          Resolve
                        </button>
                        <button
                          onClick={() => updateMessageReportStatus(report.id, 'dismissed')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded-lg text-sm"
                        >
                          <X className="w-4 h-4" />
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            {/* Search hint */}
            <p className="text-gray-500 text-sm mb-2">
              {users.length} users total • Manage user roles, premium status and moderation
            </p>
            
            {users.map((user) => (
              <div key={user.id} className={`rounded-2xl p-4 border ${
                user.deleted
                  ? 'bg-gray-800/50 border-gray-700/50 opacity-60'
                  : user.is_banned
                    ? 'bg-red-500/10 border-red-500/30'
                    : user.is_suspended
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : user.premium_type === 'admin'
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : user.premium_type === 'super'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : user.premium_type === 'basic'
                            ? 'bg-blue-500/10 border-blue-500/30'
                            : 'bg-gray-900/50 border-gray-800/50'
              }`}>
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ${
                    user.premium_type === 'admin'
                      ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-black'
                      : user.premium_type === 'super'
                        ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-black'
                        : user.premium_type === 'basic'
                          ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black'
                          : ''
                  }`}>
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt=""
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-400 font-semibold">
                          {user.full_name?.[0] || '?'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium truncate">{user.full_name || 'Anonymous'}</p>
                      {user.is_premium && (
                        <Crown className={`w-4 h-4 flex-shrink-0 ${
                          user.premium_type === 'admin'
                            ? 'text-purple-400'
                            : user.premium_type === 'super'
                              ? 'text-amber-400'
                              : 'text-blue-400'
                        }`} />
                      )}
                    </div>
                    
                    {/* Status badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={`text-xs ${
                        user.role === 'admin' ? 'text-indigo-400' :
                        user.role === 'moderator' ? 'text-yellow-400' :
                        'text-gray-500'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                      
                      {user.is_premium && (
                        <>
                          <span className="text-gray-600">•</span>
                          <span className={`text-xs ${
                            user.premium_type === 'admin'
                              ? 'text-purple-400'
                              : user.premium_type === 'super'
                                ? 'text-amber-400'
                                : 'text-blue-400'
                          }`}>
                            {user.premium_type === 'admin' ? 'Admin Premium' :
                             user.premium_type === 'super' ? 'Super Supporter' : 'Basic Premium'}
                          </span>
                        </>
                      )}
                      
                      {/* Moderation status badges */}
                      {user.deleted && (
                        <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full text-xs">
                          Deleted
                        </span>
                      )}
                      {user.is_banned && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
                          Banned
                        </span>
                      )}
                      {user.is_suspended && (
                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                          Suspended until {new Date(user.suspension_end_date!).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {/* Show reason if suspended or banned */}
                    {(user.suspension_reason || user.ban_reason) && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        Reason: {user.suspension_reason || user.ban_reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-800/50">
                  {/* Grant/Revoke Admin */}
                  {user.premium_type === 'admin' ? (
                    <button
                      onClick={() => revokeAdminPremium(user.id)}
                      className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium"
                    >
                      Revoke Admin
                    </button>
                  ) : !user.deleted && !user.is_banned && (
                    <button
                      onClick={() => {
                        setSelectedUserForAdmin(user)
                        setShowGrantAdminModal(true)
                      }}
                      className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium"
                    >
                      Grant Admin
                    </button>
                  )}
                  
                  {/* Role selector */}
                  {!user.deleted && (
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as 'user' | 'admin' | 'moderator')}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Mod</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                  
                  {/* Moderation actions - don't show for admin premium users */}
                  {user.premium_type !== 'admin' && (
                    <>
                      {/* Suspend/Unsuspend */}
                      {user.is_suspended ? (
                        <button
                          onClick={() => handleUnsuspendUser(user.id)}
                          className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium"
                        >
                          Unsuspend
                        </button>
                      ) : !user.is_banned && !user.deleted && (
                        <button
                          onClick={() => {
                            setSelectedUserForModeration(user)
                            setShowSuspendModal(true)
                          }}
                          className="px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-xs font-medium"
                        >
                          Suspend
                        </button>
                      )}
                      
                      {/* Ban/Unban */}
                      {user.is_banned ? (
                        <button
                          onClick={() => handleUnbanUser(user.id)}
                          className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium"
                        >
                          Unban
                        </button>
                      ) : !user.deleted && (
                        <button
                          onClick={() => {
                            setSelectedUserForModeration(user)
                            setShowBanModal(true)
                          }}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium"
                        >
                          Ban
                        </button>
                      )}
                      
                      {/* Delete/Restore */}
                      {user.deleted ? (
                        <button
                          onClick={() => handleRestoreUser(user.id)}
                          className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedUserForModeration(user)
                            setShowDeleteModal(true)
                          }}
                          className="px-3 py-1.5 bg-gray-500/20 text-gray-400 rounded-lg text-xs font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-3">
            {/* New Announcement Button */}
            <button
              onClick={openNewAnnouncementForm}
              className="w-full bg-indigo-500/20 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-center gap-2 text-indigo-400"
            >
              <Plus className="w-5 h-5" />
              New Announcement
            </button>

            {/* Announcement Form Modal */}
            {showAnnouncementForm && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-bold text-white mb-4">
                    {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
                  </h3>

                  {/* Image Upload */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Thumbnail Image (Optional)
                    </label>
                    {announcementImageUrl ? (
                      <div className="relative rounded-xl overflow-hidden mb-2">
                        <Image
                          src={announcementImageUrl}
                          alt="Thumbnail"
                          width={400}
                          height={200}
                          className="w-full h-48 object-cover"
                        />
                        <button
                          onClick={() => setAnnouncementImageUrl(null)}
                          className="absolute top-2 right-2 bg-black/50 p-2 rounded-full"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-gray-600 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        {uploading ? (
                          <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-500 mb-2" />
                            <span className="text-gray-500 text-sm">Click to upload image</span>
                          </>
                        )}
                      </label>
                    )}
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="Announcement title"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500"
                    />
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Content
                    </label>
                    <textarea
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      placeholder="Write your announcement..."
                      rows={4}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 resize-none"
                    />
                  </div>

                  {/* Highlighted */}
                  <label className="flex items-center gap-3 mb-6 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announcementHighlighted}
                      onChange={(e) => setAnnouncementHighlighted(e.target.checked)}
                      className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-gray-300">Highlight this announcement</span>
                  </label>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={closeAnnouncementForm}
                      className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveAnnouncement}
                      disabled={saving || !announcementTitle.trim() || !announcementContent.trim()}
                      className="flex-1 bg-indigo-500 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          {editingAnnouncement ? 'Save Changes' : 'Post'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Announcements List */}
            {announcements.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">No announcements yet</p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <div 
                  key={announcement.id} 
                  className={`bg-gray-900/50 border rounded-2xl overflow-hidden ${
                    announcement.is_highlighted ? 'border-indigo-500/50' : 'border-gray-800/50'
                  }`}
                >
                  {announcement.image_url && (
                    <div className="relative h-40 w-full">
                      <Image
                        src={announcement.image_url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-medium">{announcement.title}</h4>
                          {announcement.is_highlighted && (
                            <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                              Highlighted
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{announcement.content}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800/50">
                      <span className="text-gray-600 text-xs">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditAnnouncementForm(announcement)}
                          className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteAnnouncement(announcement.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Wallpapers Tab */}
        {activeTab === 'wallpapers' && (
          <div className="space-y-3">
            {/* New Wallpaper Button */}
            <button
              onClick={openWallpaperForm}
              className="w-full bg-indigo-500/20 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-center gap-2 text-indigo-400"
            >
              <Plus className="w-5 h-5" />
              Add Wallpaper
            </button>

            {/* Wallpaper Form Modal */}
            {showWallpaperForm && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-bold text-white mb-4">Add Wallpaper</h3>

                  {/* Wallpaper Image Upload */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Wallpaper Image
                    </label>
                    {wallpaperImageUrl ? (
                      <div className="relative rounded-xl overflow-hidden mb-2">
                        <Image
                          src={wallpaperImageUrl}
                          alt="Wallpaper preview"
                          width={400}
                          height={300}
                          className="w-full h-64 object-cover"
                          unoptimized
                        />
                        <button
                          onClick={() => setWallpaperImageUrl(null)}
                          className="absolute top-2 right-2 bg-black/50 p-2 rounded-full"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-gray-600 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleWallpaperUpload}
                          className="hidden"
                          disabled={uploadingWallpaper}
                        />
                        {uploadingWallpaper ? (
                          <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-500 mb-2" />
                            <span className="text-gray-500 text-sm">Click to upload wallpaper</span>
                            <span className="text-gray-600 text-xs mt-1">Recommended: 1080x1920 or similar</span>
                          </>
                        )}
                      </label>
                    )}
                  </div>

                  {/* Wallpaper Name */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Wallpaper Name
                    </label>
                    <input
                      type="text"
                      value={wallpaperName}
                      onChange={(e) => setWallpaperName(e.target.value)}
                      placeholder="e.g., Night Sky, Abstract Dark"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={closeWallpaperForm}
                      className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveWallpaper}
                      disabled={savingWallpaper || !wallpaperName.trim() || !wallpaperImageUrl}
                      className="flex-1 bg-indigo-500 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {savingWallpaper ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Add Wallpaper
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Wallpapers Grid */}
            {wallpapers.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">No wallpapers yet</p>
                <p className="text-gray-600 text-sm mt-1">Add wallpapers for users to customize their chat</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {wallpapers.map((wallpaper) => (
                  <div 
                    key={wallpaper.id} 
                    className={`relative rounded-2xl overflow-hidden border-2 ${
                      wallpaper.is_active ? 'border-gray-800' : 'border-red-500/50 opacity-50'
                    }`}
                  >
                    <div className="relative h-40">
                      <Image
                        src={wallpaper.image_url}
                        alt={wallpaper.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Status badge */}
                      {wallpaper.is_default && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-500/80 rounded-full">
                          <span className="text-white text-xs font-medium">Default</span>
                        </div>
                      )}
                      {!wallpaper.is_active && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500/80 rounded-full">
                          <span className="text-white text-xs font-medium">Disabled</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Info & Actions */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-medium text-sm truncate mb-2">{wallpaper.name}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleWallpaperActive(wallpaper.id, wallpaper.is_active)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                            wallpaper.is_active 
                              ? 'bg-gray-800/80 text-gray-300' 
                              : 'bg-green-500/80 text-white'
                          }`}
                        >
                          {wallpaper.is_active ? 'Disable' : 'Enable'}
                        </button>
                        {!wallpaper.is_default && (
                          <button
                            onClick={() => deleteWallpaper(wallpaper.id)}
                            className="p-1.5 bg-red-500/80 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Premium Users Tab */}
        {activeTab === 'premium' && (
          <div className="space-y-4">
            {/* Admin Premium Status Card */}
            <div className={`rounded-2xl p-4 border ${
              currentUserPremium?.is_premium 
                ? currentUserPremium.premium_type === 'admin'
                  ? 'bg-purple-500/10 border-purple-500/30'
                  : currentUserPremium.premium_type === 'super'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                : 'bg-gray-900/50 border-gray-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  currentUserPremium?.is_premium
                    ? currentUserPremium.premium_type === 'admin'
                      ? 'bg-purple-500/20'
                      : currentUserPremium.premium_type === 'super'
                        ? 'bg-amber-500/20'
                        : 'bg-blue-500/20'
                    : 'bg-gray-800'
                }`}>
                  <Shield className={`w-6 h-6 ${
                    currentUserPremium?.is_premium
                      ? currentUserPremium.premium_type === 'admin'
                        ? 'text-purple-400'
                        : currentUserPremium.premium_type === 'super'
                          ? 'text-amber-400'
                          : 'text-blue-400'
                      : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">Your Premium Status</h3>
                  <p className={`text-sm ${
                    currentUserPremium?.is_premium 
                      ? currentUserPremium.premium_type === 'admin'
                        ? 'text-purple-400'
                        : currentUserPremium.premium_type === 'super'
                          ? 'text-amber-400'
                          : 'text-blue-400'
                      : 'text-gray-500'
                  }`}>
                    {currentUserPremium?.is_premium 
                      ? currentUserPremium.premium_type === 'admin'
                        ? 'Admin Premium'
                        : currentUserPremium.premium_type === 'super'
                          ? 'Super Supporter'
                          : 'Basic Premium'
                      : 'Not a Premium User'}
                  </p>
                </div>
                {currentUserPremium?.is_premium && (
                  <Crown className={`w-6 h-6 ${
                    currentUserPremium.premium_type === 'admin'
                      ? 'text-purple-400'
                      : currentUserPremium.premium_type === 'super'
                        ? 'text-amber-400'
                        : 'text-blue-400'
                  }`} />
                )}
              </div>
              {currentUserPremium?.is_premium && currentUserPremium.premium_expires_at && (
                <p className="text-gray-500 text-xs mt-2">
                  Expires: {new Date(currentUserPremium.premium_expires_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
              )}
            </div>

            {/* Premium Users List */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                All Premium Users ({premiumUsers.length})
              </h3>
              
              {premiumUsers.length === 0 ? (
                <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-gray-800">
                  <Crown className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500">No premium users yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {premiumUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 rounded-2xl border flex items-center gap-3 ${
                        user.premium_type === 'admin'
                          ? 'bg-purple-500/10 border-purple-500/30'
                          : user.premium_type === 'super'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-blue-500/10 border-blue-500/30'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-black flex-shrink-0 ${
                        user.premium_type === 'admin'
                          ? 'ring-purple-500'
                          : user.premium_type === 'super'
                            ? 'ring-amber-500'
                            : 'ring-blue-500'
                      }`}>
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt=""
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <span className="text-gray-400 font-semibold">
                              {user.full_name?.[0] || '?'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-medium truncate">{user.full_name || 'Unknown'}</h4>
                          <Crown className={`w-4 h-4 flex-shrink-0 ${
                            user.premium_type === 'admin'
                              ? 'text-purple-400'
                              : user.premium_type === 'super'
                                ? 'text-amber-400'
                                : 'text-blue-400'
                          }`} />
                        </div>
                        <p className={`text-sm ${
                          user.premium_type === 'admin'
                            ? 'text-purple-400'
                            : user.premium_type === 'super'
                              ? 'text-amber-400'
                              : 'text-blue-400'
                        }`}>
                          {user.premium_type === 'admin' ? 'Admin Premium' : 
                           user.premium_type === 'super' ? 'Super Supporter' : 'Basic Premium'}
                        </p>
                        {user.premium_expires_at && (
                          <p className="text-gray-500 text-xs mt-0.5">
                            Expires: {new Date(user.premium_expires_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </p>
                        )}
                      </div>

                      {/* Badge */}
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.premium_type === 'admin'
                          ? 'bg-purple-500/20 text-purple-400'
                          : user.premium_type === 'super'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        ₹{user.premium_type === 'admin' ? '500' : user.premium_type === 'super' ? '200' : '100'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Call Requests Tab */}
        {activeTab === 'call-requests' && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {callRequests.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-xs text-yellow-400/70">Pending</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-400">
                  {callRequests.filter(r => r.status === 'accepted').length}
                </p>
                <p className="text-xs text-green-400/70">Accepted</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-red-400">
                  {callRequests.filter(r => r.status === 'declined').length}
                </p>
                <p className="text-xs text-red-400/70">Declined</p>
              </div>
            </div>

            {/* Pending Requests */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Phone className="w-5 h-5 text-yellow-400" />
                Pending Call Requests
              </h3>
              
              {callRequests.filter(r => r.status === 'pending').length === 0 ? (
                <div className="text-center py-8 bg-gray-900/50 rounded-2xl border border-gray-800">
                  <Phone className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No pending call requests</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {callRequests
                    .filter(r => r.status === 'pending')
                    .map((request) => (
                      <div
                        key={request.id}
                        className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4"
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-amber-500 ring-offset-2 ring-offset-black flex-shrink-0">
                            {request.requester?.avatar_url ? (
                              <Image
                                src={request.requester.avatar_url}
                                alt=""
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <span className="text-gray-400 font-semibold">
                                  {request.requester?.full_name?.[0] || '?'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-medium truncate">
                                {request.requester?.full_name || 'Unknown User'}
                              </h4>
                              <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            </div>
                            <p className="text-amber-400 text-sm">Super Supporter</p>
                            <p className="text-gray-500 text-xs mt-0.5">
                              Requested {new Date(request.created_at).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => updateCallRequestStatus(request.id, 'accepted')}
                            className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Accept
                          </button>
                          <button
                            onClick={() => updateCallRequestStatus(request.id, 'declined')}
                            className="flex-1 py-2.5 bg-red-500/20 text-red-400 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Request History */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Flag className="w-5 h-5 text-gray-400" />
                Request History
              </h3>
              
              {callRequests.filter(r => r.status !== 'pending').length === 0 ? (
                <div className="text-center py-8 bg-gray-900/50 rounded-2xl border border-gray-800">
                  <p className="text-gray-500 text-sm">No history yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {callRequests
                    .filter(r => r.status !== 'pending')
                    .map((request) => (
                      <div
                        key={request.id}
                        className={`rounded-2xl p-4 border ${
                          request.status === 'accepted'
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-black flex-shrink-0 ${
                            request.status === 'accepted' ? 'ring-green-500' : 'ring-red-500'
                          }`}>
                            {request.requester?.avatar_url ? (
                              <Image
                                src={request.requester.avatar_url}
                                alt=""
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <span className="text-gray-400 text-sm font-semibold">
                                  {request.requester?.full_name?.[0] || '?'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium truncate text-sm">
                              {request.requester?.full_name || 'Unknown User'}
                            </h4>
                            <p className="text-gray-500 text-xs">
                              {request.status === 'accepted' ? 'Accepted' : 'Declined'} on {new Date(request.updated_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short'
                              })}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            request.status === 'accepted'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {request.status === 'accepted' ? 'Accepted' : 'Declined'}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Message Report Detail Modal */}
      {selectedMessageReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-md rounded-2xl overflow-hidden max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold text-white">Message Report Details</h3>
              <button
                onClick={() => setSelectedMessageReport(null)}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Status */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Status</label>
                <span className={`block mt-1 text-sm px-3 py-1.5 rounded-lg w-fit ${
                  selectedMessageReport.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  selectedMessageReport.status === 'reviewed' ? 'bg-blue-500/20 text-blue-400' :
                  selectedMessageReport.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {selectedMessageReport.status.charAt(0).toUpperCase() + selectedMessageReport.status.slice(1)}
                </span>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Reason</label>
                <p className="text-white mt-1">{selectedMessageReport.reason}</p>
              </div>

              {/* Reporter */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Reported By</label>
                <p className="text-white mt-1">{selectedMessageReport.reporter?.full_name || 'Unknown'}</p>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide">Reported On</label>
                <p className="text-white mt-1">
                  {new Date(selectedMessageReport.created_at).toLocaleString()}
                </p>
              </div>

              {/* Message Details */}
              {selectedMessageReport.message && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Reported Message</label>
                  <div className="mt-2 bg-gray-800 rounded-xl p-3 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-indigo-400 text-sm font-medium">
                        {selectedMessageReport.message.sender_name || 'Unknown'}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {selectedMessageReport.message.group_name || 'Unknown Group'}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {selectedMessageReport.message.content || '[No content]'}
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedMessageReport.description && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Additional Details</label>
                  <p className="text-gray-400 mt-1 italic">&quot;{selectedMessageReport.description}&quot;</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-gray-800 flex-shrink-0 space-y-2">
              {selectedMessageReport.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateMessageReportStatus(selectedMessageReport.id, 'reviewed')}
                    className="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl font-medium text-sm"
                  >
                    Mark as Reviewed
                  </button>
                  <button
                    onClick={() => {
                      if (selectedMessageReport.message && confirm('Delete this message for everyone?')) {
                        deleteReportedMessage(selectedMessageReport.message_id, selectedMessageReport.id)
                      }
                    }}
                    className="py-2.5 px-4 bg-red-500 text-white rounded-xl font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              {selectedMessageReport.status !== 'resolved' && selectedMessageReport.status !== 'dismissed' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateMessageReportStatus(selectedMessageReport.id, 'resolved')}
                    className="flex-1 py-2.5 bg-green-500/20 text-green-400 rounded-xl font-medium text-sm"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => updateMessageReportStatus(selectedMessageReport.id, 'dismissed')}
                    className="flex-1 py-2.5 bg-gray-500/20 text-gray-400 rounded-xl font-medium text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              <button
                onClick={() => setSelectedMessageReport(null)}
                className="w-full py-2.5 bg-gray-800 text-gray-300 rounded-xl font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Admin Premium Modal */}
      {showGrantAdminModal && selectedUserForAdmin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-sm rounded-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Grant Admin Premium</h3>
              <button
                onClick={() => {
                  setShowGrantAdminModal(false)
                  setSelectedUserForAdmin(null)
                }}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {/* User Preview */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900">
                    {selectedUserForAdmin.avatar_url ? (
                      <Image
                        src={selectedUserForAdmin.avatar_url}
                        alt=""
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-400 text-xl font-semibold">
                          {selectedUserForAdmin.full_name?.[0] || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{selectedUserForAdmin.full_name || 'Anonymous'}</p>
                    <p className="text-purple-400 text-sm flex items-center gap-1">
                      <Crown className="w-4 h-4" />
                      Will become Admin Premium
                    </p>
                  </div>
                </div>
              </div>

              {/* What they get */}
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">This user will receive:</p>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-sm text-white">
                    <Check className="w-4 h-4 text-purple-400" />
                    Admin Premium badge (50 days)
                  </li>
                  <li className="flex items-center gap-2 text-sm text-white">
                    <Check className="w-4 h-4 text-purple-400" />
                    Admin role access
                  </li>
                  <li className="flex items-center gap-2 text-sm text-white">
                    <Check className="w-4 h-4 text-purple-400" />
                    Purple diamond profile border
                  </li>
                  <li className="flex items-center gap-2 text-sm text-white">
                    <Check className="w-4 h-4 text-purple-400" />
                    Full messaging access
                  </li>
                </ul>
              </div>

              {/* Warning */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                <p className="text-amber-400 text-xs">
                  ⚠️ This will grant admin-level access. Only do this for trusted users.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-gray-800 flex gap-2">
              <button
                onClick={() => {
                  setShowGrantAdminModal(false)
                  setSelectedUserForAdmin(null)
                }}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => grantAdminPremium(selectedUserForAdmin.id)}
                disabled={grantingAdmin}
                className="flex-1 py-2.5 bg-purple-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {grantingAdmin ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    Grant Admin
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend User Modal */}
      {showSuspendModal && selectedUserForModeration && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-sm rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-orange-400">Suspend User</h3>
              <button
                onClick={() => {
                  setShowSuspendModal(false)
                  setSelectedUserForModeration(null)
                  setModerationReason('')
                  setSuspensionDuration('1d')
                }}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="p-4">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    {selectedUserForModeration.avatar_url ? (
                      <Image
                        src={selectedUserForModeration.avatar_url}
                        alt=""
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-400 font-semibold">
                          {selectedUserForModeration.full_name?.[0] || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{selectedUserForModeration.full_name || 'Anonymous'}</p>
                    <p className="text-orange-400 text-sm">Will be temporarily suspended</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Suspension Duration</label>
                <select
                  value={suspensionDuration}
                  onChange={(e) => setSuspensionDuration(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white"
                >
                  <option value="1d">1 Day</option>
                  <option value="3d">3 Days</option>
                  <option value="7d">7 Days</option>
                  <option value="14d">14 Days</option>
                  <option value="30d">30 Days</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Reason *</label>
                <textarea
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  placeholder="Why is this user being suspended?"
                  className="w-full h-24 bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-500 resize-none"
                />
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                <p className="text-gray-400 text-xs">
                  📝 The user will see this reason and can send ONE appeal message to admin.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 flex gap-2">
              <button
                onClick={() => {
                  setShowSuspendModal(false)
                  setSelectedUserForModeration(null)
                  setModerationReason('')
                }}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendUser}
                disabled={!moderationReason.trim() || processingModeration}
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processingModeration ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Suspend User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {showBanModal && selectedUserForModeration && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-sm rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-400">Ban User</h3>
              <button
                onClick={() => {
                  setShowBanModal(false)
                  setSelectedUserForModeration(null)
                  setModerationReason('')
                }}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="p-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    {selectedUserForModeration.avatar_url ? (
                      <Image
                        src={selectedUserForModeration.avatar_url}
                        alt=""
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-400 font-semibold">
                          {selectedUserForModeration.full_name?.[0] || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{selectedUserForModeration.full_name || 'Anonymous'}</p>
                    <p className="text-red-400 text-sm">Will be permanently banned</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Reason *</label>
                <textarea
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  placeholder="Why is this user being banned?"
                  className="w-full h-24 bg-gray-800 border border-gray-700 rounded-xl p-3 text-white placeholder-gray-500 resize-none"
                />
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-xs">
                  ⚠️ This is a permanent action. The user can only appeal to admin with ONE message. You can manually unban later if needed.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 flex gap-2">
              <button
                onClick={() => {
                  setShowBanModal(false)
                  setSelectedUserForModeration(null)
                  setModerationReason('')
                }}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                disabled={!moderationReason.trim() || processingModeration}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processingModeration ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    Ban User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUserForModeration && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-sm rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-300">Delete User</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedUserForModeration(null)
                }}
                className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="p-4">
              <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden opacity-60">
                    {selectedUserForModeration.avatar_url ? (
                      <Image
                        src={selectedUserForModeration.avatar_url}
                        alt=""
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-400 font-semibold">
                          {selectedUserForModeration.full_name?.[0] || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{selectedUserForModeration.full_name || 'Anonymous'}</p>
                    <p className="text-gray-400 text-sm">Will be marked as deleted</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                <p className="text-gray-400 text-xs">
                  ℹ️ This is a soft delete. User data will be preserved but they will not appear in lists. You can restore them later.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedUserForModeration(null)
                }}
                className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={processingModeration}
                className="flex-1 py-2.5 bg-gray-600 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processingModeration ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
