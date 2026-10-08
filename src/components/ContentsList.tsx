import React, { useState } from 'react';
import {
  Code2,
  Brain,
  Calendar,
  Zap,
  Gamepad2,
  FileText,
  User,
  ChevronRight,
  Compass,
  Flame,
  Trophy,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../types';

export interface ContentsListProps {
  currentProfile: UserProfile;
  onSelectTab: (tab: any) => void;
}

/**
 * Dedicated Black and Red Microphone Icon for Voice Coach
 */
export const BlackRedMicIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Mic Head / Capsule: sleek black body with vibrant red grille accents */}
    <rect x="9" y="2" width="6" height="11" rx="3" fill="#18181B" stroke="#DC2626" strokeWidth="1.5" />
    <line x1="9" y1="5.5" x2="15" y2="5.5" stroke="#EF4444" strokeWidth="1" />
    <line x1="9" y1="8" x2="15" y2="8" stroke="#EF4444" strokeWidth="1" />
    {/* Live audio indicator */}
    <circle cx="12" cy="10.5" r="1.2" fill="#EF4444" />
    {/* Mic Cradle / Arc */}
    <path d="M5 10C5 13.866 8.134 17 12 17C15.866 17 19 10" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
    {/* Base Stand */}
    <line x1="12" y1="17" x2="12" y2="21" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="21" x2="16" y2="21" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

interface ContentModule {
  id: string;
  stepNumber: string;
  tabKey: string;
  title: string;
  badge: string;
  category: 'CODING' | 'APTITUDE' | 'INTERVIEW' | 'CAREER';
  icon: React.ComponentType<{ className?: string }>;
  badgeBg: string;
  accentBorder: string;
  topGlow: string;
  highlight: string;
  progressText: string;
}

