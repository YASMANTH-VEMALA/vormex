'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { X, Flag, Loader2, AlertCircle, Check } from 'lucide-react'

interface ReportUserModalProps {
  userId: string
  userName: string
  onClose: () => void
  onSuccess?: () => void
}

const reportReasons = [
  'Inappropriate behavior',
  'Harassment or bullying',
  'Spam or scam',
  'Fake profile',
  'Offensive content',
  'Other'
]

export function ReportUserModal({ userId, userName, onClose, onSuccess }: ReportUserModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      const reason = selectedReason === 'Other' ? customReason : selectedReason
      if (!reason.trim()) {
        setError('Please select or enter a reason')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: reportError } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: userId,
          reason: reason.trim()
        })

      if (reportError) throw reportError

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err) {
      console.error(err)
      setError('Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 rounded-t-3xl animate-slide-up">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Report User</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          {success ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-white font-medium mb-2">Report Submitted</h3>
              <p className="text-gray-400 text-sm">
                Thank you for helping keep our community safe.
              </p>
            </div>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-4">
                Report <span className="text-white font-medium">{userName}</span>
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2 mb-4">
                {reportReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full p-3 rounded-xl text-left transition-colors ${
                      selectedReason === reason
                        ? 'bg-red-500/20 border border-red-500/30 text-white'
                        : 'bg-gray-800 border border-gray-700 text-gray-300'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              {selectedReason === 'Other' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please describe the issue..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none mb-4"
                />
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !selectedReason}
                className="w-full bg-red-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Submit Report'
                )}
              </button>
            </>
          )}
        </div>

        <div className="safe-area-bottom" />
      </div>
    </div>
  )
}

interface BlockUserModalProps {
  userId: string
  userName: string
  onClose: () => void
  onSuccess?: () => void
}

export function BlockUserModal({ userId, userName, onClose, onSuccess }: BlockUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleBlock = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: blockError } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: userId
        })

      if (blockError) {
        if (blockError.code === '23505') {
          // Already blocked
          onSuccess?.()
          onClose()
          return
        }
        throw blockError
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError('Failed to block user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl animate-fade-in">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-7 h-7 text-red-400" />
          </div>
          
          <h2 className="text-lg font-semibold text-white mb-2">Block User?</h2>
          <p className="text-gray-400 text-sm mb-6">
            Block <span className="text-white font-medium">{userName}</span>? They won&apos;t be able to see your profile or interact with you.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-800 text-white font-medium py-3 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleBlock}
              disabled={loading}
              className="flex-1 bg-red-500 text-white font-medium py-3 rounded-xl disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Block'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
