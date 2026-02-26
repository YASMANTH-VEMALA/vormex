import apiClient from './client';

export interface InterviewCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  _count?: {
    questions: number;
  };
}

export interface InterviewQuestion {
  id: string;
  categoryId: string;
  category?: InterviewCategory;
  question: string;
  difficulty: string;
  hints: string[];
  sampleAnswer?: string;
  followUps: string[];
  tags: string[];
}

export interface InterviewSession {
  id: string;
  userId: string;
  categoryId: string;
  category: InterviewCategory;
  difficulty: string;
  duration: number;
  status: string;
  overallScore?: number;
  feedback?: string;
  strengths: string[];
  improvements: string[];
  startedAt: string;
  completedAt?: string;
  responses?: InterviewResponse[];
}

export interface InterviewResponse {
  id: string;
  sessionId: string;
  questionId: string;
  question: InterviewQuestion;
  answer?: string;
  duration?: number;
  score?: number;
  feedback?: string;
  answeredAt: string;
}

export interface InterviewStats {
  totalSessions: number;
  passedSessions: number;
  passRate: number;
  avgScore: number;
  categoryStats: Record<string, {
    count: number;
    avgScore: number;
    passed: number;
  }>;
}

// Get all categories
export const getInterviewCategories = async (): Promise<InterviewCategory[]> => {
  const response = await apiClient.get('/interviews/categories');
  return response.data;
};

// Get category by slug
export const getInterviewCategory = async (slug: string): Promise<InterviewCategory & { questions: InterviewQuestion[] }> => {
  const response = await apiClient.get(`/interviews/categories/${slug}`);
  return response.data;
};

// Get questions
export const getInterviewQuestions = async (filters?: {
  categoryId?: string;
  difficulty?: string;
}): Promise<InterviewQuestion[]> => {
  const response = await apiClient.get('/interviews/questions', { params: filters });
  return response.data;
};

// Get question by ID
export const getInterviewQuestion = async (questionId: string): Promise<InterviewQuestion> => {
  const response = await apiClient.get(`/interviews/questions/${questionId}`);
  return response.data;
};

// Start a new session
export const startInterviewSession = async (data: {
  categoryId: string;
  difficulty?: string;
  questionCount?: number;
  duration?: number;
}): Promise<{ session: InterviewSession; questions: InterviewQuestion[] }> => {
  const response = await apiClient.post('/interviews/sessions/start', data);
  return response.data;
};

// Get my sessions
export const getMySessions = async (status?: string): Promise<InterviewSession[]> => {
  const response = await apiClient.get('/interviews/sessions', { params: { status } });
  return response.data;
};

// Get session by ID
export const getInterviewSession = async (sessionId: string): Promise<InterviewSession> => {
  const response = await apiClient.get(`/interviews/sessions/${sessionId}`);
  return response.data;
};

// Submit response
export const submitInterviewResponse = async (data: {
  sessionId: string;
  questionId: string;
  answer: string;
  duration?: number;
}) => {
  const response = await apiClient.post('/interviews/responses', data);
  return response;
};

// Complete session
export const completeInterviewSession = async (sessionId: string) => {
  const response = await apiClient.post(`/interviews/sessions/${sessionId}/complete`);
  return response;
};

// Get my stats
export const getInterviewStats = async (): Promise<InterviewStats> => {
  const response = await apiClient.get('/interviews/stats');
  return response.data;
};
