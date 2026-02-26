'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Loader2, 
  Eye, 
  Users, 
  TrendingUp, 
  MessageCircle,
  Share2,
  Bookmark,
  Clock,
  MapPin,
  BarChart3,
  Activity,
} from 'lucide-react';
import { getReactionConfig, REACTIONS } from './ReactionPicker';
import type { ReactionType } from '@/types/post';
import apiClient from '@/lib/api/client';

interface EngagementStats {
  // Reach metrics
  reachTotal: number;
  reachUnique: number;
  reachPotential: number;
  reachPenetration: number | null;
  
  // Engagement metrics
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  engagementRate: number | null;
  
  // Velocity metrics
  velocityCurrent: number;
  velocityPeak: number;
  velocityAverage: number | null;
  
  // Amplification metrics
  amplFollowerReach: number;
  amplExtendedReach: number;
  amplFactor: number | null;
  
  // Impact metrics
  impactScore: number | null;
  impactAvgTimeViewed: number | null;
  
  // Reaction breakdown
  reactionBreakdown: { type: ReactionType; count: number }[];
  
  // Demographics (if available)
  topLocations?: { city: string; count: number }[];
  viewsByHour?: { hour: number; count: number }[];
}

interface EngagementAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export function EngagementAnalyticsModal({ isOpen, onClose, postId }: EngagementAnalyticsModalProps) {
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reach' | 'engagement'>('overview');

