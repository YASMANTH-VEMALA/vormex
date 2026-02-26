'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  Clock, 
  DollarSign,
  Search,
  Filter,
  ChevronLeft,
  Bookmark,
  BookmarkCheck,
  Globe,
  Calendar,
  CheckCircle,
  Send,
  X,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as jobsAPI from '@/lib/api/jobs';

interface Company {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  website?: string;
  location?: string;
  industry?: string;
  size?: string;
  isVerified: boolean;
}

interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string[];
  type: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  isRemote: boolean;
  experienceLevel?: string;
  skills?: string[];
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
  company: Company;
}

interface Application {
  id: string;
  jobId: string;
  status: string;
  appliedAt: string;
  job: Job;
}

interface SavedJob {
  id: string;
  jobId: string;
  savedAt: string;
  job: Job;
}

const jobTypes = ['All', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'];
const experienceLevels = ['All', 'ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'];

function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'saved' | 'applications'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsRes, applicationsRes, savedRes] = await Promise.all([
        jobsAPI.getJobs(),
        jobsAPI.getMyApplications(),
        jobsAPI.getSavedJobs()
      ]);
      setJobs(Array.isArray(jobsRes) ? jobsRes : (jobsRes as any).jobs || []);
      setApplications(Array.isArray(applicationsRes) ? applicationsRes : (applicationsRes as any).applications || []);
      setSavedJobs(Array.isArray(savedRes) ? savedRes : (savedRes as any).savedJobs || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      showToast('Failed to load jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleApply = async (job: Job) => {
    try {
      setApplying(true);
      await jobsAPI.applyToJob(job.id, {});
      showToast(`Applied to ${job.title}!`, 'success');
      setSelectedJob(null);
      loadData();
    } catch (error) {
      console.error('Error applying:', error);
      showToast('Failed to apply', 'error');
    } finally {
      setApplying(false);
    }
  };

  const handleSaveJob = async (job: Job) => {
    try {
      const isSaved = savedJobs.some(s => s.jobId === job.id);
      if (isSaved) {
        await jobsAPI.unsaveJob(job.id);
        showToast('Job removed from saved', 'success');
      } else {
        await jobsAPI.saveJob(job.id);
        showToast('Job saved!', 'success');
      }
      loadData();
    } catch (error) {
      console.error('Error saving job:', error);
      showToast('Failed to save job', 'error');
    }
  };

  const isJobSaved = (jobId: string) => savedJobs.some(s => s.jobId === jobId);
  const hasApplied = (jobId: string) => applications.some(a => a.jobId === jobId);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || job.type === selectedType;
    const matchesLevel = selectedLevel === 'All' || job.experienceLevel === selectedLevel;
    return matchesSearch && matchesType && matchesLevel;
  });

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Competitive';
    if (min && max) return `$${(min/1000).toFixed(0)}k - $${(max/1000).toFixed(0)}k`;
    if (min) return `From $${(min/1000).toFixed(0)}k`;
    if (max) return `Up to $${(max/1000).toFixed(0)}k`;
  };

  const formatJobType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'REVIEWING': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'INTERVIEW': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'OFFERED': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'REJECTED': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neutral-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-20">
      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium ${
              toast.type === 'success' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60"
          >
            <div className="min-h-screen p-4 flex items-start justify-center pt-10">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="bg-white dark:bg-neutral-900 rounded-xl max-w-lg w-full border border-gray-200 dark:border-neutral-800"
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 p-4 rounded-t-xl flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Job Details</h2>
                  <button 
                    onClick={() => setSelectedJob(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-5">
                  {/* Company Info */}
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400 font-medium shrink-0">
                      {selectedJob.company.logo ? (
                        <img src={selectedJob.company.logo} alt={selectedJob.company.name} className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-0.5">{selectedJob.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedJob.company.name}</p>
                      {selectedJob.company.isVerified && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Job Meta */}
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 p-2 rounded-lg bg-gray-50 dark:bg-neutral-800">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedJob.location || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 p-2 rounded-lg bg-gray-50 dark:bg-neutral-800">
                      <Briefcase className="w-4 h-4" />
                      <span>{formatJobType(selectedJob.type)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 p-2 rounded-lg bg-gray-50 dark:bg-neutral-800">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatSalary(selectedJob.salaryMin, selectedJob.salaryMax)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 p-2 rounded-lg bg-gray-50 dark:bg-neutral-800">
                      <Clock className="w-4 h-4" />
                      <span>{selectedJob.experienceLevel || 'Any Level'}</span>
                    </div>
                  </div>

                  {selectedJob.isRemote && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium mb-5">
                      <Globe className="w-3.5 h-3.5" />
                      Remote Friendly
                    </div>
                  )}

                  {/* Description */}
                  <div className="mb-5">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{selectedJob.description}</p>
                  </div>

                  {/* Requirements */}
                  {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                    <div className="mb-5">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Requirements</h4>
                      <ul className="space-y-1.5">
                        {selectedJob.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills */}
                  {selectedJob.skills && selectedJob.skills.length > 0 && (
                    <div className="mb-5">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedJob.skills.map((skill, index) => (
                          <span 
                            key={index}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-neutral-800">
                    <button
                      onClick={() => handleSaveJob(selectedJob)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                        isJobSaved(selectedJob.id)
                          ? 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white'
                          : 'border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {isJobSaved(selectedJob.id) ? (
                        <>
                          <BookmarkCheck className="w-4 h-4" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </button>
                    
                    {hasApplied(selectedJob.id) ? (
                      <div className="flex-1 py-2.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        Applied
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApply(selectedJob)}
                        disabled={applying}
                        className="flex-1 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5"
                      >
                        {applying ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                            Applying...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Apply Now
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 px-4 py-3">
            <Link href="/more" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Job Board</h1>
              <p className="text-xs text-gray-500">{jobs.length} opportunities available</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-4 gap-2 pb-3">
            {[
              { id: 'browse', label: 'Browse', icon: <Briefcase className="w-4 h-4" /> },
              { id: 'saved', label: 'Saved', icon: <Bookmark className="w-4 h-4" /> },
              { id: 'applications', label: 'Applications', icon: <FileText className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        {activeTab === 'browse' && (
          <>
            {/* Search */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs or companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-neutral-600"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
                    : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800 space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-2 block">Job Type</label>
                      <div className="flex flex-wrap gap-1.5">
                        {jobTypes.map((type) => (
                          <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                              selectedType === type
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                            }`}
                          >
                            {type === 'All' ? 'All Types' : formatJobType(type)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-2 block">Experience Level</label>
                      <div className="flex flex-wrap gap-1.5">
                        {experienceLevels.map((level) => (
                          <button
                            key={level}
                            onClick={() => setSelectedLevel(level)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                              selectedLevel === level
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                            }`}
                          >
                            {level === 'All' ? 'All Levels' : level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Jobs List */}
            {filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <Briefcase className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No jobs found</h3>
                <p className="text-xs text-gray-500">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 transition-all cursor-pointer"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400 shrink-0">
                        {job.company.logo ? (
                          <img src={job.company.logo} alt={job.company.name} className="w-full h-full rounded-lg object-cover" />
                        ) : (
                          <Building2 className="w-5 h-5" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-0.5">{job.title}</h3>
                            <p className="text-xs text-gray-500">{job.company.name}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveJob(job);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                          >
                            {isJobSaved(job.id) ? (
                              <BookmarkCheck className="w-4 h-4 text-gray-900 dark:text-white" />
                            ) : (
                              <Bookmark className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.location || 'Remote'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {formatJobType(job.type)}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </span>
                        </div>

                        {job.skills && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.skills.slice(0, 3).map((skill, index) => (
                              <span 
                                key={index}
                                className="px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 3 && (
                              <span className="text-xs text-gray-400">+{job.skills.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'saved' && (
          <>
            {savedJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <Bookmark className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No saved jobs</h3>
                <p className="text-xs text-gray-500 mb-3">Save jobs to review them later</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {savedJobs.map((saved) => (
                  <motion.div
                    key={saved.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800 cursor-pointer"
                    onClick={() => setSelectedJob(saved.job)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400 shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-0.5">{saved.job.title}</h3>
                        <p className="text-xs text-gray-500 mb-1.5">{saved.job.company.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          Saved {new Date(saved.savedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveJob(saved.job);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <BookmarkCheck className="w-4 h-4 text-gray-900 dark:text-white" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'applications' && (
          <>
            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <FileText className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No applications yet</h3>
                <p className="text-xs text-gray-500 mb-3">Apply to jobs and track them here</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Find Jobs
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((application) => (
                  <motion.div
                    key={application.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400 shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-0.5">{application.job.title}</h3>
                        <p className="text-xs text-gray-500 mb-2">{application.job.company.name}</p>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusStyles(application.status)}`}>
                            {application.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            Applied {new Date(application.appliedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function JobsPageWrapper() {
  return (
    <ProtectedRoute>
      <JobsPage />
    </ProtectedRoute>
  );
}
