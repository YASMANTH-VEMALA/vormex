// Profile Types - Complete TypeScript definitions for Profile API

export interface ProfileUser {
  id: string;
  username: string;
  name: string;
  email?: string; // Only included if viewing own profile
  avatar: string | null;
  bannerImageUrl: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  college: string;
  degree: string | null;
  branch: string;
  currentYear: number | null;
  graduationYear: number | null;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  githubProfileUrl: string | null;
  otherSocialUrls: SocialUrl[] | null;
  isOpenToOpportunities: boolean;
  profileVisibility: 'PUBLIC' | 'STUDENTS_ONLY' | 'CONNECTIONS';
  verified: boolean;
  interests: string[];
  profileRing?: string | null;
  hasClaimedWelcomeGift?: boolean;
  createdAt: string;
}

export interface SocialUrl {
  name: string;
  url: string;
}

export interface ProfileStats {
  xp: number;
  level: number;
  xpToNextLevel: number;
  totalPosts: number;
  totalArticles: number;
  totalShortVideos: number;
  totalForumQuestions: number;
  totalForumAnswers: number;
  totalComments: number;
  totalLikesReceived: number;
  connectionsCount: number;
  followersCount: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  totalActiveDays: number;
  replyRate?: number;
}

export interface GitHubProfile {
  connected: boolean;
  username: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
  stats: GitHubStats | null;
  lastSyncedAt: string | null;
}

export interface GitHubStats {
  totalPublicRepos: number;
  totalStars: number;
  totalForks: number;
  followers: number;
  following: number;
  topLanguages: Record<string, LanguageStat>;
  topRepos: TopRepo[];
}

export interface LanguageStat {
  bytes: number;
  percentage: number;
}

export interface TopRepo {
  name: string;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
  description: string | null;
}

export interface ActivityHeatmapDay {
  date: string;
  activityCount: number;
  isActive: boolean;
  level: 0 | 1 | 2 | 3;
  breakdown?: {
    posts: number;
    articles: number;
    comments: number;
    forumQuestions: number;
    forumAnswers: number;
    likes: number;
    messages: number;
  };
}

export interface UserSkill {
  id: string;
  skill: {
    id: string;
    name: string;
    category: string | null;
  };
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | null;
  yearsOfExp: number | null;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  type: 'Internship' | 'Part-time' | 'Full-time' | 'Freelance' | 'Contract';
  location: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  skills: string[];
  logo?: string | null;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  grade: string | null;
  activities: string | null;
  description: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  role: string | null;
  techStack: string[];
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  projectUrl: string | null;
  githubUrl: string | null;
  images: string[];
  otherLinks: { name: string; url: string }[] | null;
  featured: boolean;
}

export interface Certificate {
  id: string;
  name: string;
  issuingOrg: string;
  issueDate: string;
  expiryDate: string | null;
  doesNotExpire: boolean;
  credentialId: string | null;
  credentialUrl: string | null;
  color?: string | null;
}

export interface Achievement {
  id: string;
  title: string;
  type: 'Hackathon' | 'Competition' | 'Award' | 'Scholarship' | 'Recognition';
  organization: string;
  date: string;
  description: string | null;
  certificateUrl: string | null;
  color?: string | null;
}

export interface FeedItem {
  id: string;
  contentType: 'post' | 'article' | 'short_video' | 'forum_question' | 'forum_answer';
  title?: string;
  content: string;
  images?: string[];
  tags?: string[];
  likesCount?: number;
  commentsCount?: number;
  viewsCount?: number;
  questionId?: string;
  questionTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecentActivity {
  items: FeedItem[];
  totalCount: number;
  hasMore: boolean;
}

export interface FullProfileResponse {
  user: ProfileUser;
  stats: ProfileStats;
  github: GitHubProfile;
  activityHeatmap: ActivityHeatmapDay[];
  recentActivity: RecentActivity;
  skills: UserSkill[];
  experiences: Experience[];
  education: Education[];
  projects: Project[];
  certificates: Certificate[];
  achievements: Achievement[];
}

export interface ActivityYearsResponse {
  years: number[];
  joinedYear: number;
}

export interface ActivityHeatmapResponse {
  days: ActivityHeatmapDay[];
  stats: {
    totalContributions: number;
    currentStreak: number;
    longestStreak: number;
    contributionLevels: {
      level0: number;
      level1: number;
      level2: number;
      level3: number;
    };
  };
}

// Profile Update Types
export interface ProfileUpdateData {
  headline?: string;
  bio?: string;
  location?: string;
  currentYear?: number;
  degree?: string;
  graduationYear?: number;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubProfileUrl?: string;
  profileVisibility?: 'PUBLIC' | 'STUDENTS_ONLY' | 'CONNECTIONS';
  isOpenToOpportunities?: boolean;
  interests?: string[];
  profileRing?: 'original' | 'hue';
  hasClaimedWelcomeGift?: boolean;
}

export interface SkillInput {
  skillName: string;
  proficiency?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsOfExp?: number;
}

export interface ExperienceInput {
  title: string;
  company: string;
  type: 'Internship' | 'Part-time' | 'Full-time' | 'Freelance' | 'Contract';
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  skills?: string[];
  logo?: string;
}

export interface EducationInput {
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  grade?: string;
  activities?: string;
  description?: string;
}

export interface ProjectInput {
  name: string;
  description: string;
  role?: string;
  techStack?: string[];
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  projectUrl?: string;
  githubUrl?: string;
  images?: string[];
  featured?: boolean;
}

export interface CertificateInput {
  name: string;
  issuingOrg: string;
  issueDate: string;
  expiryDate?: string;
  doesNotExpire?: boolean;
  credentialId?: string;
  credentialUrl?: string;
  color?: string;
}

export interface AchievementInput {
  title: string;
  type: 'Hackathon' | 'Competition' | 'Award' | 'Scholarship' | 'Recognition';
  organization: string;
  date: string;
  description?: string;
  certificateUrl?: string;
  color?: string;
}

