'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Flame, BookOpen, CheckCircle2, Clock, Star } from 'lucide-react';
import { accountabilityAPI, type AccountabilityPair, type MentorshipMatch } from '@/lib/api/accountability';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function PartnerCard({ pair, onCheckIn }: { pair: AccountabilityPair; onCheckIn: (id: string) => void }) {
  const router = useRouter();
  const needsCheckIn = !pair.lastCheckIn || (Date.now() - new Date(pair.lastCheckIn).getTime()) > 86400000;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden" onClick={() => router.push(`/profile/${pair.partner.username}`)}>
          {pair.partner.profileImage ? (
            <img src={pair.partner.profileImage} alt="" className="w-full h-full object-cover cursor-pointer" />
          ) : (
            <span className="font-bold text-gray-400 cursor-pointer">{pair.partner.name.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{pair.partner.name}</p>
          <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">{pair.partner.college || pair.partner.headline}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-orange-500">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-bold">{pair.sharedStreak}</span>
          </div>
          <p className="text-[10px] text-gray-400">day streak</p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-neutral-950 rounded-xl p-3 mb-3">
        <p className="text-xs text-gray-500 dark:text-neutral-400 mb-0.5">Shared Goal</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{pair.goal}</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-xs text-gray-500">
          <span>{pair.checkInsCompleted} check-ins</span>
          <span>Best: {pair.bestStreak} days</span>
        </div>
        {needsCheckIn && (
          <button
            onClick={() => onCheckIn(pair.id)}
            className="px-4 py-1.5 rounded-lg bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors"
          >
            Check In
          </button>
        )}
        {!needsCheckIn && (
          <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Done today
          </span>
        )}
      </div>
    </div>
  );
}

function MentorshipCard({ match }: { match: MentorshipMatch }) {
  const router = useRouter();
  const other = match.myRole === 'mentor' ? match.mentee : match.mentor;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => router.push(`/profile/${other.username}`)}>
          {other.profileImage ? (
            <img src={other.profileImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-gray-400">{other.name.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{other.name}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              match.myRole === 'mentor' 
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400' 
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
            }`}>
              {match.myRole === 'mentor' ? 'Your mentee' : 'Your mentor'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-neutral-400">{match.skill}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{match.sessionsCompleted}</p>
          <p className="text-[10px] text-gray-400">sessions</p>
        </div>
      </div>

      {match.rating && (
        <div className="flex items-center gap-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-3 h-3 ${i < Math.round(match.rating!) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountabilityContent() {
  const [tab, setTab] = useState<'partners' | 'mentorship'>('partners');
  const [partners, setPartners] = useState<AccountabilityPair[]>([]);
  const [mentorships, setMentorships] = useState<MentorshipMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await accountabilityAPI.getPartners();
      setPartners(data.partners);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMentorships = useCallback(async () => {
    try {
      const data = await accountabilityAPI.getMentorships();
      setMentorships(data.mentorships);
    } catch (error) {
      console.error('Failed to fetch mentorships:', error);
    }
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);
  useEffect(() => { if (tab === 'mentorship') fetchMentorships(); }, [tab, fetchMentorships]);

  const handleCheckIn = async (pairId: string) => {
    try {
      const result = await accountabilityAPI.checkIn(pairId);
      setPartners(prev => prev.map(p => 
        p.id === pairId ? { ...p, sharedStreak: result.streak, bestStreak: result.bestStreak, checkInsCompleted: result.checkInsCompleted, lastCheckIn: new Date().toISOString() } : p
      ));
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-24">
      <div className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Grow Together</h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400">Accountability partners & mentorship</p>

          <div className="flex bg-gray-100 dark:bg-neutral-800 rounded-xl p-1 mt-4">
            <button onClick={() => setTab('partners')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'partners' ? 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              <Flame className="w-4 h-4" /> Partners
            </button>
            <button onClick={() => setTab('mentorship')} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'mentorship' ? 'bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
              <BookOpen className="w-4 h-4" /> Mentorship
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 h-32 animate-pulse" />
          ))
        ) : tab === 'partners' ? (
          partners.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl block mb-3">🤝</span>
              <p className="font-medium text-gray-700 dark:text-neutral-300">No accountability partners yet</p>
              <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                Find someone with the same goal in Smart Matches and start an accountability partnership
              </p>
              <button onClick={() => window.location.href = '/find-people'} className="mt-4 px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-semibold">
                Find Partners
              </button>
            </div>
          ) : (
            partners.map(pair => (
              <motion.div key={pair.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <PartnerCard pair={pair} onCheckIn={handleCheckIn} />
              </motion.div>
            ))
          )
        ) : (
          mentorships.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl block mb-3">🧭</span>
              <p className="font-medium text-gray-700 dark:text-neutral-300">No mentorships yet</p>
              <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                Use &quot;Find Mentor&quot; in Smart Matches to connect with experienced people who can guide you
              </p>
              <button onClick={() => window.location.href = '/find-people'} className="mt-4 px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-semibold">
                Find Mentors
              </button>
            </div>
          ) : (
            mentorships.map(match => (
              <motion.div key={match.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <MentorshipCard match={match} />
              </motion.div>
            ))
          )
        )}
      </div>
    </div>
  );
}

export default function AccountabilityPage() {
  return (
    <ProtectedRoute>
      <AccountabilityContent />
    </ProtectedRoute>
  );
}
