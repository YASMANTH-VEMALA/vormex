import apiClient from './client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PersonCard {
  id: string;
  username: string;
  name: string;
  profileImage: string | null;
  bannerImageUrl: string | null;
  headline: string | null;
  college: string | null;
  branch: string | null;
  bio: string | null;
  skills: string[];
  interests: string[];
  isOnline: boolean;
  connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected';
  mutualConnections?: number;
}

export interface PeopleFilters {
  search?: string;
  college?: string;
  branch?: string;
  graduationYear?: number;
  skills?: string[];
  interests?: string[];
  location?: string;
  isOpenToOpportunities?: boolean;
}

export interface PeoplePagination {
  page?: number;
  limit?: number;
}

export interface PeopleResponse {
  people: PersonCard[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface FilterOptions {
  colleges: string[];
  branches: string[];
  graduationYears: number[];
  locations: string[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get all people with optional filters and pagination
 */
export async function getPeople(
  filters?: PeopleFilters,
  pagination?: PeoplePagination
): Promise<PeopleResponse> {
  const params = new URLSearchParams();
  
  if (filters?.search) params.append('search', filters.search);
  if (filters?.college) params.append('college', filters.college);
  if (filters?.branch) params.append('branch', filters.branch);
  if (filters?.graduationYear) params.append('graduationYear', filters.graduationYear.toString());
  if (filters?.skills?.length) params.append('skills', filters.skills.join(','));
  if (filters?.interests?.length) params.append('interests', filters.interests.join(','));
  if (filters?.location) params.append('location', filters.location);
  if (filters?.isOpenToOpportunities !== undefined) {
    params.append('isOpenToOpportunities', filters.isOpenToOpportunities.toString());
  }
  
  if (pagination?.page) params.append('page', pagination.page.toString());
  if (pagination?.limit) params.append('limit', pagination.limit.toString());
  
  return apiClient.get(`/people?${params.toString()}`);
}

/**
 * Get personalized suggestions (People You May Know)
 */
export async function getSuggestions(limit: number = 10): Promise<{ suggestions: PersonCard[] }> {
  return apiClient.get(`/people/suggestions?limit=${limit}`);
}

/**
 * Get people from the same college
 */
export async function getPeopleFromSameCollege(limit: number = 10): Promise<{ people: PersonCard[] }> {
  return apiClient.get(`/people/same-college?limit=${limit}`);
}

/**
 * Get people near the current user
 */
export async function getPeopleNearMe(limit: number = 10): Promise<{ people: PersonCard[] }> {
  return apiClient.get(`/people/near-me?limit=${limit}`);
}

/**
 * Get available filter options
 */
export async function getFilterOptions(): Promise<FilterOptions> {
  return apiClient.get('/people/filter-options');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER TYPES AND FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SearchUser {
  id: string;
  username: string;
  name: string;
  profileImage: string | null;
  headline: string | null;
}

/**
 * Quick search users by name or username
 */
export async function searchUsers(query: string, limit: number = 10): Promise<SearchUser[]> {
  const response = await getPeople({ search: query }, { limit });
  return response.people.map(p => ({
    id: p.id,
    username: p.username,
    name: p.name,
    profileImage: p.profileImage,
    headline: p.headline,
  }));
}
