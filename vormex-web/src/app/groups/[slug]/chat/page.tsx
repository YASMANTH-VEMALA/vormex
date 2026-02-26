'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GroupChat } from '@/components/groups';
import { getGroup, Group } from '@/lib/api/groups';

interface GroupChatPageProps {
  params: Promise<{ slug: string }>;
}

export default function GroupChatPage({ params }: GroupChatPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true);
        const data = await getGroup(resolvedParams.slug);
        
        if (!data.isMember) {
          router.push(`/groups/${resolvedParams.slug}`);
          return;
        }
        
        setGroup(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load group');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [resolvedParams.slug, router]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !group) {
    return (
      <ProtectedRoute>
        <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Group not found'}</p>
            <button
              onClick={() => router.push('/groups')}
              className="text-blue-600 hover:underline"
            >
              Go back to groups
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Back navigation */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <Link
            href={`/groups/${group.slug}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {group.name}
          </Link>
        </div>

        {/* Chat Component */}
        <div className="flex-1 overflow-hidden">
          <GroupChat group={group} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
