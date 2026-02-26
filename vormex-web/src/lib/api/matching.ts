import apiClient from './client';

export interface SmartMatch {
  user: {
    id: string;
    name: string;
    username: string;
    profileImage: string | null;
    headline: string | null;
    college: string | null;
    branch: string | null;
    graduationYear: number | null;
    interests: string[];
    bio: string | null;
    githubConnected: boolean;
    skills: { name: string; proficiency: string | null }[];
    onboarding: {
      primaryGoal: string | null;
      lookingFor: string[];
    } | null;
    stats: {
      connectionsCount: number;
      xp: number;
      level: number;
    } | null;
  };
  score: number;
  matchPercentage: number;
  reasons: string[];
  tags: string[];
}

export interface IceBreaker {
  iceBreakers: string[];
  actions: { type: string; label: string; icon: string }[];
  context: {
    sharedInterests: string[];
    sameCampus: boolean;
    sharedGoal: boolean;
  };
}

export const matchingAPI = {
  getSmartMatches: async (params?: {
    type?: 'all' | 'same_campus' | 'same_goal' | 'mentor' | 'mentee';
    page?: number;
    limit?: number;
  }): Promise<{
    matches: SmartMatch[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    return apiClient.get(`/matching/smart?${searchParams.toString()}`) as any;
  },

  getMentorMatches: async (): Promise<{
    mentors: {
      user: {
        id: string;
        name: string;
        username: string;
        profileImage: string | null;
        headline: string | null;
        college: string | null;
        graduationYear: number | null;
      };
      teachableSkills: string[];
      xp: number;
      level: number;
    }[];
  }> => {
    return apiClient.get('/matching/mentors') as any;
  },

  getAccountabilityMatches: async (): Promise<{
    matches: {
      user: {
        id: string;
        name: string;
        username: string;
        profileImage: string | null;
        headline: string | null;
        college: string | null;
      };
      sharedGoal: string | null;
      availability: string | null;
    }[];
  }> => {
    return apiClient.get('/matching/accountability') as any;
  },

  getIceBreakers: async (targetUserId: string): Promise<IceBreaker> => {
    return apiClient.get(`/matching/ice-breakers/${targetUserId}`) as any;
  },
};
