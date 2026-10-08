import React, { useState } from 'react';
import {
  Code2,
  Brain,
  Mic,
  Calendar,
  Zap,
  FileText,
  User,
  Layers,
  ChevronRight,
  Compass,
  Flame,
  Trophy,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile } from '../types';

export interface ContentsListProps {
  currentProfile: UserProfile;
  onSelectTab: (tab: any) => void;
}

interface ContentModule {
  id: string;
  stepNumber: string;
  tabKey: string;
  title: string;
  badge: string;
  category: 'CODING' | 'APTITUDE' | 'INTERVIEW' | 'CAREER';
  icon: React.ComponentType<{ className?: string }>;
  count: string;
  summary: string;
  keyTopics: string[];
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
  const dailyProgressPct = Math.round((completedDailyMissions / 4) * 100);

  const MODULES: ContentModule[] = [
    {
      id: 'dsa-hub',
      stepNumber: '01',
      tabKey: 'dsa',
      title: '3,000+ DSA Hub',
      badge: 'Coding',
      category: 'CODING',
      icon: Code2,
      count: '3,024 Problems · 4 Languages',
      summary:
        '24 topics with C++, Java, Python & JS solutions + time and space complexity analysis.',
      keyTopics: ['Arrays', 'Trees & Graphs', 'Dynamic Programming', 'Binary Search'],
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
      count: 'Unlimited Drills + Timed Mock',
      summary:
        'Quantitative Math, Logical Reasoning, Verbal Ability & Core CS with step-by-step formulas.',
      keyTopics: ['Quant Math', 'Logical Reasoning', 'Verbal Ability', 'Core CS'],
      progressText: `${solvedAptCount} Done`,
    },
    {
      id: 'voice-coach',
      stepNumber: '03',
      tabKey: 'voice',
      title: 'Interactive Voice Coach',
      badge: 'Spoken English',
      category: 'INTERVIEW',
      icon: Mic,
      count: '3s Auto-Send · Multi-Accent',
      summary:
        'Hands-free HR & technical interview practice with instant fluency and grammar scoring.',
      keyTopics: ['Indian/US/UK Accent', 'Fluency Score', 'Grammar Fix'],
      progressText: tasks.commToday ? 'Done Today ✓' : 'Tap to Speak',
    },
    {
      id: 'arcade-game',
      stepNumber: '04',
      tabKey: 'arcade',
      title: 'Byte Runner',
      badge: 'Full Screen Game',
      category: 'CODING',
      icon: Zap,
      count: '500+ Pts = Gold Shield',
      summary:
        'High-speed full-screen mobile & desktop Byte Runner cyber arena. Dodge barriers, dash & collect data bytes.',
      keyTopics: ['Full-Screen Mobile', 'Byte Dash', 'Data Bytes', 'Gold Shield'],
      progressText:
        bestGameScore > 0 ? `Best: ${bestGameScore} pts` : 'Play Full Screen',
    },
    {
      id: 'curriculum-roadmap',
      stepNumber: '05',
      tabKey: 'curriculum',
      title: '9-Month Course Syllabus',
      badge: '270 Days',
      category: 'CODING',
      icon: Calendar,
      count: 'Step-by-Step Daily Plan',
      summary:
        'Vertical day-by-day syllabus checklist: 3 DSA problems, 10 Aptitude questions & 1 Voice Coach session.',
      keyTopics: ['Months 1–3 Foundations', 'Months 4–6 DSA & CS', 'Months 7–9 Mocks'],
      progressText: '270-Day Syllabus',
    },
    {
      id: 'interview-prep-tips',
      stepNumber: '06',
      tabKey: 'interview',
      title: 'Interview Prep Guide',
      badge: '5 Stages',
      category: 'INTERVIEW',
      icon: Compass,
      count: 'Checklist + STAR Guide',
      summary:
        'Step-by-step checklists for Online Assessments, Technical Rounds, System Design & HR interviews.',
      keyTopics: ['5-Stage Flow', 'Core CS List', 'Live Coding', 'STAR Method'],
      progressText: 'Quick Checklist',
    },
    {
      id: 'resume-builder',
      stepNumber: '07',
      tabKey: 'resume',
      title: 'Resume Builder',
      badge: 'Standard ATS',
      category: 'CAREER',
      icon: FileText,
      count: 'PDF · TXT · DOC · MD · HTML',
      summary:
        'Single standard highly-valid ATS resume template with ******** placeholders ready for user input and export.',
      keyTopics: ['Standard Template', 'PDF & Text', 'Word & HTML'],
      progressText: 'Ready to Fill',
    },
    {
      id: 'profile-settings',
      stepNumber: '08',
      tabKey: 'profile',
      title: 'Candidate Profile',
      badge: 'Cloud Sync',
      category: 'CAREER',
      icon: User,
      count: 'Daily Task Verified Streak',
      summary:
        'Manage your name, college, graduation year, solved DSA count, Aptitude stats, and daily streak.',
      keyTopics: ['Graduation Year', 'Streak Stats', 'Cloud Sync'],
      progressText: `${currentProfile.streakDays}d Streak`,
    },
  ];

  const filteredModules = MODULES.filter(
    (mod) => selectedCategory === 'ALL' || mod.category === selectedCategory
  );

