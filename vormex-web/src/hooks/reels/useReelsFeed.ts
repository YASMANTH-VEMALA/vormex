'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { reelsApi, Reel, ReelsFeedResponse } from '@/lib/api/reels';

interface UseReelsFeedOptions {
  mode?: 'foryou' | 'following';
  initialData?: Reel[];
  enabled?: boolean;
}

export function useReelsFeed({
  mode = 'foryou',
  initialData,
  enabled = true,
}: UseReelsFeedOptions = {}) {
  const query = useInfiniteQuery({
    queryKey: ['reels-feed', mode],
    queryFn: async ({ pageParam }) => {
      const response = await reelsApi.getFeed({ cursor: pageParam, limit: 10, mode });
      return response as unknown as ReelsFeedResponse;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 5,
    enabled,
    initialData: initialData
      ? {
          pages: [{ reels: initialData, nextCursor: null, hasMore: false }],
          pageParams: [undefined],
        }
      : undefined,
  });

  const reels = query.data?.pages.flatMap((p) => p.reels) ?? [];

  return {
    reels,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}

export function useTrendingReels(hours: number = 24) {
  const query = useInfiniteQuery({
    queryKey: ['reels-trending', hours],
    queryFn: async () => {
      const response = await reelsApi.getTrending({ hours, limit: 20 });
      return response as unknown as ReelsFeedResponse;
    },
    getNextPageParam: () => undefined,
    initialPageParam: undefined,
    staleTime: 1000 * 60 * 5,
  });

  const reels = query.data?.pages.flatMap((p) => p.reels) ?? [];

  return {
    reels,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useHashtagReels(hashtag: string) {
  const query = useInfiniteQuery({
    queryKey: ['reels-hashtag', hashtag],
    queryFn: async ({ pageParam }) => {
      const response = await reelsApi.getByHashtag(hashtag, { cursor: pageParam, limit: 20 });
      return response as unknown as ReelsFeedResponse;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 5,
    enabled: !!hashtag,
  });

  const reels = query.data?.pages.flatMap((p) => p.reels) ?? [];

  return {
    reels,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}

export function useAudioReels(audioId: string) {
  const query = useInfiniteQuery({
    queryKey: ['reels-audio', audioId],
    queryFn: async ({ pageParam }) => {
      const response = await reelsApi.getByAudio(audioId, { cursor: pageParam, limit: 20 });
      return response as unknown as ReelsFeedResponse;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 5,
    enabled: !!audioId,
  });

  const reels = query.data?.pages.flatMap((p) => p.reels) ?? [];

  return {
    reels,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}

export function useUserReels(userId: string) {
  const query = useInfiniteQuery({
    queryKey: ['reels-user', userId],
    queryFn: async ({ pageParam }) => {
      const response = await reelsApi.getUserReels(userId, { cursor: pageParam, limit: 20 });
      return response as unknown as ReelsFeedResponse;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });

  const reels = query.data?.pages.flatMap((p) => p.reels) ?? [];

  return {
    reels,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}
