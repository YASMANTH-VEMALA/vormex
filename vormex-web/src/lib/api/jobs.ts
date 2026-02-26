import apiClient from './client';

export interface Company {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  website?: string;
  description?: string;
  industry?: string;
  size?: string;
  location?: string;
  isVerified: boolean;
  _count?: {
    jobs: number;
  };
}

export interface Job {
  id: string;
  companyId: string;
  company: Company;
  title: string;
  slug: string;
  description: string;
  type: string;
  location: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  experienceLevel: string;
  applicationUrl?: string;
  status: string;
  isFeatured: boolean;
  viewCount: number;
  applicationCount: number;
  expiresAt?: string;
  createdAt: string;
  isSaved?: boolean;
  hasApplied?: boolean;
}

export interface JobApplication {
  id: string;
  userId: string;
  jobId: string;
  job: Job;
  status: string;
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: string;
}

// Get all companies
export const getCompanies = async (): Promise<Company[]> => {
  const response = await apiClient.get('/jobs/companies');
  return response.data;
};

// Get company by slug
export const getCompany = async (slug: string): Promise<Company & { jobs: Job[] }> => {
  const response = await apiClient.get(`/jobs/companies/${slug}`);
  return response.data;
};

// Get all jobs
export const getJobs = async (filters?: {
  type?: string;
  location?: string;
  experienceLevel?: string;
  isRemote?: boolean;
  search?: string;
}): Promise<Job[]> => {
  const response = await apiClient.get('/jobs', { params: filters });
  return response.data;
};

// Get job by slug
export const getJob = async (slug: string): Promise<Job> => {
  const response = await apiClient.get(`/jobs/${slug}`);
  return response.data;
};

// Get featured jobs
export const getFeaturedJobs = async (limit?: number): Promise<Job[]> => {
  const response = await apiClient.get('/jobs/featured', { params: { limit } });
  return response.data;
};

// Get job types
export const getJobTypes = async (): Promise<string[]> => {
  const response = await apiClient.get('/jobs/types');
  return response.data;
};

// Apply to a job
export const applyToJob = async (jobId: string, data: {
  coverLetter?: string;
  resumeUrl?: string;
}) => {
  const response = await apiClient.post(`/jobs/${jobId}/apply`, data);
  return response;
};

// Get my applications
export const getMyApplications = async (): Promise<JobApplication[]> => {
  const response = await apiClient.get('/jobs/applications/me');
  return response.data;
};

// Save a job
export const saveJob = async (jobId: string) => {
  const response = await apiClient.post(`/jobs/${jobId}/save`);
  return response;
};

// Unsave a job
export const unsaveJob = async (jobId: string) => {
  const response = await apiClient.delete(`/jobs/${jobId}/save`);
  return response;
};

// Get saved jobs
export const getSavedJobs = async (): Promise<Job[]> => {
  const response = await apiClient.get('/jobs/saved');
  return response.data;
};