  return (
    <div className="space-y-4">
      {/* Progress & Daily Task Streak Overview Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0F3057]">
              <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Course Syllabus & Daily Tracker</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight">
              Hi, {currentProfile.name}
            </h1>
            {currentProfile.graduationYear && (
              <p className="text-xs text-gray-500 mt-0.5">
                {currentProfile.university} · Class of {currentProfile.graduationYear}
              </p>
            )}
          </div>

          {/* 4 Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-left select-none">
              <div className="flex items-center gap-1 text-[10px] text-amber-800 uppercase font-bold">
                <Flame className="w-3 h-3 text-amber-600 fill-amber-500 shrink-0" />
                <span className="truncate">Streak</span>
              </div>
              <span className="text-sm sm:text-base font-extrabold text-gray-900 font-mono tabular-nums block">
                {currentProfile.streakDays}d
              </span>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('dsa')}
              className="bg-[#FAFAFA] border border-gray-200 px-3 py-2 rounded-xl text-left transition hover:border-gray-300"
            >
              <span className="text-[10px] text-gray-500 uppercase font-bold block truncate">
                DSA
              </span>
              <span className="text-sm sm:text-base font-bold text-[#0B2545] font-mono tabular-nums block">
                {solvedDSACount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('aptitude')}
              className="bg-[#FAFAFA] border border-gray-200 px-3 py-2 rounded-xl text-left transition hover:border-gray-300"
            >
              <span className="text-[10px] text-gray-500 uppercase font-bold block truncate">
                Aptitude
              </span>
              <span className="text-sm sm:text-base font-bold text-emerald-700 font-mono tabular-nums block">
                {solvedAptCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('arcade')}
              className="bg-[#FAFAFA] border border-gray-200 px-3 py-2 rounded-xl text-left transition hover:border-gray-300"
            >
              <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase font-bold">
                <Trophy className="w-3 h-3 text-[#D4AF37] shrink-0" />
                <span className="truncate">Best</span>
              </div>
              <span className="text-sm sm:text-base font-bold text-gray-900 font-mono tabular-nums block">
                {bestGameScore}
              </span>
            </button>
          </div>
        </div>

        {/* Daily Tasks Strip — Streak counts only when at least 1 task is completed today */}
        <div className="bg-[#FAFAFA] border border-gray-200 rounded-xl p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-gray-900">
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0" />
              <span>Daily Tasks ({completedDailyMissions}/4 Completed)</span>
            </div>
            <span
              className={`text-[11px] font-semibold ${
                hasEarnedTodayStreak ? 'text-emerald-700' : 'text-amber-800'
              }`}
            >
              {hasEarnedTodayStreak
                ? 'Daily Streak Counted for Today ✓'
                : 'Complete any 1 daily task below to count today’s streak'}
            </span>
          </div>

          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0B2545] via-[#D4AF37] to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(4, dailyProgressPct)}%` }}
            />
          </div>

          {/* Vertical / Stacked Daily Tasks List */}
          <div className="flex flex-col space-y-1.5 pt-1">
            {[
              {
                label: '1. Solve 1 DSA Problem',
                done: tasks.dsaToday,
                tab: 'dsa',
                action: 'Open DSA Hub',
              },
              {
                label: '2. Complete 1 Aptitude Question',
                done: tasks.aptitudeToday,
                tab: 'aptitude',
                action: 'Open Aptitude',
              },
              {
                label: '3. Complete 1 Voice Coach Session',
                done: tasks.commToday,
                tab: 'voice',
                action: 'Open Voice Coach',
              },
              {
                label: '4. Play Byte Runner Game',
                done: tasks.streakShieldChecked,
                tab: 'arcade',
                action: 'Play Full Screen',
              },
            ].map((m, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectTab(m.tab)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium border text-left transition ${
                  m.done
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      m.done ? 'text-emerald-600' : 'text-gray-300'
                    }`}
                  />
                  <span className="truncate">{m.label}</span>
                </div>
                <span className="text-[11px] font-bold text-[#0F3057] shrink-0">
                  {m.done ? 'Completed ✓' : `${m.action} →`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { id: 'ALL', label: 'All Syllabus Modules (8)' },
            { id: 'CODING', label: 'Coding' },
            { id: 'APTITUDE', label: 'Aptitude' },
            { id: 'INTERVIEW', label: 'Interview' },
            { id: 'CAREER', label: 'Career' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-[#0B2545] text-white font-semibold'
                  : 'text-gray-600 bg-[#FAFAFA] border border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Course Syllabus Modules — Shown Vertically One by One Below (Never Sideways) */}
      <div className="flex flex-col space-y-3">
        {filteredModules.map((module) => {
          const Icon = module.icon;
          return (
            <div
              key={module.id}
              onClick={() => onSelectTab(module.tabKey)}
              className="group bg-white border border-gray-200 hover:border-[#13315C] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-sm transition cursor-pointer flex flex-col gap-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] border border-gray-200 flex items-center justify-center text-[#0F3057] shrink-0">
                    <Icon className="w-5 h-5 text-[#0F3057]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#B8860B]">
                        {module.stepNumber}.
                      </span>
                      <h3 className="text-base font-bold text-gray-900 leading-snug">
                        {module.title}
                      </h3>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs font-medium text-gray-500">
                        {module.badge}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#B8860B] mt-0.5">
                      {module.count}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <span className="text-xs font-semibold text-gray-600 font-mono">
                    {module.progressText}
                  </span>
                  <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0B2545] text-white text-xs font-semibold group-hover:bg-[#13315C] transition shrink-0">
                    <span>Open Module</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {module.summary}
              </p>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 pt-1 border-t border-gray-100">
                <span className="font-semibold text-gray-700">Key Topics:</span>
                {module.keyTopics.map((topic, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span aria-hidden="true">·</span>}
                    <span>{topic}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
