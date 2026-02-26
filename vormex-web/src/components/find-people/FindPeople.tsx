'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  Loader2,
  Users,
  ChevronDown,
  Sparkles,
  GraduationCap,
  MapPin,
  RefreshCw,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { PersonCard } from './PersonCard';
import { PersonCardSkeleton } from './PersonCardSkeleton';
import { NearbyUsers } from './NearbyUsers';
import { SmartMatchesTab } from './SmartMatchesTab';
import {
  getPeople,
  getSuggestions,
  getPeopleFromSameCollege,
  getFilterOptions,
  type PersonCard as PersonCardType,
  type PeopleFilters,
  type FilterOptions,
} from '@/lib/api/people';
import { useAuth } from '@/lib/auth/useAuth';

type TabType = 'all' | 'smart' | 'suggestions' | 'college' | 'nearby';

const PEOPLE_STALE_TIME = 5 * 60 * 1000; // 5 min - instant back from profile

export function FindPeople() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam === 'college' ? 'college' : 'smart'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState<PersonCardType[]>([]);
  const [suggestions, setSuggestions] = useState<PersonCardType[]>([]);
  const [colleaguePeople, setColleaguePeople] = useState<PersonCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<PeopleFilters>({});
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Cached initial data - instant when navigating back from profile
  const { data: initialData, isLoading: initialLoading, isError: initialError, refetch: refetchInitial } = useQuery({
    queryKey: ['find-people-initial'],
    queryFn: async () => {
      const [allPeopleRes, suggestionsRes, collegeRes] = await Promise.all([
        getPeople({}, { page: 1, limit: 20 }),
        getSuggestions(10).catch(() => ({ suggestions: [] })),
        getPeopleFromSameCollege(10).catch(() => ({ people: [] })),
      ]);
      return {
        people: allPeopleRes.people,
        total: allPeopleRes.total,
        hasMore: allPeopleRes.hasMore,
        suggestions: suggestionsRes.suggestions,
        colleaguePeople: collegeRes.people,
      };
    },
    staleTime: PEOPLE_STALE_TIME,
    retry: 2,
  });

  // Sync cached data into local state when available (instant when navigating back)
  useEffect(() => {
    if (initialData) {
      setPeople(initialData.people);
      setTotal(initialData.total);
      setHasMore(initialData.hasMore);
      setSuggestions(initialData.suggestions);
      setColleaguePeople(initialData.colleaguePeople);
      setLoading(false);
    }
  }, [initialData]);

  // Show loading when fetching and no cached data; clear loading when query completes (success or error)
  useEffect(() => {
    if (!initialData && initialLoading) setLoading(true);
    if (!initialLoading) setLoading(false);
  }, [initialLoading, initialData]);

  // Open college tab when navigating from "See all from your campus"
  useEffect(() => {
    if (tabParam === 'college') setActiveTab('college');
  }, [tabParam]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const options = await getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      }
    };
    fetchFilterOptions();
  }, []);

  // Search with debounce
  const handleSearch = useCallback(async (query: string) => {
    if (activeTab !== 'all') return;
    
    setLoading(true);
    setPage(1);
    
    try {
      const currentFilters: PeopleFilters = {
        ...filters,
        search: query || undefined,
      };
      
      const result = await getPeople(currentFilters, { page: 1, limit: 20 });
      setPeople(result.people);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  // Debounced search - skip when empty search + no filters (use cached initialData)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    const hasFilters = selectedCollege || selectedBranch || selectedYear;
    if (!searchQuery && !hasFilters && activeTab === 'all') {
      if (initialData) {
        setPeople(initialData.people);
        setTotal(initialData.total);
        setHasMore(initialData.hasMore);
      }
      setLoading(false);
      return;
    }
    if (activeTab !== 'all') return;
    searchTimeoutRef.current = setTimeout(() => handleSearch(searchQuery), 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, activeTab, selectedCollege, selectedBranch, selectedYear, initialData, handleSearch]);

  // Apply filters
  const applyFilters = async () => {
    const newFilters: PeopleFilters = {
      search: searchQuery || undefined,
      college: selectedCollege || undefined,
      branch: selectedBranch || undefined,
      graduationYear: selectedYear,
    };
    
    setFilters(newFilters);
    setLoading(true);
    setPage(1);
    
    try {
      const result = await getPeople(newFilters, { page: 1, limit: 20 });
      setPeople(result.people);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to apply filters:', error);
    } finally {
      setLoading(false);
      setShowFilters(false);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedCollege('');
    setSelectedBranch('');
    setSelectedYear(undefined);
    setFilters({});
    handleSearch(searchQuery);
  };

  // Load more people
  const loadMore = async () => {
    if (loadingMore || !hasMore || activeTab !== 'all') return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const result = await getPeople(
        { ...filters, search: searchQuery || undefined },
        { page: nextPage, limit: 20 }
      );
      
      setPeople(prev => [...prev, ...result.people]);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && activeTab === 'all') {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, activeTab, page]);

  // Handle connection status change
  const handleConnectionChange = (personId: string, newStatus: string) => {
    // Update all lists
    const updateList = (list: PersonCardType[]) =>
      list.map(p =>
        p.id === personId ? { ...p, connectionStatus: newStatus as any } : p
      );
    
    setPeople(updateList);
    setSuggestions(updateList);
    setColleaguePeople(updateList);
  };

  // Get current display list (dedupe by id to avoid React key errors from API overlap)
  const getDisplayedPeople = () => {
    switch (activeTab) {
      case 'suggestions':
        return suggestions;
      case 'college':
        return colleaguePeople;
      default:
        return people;
    }
  };

  const displayedPeople = (() => {
    const list = getDisplayedPeople();
    const seen = new Set<string>();
    return list.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  })();
  const hasActiveFilters = selectedCollege || selectedBranch || selectedYear;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-neutral-800">
          <div className="p-4">
            {/* Title */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Find People
              </h1>
              {total > 0 && activeTab === 'all' && (
                <span className="text-sm text-gray-500 dark:text-neutral-400">
                  {total.toLocaleString()} people
                </span>
              )}
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
              <button
                onClick={() => setActiveTab('smart')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'smart'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                <Zap className="w-4 h-4" />
                Smart Matches
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                <Users className="w-4 h-4" />
                All People
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'suggestions'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                For You
              </button>
              <button
                onClick={() => setActiveTab('college')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'college'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Same Campus
              </button>
              <button
                onClick={() => setActiveTab('nearby')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'nearby'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Nearby
              </button>
            </div>
            
            {/* Search Bar (only for All tab) */}
            {activeTab === 'all' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, username, college, skills..."
                  className="w-full pl-10 pr-20 py-3 rounded-xl bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-full transition-colors ${
                      showFilters || hasActiveFilters
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-500'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && activeTab === 'all' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-gray-100 dark:border-neutral-800"
              >
                <div className="p-4 space-y-4">
                  {/* College Filter */}
                  {((filterOptions?.colleges?.length ?? 0) > 0 || user?.college) && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 block">
                        College
                      </label>
                      <select
                        value={selectedCollege}
                        onChange={(e) => setSelectedCollege(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Colleges</option>
                        {user?.college && (
                          <option value={user.college}>
                            My campus ({user.college})
                          </option>
                        )}
                        {filterOptions?.colleges
                          ?.filter((c) => c !== user?.college)
                          .map((college) => (
                            <option key={college} value={college}>
                              {college}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Branch Filter */}
                  {filterOptions?.branches && filterOptions.branches.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 block">
                        Branch
                      </label>
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Branches</option>
                        {filterOptions.branches.map((branch) => (
                          <option key={branch} value={branch}>
                            {branch}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Graduation Year Filter */}
                  {filterOptions?.graduationYears && filterOptions.graduationYears.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 block">
                        Graduation Year
                      </label>
                      <select
                        value={selectedYear || ''}
                        onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Years</option>
                        {filterOptions.graduationYears.sort((a, b) => b - a).map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Filter Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={applyFilters}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                      Apply Filters
                    </button>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Active Filters Display */}
          {hasActiveFilters && activeTab === 'all' && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCollege && (
                <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm rounded-full">
                  <GraduationCap className="w-3 h-3" />
                  {selectedCollege}
                  <button onClick={() => { setSelectedCollege(''); applyFilters(); }}>
                    <X className="w-3 h-3 ml-1" />
                  </button>
                </span>
              )}
              {selectedBranch && (
                <span className="flex items-center gap-1 px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm rounded-full">
                  {selectedBranch}
                  <button onClick={() => { setSelectedBranch(''); applyFilters(); }}>
                    <X className="w-3 h-3 ml-1" />
                  </button>
                </span>
              )}
              {selectedYear && (
                <span className="flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm rounded-full">
                  Class of {selectedYear}
                  <button onClick={() => { setSelectedYear(undefined); applyFilters(); }}>
                    <X className="w-3 h-3 ml-1" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Smart Matches Tab Content */}
          {activeTab === 'smart' && (
            <SmartMatchesTab />
          )}

          {/* Nearby Tab Content */}
          {activeTab === 'nearby' && (
            <NearbyUsers />
          )}

          {/* Skeleton Loading */}
          {activeTab !== 'nearby' && activeTab !== 'smart' && loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <PersonCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {activeTab !== 'nearby' && activeTab !== 'smart' && initialError && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Failed to load people
              </h3>
              <p className="text-gray-500 dark:text-neutral-400 max-w-md mx-auto mb-4">
                Something went wrong. Please try again.
              </p>
              <button
                onClick={() => refetchInitial()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {activeTab !== 'nearby' && activeTab !== 'smart' && !loading && !initialError && displayedPeople.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-300 dark:text-neutral-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {activeTab === 'suggestions'
                  ? 'No suggestions yet'
                  : activeTab === 'college'
                  ? 'No colleagues found'
                  : searchQuery
                  ? 'No results found'
                  : 'No people found'}
              </h3>
              <p className="text-gray-500 dark:text-neutral-400 max-w-md mx-auto">
                {activeTab === 'suggestions'
                  ? 'Complete your profile to get personalized suggestions'
                  : activeTab === 'college'
                  ? 'Add your college information to find colleagues'
                  : searchQuery
                  ? 'Try a different search term or adjust your filters'
                  : 'Check back later for new users'}
              </p>
            </div>
          )}

          {/* People Grid */}
          {activeTab !== 'nearby' && activeTab !== 'smart' && !loading && displayedPeople.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedPeople.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  onConnectionChange={handleConnectionChange}
                />
              ))}
            </div>
          )}

          {/* Load More Trigger */}
          {activeTab === 'all' && hasMore && !loading && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {loadingMore ? (
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              ) : (
                <button
                  onClick={loadMore}
                  className="flex items-center gap-2 px-6 py-2 text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Load more
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FindPeople;
