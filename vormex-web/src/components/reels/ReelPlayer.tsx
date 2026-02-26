'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Loader2, Play, Pause } from 'lucide-react';

interface ReelPlayerProps {
  hlsUrl: string | null;
  mp4Url: string;
  thumbnailUrl?: string | null;
  isActive: boolean;
  isMuted: boolean;
  onProgress?: (progress: number, watchTimeMs: number) => void;
  onComplete?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onMuteToggle?: () => void;
}

export function ReelPlayer({
  hlsUrl,
  mp4Url,
  thumbnailUrl,
  isActive,
  isMuted,
  onProgress,
  onComplete,
  onTap,
  onDoubleTap,
  onMuteToggle,
}: ReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  const lastTap = useRef(0);
  const watchTimeRef = useRef(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          if (isActive) {
            video.play().catch(() => {});
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.error('HLS error:', data);
            setError(true);
            video.src = mp4Url;
            video.load();
          }
        });

        hlsRef.current = hls;
      } else if (hlsUrl && video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        video.addEventListener('loadedmetadata', () => {
          setIsLoaded(true);
          if (isActive) {
            video.play().catch(() => {});
          }
        });
      } else {
        video.src = mp4Url;
        video.addEventListener('loadedmetadata', () => {
          setIsLoaded(true);
          if (isActive) {
            video.play().catch(() => {});
          }
        });
      }
    };

    initHls();

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [hlsUrl, mp4Url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isLoaded) return;

    if (isActive) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive, isLoaded]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentProgress = video.duration > 0 ? video.currentTime / video.duration : 0;
      watchTimeRef.current = video.currentTime * 1000;
      setProgress(currentProgress);
      onProgress?.(currentProgress, watchTimeRef.current);
    };

    const handleEnded = () => {
      onComplete?.();
      video.currentTime = 0;
      video.play().catch(() => {});
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onProgress, onComplete]);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const now = Date.now();
    
    if (now - lastTap.current < 300) {
      onDoubleTap?.();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current !== 0 && Date.now() - lastTap.current >= 300) {
          onTap?.();
          // Tap to pause/play
          const video = videoRef.current;
          if (video && isLoaded) {
            if (video.paused) {
              video.play().then(() => setIsPlaying(true)).catch(() => {});
            } else {
              video.pause();
              setIsPlaying(false);
            }
          }
          lastTap.current = 0;
        }
      }, 300);
    }

    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  }, [onTap, onDoubleTap, isLoaded]);

  const togglePlayPause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [isPlaying]);

  return (
    <div
      className="absolute inset-0 w-full h-full bg-black overflow-hidden flex items-center justify-center"
      onClick={handleTap}
    >
      {!isLoaded && thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        loop
        muted={isMuted}
        poster={thumbnailUrl || undefined}
        preload="metadata"
      />

      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {showControls && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={togglePlayPause}
            className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center pointer-events-auto transition-opacity"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" fill="white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="absolute bottom-20 left-4 right-4 text-center text-white/70 text-sm">
          Video playback error. Using fallback quality.
        </div>
      )}
    </div>
  );
}
