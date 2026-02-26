import apiClient from './client';

export interface ReportReason {
  value: string;
  label: string;
  description: string;
}

export interface ReportResponse {
  message: string;
  reportId: string;
}

export interface MyReport {
  id: string;
  reportType: 'POST' | 'CHAT' | 'USER' | 'COMMENT' | 'GROUP';
  reason: string;
  description: string | null;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  actionTaken: string;
  createdAt: string;
  reviewedAt: string | null;
  post: {
    id: string;
    content: string;
    type: string;
  } | null;
  reportedUser: {
    id: string;
    name: string;
    username: string;
    profileImage: string | null;
  } | null;
}

export interface ReportRequest {
  reason: string;
  description?: string;
}

export interface ChatReportRequest extends ReportRequest {
  reportedUserId: string;
}

export const reportAPI = {
  // Get available report reasons
  getReasons: async (): Promise<{ reasons: ReportReason[] }> => {
    return apiClient.get('/reports/reasons');
  },

  // Report a post
  reportPost: async (postId: string, data: ReportRequest): Promise<ReportResponse> => {
    return apiClient.post(`/reports/post/${postId}`, data);
  },

  // Report a comment
  reportComment: async (commentId: string, data: ReportRequest): Promise<ReportResponse> => {
    return apiClient.post(`/reports/comment/${commentId}`, data);
  },

  // Report a user in chat
  reportChatUser: async (conversationId: string, data: ChatReportRequest): Promise<ReportResponse> => {
    return apiClient.post(`/reports/chat/${conversationId}`, data);
  },

  // Report a user profile
  reportUser: async (userId: string, data: ReportRequest): Promise<ReportResponse> => {
    return apiClient.post(`/reports/user/${userId}`, data);
  },

  // Report a group
  reportGroup: async (groupId: string, data: ReportRequest): Promise<ReportResponse> => {
    return apiClient.post(`/reports/group/${groupId}`, data);
  },

  // Get user's own reports
  getMyReports: async (page = 1, limit = 10): Promise<{
    reports: MyReport[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    return apiClient.get(`/reports/my-reports?page=${page}&limit=${limit}`);
  },
};
