export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          college_name: string | null
          state: string | null
          district: string | null
          city: string | null
          is_profile_complete: boolean
          is_premium: boolean
          premium_type: 'basic' | 'super' | 'admin' | null
          premium_expires_at: string | null
          // Moderation fields
          deleted: boolean
          is_suspended: boolean
          suspension_end_date: string | null
          suspension_reason: string | null
          is_banned: boolean
          ban_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          college_name?: string | null
          state?: string | null
          district?: string | null
          city?: string | null
          is_profile_complete?: boolean
          is_premium?: boolean
          premium_type?: 'basic' | 'super' | 'admin' | null
          premium_expires_at?: string | null
          // Moderation fields
          deleted?: boolean
          is_suspended?: boolean
          suspension_end_date?: string | null
          suspension_reason?: string | null
          is_banned?: boolean
          ban_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          college_name?: string | null
          state?: string | null
          district?: string | null
          city?: string | null
          is_profile_complete?: boolean
          is_premium?: boolean
          premium_type?: 'basic' | 'super' | 'admin' | null
          premium_expires_at?: string | null
          // Moderation fields
          deleted?: boolean
          is_suspended?: boolean
          suspension_end_date?: string | null
          suspension_reason?: string | null
          is_banned?: boolean
          ban_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      colleges: {
        Row: {
          id: string
          name: string
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          show_in_people_list: boolean
          allow_direct_messages: boolean
          show_location_publicly: boolean
          chat_wallpaper_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          show_in_people_list?: boolean
          allow_direct_messages?: boolean
          show_location_publicly?: boolean
          chat_wallpaper_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          show_in_people_list?: boolean
          allow_direct_messages?: boolean
          show_location_publicly?: boolean
          chat_wallpaper_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'moderator' | 'user'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: 'admin' | 'moderator' | 'user'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'moderator' | 'user'
          created_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          visibility: 'public' | 'private'
          created_by: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          visibility?: 'public' | 'private'
          created_by: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          visibility?: 'public' | 'private'
          created_by?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'admin' | 'member'
          joined_at: string
          last_read_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'admin' | 'member'
          joined_at?: string
          last_read_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          joined_at?: string
          last_read_at?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          image_url: string | null
          is_highlighted: boolean
          created_by: string
          group_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          image_url?: string | null
          is_highlighted?: boolean
          created_by: string
          group_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          image_url?: string | null
          is_highlighted?: boolean
          created_by?: string
          group_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string | null
          reported_group_id: string | null
          reason: string
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id?: string | null
          reported_group_id?: string | null
          reason: string
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_user_id?: string | null
          reported_group_id?: string | null
          reason?: string
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          id?: string
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: {
          id?: string
          blocker_id?: string
          blocked_id?: string
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
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
          deleted_for: string[]
          mentioned_users: string[]
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          sender_id: string
          content: string
          message_type?: 'text' | 'image' | 'file' | 'system'
          file_url?: string | null
          image_url?: string | null
          reply_to?: string | null
          is_edited?: boolean
          is_deleted?: boolean
          deleted_for?: string[]
          mentioned_users?: string[]
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          sender_id?: string
          content?: string
          message_type?: 'text' | 'image' | 'file' | 'system'
          file_url?: string | null
          image_url?: string | null
          reply_to?: string | null
          is_edited?: boolean
          is_deleted?: boolean
          deleted_for?: string[]
          mentioned_users?: string[]
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      wallpapers: {
        Row: {
          id: string
          name: string
          image_url: string
          is_default: boolean
          is_active: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          image_url: string
          is_default?: boolean
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          image_url?: string
          is_default?: boolean
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
        Relationships: []
      }
      message_reports: {
        Row: {
          id: string
          message_id: string
          reporter_id: string
          reason: string
          description: string | null
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          reporter_id: string
          reason: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          reporter_id?: string
          reason?: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_at?: string
        }
        Relationships: []
      }
      message_reads: {
        Row: {
          id: string
          message_id: string
          user_id: string
          read_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          read_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          read_at?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      premium_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: 'basic' | 'super' | 'admin'
          amount: number
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: 'pending' | 'active' | 'expired' | 'failed'
          starts_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_type: 'basic' | 'super' | 'admin'
          amount: number
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: 'pending' | 'active' | 'expired' | 'failed'
          starts_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: 'basic' | 'super' | 'admin'
          amount?: number
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: 'pending' | 'active' | 'expired' | 'failed'
          starts_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      call_requests: {
        Row: {
          id: string
          requester_id: string
          admin_id: string
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          admin_id: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          admin_id?: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type Group = Database['public']['Tables']['groups']['Row']
export type GroupMember = Database['public']['Tables']['group_members']['Row']
export type Announcement = Database['public']['Tables']['announcements']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type BlockedUser = Database['public']['Tables']['blocked_users']['Row']
export type DirectMessage = Database['public']['Tables']['direct_messages']['Row']
export type PremiumSubscription = Database['public']['Tables']['premium_subscriptions']['Row']
export type CallRequest = Database['public']['Tables']['call_requests']['Row']
export type College = Database['public']['Tables']['colleges']['Row']
export type Role = Database['public']['Tables']['roles']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type MessageRead = Database['public']['Tables']['message_reads']['Row']
export type Wallpaper = Database['public']['Tables']['wallpapers']['Row']
export type MessageReaction = Database['public']['Tables']['message_reactions']['Row']
export type MessageReport = Database['public']['Tables']['message_reports']['Row']
