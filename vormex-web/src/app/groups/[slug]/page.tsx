'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GroupHeader } from '@/components/groups';
import { GroupCard } from '@/components/groups';
import { 
  getGroup, 
  getGroupPosts, 
  getGroupMembers,
  joinGroup, 
  leaveGroup,
  toggleGroupPostLike,
  Group, 
  GroupPost,
  GroupMember 
} from '@/lib/api/groups';
import { useAuth } from '@/lib/auth/useAuth';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

type Tab = 'posts' | 'about' | 'members';

interface GroupDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch group data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const groupData = await getGroup(resolvedParams.slug);
        setGroup(groupData);

        // Fetch posts and members if member or public
        if (groupData.isMember || groupData.privacy !== 'SECRET') {
          const [postsData, membersData] = await Promise.all([
            getGroupPosts(groupData.id),
            getGroupMembers(groupData.id, { limit: 10 }),
          ]);
          setPosts(postsData.posts);
          setMembers(membersData.members);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load group');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.slug]);

  // Handle join
  const handleJoin = async () => {
    if (!group) return;
    
    try {
      setActionLoading(true);
      const result = await joinGroup(group.id);
      
      if (result.status === 'joined') {
        setGroup({ ...group, isMember: true, memberRole: 'MEMBER' });
        // Refetch data
        const [postsData, membersData] = await Promise.all([
          getGroupPosts(group.id),
          getGroupMembers(group.id, { limit: 10 }),
        ]);
        setPosts(postsData.posts);
        setMembers(membersData.members);
      } else {
        alert('Join request sent! You will be notified when approved.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to join group');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle leave
  const handleLeave = async () => {
    if (!group || !confirm('Are you sure you want to leave this group?')) return;
    
    try {
      setActionLoading(true);
      await leaveGroup(group.id);
      setGroup({ ...group, isMember: false, memberRole: null });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to leave group');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle like post
  const handleLikePost = async (postId: string) => {
    if (!group) return;
    
    try {
      const result = await toggleGroupPostLike(group.id, postId);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: result.liked,
            likesCount: result.liked ? p.likesCount + 1 : p.likesCount - 1,
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !group) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Header */}
          <GroupHeader
            group={group}
            onJoin={handleJoin}
            onLeave={handleLeave}
            isLoading={actionLoading}
          />

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg my-6 w-fit">
            {(['posts', 'about', 'members'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize",
                  activeTab === tab
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {/* Create Post (if member) */}
                  {group.isMember && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          {user?.profileImage ? (
                            <Image src={user.profileImage} alt="" width={40} height={40} className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                              {user?.name?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <button className="flex-1 text-left px-4 py-2.5 bg-gray-100 dark:bg-gray-900 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                          Write something...
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Posts */}
                  {posts.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">No posts yet</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Be the first to post in this group!
                      </p>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                      >
                        {/* Pinned badge */}
                        {post.isPinned && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mb-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            Pinned post
                          </div>
                        )}

                        {/* Author */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            {post.author.profileImage ? (
                              <Image src={post.author.profileImage} alt="" width={40} height={40} className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
                                {post.author.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <Link href={`/profile/${post.author.username}`} className="font-medium text-gray-900 dark:text-white hover:underline">
                              {post.author.name}
                            </Link>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>

                        {/* Content */}
                        {post.content && (
                          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-3">
                            {post.content}
                          </p>
                        )}

                        {/* Media */}
                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                          <div className="mb-3 rounded-lg overflow-hidden">
                            {post.mediaType === 'video' ? (
                              <video src={post.mediaUrls[0]} controls className="w-full" />
                            ) : (
                              <Image
                                src={post.mediaUrls[0]}
                                alt=""
                                width={600}
                                height={400}
                                className="w-full object-cover"
                              />
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => handleLikePost(post.id)}
                            className={cn(
                              "flex items-center gap-1.5 text-sm transition-colors",
                              post.isLiked
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            )}
                          >
                            <svg className="w-5 h-5" fill={post.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            {post.likesCount}
                          </button>
                          <button className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {post.commentsCount}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'about' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About this group</h2>
                  
                  {group.description ? (
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{group.description}</p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-500 italic mb-6">No description provided</p>
                  )}

                  {group.rules && group.rules.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Group Rules</h3>
                      <ol className="list-decimal list-inside space-y-2">
                        {group.rules.map((rule, index) => (
                          <li key={index} className="text-gray-600 dark:text-gray-400">
                            {rule}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {group.tags && group.tags.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {group.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'members' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Members ({group.memberCount})
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {members.map((member) => (
                      <Link
                        key={member.id}
                        href={`/profile/${member.user.username}`}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          {member.user.profileImage ? (
                            <Image src={member.user.profileImage} alt="" width={48} height={48} className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium text-lg">
                              {member.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {member.user.name}
                            </span>
                            {member.role !== 'MEMBER' && (
                              <span className={cn(
                                "px-2 py-0.5 text-xs font-medium rounded-full",
                                member.role === 'OWNER' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
                                member.role === 'ADMIN' && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                                member.role === 'MODERATOR' && "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                              )}>
                                {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{member.user.username}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Group Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Group Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Privacy</span>
                    <span className="text-gray-900 dark:text-white capitalize">{group.privacy.toLowerCase()}</span>
                  </div>
                  {group.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Category</span>
                      <span className="text-gray-900 dark:text-white">{group.category}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Members</span>
                    <span className="text-gray-900 dark:text-white">{group.memberCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Posts</span>
                    <span className="text-gray-900 dark:text-white">{group.postCount}</span>
                  </div>
                </div>
              </div>

              {/* Admin panel for owners/admins */}
              {group.memberRole && ['OWNER', 'ADMIN'].includes(group.memberRole) && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Admin</h3>
                  <div className="space-y-2">
                    <Link
                      href={`/groups/${group.slug}/settings`}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Group Settings
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