export const ContentsList: React.FC<ContentsListProps> = ({
  currentProfile,
  onSelectTab,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    'ALL' | 'CODING' | 'APTITUDE' | 'INTERVIEW' | 'CAREER'
  >('ALL');

  const solvedDSACount = currentProfile.solvedDSAIds.length;
  const solvedAptCount = currentProfile.solvedAptitudeIds.length;
  const bestGameScore = currentProfile.highGameScore || 0;
  const tasks = currentProfile.dailyTasksCompleted || {
    dsaToday: false,
    aptitudeToday: false,
    commToday: false,
    streakShieldChecked: false,
  };

  const completedDailyMissions = [
    tasks.dsaToday,
    tasks.aptitudeToday,
    tasks.commToday,
    tasks.streakShieldChecked,
  ].filter(Boolean).length;

  const hasEarnedTodayStreak = completedDailyMissions >= 1;

  const MODULES: ContentModule[] = [
    {
      id: 'dsa-hub',
      stepNumber: '01',
      tabKey: 'dsa',
      title: '3,000+ DSA Hub',
      badge: 'Coding',
      category: 'CODING',
      icon: Code2,
      badgeBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25',
      accentBorder: 'hover:border-emerald-300',
      topGlow: 'from-emerald-400 to-teal-500',
      highlight: '3,024 Problems with C++, Java, Python & JS solutions',
      progressText: `${solvedDSACount} Solved`,
    },
    {
      id: 'aptitude-arena',
      stepNumber: '02',
      tabKey: 'aptitude',
      title: '10,000+ Aptitude Arena',
      badge: 'Assessment',
      category: 'APTITUDE',
      icon: Brain,
      badgeBg: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/25',
      accentBorder: 'hover:border-purple-300',
      topGlow: 'from-purple-400 to-indigo-500',
      highlight: 'Quantitative, Logical, Verbal & CS drills with step-by-step formulas',
      progressText: `${solvedAptCount} Done`,
    },
    {
      id: 'voice-coach',
      stepNumber: '03',
      tabKey: 'voice',
      title: 'Voice Coach',
      badge: 'Spoken English',
      category: 'INTERVIEW',
      icon: BlackRedMicIcon,
      badgeBg: 'bg-gradient-to-br from-zinc-900 via-neutral-900 to-red-950 text-red-500 border border-red-500/30 shadow-red-500/20',
      accentBorder: 'hover:border-red-300',
      topGlow: 'from-red-500 to-zinc-900',
      highlight: 'Instant spoken feedback, fluency analytics & multi-accent coaching',
      progressText: tasks.commToday ? 'Completed Today ✓' : 'Ready to Practice',
    },
    {
      id: 'arcade-game',
      stepNumber: '04',
      tabKey: 'arcade',
      title: 'Byte Runner',
      badge: 'Cyber Arcade',
      category: 'CODING',
      icon: Gamepad2,
      badgeBg: 'bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-pink-500/25',
      accentBorder: 'hover:border-pink-300',
      topGlow: 'from-pink-400 to-rose-500',
      highlight: 'High-speed algorithmic runner arena — score 500+ for Gold Shield',
      progressText: bestGameScore > 0 ? `Best: ${bestGameScore} pts` : 'Play Arcade',
    },
    {
      id: 'curriculum-roadmap',
      stepNumber: '05',
      tabKey: 'curriculum',
      title: '9-Month Course Syllabus',
      badge: '270 Days',
      category: 'CODING',
      icon: Calendar,
      badgeBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25',
      accentBorder: 'hover:border-amber-300',
      topGlow: 'from-amber-400 to-orange-500',
      highlight: 'Structured daily roadmap: 3 DSA, 10 Aptitude & 1 Voice session per day',
      progressText: '270-Day Roadmap',
    },
    {
      id: 'interview-prep-tips',
      stepNumber: '06',
      tabKey: 'interview',
      title: 'Interview Prep Guide',
      badge: 'Framework',
      category: 'INTERVIEW',
      icon: Compass,
      badgeBg: 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/25',
      accentBorder: 'hover:border-blue-300',
      topGlow: 'from-blue-500 to-indigo-600',
      highlight: 'Online assessments, live technical rounds, system design & STAR HR',
      progressText: '5 Stages Guide',
    },
    {
      id: 'resume-builder',
      stepNumber: '07',
      tabKey: 'resume',
      title: 'Resume Builder',
      badge: 'Career',
      category: 'CAREER',
      icon: FileText,
      badgeBg: 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-teal-500/25',
      accentBorder: 'hover:border-teal-300',
      topGlow: 'from-teal-400 to-cyan-500',
      highlight: 'Universal single-page standard format with instant PDF, Text & Word export',
      progressText: 'Single Page Format',
    },
    {
      id: 'profile-settings',
      stepNumber: '08',
      tabKey: 'profile',
      title: 'Candidate Profile',
      badge: 'Account',
      category: 'CAREER',
      icon: User,
      badgeBg: 'bg-gradient-to-br from-slate-700 to-zinc-900 text-white shadow-slate-700/25',
      accentBorder: 'hover:border-slate-400',
      topGlow: 'from-slate-500 to-zinc-800',
      highlight: 'Verified 24h daily streak tracker, college details & cloud sync',
      progressText: `${currentProfile.streakDays}d Streak`,
    },
  ];

  const filteredModules = MODULES.filter(
    (mod) => selectedCategory === 'ALL' || mod.category === selectedCategory
  );

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* 1. Precise Hero & Metric Bar - Classy, Clean & Light with Bright Blue Accent */}
      <div className="relative bg-white/95 border border-sky-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Placement Training Dashboard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              Welcome back, {currentProfile.name}
            </h1>
            {currentProfile.graduationYear && (
              <p className="text-xs font-medium text-slate-600 mt-0.5">
                {currentProfile.university} · Class of {currentProfile.graduationYear}
              </p>
            )}
          </div>

          {/* 4 Precise Metrics in Unified Glossy Blue Palette with Black Text */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Streak */}
            <div className="relative overflow-hidden bg-gradient-to-b from-[#F0F7FF] via-[#DBEAFE] to-[#BFDBFE] border border-[#93C5FD] px-3 py-2 rounded-xl text-left select-none shadow-[0_2px_8px_rgba(37,99,235,0.1),inset_0_1px_1px_rgba(255,255,255,0.9)] before:absolute before:inset-x-0 before:top-0 before:h-[45%] before:bg-gradient-to-b before:from-white/70 before:to-transparent before:pointer-events-none">
              <div className="flex items-center gap-1 text-[10px] text-black uppercase font-bold tracking-wider relative z-10">
                <Flame className="w-3 h-3 text-blue-600 fill-sky-400 shrink-0" />
                <span>Streak</span>
              </div>
              <span className="text-sm sm:text-base font-extrabold text-black font-mono tabular-nums block mt-0.5 relative z-10">
                {currentProfile.streakDays}d
              </span>
            </div>

            {/* DSA Solved */}
            <button
              type="button"
              onClick={() => onSelectTab('dsa')}
              className="relative overflow-hidden bg-gradient-to-b from-[#F0F7FF] via-[#DBEAFE] to-[#BFDBFE] border border-[#93C5FD] hover:border-[#60A5FA] px-3 py-2 rounded-xl text-left transition cursor-pointer shadow-[0_2px_8px_rgba(37,99,235,0.1),inset_0_1px_1px_rgba(255,255,255,0.9)] hover:shadow-[0_4px_14px_rgba(37,99,235,0.18),inset_0_1px_2px_rgba(255,255,255,0.95)] before:absolute before:inset-x-0 before:top-0 before:h-[45%] before:bg-gradient-to-b before:from-white/70 before:to-transparent before:pointer-events-none group"
            >
              <div className="flex items-center gap-1 text-[10px] text-black uppercase font-bold tracking-wider relative z-10">
                <Code2 className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="truncate">DSA Solved</span>
              </div>
              <span className="text-sm sm:text-base font-extrabold text-black font-mono tabular-nums block mt-0.5 group-hover:text-black transition relative z-10">
                {solvedDSACount}
              </span>
            </button>

            {/* Aptitude Done */}
            <button
              type="button"
              onClick={() => onSelectTab('aptitude')}
              className="relative overflow-hidden bg-gradient-to-b from-[#F0F7FF] via-[#DBEAFE] to-[#BFDBFE] border border-[#93C5FD] hover:border-[#60A5FA] px-3 py-2 rounded-xl text-left transition cursor-pointer shadow-[0_2px_8px_rgba(37,99,235,0.1),inset_0_1px_1px_rgba(255,255,255,0.9)] hover:shadow-[0_4px_14px_rgba(37,99,235,0.18),inset_0_1px_2px_rgba(255,255,255,0.95)] before:absolute before:inset-x-0 before:top-0 before:h-[45%] before:bg-gradient-to-b before:from-white/70 before:to-transparent before:pointer-events-none group"
            >
              <div className="flex items-center gap-1 text-[10px] text-black uppercase font-bold tracking-wider relative z-10">
                <Brain className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="truncate">Aptitude Done</span>
              </div>
              <span className="text-sm sm:text-base font-extrabold text-black font-mono tabular-nums block mt-0.5 group-hover:text-black transition relative z-10">
                {solvedAptCount}
              </span>
            </button>

            {/* Arcade */}
            <button
              type="button"
              onClick={() => onSelectTab('arcade')}
              className="relative overflow-hidden bg-gradient-to-b from-[#F0F7FF] via-[#DBEAFE] to-[#BFDBFE] border border-[#93C5FD] hover:border-[#60A5FA] px-3 py-2 rounded-xl text-left transition cursor-pointer shadow-[0_2px_8px_rgba(37,99,235,0.1),inset_0_1px_1px_rgba(255,255,255,0.9)] hover:shadow-[0_4px_14px_rgba(37,99,235,0.18),inset_0_1px_2px_rgba(255,255,255,0.95)] before:absolute before:inset-x-0 before:top-0 before:h-[45%] before:bg-gradient-to-b before:from-white/70 before:to-transparent before:pointer-events-none group"
            >
              <div className="flex items-center gap-1 text-[10px] text-black uppercase font-bold tracking-wider relative z-10">
                <Trophy className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="truncate">Arcade</span>
              </div>
              <span className="text-sm sm:text-base font-extrabold text-black font-mono tabular-nums block mt-0.5 group-hover:text-black transition relative z-10">
                {bestGameScore} pts
              </span>
            </button>
          </div>
        </div>

        {/* 2. Daily Goal Tracker Strip — Classy Neutral Card */}
        <div className="relative z-10 bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Flame className="w-3.5 h-3.5 text-[#EA580C] fill-[#F97316] shrink-0" />
              <span>Daily Tasks ({completedDailyMissions}/4 Completed)</span>
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                hasEarnedTodayStreak
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}
            >
              {hasEarnedTodayStreak
                ? 'Streak counted for today ✓'
                : 'Complete at least 1 task daily to maintain your streak'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
            {[
              {
                label: '1. DSA Problem',
                done: tasks.dsaToday,
                tab: 'dsa',
              },
              {
                label: '2. Aptitude Drill',
                done: tasks.aptitudeToday,
                tab: 'aptitude',
              },
              {
                label: '3. Voice Coach',
                done: tasks.commToday,
                tab: 'voice',
              },
              {
                label: '4. Byte Runner',
                done: tasks.streakShieldChecked,
                tab: 'arcade',
              },
            ].map((taskItem, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectTab(taskItem.tab)}
                className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition cursor-pointer shadow-2xs ${
                  taskItem.done
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      taskItem.done ? 'text-emerald-600' : 'text-slate-300'
                    }`}
                  />
                  <span className="truncate">{taskItem.label}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* 3. Category Filter Chips - Clean Classy Segmented Filter */}
        <div className="relative z-10 flex flex-wrap items-center gap-1.5 pt-0.5">
          {[
            { id: 'ALL', label: 'All Modules (8)' },
            { id: 'CODING', label: 'Coding' },
            { id: 'APTITUDE', label: 'Aptitude' },
            { id: 'INTERVIEW', label: 'Interview' },
            { id: 'CAREER', label: 'Career' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Precise Interactive Modules Grid - Classy Cards with Distinct Logo Colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredModules.map((module) => {
          const Icon = module.icon;

          return (
            <div
              key={module.id}
              onClick={() => onSelectTab(module.tabKey)}
              className={`group relative bg-white hover:bg-slate-50/40 border border-slate-200/90 ${module.accentBorder} rounded-2xl p-4 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between gap-3 overflow-hidden transition`}
            >
              {/* Subtle top edge accent glow on card hover */}
              <div
                className={`absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r ${module.topGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
              />

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl ${module.badgeBg} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {module.stepNumber}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-black transition truncate">
                        {module.title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                      {module.badge}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-semibold text-slate-700 bg-slate-100 group-hover:bg-slate-200/80 px-2 py-0.5 rounded-md border border-slate-200 transition shrink-0">
                  {module.progressText}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {module.highlight}
              </p>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                <span className="text-slate-400 text-[11px] font-medium">Click to launch</span>
                <div className="inline-flex items-center gap-1 font-semibold text-slate-800 group-hover:text-black transition">
                  <span>Open</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
