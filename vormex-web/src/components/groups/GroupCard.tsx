'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Group } from '@/lib/api/groups';
import { cn } from '@/lib/utils';

interface GroupCardProps {
  group: Group;
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
  isJoining?: boolean;
}

export default function GroupCard({ group, onJoin, onLeave, isJoining }: GroupCardProps) {
  const memberCount = group._count?.members || group.memberCount;
  const postCount = group._count?.posts || group.postCount;

  const privacyBadge = {
    PUBLIC: { label: 'Public', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    PRIVATE: { label: 'Private', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    SECRET: { label: 'Secret', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  };

  const privacy = privacyBadge[group.privacy];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Cover Image */}
      <Link href={`/groups/${group.slug}`}>
        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
          {group.coverImage && (
            <Image
              src={group.coverImage}
              alt={group.name}
              fill
              className="object-cover"
            />
          )}
          {/* Icon overlay */}
          {group.iconImage && (
            <div className="absolute -bottom-6 left-4">
              <div className="w-14 h-14 rounded-xl border-4 border-white dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-800">
                <Image
                  src={group.iconImage}
                  alt={group.name}
                  width={56}
                  height={56}
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className={cn("p-4", group.iconImage && "pt-8")}>
        <div className="flex items-start justify-between gap-2">
          <Link href={`/groups/${group.slug}`} className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {group.name}
            </h3>
          </Link>
          <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0", privacy.color)}>
            {privacy.label}
          </span>
        </div>

        {group.description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {group.description}
          </p>
        )}

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {memberCount.toLocaleString()} members
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            {postCount} posts
          </span>
        </div>

        {/* Category tag */}
        {group.category && (
          <div className="mt-3">
            <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">
              {group.category}
            </span>
          </div>
        )}

        {/* Member avatars preview */}
        {group.members && group.members.length > 0 && (
          <div className="mt-3 flex items-center">
            <div className="flex -space-x-2">
              {group.members.slice(0, 3).map((member) => (
                <div
                  key={member.id}
                  className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden bg-gray-200 dark:bg-gray-600"
                >
                  {member.user.profileImage ? (
                    <Image
                      src={member.user.profileImage}
                      alt={member.user.name}
                      width={28}
                      height={28}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {memberCount > 3 && (
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                +{memberCount - 3} more
              </span>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4">
          {group.isMember ? (
            <div className="flex items-center gap-2">
              <Link
                href={`/groups/${group.slug}`}
                className="flex-1 px-4 py-2 text-center text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                View Group
              </Link>
              {group.memberRole !== 'OWNER' && onLeave && (
                <button
                  onClick={() => onLeave(group.id)}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Leave group"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => onJoin?.(group.id)}
              disabled={isJoining}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isJoining ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Joining...
                </span>
              ) : group.privacy === 'PRIVATE' ? (
                'Request to Join'
              ) : (
                'Join Group'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
