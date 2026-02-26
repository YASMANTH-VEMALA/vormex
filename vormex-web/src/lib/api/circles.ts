import apiClient from './client';

export interface Circle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  coverImageUrl: string | null;
  emoji: string | null;
  category: string;
  campus: string | null;
  tags: string[];
  type: string;
  isPrivate: boolean;
  memberCount: number;
  activeMembers: number;
  postsCount: number;
  weeklyActivity: number;
  isMember?: boolean;
  myRole?: string | null;
  createdAt: string;
}

export interface CircleMember {
  id: string;
  name: string;
  username: string;
  profileImage: string | null;
  headline: string | null;
  college: string | null;
  role: string;
  xpInCircle: number;
  joinedAt: string;
}

export interface CirclePost {
  id: string;
  circleId: string;
  authorId: string;
  content: string;
  type: string;
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  isPinned: boolean;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    username: string;
    profileImage: string | null;
    headline: string | null;
  };
}

export const circlesAPI = {
  discover: async (params?: { category?: string; campus?: string; search?: string; page?: number }): Promise<{
    circles: Circle[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.campus) searchParams.set('campus', params.campus);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    return apiClient.get(`/circles/discover?${searchParams.toString()}`) as any;
  },

  getMyCircles: async (): Promise<{ circles: Circle[] }> => {
    return apiClient.get('/circles/my/all') as any;
  },

  getBySlug: async (slug: string): Promise<{ circle: Circle & { topMembers: CircleMember[]; _count: Record<string, number> } }> => {
    return apiClient.get(`/circles/${slug}`) as any;
  },

  join: async (circleId: string): Promise<{ message: string }> => {
    return apiClient.post(`/circles/${circleId}/join`) as any;
  },

  leave: async (circleId: string): Promise<{ message: string }> => {
    return apiClient.post(`/circles/${circleId}/leave`) as any;
  },

  create: async (data: {
    name: string;
    description?: string;
    category: string;
    campus?: string;
    tags?: string[];
    emoji?: string;
    isPrivate?: boolean;
  }): Promise<{ circle: Circle }> => {
    return apiClient.post('/circles', data) as any;
  },

  getMembers: async (circleId: string, page?: number): Promise<{
    members: CircleMember[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    return apiClient.get(`/circles/${circleId}/members?page=${page || 1}`) as any;
  },

  getPosts: async (circleId: string, page?: number): Promise<{
    posts: CirclePost[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    return apiClient.get(`/circles/${circleId}/posts?page=${page || 1}`) as any;
  },

  createPost: async (circleId: string, data: { content: string; type?: string; mediaUrls?: string[] }): Promise<{ post: CirclePost }> => {
    return apiClient.post(`/circles/${circleId}/posts`, data) as any;
  },

  seedDefaults: async (): Promise<{ message: string }> => {
    return apiClient.post('/circles/admin/seed') as any;
  },
};
