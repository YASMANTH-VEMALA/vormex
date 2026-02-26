'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getEventSocialStats, trackEventView, type EventStats } from '@/lib/api/social-proof';
import { Zap, Users, Eye, Clock } from 'lucide-react';

/**
 * EventRSVPCard — Event social proof with scarcity indicators
 *
 * Psychology: SCARCITY + FOMO + SOCIAL PROOF
 * "89 going • 23 RSVPed in the last hour" creates urgency.
 * "Only 11 spots remaining!" triggers loss aversion.
 * "12 of your connections attending" adds social validation.
 *
 * Placement: Event detail page, above RSVP button
 */

interface EventRSVPCardProps {
  eventId: string;
  maxAttendees?: number;
}

export default function EventRSVPCard({ eventId, maxAttendees }: EventRSVPCardProps) {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        // Track the view (contributes to "234 views today" counter)
        trackEventView(eventId).catch(() => {});
        const data = await getEventSocialStats(eventId);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch event stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();

    // Refresh every 30 seconds — RSVP urgency needs freshness
    const interval = setInterval(async () => {
      try {
        const data = await getEventSocialStats(eventId);
        setStats(data);
      } catch {}
    }, 30000);

    return () => clearInterval(interval);
  }, [eventId]);

  if (loading || !stats) return null;

  const spotsLeft = maxAttendees ? maxAttendees - stats.rsvpCount : null;
  const isAlmostFull = spotsLeft !== null && spotsLeft <= 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-4 space-y-2.5"
    >
      {/* RSVP count — main social proof */}
      <div className="flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">
          {stats.rsvpCount} {stats.rsvpCount === 1 ? 'person is' : 'people are'} going
        </span>
        {stats.rsvpsLastHour > 0 && (
          <span className="text-xs text-gray-400 dark:text-neutral-500">
            • {stats.rsvpsLastHour} in the last hour
          </span>
        )}
      </div>

      {/* Scarcity indicator — turns red when nearly full */}
      {spotsLeft !== null && (
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${
          isAlmostFull
            ? 'bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30'
            : 'bg-gray-50 dark:bg-neutral-800/50'
        }`}>
          <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${
            isAlmostFull ? 'text-red-500' : 'text-gray-400 dark:text-neutral-500'
          }`} />
          <span className={`text-sm font-semibold ${
            isAlmostFull
              ? 'text-red-700 dark:text-red-300'
              : 'text-gray-600 dark:text-neutral-400'
          }`}>
            {spotsLeft <= 0
              ? '🚫 Event is full!'
              : `Only ${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} remaining!`}
          </span>
        </div>
      )}

      {/* Mutual connections attending */}
      {stats.mutualConnectionsAttending > 0 && (
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span className="text-sm text-gray-600 dark:text-neutral-400">
            {stats.mutualConnectionsAttending} of your connections {stats.mutualConnectionsAttending === 1 ? 'is' : 'are'} attending
          </span>
        </div>
      )}

      {/* View count */}
      {stats.viewsToday > 0 && (
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
          <span className="text-xs text-gray-400 dark:text-neutral-500">
            {stats.viewsToday} {stats.viewsToday === 1 ? 'person' : 'people'} viewed this event today
          </span>
        </div>
      )}
    </motion.div>
  );
}
