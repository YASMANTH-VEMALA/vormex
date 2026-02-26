import apiClient from './client';

export interface AccountabilityPair {
  id: string;
  user1Id: string;
  user2Id: string;
  goal: string;
  status: string;
  sharedStreak: number;
  bestStreak: number;
  lastCheckIn: string | null;
  checkInsCompleted: number;
  partner: {
    id: string;
    name: string;
    username: string;
    profileImage: string | null;
    headline: string | null;
    college: string | null;
  };
}

export interface MentorshipMatch {
  id: string;
  mentorId: string;
  menteeId: string;
  skill: string;
  status: string;
  sessionsCompleted: number;
  rating: number | null;
  myRole: 'mentor' | 'mentee';
  mentor: { id: string; name: string; username: string; profileImage: string | null; headline: string | null };
  mentee: { id: string; name: string; username: string; profileImage: string | null; headline: string | null };
}

export const accountabilityAPI = {
  getPartners: async (): Promise<{ partners: AccountabilityPair[] }> => {
    return apiClient.get('/accountability/partners') as any;
  },

  requestPartner: async (targetUserId: string, goal: string): Promise<{ pair: AccountabilityPair }> => {
    return apiClient.post('/accountability/partners', { targetUserId, goal }) as any;
  },

  respondToPartner: async (pairId: string, action: 'pause' | 'complete'): Promise<{ message: string }> => {
    return apiClient.post(`/accountability/partners/${pairId}/respond`, { action }) as any;
  },

  checkIn: async (pairId: string): Promise<{ streak: number; bestStreak: number; checkInsCompleted: number }> => {
    return apiClient.post(`/accountability/partners/${pairId}/check-in`) as any;
  },

  getMentorships: async (role?: 'mentor' | 'mentee'): Promise<{ mentorships: MentorshipMatch[] }> => {
    const params = role ? `?role=${role}` : '';
    return apiClient.get(`/accountability/mentorships${params}`) as any;
  },

  requestMentorship: async (mentorId: string, skill: string): Promise<{ mentorship: MentorshipMatch }> => {
    return apiClient.post('/accountability/mentorships', { mentorId, skill }) as any;
  },

  respondToMentorship: async (mentorshipId: string, action: 'accept' | 'reject'): Promise<{ message: string }> => {
    return apiClient.post(`/accountability/mentorships/${mentorshipId}/respond`, { action }) as any;
  },

  completeSession: async (mentorshipId: string, rating?: number, feedback?: string): Promise<{ message: string }> => {
    return apiClient.post(`/accountability/mentorships/${mentorshipId}/session`, { rating, feedback }) as any;
  },
};
