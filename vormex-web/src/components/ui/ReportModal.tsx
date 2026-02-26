'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  Flag,
  Loader2,
  Check,
  ChevronRight,
} from 'lucide-react';
import { reportAPI, type ReportReason } from '@/lib/api/reports';

export type ReportType = 'post' | 'comment' | 'user' | 'group' | 'chat';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ReportType;
  targetId: string;
  targetName?: string;
  reportedUserId?: string;
}

export function ReportModal({
  isOpen,
  onClose,
  type,
  targetId,
  targetName,
  reportedUserId,
}: ReportModalProps) {
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingReasons, setLoadingReasons] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchReasons();
      setSelectedReason('');
      setDescription('');
      setSubmitted(false);
      setError(null);
    }
  }, [isOpen]);

  const fetchReasons = async () => {
    try {
      setLoadingReasons(true);
      const response = await reportAPI.getReasons();
      setReasons(response.reasons || getDefaultReasons());
    } catch (err) {
      console.error('Failed to fetch report reasons:', err);
      setReasons(getDefaultReasons());
    } finally {
      setLoadingReasons(false);
    }
  };

  const getDefaultReasons = (): ReportReason[] => [
    { value: 'SPAM', label: 'Spam', description: 'Misleading or repetitive content' },
    { value: 'HARASSMENT', label: 'Harassment', description: 'Bullying or targeted harassment' },
    { value: 'HATE_SPEECH', label: 'Hate Speech', description: 'Attacks based on identity' },
    { value: 'VIOLENCE', label: 'Violence', description: 'Violent or graphic content' },
    { value: 'MISINFORMATION', label: 'Misinformation', description: 'False or misleading information' },
    { value: 'INAPPROPRIATE', label: 'Inappropriate Content', description: 'Adult or explicit content' },
    { value: 'SCAM', label: 'Scam/Fraud', description: 'Fraudulent or deceptive content' },
    { value: 'OTHER', label: 'Other', description: 'Something else not listed above' },
  ];

  const getTypeLabel = () => {
    switch (type) {
      case 'post': return 'post';
      case 'comment': return 'comment';
      case 'user': return 'user';
      case 'group': return 'group';
      case 'chat': return 'message';
      default: return 'content';
    }
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Please select a reason');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const reportData = {
        reason: selectedReason,
        description: description.trim() || undefined,
      };

      switch (type) {
        case 'post':
          await reportAPI.reportPost(targetId, reportData);
          break;
        case 'comment':
          await reportAPI.reportComment(targetId, reportData);
          break;
        case 'user':
          await reportAPI.reportUser(targetId, reportData);
          break;
        case 'group':
          await reportAPI.reportGroup(targetId, reportData);
          break;
        case 'chat':
          if (reportedUserId) {
            await reportAPI.reportChatUser(targetId, { ...reportData, reportedUserId });
          }
          break;
      }

      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full border border-gray-200 dark:border-neutral-800 overflow-hidden shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Report {getTypeLabel()}
                  </h2>
                  {targetName && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                      {targetName}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Report Submitted
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Thank you for reporting. Our team will review this {getTypeLabel()}.
                  </p>
                </motion.div>
              ) : loadingReasons ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Why are you reporting this {getTypeLabel()}?
                  </p>

                  {/* Reasons List */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
                    {reasons.map((reason) => (
                      <button
                        key={reason.value}
                        onClick={() => setSelectedReason(reason.value)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                          selectedReason === reason.value
                            ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500'
                            : 'bg-gray-50 dark:bg-neutral-800 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-neutral-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedReason === reason.value
                            ? 'border-red-500 bg-red-500'
                            : 'border-gray-300 dark:border-neutral-600'
                        }`}>
                          {selectedReason === reason.value && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${
                            selectedReason === reason.value
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {reason.label}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {reason.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Additional Details */}
                  {selectedReason && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Additional details (optional)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide more context about why you're reporting this..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-500 border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"
                      />
                    </motion.div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!submitted && !loadingReasons && (
              <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-neutral-800">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedReason || loading}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    selectedReason && !loading
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-200 dark:bg-neutral-700 text-gray-400 cursor-not-allowed'
                  }`}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ReportModal;
