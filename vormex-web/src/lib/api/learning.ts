import apiClient from './client';

export interface LearningPath {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  thumbnail?: string;
  estimatedHours: number;
  xpReward: number;
  isFeatured: boolean;
  isPublished: boolean;
  enrollmentCount: number;
  completionCount: number;
  modules: LearningModule[];
  enrollment?: PathEnrollment;
}

export interface LearningModule {
  id: string;
  pathId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  quizzes: Quiz[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  type: string;
  videoUrl?: string;
  duration: number;
  order: number;
  xpReward: number;
  isCompleted?: boolean;
}

export interface Quiz {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  passingScore: number;
  xpReward: number;
  order: number;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  type: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  order: number;
}

export interface PathEnrollment {
  id: string;
  userId: string;
  pathId: string;
  progress: number;
  status: string;
  startedAt: string;
  completedAt?: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
  attemptedAt: string;
}

// Get all learning paths
export const getLearningPaths = async (filters?: {
  category?: string;
  difficulty?: string;
}): Promise<LearningPath[]> => {
  const response = await apiClient.get('/learning/paths', { params: filters });
  return response.data;
};

// Get learning path by slug
export const getLearningPath = async (slug: string): Promise<LearningPath> => {
  const response = await apiClient.get(`/learning/paths/${slug}`);
  return response.data;
};

// Get featured paths
export const getFeaturedPaths = async (limit?: number): Promise<LearningPath[]> => {
  const response = await apiClient.get('/learning/featured', { params: { limit } });
  return response.data;
};

// Get categories
export const getLearningCategories = async (): Promise<string[]> => {
  const response = await apiClient.get('/learning/categories');
  return response.data;
};

// Enroll in a path
export const enrollInPath = async (pathId: string) => {
  const response = await apiClient.post('/learning/enroll', { pathId });
  return response;
};

// Get my enrollments
export const getMyEnrollments = async (): Promise<PathEnrollment[]> => {
  const response = await apiClient.get('/learning/my-enrollments');
  return response.data;
};

// Drop enrollment
export const dropEnrollment = async (pathId: string) => {
  const response = await apiClient.delete(`/learning/enroll/${pathId}`);
  return response;
};

// Get lesson content
export const getLesson = async (lessonId: string): Promise<Lesson> => {
  const response = await apiClient.get(`/learning/lessons/${lessonId}`);
  return response.data;
};

// Mark lesson complete
export const completeLesson = async (lessonId: string, timeSpent?: number) => {
  const response = await apiClient.post(`/learning/lessons/${lessonId}/complete`, { timeSpent });
  return response;
};

// Submit quiz
export const submitQuiz = async (quizId: string, answers: Record<string, string>): Promise<QuizAttempt> => {
  const response = await apiClient.post('/learning/quiz/submit', { quizId, answers });
  return response.data;
};

// Get quiz attempts
export const getQuizAttempts = async (quizId: string): Promise<QuizAttempt[]> => {
  const response = await apiClient.get(`/learning/quiz/${quizId}/attempts`);
  return response.data;
};