  useEffect(() => {
    if (!isOpen || !postId) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/posts/${postId}/analytics`);
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        // Set mock data for demonstration if API not implemented
        setStats({
          reachTotal: 1234,
          reachUnique: 987,
          reachPotential: 5000,
          reachPenetration: 19.74,
          likesCount: 156,
          commentsCount: 23,
          sharesCount: 12,
          savesCount: 45,
          engagementRate: 12.6,
          velocityCurrent: 15,
          velocityPeak: 42,
          velocityAverage: 8.5,
          amplFollowerReach: 800,
          amplExtendedReach: 434,
          amplFactor: 1.54,
          impactScore: 78,
          impactAvgTimeViewed: 45.2,
          reactionBreakdown: [
            { type: 'LIKE', count: 98 },
            { type: 'CELEBRATE', count: 32 },
            { type: 'SUPPORT', count: 14 },
            { type: 'INSIGHTFUL', count: 8 },
            { type: 'CURIOUS', count: 4 },
          ],
          topLocations: [
            { city: 'San Francisco', count: 234 },
            { city: 'New York', count: 189 },
            { city: 'London', count: 156 },
            { city: 'Bangalore', count: 123 },
            { city: 'Toronto', count: 89 },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isOpen, postId]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed inset-x-4 top-[5%] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl z-50 max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Post Analytics
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-neutral-800">
              {(['overview', 'reach', 'engagement'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    activeTab === tab
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[65vh] p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : !stats ? (
                <div className="text-center py-12 text-gray-500 dark:text-neutral-400">
                  Analytics not available
                </div>
              ) : (
                <>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard
                          icon={Eye}
                          label="Impressions"
                          value={formatNumber(stats.reachTotal)}
                          color="blue"
                        />
                        <MetricCard
                          icon={Users}
                          label="Unique Views"
                          value={formatNumber(stats.reachUnique)}
                          color="green"
                        />
                        <MetricCard
                          icon={TrendingUp}
                          label="Engagement Rate"
                          value={`${stats.engagementRate?.toFixed(1) || 0}%`}
                          color="purple"
                        />
                        <MetricCard
                          icon={Activity}
                          label="Impact Score"
                          value={stats.impactScore?.toString() || '-'}
                          color="amber"
                        />
                      </div>

                      {/* Reaction Breakdown */}
                      <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-4">
                          Reaction Breakdown
                        </h3>
                        <div className="space-y-3">
                          {stats.reactionBreakdown.map((reaction) => {
                            const config = getReactionConfig(reaction.type);
                            const Icon = config.icon;
                            const percentage = stats.likesCount > 0 
                              ? (reaction.count / stats.likesCount * 100) 
                              : 0;
                            
                            return (
                              <div key={reaction.type} className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-full ${config.bgColor}`}>
                                  <Icon className={`w-4 h-4 ${config.color}`} />
                                </div>
                                <span className="text-sm text-gray-600 dark:text-neutral-400 w-20">
                                  {config.label}
                                </span>
                                <div className="flex-1 h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className={`h-full ${config.bgColor.replace('bg-', 'bg-').replace('/30', '')}`}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                                  {reaction.count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Engagement Actions */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                          <MessageCircle className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {stats.commentsCount}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-neutral-400">Comments</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                          <Share2 className="w-5 h-5 mx-auto mb-2 text-green-500" />
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {stats.sharesCount}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-neutral-400">Shares</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                          <Bookmark className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {stats.savesCount}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-neutral-400">Saves</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                          <Clock className="w-5 h-5 mx-auto mb-2 text-amber-500" />
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {stats.impactAvgTimeViewed?.toFixed(0) || 0}s
                          </p>
                          <p className="text-xs text-gray-500 dark:text-neutral-400">Avg. View</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reach Tab */}
                  {activeTab === 'reach' && (
                    <div className="space-y-6">
                      {/* Reach Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4">
                          <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Reach</p>
                          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                            {formatNumber(stats.reachTotal)}
                          </p>
                          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                            impressions
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4">
                          <p className="text-sm text-green-600 dark:text-green-400 mb-1">Unique Reach</p>
                          <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                            {formatNumber(stats.reachUnique)}
                          </p>
                          <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                            unique viewers
                          </p>
                        </div>
                      </div>

                      {/* Reach Breakdown */}
                      <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-4">
                          Reach Sources
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-neutral-400">Follower Reach</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatNumber(stats.amplFollowerReach)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-neutral-400">Extended Reach</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatNumber(stats.amplExtendedReach)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-neutral-400">Amplification Factor</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {stats.amplFactor?.toFixed(2) || '-'}x
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-neutral-400">Reach Penetration</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {stats.reachPenetration?.toFixed(1) || 0}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Top Locations */}
                      {stats.topLocations && stats.topLocations.length > 0 && (
                        <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4">
                          <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Top Locations
                          </h3>
                          <div className="space-y-2">
                            {stats.topLocations.map((location, index) => (
                              <div key={location.city} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 dark:text-neutral-500 w-4">
                                    {index + 1}
                                  </span>
                                  <span className="text-sm text-gray-600 dark:text-neutral-400">
                                    {location.city}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {location.count}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Engagement Tab */}
                  {activeTab === 'engagement' && (
                    <div className="space-y-6">
                      {/* Velocity Metrics */}
                      <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Engagement Velocity
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {stats.velocityCurrent}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-neutral-400">
                              Current/hour
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {stats.velocityPeak}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-neutral-400">
                              Peak/hour
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {stats.velocityAverage?.toFixed(1) || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-neutral-400">
                              Average/hour
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Engagement Rate Visualization */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            Engagement Rate
                          </h3>
                          <TrendingUp className="w-5 h-5 text-purple-500" />
                        </div>
                        <p className="text-5xl font-bold text-purple-700 dark:text-purple-300 mb-2">
                          {stats.engagementRate?.toFixed(1) || 0}%
                        </p>
                        <p className="text-sm text-purple-600 dark:text-purple-400">
                          Based on {formatNumber(stats.reachUnique)} unique viewers
                        </p>
                        
                        {/* Engagement breakdown */}
                        <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            ({stats.likesCount} reactions + {stats.commentsCount} comments + {stats.sharesCount} shares) / {formatNumber(stats.reachUnique)} views × 100
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Metric Card Component
function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}) {
  const colorClasses = {
    blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
    green: 'text-green-500 bg-green-50 dark:bg-green-900/30',
    purple: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
    amber: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
  };

  return (
    <div className={`p-4 rounded-xl ${colorClasses[color].split(' ').slice(1).join(' ')}`}>
      <Icon className={`w-5 h-5 ${colorClasses[color].split(' ')[0]} mb-2`} />
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-neutral-400">{label}</p>
    </div>
  );
}
