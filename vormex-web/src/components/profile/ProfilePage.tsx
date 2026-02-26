'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import {
  getProfile,
  getActivityHeatmap,
  getActivityYears,
  syncGitHubStats,
  startGitHubOAuth,
  updateProfile,
  deleteSkill,
  deleteProject
} from '@/lib/api/profile';
import { ProfileHeader } from './ProfileHeader';
import { ProfileAbout } from './ProfileAbout';
import { GitHubStats } from './GitHubStats';
import { ActivityCalendar } from './ActivityCalendar';
import { SkillsGrid } from './SkillsGrid';
import { ProjectsGrid } from './ProjectsGrid';
import { ExperienceTimeline } from './ExperienceTimeline';
import { EducationTimeline } from './EducationTimeline';
import { CertificatesGrid } from './CertificatesGrid';
import { Achievements } from './Achievements';
import { ProfileFeed } from './ProfileFeed';
import { EditProfileModal } from './EditProfileModal';
import { AddProjectModal } from './AddProjectModal';
import { AddSkillModal } from './AddSkillModal';
import { AddExperienceModal } from './AddExperienceModal';
import { AddEducationModal } from './AddEducationModal';
import { AddAchievementModal } from './AddAchievementModal';
import { AddCertificateModal } from './AddCertificateModal';
import { ImageUploadModal } from './ImageUploadModal';
import { ProfileSkeleton } from './ProfileSkeleton';
import { Button } from '@/components/ui/Button';
import type { FullProfileResponse, ActivityHeatmapDay, ActivityYearsResponse, Project, UserSkill, Experience, Education, Achievement, Certificate } from '@/types/profile';

interface ProfilePageProps {
  userId?: string; // If not provided, shows current user's profile
}

