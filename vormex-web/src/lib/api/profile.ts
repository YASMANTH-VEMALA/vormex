// Profile API - Complete API client for all profile endpoints

import apiClient from './client';
import type {
  FullProfileResponse,
  ProfileUpdateData,
  ActivityHeatmapResponse,
  ActivityYearsResponse,
  UserSkill,
  SkillInput,
  Experience,
  ExperienceInput,
  Education,
  EducationInput,
  Project,
  ProjectInput,
  Certificate,
  CertificateInput,
  Achievement,
  AchievementInput,
  RecentActivity,
} from '@/types/profile';

// ============================================
// Profile Endpoints
// ============================================

/**
 * Upload company logo
 */
export async function uploadCompanyLogo(file: File): Promise<{ logoUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);
  return apiClient.post('/upload/logo', formData);
}

/**
 * Get full user profile with all data
 * @param usernameOrId - Username or user ID
 */
export async function getProfile(usernameOrId: string): Promise<FullProfileResponse> {
  return apiClient.get(`/users/${usernameOrId}/profile`);
}

/**
 * Update own profile
 */
export async function updateProfile(data: ProfileUpdateData): Promise<any> {
  return apiClient.put('/users/me', data);
}

/**
 * Update profile avatar
 */
export async function updateAvatar(avatarUrl: string): Promise<{ avatar: string }> {
  return apiClient.post('/users/me/avatar', { avatarUrl });
}

/**
 * Update profile banner
 */
export async function updateBanner(bannerUrl: string): Promise<{ bannerImageUrl: string }> {
  return apiClient.post('/users/me/banner', { bannerUrl });
}

/**
 * Claim welcome gift and apply profile ring
 * Uses PUT /users/me (existing route) to avoid 404 on separate endpoint
 * @param profileRing - "original" | "hue"
 */
export async function claimWelcomeGift(profileRing: 'original' | 'hue'): Promise<{ profileRing: string; hasClaimedWelcomeGift: boolean }> {
  const updated = await updateProfile({ profileRing, hasClaimedWelcomeGift: true });
  return {
    profileRing: (updated as any).profileRing ?? profileRing,
    hasClaimedWelcomeGift: (updated as any).hasClaimedWelcomeGift ?? true,
  };
}

/**
 * Get user content feed
 */
export async function getUserFeed(
  usernameOrId: string,
  page: number = 1,
  limit: number = 20,
  filter: 'all' | 'posts' | 'articles' | 'forum' | 'videos' = 'all'
): Promise<RecentActivity> {
  return apiClient.get(`/users/${usernameOrId}/feed`, {
    params: { page, limit, filter },
  });
}

// ============================================
// Activity Calendar Endpoints
// ============================================

/**
 * Get activity heatmap data
 * @param userId - User ID
 * @param year - Optional year (default: last 365 days)
 */
export async function getActivityHeatmap(
  userId: string,
  year?: number
): Promise<ActivityHeatmapResponse> {
  const params = year ? { year } : {};
  return apiClient.get(`/users/${userId}/activity`, { params });
}

/**
 * Get available years for activity calendar
 */
export async function getActivityYears(userId: string): Promise<ActivityYearsResponse> {
  return apiClient.get(`/users/${userId}/activity/years`);
}

// ============================================
// Skills Endpoints
// ============================================

/**
 * Add a skill to profile
 */
export async function addSkill(data: SkillInput): Promise<UserSkill> {
  return apiClient.post('/users/me/skills', data);
}

/**
 * Update a skill
 */
export async function updateSkill(
  id: string,
  data: Partial<SkillInput>
): Promise<UserSkill> {
  return apiClient.put(`/users/me/skills/${id}`, data);
}

/**
 * Remove a skill from profile
 */
export async function deleteSkill(id: string): Promise<{ message: string }> {
  return apiClient.delete(`/users/me/skills/${id}`);
}

/**
 * Search skills for autocomplete
 */
export async function searchSkills(
  query: string
): Promise<{ id: string; name: string; category: string | null }[]> {
  return apiClient.get('/skills/search', { params: { q: query } });
}

// ============================================
// Experience Endpoints
// ============================================

/**
 * Create an experience
 */
export async function createExperience(data: ExperienceInput): Promise<Experience> {
  return apiClient.post('/users/me/experiences', data);
}

/**
 * Update an experience
 */
export async function updateExperience(
  id: string,
  data: Partial<ExperienceInput>
): Promise<Experience> {
  return apiClient.put(`/users/me/experiences/${id}`, data);
}

/**
 * Delete an experience
 */
export async function deleteExperience(id: string): Promise<{ message: string }> {
  return apiClient.delete(`/users/me/experiences/${id}`);
}

/**
 * Get user experiences (public)
 */
