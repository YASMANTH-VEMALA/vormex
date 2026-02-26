'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Hls from 'hls.js';

interface UseReelPlayerOptions {
  hlsUrl: string | null;
  mp4Url: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

interface UseReelPlayerReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  isLoaded: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
  duration: number;
  currentTime: number;
  error: Error | null;
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => void;
  toggleMute: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
}

export function useReelPlayer({
  hlsUrl,
  mp4Url,
  autoPlay = false,
  muted = true,
  loop = true,
}: UseReelPlayerOptions): UseReelPlayerReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const initHls = () => {
      if (hlsUrl && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          startLevel: -1,
          capLevelToPlayerSize: true,
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoaded(true);
          setError(null);
          if (autoPlay) {
            video.play().catch(() => {});
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.error('HLS error:', data);
            setError(new Error('HLS playback failed'));
            video.src = mp4Url;
            video.load();
          }
        });

        hlsRef.current = hls;
      } else if (hlsUrl && video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
      } else {
        video.src = mp4Url;
      }
    };

    const handleLoadedMetadata = () => {
      setIsLoaded(true);
      setDuration(video.duration);
      if (autoPlay) {
        video.play().catch(() => {});
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress(video.duration > 0 ? video.currentTime / video.duration : 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      if (loop) {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    };
    const handleError = () => {
      setError(new Error('Video playback error'));
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    initHls();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [hlsUrl, mp4Url, autoPlay, loop]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const play = useCallback(async () => {
    if (videoRef.current) {
      await videoRef.current.play();
    }
  }, []);

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  return {
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    isLoaded,
    isPlaying,
    isMuted,
    progress,
    duration,
    currentTime,
    error,
    play,
    pause,
    togglePlay,
    toggleMute,
    seek,
    setVolume,
  };
}
