'use client';

import { useState, useEffect } from 'react';
import { X, Flag, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { reportAPI, ReportReason } from '@/lib/api/reports';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'post' | 'comment' | 'user' | 'group' | 'chat';
  targetId: string;
  targetName?: string;
  conversationId?: string; // For chat reports
  reportedUserId?: string; // For chat reports
}

export default function ReportModal({
  isOpen,
  onClose,
  type,
  targetId,
  targetName,
  conversationId,
  reportedUserId,
}: ReportModalProps) {
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingReasons, setFetchingReasons] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const response = await reportAPI.getReasons();
        setReasons(response.reasons);
      } catch (err) {
        console.error('Failed to fetch report reasons:', err);
      } finally {
        setFetchingReasons(false);
      }
    };

    if (isOpen) {
      fetchReasons();
      // Reset state
      setSelectedReason('');
      setDescription('');
      setSuccess(false);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Please select a reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = {
        reason: selectedReason,
        description: description.trim() || undefined,
      };

      switch (type) {
        case 'post':
          await reportAPI.reportPost(targetId, data);
          break;
        case 'comment':
          await reportAPI.reportComment(targetId, data);
          break;
        case 'user':
          await reportAPI.reportUser(targetId, data);
          break;
        case 'group':
          await reportAPI.reportGroup(targetId, data);
          break;
        case 'chat':
          if (!conversationId || !reportedUserId) {
            throw new Error('Missing conversation or user info');
          }
          await reportAPI.reportChatUser(conversationId, {
            ...data,
            reportedUserId,
          });
          break;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'post':
        return 'Report Post';
      case 'comment':
        return 'Report Comment';
      case 'user':
        return `Report ${targetName || 'User'}`;
      case 'group':
        return 'Report Group';
      case 'chat':
        return `Report ${targetName || 'User'}`;
      default:
        return 'Report';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getTitle()}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {success ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Report Submitted
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Thank you for helping keep our community safe. We'll review your report shortly.
                </p>
              </div>
            ) : fetchingReasons ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Why are you reporting this {type}? Your report will be reviewed by our team.
                </p>

                {/* Reason Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select a reason <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {reasons.map((reason) => (
                      <label
                        key={reason.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedReason === reason.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={reason.value}
                          checked={selectedReason === reason.value}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="mt-1 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {reason.label}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {reason.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide any additional context that might help us review this report..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-400 text-right">
                    {description.length}/500
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedReason}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