export async function getUserExperiences(userId: string): Promise<Experience[]> {
  return apiClient.get(`/users/${userId}/experiences`);
}

// ============================================
// Education Endpoints
// ============================================

/**
 * Create education entry
 */
export async function createEducation(data: EducationInput): Promise<Education> {
  return apiClient.post('/users/me/education', data);
}

/**
 * Update education entry
 */
export async function updateEducation(
  id: string,
  data: Partial<EducationInput>
): Promise<Education> {
  return apiClient.put(`/users/me/education/${id}`, data);
}

/**
 * Delete education entry
 */
export async function deleteEducation(id: string): Promise<{ message: string }> {
  return apiClient.delete(`/users/me/education/${id}`);
}

/**
 * Get user education (public)
 */
export async function getUserEducation(userId: string): Promise<Education[]> {
  return apiClient.get(`/users/${userId}/education`);
}

// ============================================
// Projects Endpoints
// ============================================

/**
 * Create a project
 */
export async function createProject(data: ProjectInput): Promise<Project> {
  return apiClient.post('/users/me/projects', data);
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  data: Partial<ProjectInput>
): Promise<Project> {
  return apiClient.put(`/users/me/projects/${id}`, data);
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<{ message: string }> {
  return apiClient.delete(`/users/me/projects/${id}`);
}

/**
 * Toggle project featured status
 */
export async function toggleProjectFeatured(id: string): Promise<Project> {
  return apiClient.post(`/users/me/projects/${id}/feature`);
}

/**
 * Get user projects (public)
 */
export async function getUserProjects(userId: string): Promise<Project[]> {
  return apiClient.get(`/users/${userId}/projects`);
}

// ============================================
// Certificates Endpoints
// ============================================

/**
 * Create a certificate
 */
export async function createCertificate(data: CertificateInput): Promise<Certificate> {
  return apiClient.post('/users/me/certificates', data);
}

/**
 * Update a certificate
 */
export async function updateCertificate(
  id: string,
  data: Partial<CertificateInput>
): Promise<Certificate> {
  return apiClient.put(`/users/me/certificates/${id}`, data);
}

/**
 * Delete a certificate
 */
export async function deleteCertificate(id: string): Promise<{ message: string }> {
  return apiClient.delete(`/users/me/certificates/${id}`);
}

/**
 * Get user certificates (public)
 */
export async function getUserCertificates(userId: string): Promise<Certificate[]> {
  return apiClient.get(`/users/${userId}/certificates`);
}

// ============================================
// Achievements Endpoints
// ============================================

/**
 * Create an achievement
 */
export async function createAchievement(data: AchievementInput): Promise<Achievement> {
  return apiClient.post('/users/me/achievements', data);
}

/**
 * Update an achievement
 */
export async function updateAchievement(
  id: string,
  data: Partial<AchievementInput>
): Promise<Achievement> {
  return apiClient.put(`/users/me/achievements/${id}`, data);
}

/**
 * Delete an achievement
 */
export async function deleteAchievement(id: string): Promise<{ message: string }> {
  return apiClient.delete(`/users/me/achievements/${id}`);
}

/**
 * Get user achievements (public)
 */
export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  return apiClient.get(`/users/${userId}/achievements`);
}

// ============================================
// GitHub Integration Endpoints
// ============================================

/**
 * Start GitHub OAuth flow
 */
export async function startGitHubOAuth(): Promise<{ authUrl: string }> {
  return apiClient.get('/integrations/github/start');
}

/**
 * Sync GitHub stats manually
 */
export async function syncGitHubStats(): Promise<{
  message: string;
  stats: any;
  syncedAt: string;
}> {
  return apiClient.post('/integrations/github/sync');
}

/**
 * Disconnect GitHub account
 */
export async function disconnectGitHub(): Promise<{ message: string }> {
  return apiClient.post('/integrations/github/disconnect');
}

/**
 * Get GitHub stats
 */
export async function getGitHubStats(): Promise<{
  connected: boolean;
  username: string | null;
  stats: any;
  lastSyncedAt: string | null;
}> {
  return apiClient.get('/integrations/github/stats');
}

// Default export for convenience
export const profileAPI = {
  getProfile,
  updateProfile,
  updateAvatar,
  updateBanner,
  getUserFeed,
  getActivityHeatmap,
  getActivityYears,
  addSkill,
  updateSkill,
  deleteSkill,
  searchSkills,
  createExperience,
  updateExperience,
  deleteExperience,
  getUserExperiences,
  createEducation,
  updateEducation,
  deleteEducation,
  getUserEducation,
  createProject,
  updateProject,
  deleteProject,
  toggleProjectFeatured,
  getUserProjects,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  getUserCertificates,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  getUserAchievements,
  startGitHubOAuth,
  syncGitHubStats,
  disconnectGitHub,
  getGitHubStats,
};

