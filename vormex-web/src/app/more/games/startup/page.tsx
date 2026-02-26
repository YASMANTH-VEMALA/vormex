'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  TrendingUp,
  Zap,
  Trophy,
  DollarSign,
  Users,
  Rocket,
  Building2,
  Code,
  Megaphone,
  Cpu,
  Shield,
  Briefcase,
  Target,
  ChevronRight,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Star,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import confetti from 'canvas-confetti';

type GamePhase = 'setup' | 'playing' | 'event' | 'milestone' | 'ended';

interface StartupState {
  name: string;
  industry: string;
  cash: number;
  revenue: number;
  users: number;
  employees: number;
  reputation: number;
  techLevel: number;
  marketingLevel: number;
  month: number;
  valuation: number;
}

interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'challenge' | 'news';
  choices: {
    id: string;
    text: string;
    effects: Partial<StartupState>;
    xpReward: number;
  }[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  requirement: (state: StartupState) => boolean;
  xpReward: number;
  achieved: boolean;
}

const INDUSTRIES = [
  { id: 'saas', name: 'SaaS', icon: Code, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'fintech', name: 'Fintech', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  { id: 'ai', name: 'AI/ML', icon: Cpu, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  { id: 'security', name: 'Cybersecurity', icon: Shield, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
];

const GAME_EVENTS: GameEvent[] = [
  {
    id: 'investor',
    title: 'Investor Interest',
    description: 'A VC firm wants to invest $500K for 15% equity. Do you accept?',
    type: 'opportunity',
    choices: [
      { id: 'accept', text: 'Accept the deal', effects: { cash: 500000, reputation: 10 }, xpReward: 20 },
      { id: 'negotiate', text: 'Negotiate for better terms', effects: { cash: 350000, reputation: 15 }, xpReward: 30 },
      { id: 'decline', text: 'Decline and bootstrap', effects: { reputation: 5 }, xpReward: 10 },
    ],
  },
  {
    id: 'competitor',
    title: 'Competitor Launches',
    description: 'A well-funded competitor just launched a similar product. How do you respond?',
    type: 'challenge',
    choices: [
      { id: 'innovate', text: 'Accelerate innovation', effects: { cash: -50000, techLevel: 2 }, xpReward: 25 },
      { id: 'marketing', text: 'Double down on marketing', effects: { cash: -30000, marketingLevel: 2, users: 5000 }, xpReward: 20 },
      { id: 'niche', text: 'Focus on niche market', effects: { users: 2000, reputation: 10 }, xpReward: 15 },
    ],
  },
  {
    id: 'viral',
    title: 'Viral Moment',
    description: 'Your product just went viral on social media! Quick, capitalize on it!',
    type: 'opportunity',
    choices: [
      { id: 'scale', text: 'Scale servers immediately', effects: { cash: -100000, users: 50000 }, xpReward: 40 },
      { id: 'press', text: 'Hire PR firm', effects: { cash: -50000, reputation: 30, users: 20000 }, xpReward: 30 },
      { id: 'wait', text: 'Wait and see', effects: { users: 10000 }, xpReward: 10 },
    ],
  },
  {
    id: 'talent',
    title: 'Key Hire Available',
    description: 'A senior engineer from a FAANG company wants to join. Salary: $200K/year',
    type: 'opportunity',
    choices: [
      { id: 'hire', text: 'Make the hire', effects: { cash: -200000, employees: 1, techLevel: 3 }, xpReward: 35 },
      { id: 'equity', text: 'Offer more equity, less cash', effects: { cash: -100000, employees: 1, techLevel: 2 }, xpReward: 25 },
      { id: 'pass', text: 'Pass on this one', effects: {}, xpReward: 5 },
    ],
  },
  {
    id: 'bug',
    title: 'Critical Bug Found',
    description: 'Users discovered a major security vulnerability. How do you handle it?',
    type: 'challenge',
    choices: [
      { id: 'transparent', text: 'Be transparent, fix immediately', effects: { cash: -50000, reputation: 20 }, xpReward: 40 },
      { id: 'quiet', text: 'Fix quietly', effects: { cash: -20000, reputation: -10 }, xpReward: 10 },
      { id: 'downplay', text: 'Downplay the issue', effects: { reputation: -30, users: -10000 }, xpReward: 0 },
    ],
  },
  {
    id: 'acquisition',
    title: 'Acquisition Offer',
    description: 'A big tech company wants to acquire you for $5M. Your current valuation is $3M.',
    type: 'opportunity',
    choices: [
      { id: 'sell', text: 'Accept the offer', effects: { cash: 5000000 }, xpReward: 100 },
      { id: 'counter', text: 'Counter with $8M', effects: { reputation: 10 }, xpReward: 20 },
      { id: 'decline', text: 'Decline, keep building', effects: { reputation: 15, techLevel: 1 }, xpReward: 30 },
    ],
  },
];

const MILESTONES: Omit<Milestone, 'achieved'>[] = [
  { id: 'first-revenue', title: 'First Revenue', description: 'Generate your first $1,000', requirement: (s) => s.revenue >= 1000, xpReward: 50 },
  { id: 'first-users', title: '1K Users', description: 'Reach 1,000 users', requirement: (s) => s.users >= 1000, xpReward: 50 },
  { id: 'team-growth', title: 'Growing Team', description: 'Hire 5 employees', requirement: (s) => s.employees >= 5, xpReward: 75 },
  { id: 'profitable', title: 'Profitable', description: 'Achieve positive cash flow', requirement: (s) => s.revenue > 0 && s.cash > 100000, xpReward: 100 },
  { id: 'unicorn', title: 'Unicorn Status', description: 'Reach $1B valuation', requirement: (s) => s.valuation >= 1000000000, xpReward: 500 },
];

export default function StartupSimulatorPage() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [startup, setStartup] = useState<StartupState>({
    name: '',
    industry: '',
    cash: 50000,
    revenue: 0,
    users: 0,
    employees: 1,
    reputation: 50,
    techLevel: 1,
    marketingLevel: 1,
    month: 1,
    valuation: 50000,
  });
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [startupName, setStartupName] = useState('');
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>(
    MILESTONES.map(m => ({ ...m, achieved: false }))
  );
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [achievedMilestone, setAchievedMilestone] = useState<Milestone | null>(null);

  // Game tick - simulate monthly progress
  useEffect(() => {
    if (gamePhase !== 'playing' || isPaused) return;

    const tickInterval = 3000 / gameSpeed; // 3 seconds per month at 1x speed

    const interval = setInterval(() => {
      setStartup(prev => {
        // Calculate monthly changes
        const userGrowth = Math.floor(prev.users * 0.1 * prev.marketingLevel + prev.reputation * 2);
        const monthlyRevenue = Math.floor(prev.users * 0.5 * prev.techLevel);
        const monthlyCosts = prev.employees * 8000 + prev.marketingLevel * 5000 + prev.techLevel * 3000;
        const newCash = prev.cash + monthlyRevenue - monthlyCosts;
        
        // Calculate valuation
        const newValuation = Math.max(
          50000,
          prev.users * 100 + prev.revenue * 12 + prev.techLevel * 50000 + prev.reputation * 10000
        );

        return {
          ...prev,
          month: prev.month + 1,
          users: prev.users + userGrowth,
          revenue: monthlyRevenue,
          cash: newCash,
          valuation: newValuation,
        };
      });

      // Random event chance
      if (Math.random() < 0.3) {
        const randomEvent = GAME_EVENTS[Math.floor(Math.random() * GAME_EVENTS.length)];
        setCurrentEvent(randomEvent);
        setGamePhase('event');
      }
    }, tickInterval);

    return () => clearInterval(interval);
  }, [gamePhase, isPaused, gameSpeed]);

  // Check milestones
  useEffect(() => {
    if (gamePhase !== 'playing') return;

    setMilestones(prev => {
      const updated = prev.map(m => {
        if (!m.achieved && m.requirement(startup)) {
          setAchievedMilestone(m);
          setTotalXpEarned(xp => xp + m.xpReward);
          setGamePhase('milestone');
          return { ...m, achieved: true };
        }
        return m;
      });
      return updated;
    });
  }, [startup, gamePhase]);

  // Check game over conditions
  useEffect(() => {
    if (gamePhase !== 'playing') return;

    if (startup.cash < -100000) {
      setGamePhase('ended');
    } else if (startup.month >= 60) { // 5 years
      setGamePhase('ended');
    }
  }, [startup, gamePhase]);

  const startGame = () => {
    if (!selectedIndustry || !startupName.trim()) return;

    setStartup(prev => ({
      ...prev,
      name: startupName,
      industry: selectedIndustry,
    }));
    setGamePhase('playing');
  };

  const handleEventChoice = (choice: GameEvent['choices'][0]) => {
    setStartup(prev => ({
      ...prev,
      ...Object.entries(choice.effects).reduce((acc, [key, value]) => {
        const currentValue = prev[key as keyof StartupState];
        if (typeof currentValue === 'number' && typeof value === 'number') {
          return { ...acc, [key]: currentValue + value };
        }
        return { ...acc, [key]: value };
      }, {}),
    }));
    setTotalXpEarned(prev => prev + choice.xpReward);
    setCurrentEvent(null);
    setGamePhase('playing');
  };

  const continueMilestone = () => {
    setAchievedMilestone(null);
    setGamePhase('playing');
  };

  const resetGame = () => {
    setStartup({
      name: '',
      industry: '',
      cash: 50000,
      revenue: 0,
      users: 0,
      employees: 1,
      reputation: 50,
      techLevel: 1,
      marketingLevel: 1,
      month: 1,
      valuation: 50000,
    });
    setMilestones(MILESTONES.map(m => ({ ...m, achieved: false })));
    setTotalXpEarned(0);
    setSelectedIndustry(null);
    setStartupName('');
    setCurrentEvent(null);
    setAchievedMilestone(null);
    setGamePhase('setup');
  };

  const invest = (area: 'tech' | 'marketing' | 'hiring') => {
    const costs = { tech: 30000, marketing: 20000, hiring: 50000 };
    if (startup.cash < costs[area]) return;

    setStartup(prev => ({
      ...prev,
      cash: prev.cash - costs[area],
      ...(area === 'tech' && { techLevel: prev.techLevel + 1 }),
      ...(area === 'marketing' && { marketingLevel: prev.marketingLevel + 1 }),
      ...(area === 'hiring' && { employees: prev.employees + 1 }),
    }));
  };

  const formatMoney = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/more/games"
                  className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-rose-500" />
                  {gamePhase === 'setup' ? 'Startup Simulator' : startup.name}
                </h1>
              </div>
              
              {totalXpEarned > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    {totalXpEarned} XP
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            {/* Setup Phase */}
            {gamePhase === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <Rocket className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Start Your Startup
                  </h2>
                  <p className="text-gray-500">
                    Build your tech empire from scratch!
                  </p>
                </div>

                {/* Startup Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Startup Name
                  </label>
                  <input
                    type="text"
                    value={startupName}
                    onChange={(e) => setStartupName(e.target.value)}
                    placeholder="Enter your startup name..."
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Industry Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Choose Your Industry
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {INDUSTRIES.map((industry) => (
                      <button
                        key={industry.id}
                        onClick={() => setSelectedIndustry(industry.id)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedIndustry === industry.id
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-10 h-10 ${industry.bg} rounded-lg flex items-center justify-center mb-2`}>
                          <industry.icon className={`w-5 h-5 ${industry.color}`} />
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {industry.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={startGame}
                  disabled={!selectedIndustry || !startupName.trim()}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Rocket className="w-5 h-5" />
                  Launch Startup
                </button>
              </motion.div>
            )}

            {/* Playing Phase */}
            {gamePhase === 'playing' && (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Game Controls */}
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Month {startup.month}</span>
                    <span className="text-xs text-gray-400">
                      ({Math.floor(startup.month / 12)} years, {startup.month % 12} months)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {isPaused ? (
                        <Play className="w-5 h-5 text-green-500" />
                      ) : (
                        <Pause className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={() => setGameSpeed(gameSpeed === 1 ? 2 : gameSpeed === 2 ? 3 : 1)}
                      className="px-2 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-lg"
                    >
                      {gameSpeed}x
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-gray-500">Cash</span>
                    </div>
                    <p className={`text-lg font-bold ${startup.cash < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                      {formatMoney(startup.cash)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-gray-500">Users</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatNumber(startup.users)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-gray-500">Revenue/mo</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatMoney(startup.revenue)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-amber-500" />
                      <span className="text-xs text-gray-500">Valuation</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatMoney(startup.valuation)}
                    </p>
                  </div>
                </div>

                {/* Levels */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Company Stats</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tech Level</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-4 rounded-sm ${
                              i < startup.techLevel ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Marketing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-4 rounded-sm ${
                              i < startup.marketingLevel ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Reputation</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {startup.reputation}/100
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Employees</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {startup.employees}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => invest('tech')}
                    disabled={startup.cash < 30000}
                    className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Code className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Upgrade Tech</p>
                    <p className="text-xs text-gray-500">$30K</p>
                  </button>
                  <button
                    onClick={() => invest('marketing')}
                    disabled={startup.cash < 20000}
                    className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Megaphone className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Marketing</p>
                    <p className="text-xs text-gray-500">$20K</p>
                  </button>
                  <button
                    onClick={() => invest('hiring')}
                    disabled={startup.cash < 50000}
                    className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Hire</p>
                    <p className="text-xs text-gray-500">$50K</p>
                  </button>
                </div>

                {/* Milestones */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Milestones
                  </h3>
                  <div className="space-y-2">
                    {milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          milestone.achieved
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : 'bg-gray-50 dark:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {milestone.achieved ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Target className="w-5 h-5 text-gray-400" />
                          )}
                          <span className={`text-sm ${
                            milestone.achieved
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {milestone.title}
                          </span>
                        </div>
                        <span className="text-xs text-purple-600 dark:text-purple-400">
                          +{milestone.xpReward} XP
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Event Phase */}
            {gamePhase === 'event' && currentEvent && (
              <motion.div
                key="event"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-4"
              >
                <div className={`p-6 rounded-xl border-2 ${
                  currentEvent.type === 'opportunity'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : currentEvent.type === 'challenge'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {currentEvent.type === 'opportunity' ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : currentEvent.type === 'challenge' ? (
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    ) : (
                      <Megaphone className="w-6 h-6 text-blue-500" />
                    )}
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentEvent.title}
                    </h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {currentEvent.description}
                  </p>
                  
                  <div className="space-y-3">
                    {currentEvent.choices.map((choice) => (
                      <button
                        key={choice.id}
                        onClick={() => handleEventChoice(choice)}
                        className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-rose-500 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {choice.text}
                          </span>
                          <span className="text-sm text-purple-600">+{choice.xpReward} XP</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Milestone Phase */}
            {gamePhase === 'milestone' && achievedMilestone && (
              <motion.div
                key="milestone"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                >
                  <Trophy className="w-20 h-20 text-amber-500 mx-auto mb-4" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Milestone Achieved!
                </h2>
                <h3 className="text-xl text-rose-600 dark:text-rose-400 mb-2">
                  {achievedMilestone.title}
                </h3>
                <p className="text-gray-500 mb-6">{achievedMilestone.description}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-600">+{achievedMilestone.xpReward} XP</span>
                </div>
                <br />
                <button
                  onClick={continueMilestone}
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* Ended Phase */}
            {gamePhase === 'ended' && (
              <motion.div
                key="ended"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-10"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {startup.cash < -100000 ? 'Game Over - Bankrupt!' : 'Simulation Complete!'}
                </h2>
                <p className="text-gray-500 mb-6">
                  {startup.name} ran for {Math.floor(startup.month / 12)} years and {startup.month % 12} months
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatMoney(startup.valuation)}
                    </p>
                    <p className="text-sm text-gray-500">Final Valuation</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(startup.users)}
                    </p>
                    <p className="text-sm text-gray-500">Total Users</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {milestones.filter(m => m.achieved).length}/{milestones.length}
                    </p>
                    <p className="text-sm text-gray-500">Milestones</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-2xl font-bold text-purple-600">
                      +{totalXpEarned}
                    </p>
                    <p className="text-sm text-gray-500">XP Earned</p>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={resetGame}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Play Again
                  </button>
                  <Link
                    href="/more/games"
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors"
                  >
                    Back to Games
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ProtectedRoute>
  );
}
