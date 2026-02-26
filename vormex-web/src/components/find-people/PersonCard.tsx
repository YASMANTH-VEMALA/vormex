'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ConnectionSentToast from '@/components/engagement/ConnectionSentToast';
import {
  GraduationCap,
  Loader2,
  UserPlus,
  UserCheck,
  Clock,
  UserX,
  Check,
  X,
} from 'lucide-react';
import type { PersonCard as PersonCardType } from '@/lib/api/people';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  cancelConnectionRequest,
} from '@/lib/api/connections';

interface PersonCardProps {
  person: PersonCardType;
  onConnectionChange?: (personId: string, newStatus: string) => void;
}

export function PersonCard({ person, onConnectionChange }: PersonCardProps) {
  // Normalize connectionStatus to lowercase for consistent comparison
  const normalizedStatus = person.connectionStatus?.toLowerCase() || 'none';
  const [connectionStatus, setConnectionStatus] = useState(normalizedStatus);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleConnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    
    setLoading(true);
    try {
      await sendConnectionRequest(person.id);
      setConnectionStatus('pending_sent');
      setShowToast(true);
      onConnectionChange?.(person.id, 'pending_sent');
    } catch (error) {
      console.error('Failed to send connection request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    
    setLoading(true);
    try {
      // Note: We'd need the connection ID here, but for now we'll use the user ID
      // The backend should handle finding the right connection
      await acceptConnectionRequest(person.id);
      setConnectionStatus('connected');
      onConnectionChange?.(person.id, 'connected');
    } catch (error) {
      console.error('Failed to accept connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    
    setLoading(true);
    try {
      await rejectConnectionRequest(person.id);
      setConnectionStatus('none');
      onConnectionChange?.(person.id, 'none');
    } catch (error) {
      console.error('Failed to reject connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    
    setLoading(true);
    try {
      await cancelConnectionRequest(person.id);
      setConnectionStatus('none');
      onConnectionChange?.(person.id, 'none');
    } catch (error) {
      console.error('Failed to cancel request:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderConnectionButton = () => {
    if (loading) {
      return (
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-400"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
        </button>
      );
    }

    switch (connectionStatus) {
      case 'connected':
        return (
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium"
          >
            <UserCheck className="w-4 h-4" />
            Connected
          </button>
        );
      
      case 'pending_sent':
        return (
          <button
            onClick={handleCancelRequest}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 text-sm font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <Clock className="w-4 h-4" />
            Pending
          </button>
        );
      
      case 'pending_received':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAccept}
              className="flex items-center gap-1 px-3 py-2 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              <Check className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={handleReject}
              className="flex items-center gap-1 px-3 py-2 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 text-sm font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      
      default:
        return (
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Connect
          </button>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden hover:border-gray-300 dark:hover:border-neutral-700 transition-all hover:shadow-lg group"
    >
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
        {person.bannerImageUrl && (
          <img
            src={person.bannerImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Online indicator */}
        {person.isOnline && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Online
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="relative px-4 pb-4">
        {/* Profile Image */}
        <Link href={`/profile/${person.username}`}>
          <div className="absolute -top-10 left-4 w-20 h-20 rounded-full border-4 border-white dark:border-neutral-900 overflow-hidden bg-gray-200 dark:bg-neutral-700 group-hover:border-gray-100 dark:group-hover:border-neutral-800 transition-colors">
            {person.profileImage ? (
              <img
                src={person.profileImage}
                alt={person.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500 dark:text-neutral-400">
                {person.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </Link>
        
        {/* Connection Button - positioned at top right */}
        <div className="absolute -top-4 right-4">
          {renderConnectionButton()}
        </div>
        
        {/* User Info */}
        <div className="pt-12">
          <Link href={`/profile/${person.username}`}>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
              {person.name}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            @{person.username}
          </p>
          
          {/* Headline */}
          {person.headline && (
            <p className="text-sm text-gray-600 dark:text-neutral-300 mt-1 line-clamp-2">
              {person.headline}
            </p>
          )}
          
          {/* College */}
          {person.college && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500 dark:text-neutral-400">
              <GraduationCap className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{person.college}</span>
              {person.branch && (
                <span className="text-gray-400 dark:text-neutral-500">• {person.branch}</span>
              )}
            </div>
          )}
          
          {/* Skills */}
          {person.skills && person.skills.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1.5">
                {person.skills.slice(0, 4).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full"
                  >
                    {skill}
                  </span>
                ))}
                {person.skills.length > 4 && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 text-xs font-medium rounded-full">
                    +{person.skills.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Interests */}
          {person.interests && person.interests.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1.5">
                {person.interests.slice(0, 3).map((interest, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium rounded-full"
                  >
                    {interest}
                  </span>
                ))}
                {person.interests.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 text-xs font-medium rounded-full">
                    +{person.interests.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Mutual Connections */}
          {person.mutualConnections !== undefined && person.mutualConnections > 0 && (
            <p className="mt-3 text-xs text-gray-400 dark:text-neutral-500">
              {person.mutualConnections} mutual connection{person.mutualConnections !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <ConnectionSentToast
        show={showToast}
        recipientName={person.name}
        onClose={() => setShowToast(false)}
      />
    </motion.div>
  );
}

export default PersonCard;