export function ProfilePage({ userId }: ProfilePageProps) {
  const { user: authUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<FullProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addProjectModalOpen, setAddProjectModalOpen] = useState(false);
  const [addSkillModalOpen, setAddSkillModalOpen] = useState(false);
  const [addExperienceModalOpen, setAddExperienceModalOpen] = useState(false);
  const [addEducationModalOpen, setAddEducationModalOpen] = useState(false);
  const [addAchievementModalOpen, setAddAchievementModalOpen] = useState(false);
  const [addCertificateModalOpen, setAddCertificateModalOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);

  // Edit State
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [skillToEdit, setSkillToEdit] = useState<UserSkill | null>(null);
  const [certificateToEdit, setCertificateToEdit] = useState<Certificate | null>(null);
  const [achievementToEdit, setAchievementToEdit] = useState<Achievement | null>(null);

  // Activity calendar state
  const [activityData, setActivityData] = useState<ActivityHeatmapDay[]>([]);
  const [availableYears, setAvailableYears] = useState<ActivityYearsResponse | null>(null);

  // Handler for avatar update
  const handleAvatarUpdated = (avatarUrl: string) => {
    if (profile) {
      setProfile({
        ...profile,
        user: { ...profile.user, avatar: avatarUrl },
      });
    }
  };

  // Handler for banner update
  const handleBannerUpdated = (bannerUrl: string) => {
    if (profile) {
      setProfile({
        ...profile,
        user: { ...profile.user, bannerImageUrl: bannerUrl },
      });
    }
  };

  // --- Projects ---
  const handleProjectAdded = (project: Project) => {
    if (profile) {
      setProfile({
        ...profile,
        projects: [project, ...profile.projects],
      });
    }
  };

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setAddProjectModalOpen(true);
  };

  const handleProjectUpdated = (updatedProject: Project) => {
    if (profile) {
      setProfile({
        ...profile,
        projects: profile.projects.map(p => p.id === updatedProject.id ? updatedProject : p)
      });
    }
  };

  const handleProjectDeleted = (projectId: string) => {
    if (profile) {
      setProfile({
        ...profile,
        projects: profile.projects.filter(p => p.id !== projectId)
      });
    }
  };

  // --- Skills ---
  const handleSkillAdded = (skill: UserSkill) => {
    if (profile) {
      setProfile({
        ...profile,
        skills: [...profile.skills, skill],
      });
    }
  };

  const handleEditSkill = (skill: UserSkill) => {
    setSkillToEdit(skill);
    setAddSkillModalOpen(true);
  };

  const handleSkillUpdated = (updatedSkill: UserSkill) => {
    if (profile) {
      setProfile({
        ...profile,
        skills: profile.skills.map(s => s.id === updatedSkill.id ? updatedSkill : s)
      });
    }
  };

  const handleRemoveSkill = async (id: string) => {
    if (!profile) return;
    if (!confirm('Are you sure you want to remove this skill?')) return;

    const originalSkills = profile.skills;
    // Optimistic
    setProfile({ ...profile, skills: profile.skills.filter(s => s.id !== id) });

    try {
      await deleteSkill(id);
    } catch (err) {
      // Revert
      setProfile({ ...profile, skills: originalSkills });
      console.error("Failed to delete skill", err);
    }
  };

  // Also handle delete from within modal
  const handleSkillDeletedFromModal = (id: string) => {
    if (profile) {
      setProfile({
        ...profile,
        skills: profile.skills.filter(s => s.id !== id)
      });
    }
  };


  // --- Interests ---
  const handleInterestAdded = (interest: string) => {
    if (profile) {
      setProfile({
        ...profile,
        user: {
          ...profile.user,
          interests: [...(profile.user.interests || []), interest],
        },
      });
      fetchProfile();
    }
  };

  const handleRemoveInterest = async (interest: string) => {
    if (!profile) return;
    if (!confirm(`Remove interest "${interest}"?`)) return;

    const newInterests = profile.user.interests?.filter(i => i !== interest) || [];
    // Optimistic
    setProfile({
      ...profile,
      user: { ...profile.user, interests: newInterests }
    });

    try {
      await updateProfile({ interests: newInterests });
    } catch (err) {
      fetchProfile(); // Revert/Refresh
    }
  };


  // --- Other Handlers ---
  const handleExperienceAdded = (experience: Experience) => {
    if (profile) {
      setProfile({
        ...profile,
        experiences: [experience, ...profile.experiences],
      });
    }
  };

  const handleEducationAdded = (education: Education) => {
    if (profile) {
      setProfile({
        ...profile,
        education: [education, ...profile.education],
      });
    }
  };

  const handleAchievementAdded = (achievement: Achievement) => {
    if (profile) {
      setProfile({
        ...profile,
        achievements: [achievement, ...profile.achievements],
      });
    }
  };

  const handleCertificateAdded = (certificate: Certificate) => {
    if (profile) {
      setProfile({
        ...profile,
        certificates: [certificate, ...profile.certificates],
      });
    }
  };

  const handleEditCertificate = (certificate: Certificate) => {
    setCertificateToEdit(certificate);
    setAddCertificateModalOpen(true);
  };

  const handleEditAchievement = (achievement: Achievement) => {
    setAchievementToEdit(achievement);
    setAddAchievementModalOpen(true);
  };

  const handleCertificateUpdated = (updatedCertificate: Certificate) => {
    if (!profile) return;
    setProfile({
      ...profile,
      certificates: profile.certificates.map((c) =>
        c.id === updatedCertificate.id ? updatedCertificate : c
      ),
    });
  };

  const handleAchievementUpdated = (updatedAchievement: Achievement) => {
    if (!profile) return;
    setProfile({
      ...profile,
      achievements: profile.achievements.map((a) =>
        a.id === updatedAchievement.id ? updatedAchievement : a
      ),
    });
  };

  // Determine if viewing own profile
  const targetUserId = userId ? userId : (isAuthenticated && authUser?.id ? authUser.id : null);
  const isOwner = isAuthenticated && authUser && authUser.id === targetUserId;

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    console.log('ProfilePage - fetchProfile called', {
      targetUserId,
      authUser,
      isAuthenticated,
      isOwner,
    });

    if (!targetUserId) {
      console.log('No targetUserId, not authenticated or no user ID provided');
      setLoading(false);
      if (!userId) {
        setError('Please login to view your profile.');
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } else {
        setError('Invalid user ID provided.');
      }
      return;
    }

    setLoading(true);
    setError(null);
    setIsPrivate(false);

    try {
      console.log('Fetching profile for:', targetUserId);
      const data = await getProfile(targetUserId);
      console.log('Profile API response - user.profileRing:', data?.user?.profileRing);
      setProfile(data);
      setActivityData(data.activityHeatmap || []);
      setLoading(false);

      getActivityYears(data.user.id)
        .then(years => setAvailableYears(years))
        .catch(err => console.error('Failed to fetch activity years:', err));
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      if (err.response?.status === 403) {
        setIsPrivate(true);
        setError(err.response?.data?.error || 'This profile is private.');
      } else if (err.response?.status === 404) {
        setError('User not found.');
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to load profile.');
      }
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchProfile();
    
    // Handle GitHub OAuth callback
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const githubStatus = urlParams.get('github');
      const githubMessage = urlParams.get('message');
      
      if (githubStatus === 'connected') {
        console.log('GitHub connected successfully, refreshing profile...');
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
        // Refetch profile to get updated GitHub data
        setTimeout(() => fetchProfile(), 500);
      } else if (githubStatus === 'error') {
        console.error('GitHub connection error:', githubMessage);
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [fetchProfile]);

  const [activityLoading, setActivityLoading] = useState(false);

  // Handle year change for activity calendar
  const handleYearChange = async (year: number | null) => {
    if (!profile) return;
    setActivityLoading(true);

    try {
      const data = await getActivityHeatmap(profile.user.id, year || undefined);
      setActivityData(data.days || []);
    } catch (err) {
      console.error('Failed to fetch activity data:', err);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleGitHubSync = async () => {
    try {
      await syncGitHubStats();
      fetchProfile();
    } catch (err) {
      console.error('Failed to sync GitHub:', err);
    }
  };

  const handleGitHubConnect = async () => {
    try {
      const { authUrl } = await startGitHubOAuth();
      window.location.href = authUrl;
    } catch (err) {
      console.error('Failed to start GitHub OAuth:', err);
    }
  };

  const handleProfileUpdate = (updatedData: Partial<FullProfileResponse['user']>) => {
    if (profile) {
      setProfile({
        ...profile,
        user: { ...profile.user, ...updatedData },
      });
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (isPrivate) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-gray-500 dark:text-gray-500 dark:text-neutral-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white mb-2">Private Profile</h2>
          <p className="text-gray-600 dark:text-gray-600 dark:text-neutral-400 mb-6">{error}</p>
          {!isAuthenticated && (
            <Button
              onClick={() => window.location.href = '/login'}
              className="bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white"
            >
              Sign in to view
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-600 dark:text-neutral-400 mb-6">{error || 'Something went wrong.'}</p>
          <Button
            onClick={fetchProfile}
            className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-100 dark:bg-neutral-800 dark:hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-900 dark:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 pb-24 overflow-x-hidden">
      <ProfileHeader
        user={{
          ...profile.user,
          profileRing: profile.user.profileRing ?? (isOwner ? (authUser as { profileRing?: string })?.profileRing : undefined),
        }}
        stats={profile.stats}
        isOwner={!!isOwner}
        onEditProfile={() => setEditModalOpen(true)}
        onEditAvatar={() => setAvatarModalOpen(true)}
        onEditBanner={() => setBannerModalOpen(true)}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6"
        >
          {/* About Section (Bio & Interests) */}
          <ProfileAbout
            user={profile.user}
            stats={profile.stats}
            isOwner={!!isOwner}
            onRemoveInterest={handleRemoveInterest}
          />

          <GitHubStats
            github={profile.github}
            isOwner={!!isOwner}
            onSync={handleGitHubSync}
            onConnect={handleGitHubConnect}
          />

          <ActivityCalendar
            userId={profile.user.id}
            activityData={activityData}
            currentStreak={profile.stats.currentStreak}
            longestStreak={profile.stats.longestStreak}
            onYearChange={handleYearChange}
            availableYears={availableYears || undefined}
            isLoading={activityLoading}
          />

          <SkillsGrid
            skills={profile.skills}
            isOwner={!!isOwner}
            onAddSkill={() => {
              setSkillToEdit(null);
              setAddSkillModalOpen(true);
            }}
            onRemoveSkill={handleRemoveSkill}
            onEditSkill={handleEditSkill}
          />

          <ProjectsGrid
            projects={profile.projects}
            isOwner={!!isOwner}
            onAddProject={() => {
              setProjectToEdit(null);
              setAddProjectModalOpen(true);
            }}
            onEditProject={handleEditProject}
          />

          <ExperienceTimeline
            experiences={profile.experiences}
            isOwner={!!isOwner}
            onAddExperience={() => setAddExperienceModalOpen(true)}
          />

          <EducationTimeline
            education={profile.education}
            isOwner={!!isOwner}
            onAddEducation={() => setAddEducationModalOpen(true)}
          />

          <CertificatesGrid
            certificates={profile.certificates}
            isOwner={!!isOwner}
            onAddCertificate={() => {
              setCertificateToEdit(null);
              setAddCertificateModalOpen(true);
            }}
            onEditCertificate={handleEditCertificate}
          />

          <Achievements
            achievements={profile.achievements}
            isOwner={!!isOwner}
            onAddAchievement={() => {
              setAchievementToEdit(null);
              setAddAchievementModalOpen(true);
            }}
            onEditAchievement={handleEditAchievement}
          />

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Activity Feed</h2>
            <ProfileFeed
              userId={profile.user.id}
              initialFeed={profile.recentActivity}
            />
          </div>
        </motion.div>
      </div>

      {isOwner && profile && (
        <EditProfileModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          user={profile.user}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {/* Add/Edit Project Modal */}
      {isOwner && (
        <AddProjectModal
          isOpen={addProjectModalOpen}
          onClose={() => {
            setAddProjectModalOpen(false);
            setProjectToEdit(null);
          }}
          onProjectAdded={handleProjectAdded}
          onProjectUpdated={handleProjectUpdated}
          onProjectDeleted={handleProjectDeleted}
          projectToEdit={projectToEdit}
        />
      )}

      {/* Add/Edit Skill Modal */}
      {isOwner && profile && (
        <AddSkillModal
          isOpen={addSkillModalOpen}
          onClose={() => {
            setAddSkillModalOpen(false);
            setSkillToEdit(null);
          }}
          onSkillAdded={handleSkillAdded}
          onSkillUpdated={handleSkillUpdated}
          onSkillDeleted={handleSkillDeletedFromModal}
          onInterestAdded={handleInterestAdded}
          existingSkills={profile.skills.map(s => s.skill.name)}
          existingInterests={profile.user.interests || []}
          skillToEdit={skillToEdit}
        />
      )}

      {isOwner && (
        <AddExperienceModal
          isOpen={addExperienceModalOpen}
          onClose={() => setAddExperienceModalOpen(false)}
          onExperienceAdded={handleExperienceAdded}
        />
      )}

      {isOwner && (
        <AddEducationModal
          isOpen={addEducationModalOpen}
          onClose={() => setAddEducationModalOpen(false)}
          onEducationAdded={handleEducationAdded}
        />
      )}

      {isOwner && (
        <AddAchievementModal
          isOpen={addAchievementModalOpen}
          onClose={() => {
            setAddAchievementModalOpen(false);
            setAchievementToEdit(null);
          }}
          onAchievementAdded={handleAchievementAdded}
          achievementToEdit={achievementToEdit}
          onAchievementUpdated={handleAchievementUpdated}
        />
      )}

      {isOwner && (
        <AddCertificateModal
          isOpen={addCertificateModalOpen}
          onClose={() => {
            setAddCertificateModalOpen(false);
            setCertificateToEdit(null);
          }}
          onCertificateAdded={handleCertificateAdded}
          certificateToEdit={certificateToEdit}
          onCertificateUpdated={handleCertificateUpdated}
        />
      )}

      {isOwner && profile && (
        <ImageUploadModal
          isOpen={avatarModalOpen}
          onClose={() => setAvatarModalOpen(false)}
          type="avatar"
          currentImageUrl={profile.user.avatar}
          onImageUpdated={handleAvatarUpdated}
        />
      )}

      {isOwner && profile && (
        <ImageUploadModal
          isOpen={bannerModalOpen}
          onClose={() => setBannerModalOpen(false)}
          type="banner"
          currentImageUrl={profile.user.bannerImageUrl}
          onImageUpdated={handleBannerUpdated}
        />
      )}
    </div>
  );
}
