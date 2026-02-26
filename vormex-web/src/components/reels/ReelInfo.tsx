'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Music, MapPin, ChevronDown, ChevronUp, Code, ExternalLink, Loader2 } from 'lucide-react';
import { Reel } from '@/lib/api/reels';
import { followUser, unfollowUser } from '@/lib/api/follow';
import { useAuth } from '@/lib/auth/useAuth';

interface ReelInfoProps {
  reel: Reel;
  onAudioClick?: () => void;
  onHashtagClick?: (hashtag: string) => void;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function ReelInfo({ reel, onAudioClick, onHashtagClick, onFollowChange }: ReelInfoProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(reel.author.isFollowing ?? false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const isOwnReel = user?.id === reel.author.id;

  useEffect(() => {
    setIsFollowing(reel.author.isFollowing ?? false);
  }, [reel.author.id, reel.author.isFollowing]);

  const handleFollowClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOwnReel || isFollowLoading) return;
      setIsFollowLoading(true);
      try {
        if (isFollowing) {
          await unfollowUser(reel.author.id);
          setIsFollowing(false);
          onFollowChange?.(false);
        } else {
          await followUser(reel.author.id);
          setIsFollowing(true);
          onFollowChange?.(true);
        }
      } catch (err) {
        console.error('Follow error:', err);
      } finally {
        setIsFollowLoading(false);
      }
    },
    [reel.author.id, isFollowing, isFollowLoading, isOwnReel, onFollowChange]
  );
  const maxLength = 100;
  const shouldTruncate = reel.caption && reel.caption.length > maxLength;

  const displayCaption = shouldTruncate && !isExpanded
    ? reel.caption?.slice(0, maxLength) + '...'
    : reel.caption;

  const renderHashtags = (text: string | null) => {
    if (!text) return null;
    
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        const tag = part.slice(1);
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              onHashtagClick?.(tag);
            }}
            className="text-white font-semibold hover:underline"
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderMentions = (text: string | null) => {
    if (!text) return null;
    
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <Link
            key={index}
            href={`/profile/${username}`}
            onClick={(e) => e.stopPropagation()}
            className="text-blue-400 font-semibold hover:underline"
          >
            {part}
          </Link>
        );
      }
      return renderHashtags(part);
    });
  };

  return (
    <div className="flex flex-col gap-3 max-w-[calc(100%-80px)]">
      <div className="flex items-center gap-3">
        <Link
          href={`/profile/${reel.author.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white flex-shrink-0">
            <img
              src={reel.author.profileImage || '/default-avatar.png'}
              alt={reel.author.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white font-semibold text-sm truncate">
              {reel.author.username}
            </span>
            {reel.author.headline && (
              <span className="text-white/70 text-xs line-clamp-1">
                {reel.author.headline}
              </span>
            )}
          </div>
        </Link>
        {!isOwnReel && (
          <button
            type="button"
            onClick={handleFollowClick}
            disabled={isFollowLoading}
            className={`ml-2 px-4 py-1 text-xs font-semibold rounded-full transition-colors flex-shrink-0 ${
              isFollowing
                ? 'bg-white/20 text-white border border-white/40'
                : 'bg-white text-black hover:bg-white/90'
            } disabled:opacity-50`}
          >
            {isFollowLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isFollowing ? (
              'Following'
            ) : (
              'Follow'
            )}
          </button>
        )}
      </div>

      {reel.title && (
        <h3 className="text-white font-semibold text-base">
          {reel.title}
        </h3>
      )}

      {reel.caption && (
        <div className="text-white text-sm leading-relaxed">
          {renderMentions(displayCaption)}
          {shouldTruncate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="ml-1 text-white/70 hover:text-white inline-flex items-center gap-0.5"
            >
              {isExpanded ? (
                <>less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>more <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>
      )}

      {reel.hashtags && reel.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {reel.hashtags.map((tag) => (
            <button
              key={tag}
              onClick={(e) => {
                e.stopPropagation();
                onHashtagClick?.(tag);
              }}
              className="text-white/90 text-sm hover:text-white"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {reel.codeSnippet && (
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <Code className="w-4 h-4" />
          <span>{reel.codeLanguage || 'Code'}</span>
          {reel.codeFileName && (
            <span className="text-white/60">• {reel.codeFileName}</span>
          )}
          {reel.repoUrl && (
            <a
              href={reel.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-1 hover:text-white"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {reel.locationName && (
        <div className="flex items-center gap-1 text-white/70 text-sm">
          <MapPin className="w-4 h-4" />
          <span>{reel.locationName}</span>
        </div>
      )}

      {reel.audio && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAudioClick?.();
          }}
          className="flex items-center gap-2 text-white/90 text-sm hover:text-white overflow-hidden"
        >
          <div className="flex items-center gap-2 animate-marquee">
            <Music className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">
              {reel.audio.title}
              {reel.audio.artist && ` • ${reel.audio.artist}`}
            </span>
          </div>
        </button>
      )}

      {reel.ctaType && reel.ctaText && reel.ctaUrl && (
        <a
          href={reel.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-colors w-fit"
        >
          {reel.ctaText}
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}
