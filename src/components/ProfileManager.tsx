import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  LogOut,
  Code2,
  Brain,
  Zap,
  Users,
  UserPlus,
  Trophy,
  Flame,
  RefreshCw,
  Check,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  sanitizeStrictText,
  loadAllSavedProfiles,
  removeSavedProfile,
} from '../utils/securityVault';
import {
  CohortCandidateSummary,
  fetchCohortLeaderboardFromSupabase,
} from '../lib/supabase';
import { ProPlacementAppLogo } from './ProPlacementAppLogo';

interface ProfileManagerProps {
  currentProfile: UserProfile;
  onSelectProfile: (profile: UserProfile) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onLogout?: () => void;
}

const QUICK_GRAD_YEARS = [
  '2024',
  '2025',
  '2026',
  '2027',
  '2028',
  '2029',
  '2030',
  '2031',
  '2032',
  '2033',
  '2034',
  '2035',
  '2036',
  '2037',
  '2038',
];

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  currentProfile,
  onSelectProfile,
  onUpdateProfile,
  onLogout,
}) => {
  const [savedProfiles, setSavedProfiles] = useState<UserProfile[]>([]);
  const [leaderboard, setLeaderboard] = useState<CohortCandidateSummary[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);

  const refreshSavedProfiles = useCallback(() => {
    setSavedProfiles(loadAllSavedProfiles());
  }, []);

  const loadCohortLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const mergedMap = new Map<string, CohortCandidateSummary>();

      // 1. Fetch from Express server multi-user endpoint
      try {
        const res = await fetch(
          `/api/community/leaderboard?email=${encodeURIComponent(
            currentProfile.email
          )}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.leaderboard)) {
            for (const item of data.leaderboard) {
              mergedMap.set(`${item.name}_${item.university}`.toLowerCase(), item);
            }
          }
        }
      } catch {
        // Non-blocking
      }

      // 2. Merge with Supabase cohort leaderboard
      try {
        const supaList = await fetchCohortLeaderboardFromSupabase(
          currentProfile.email
        );
        for (const item of supaList) {
          const key = `${item.name}_${item.university}`.toLowerCase();
          const prev = mergedMap.get(key);
          if (!prev || item.xp >= prev.xp) {
            mergedMap.set(key, {
              ...prev,
              ...item,
              isCurrentUser: Boolean(prev?.isCurrentUser || item.isCurrentUser),
              isOnline: Boolean(prev?.isOnline || item.isOnline),
            });
          }
        }
      } catch {
        // Non-blocking
      }

      // 3. Ensure all saved local profiles and current user are represented
      const localAll = loadAllSavedProfiles();
      for (const prof of [currentProfile, ...localAll]) {
        const isCurrent =
          prof.email.toLowerCase() === currentProfile.email.toLowerCase();
        const dsaCount = prof.solvedDSAIds?.length || 0;
        const aptCount = prof.solvedAptitudeIds?.length || 0;
        const streak = prof.streakDays || 0;
        const gameScore = prof.highGameScore || 0;
        const xp =
          dsaCount * 25 +
          aptCount * 10 +
          streak * 50 +
          Math.floor(gameScore / 100);
        const key = `${prof.name}_${prof.university}`.toLowerCase();
        const existing = mergedMap.get(key);
        if (!existing || isCurrent || xp > existing.xp) {
          mergedMap.set(key, {
            id: prof.id || `cand_${key}`,
            name: prof.name,
            university: prof.university || 'Engineering Institution',
            graduationYear: prof.graduationYear || '',
            streakDays: Math.max(streak, existing?.streakDays || 0),
            streakShieldActive: Boolean(
              prof.streakShieldActive || existing?.streakShieldActive
            ),
            highGameScore: Math.max(gameScore, existing?.highGameScore || 0),
            solvedDSACount: Math.max(dsaCount, existing?.solvedDSACount || 0),
            solvedAptitudeCount: Math.max(
              aptCount,
              existing?.solvedAptitudeCount || 0
            ),
            xp: Math.max(xp, existing?.xp || 0),
            isCurrentUser: isCurrent || Boolean(existing?.isCurrentUser),
            isOnline: isCurrent || Boolean(existing?.isOnline),
          });
        }
      }

      const sorted = Array.from(mergedMap.values()).sort((a, b) => b.xp - a.xp);
      setLeaderboard(sorted);
      setOnlineCount(Math.max(1, sorted.filter((c) => c.isOnline).length));
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [
    currentProfile.email,
    currentProfile.name,
    currentProfile.university,
    currentProfile.graduationYear,
    currentProfile.streakDays,
    currentProfile.streakShieldActive,
    currentProfile.highGameScore,
    currentProfile.solvedDSAIds?.length,
    currentProfile.solvedAptitudeIds?.length,
  ]);

  useEffect(() => {
    refreshSavedProfiles();
    loadCohortLeaderboard();
  }, [refreshSavedProfiles, loadCohortLeaderboard]);

  const handleRemoveProfile = (emailToRemove: string) => {
    const updated = removeSavedProfile(emailToRemove);
    setSavedProfiles(updated);
  };

  return (
    <div className="space-y-6 text-gray-900">
      {/* 1. Active Candidate Profile Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-3.5">
            <ProPlacementAppLogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#B8860B]">
                  Active Candidate Profile
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                {currentProfile.name}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentProfile.university}
                {currentProfile.graduationYear
                  ? ` · Class of ${currentProfile.graduationYear}`
                  : ' · Set your graduation year below'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0B2545] hover:bg-[#13315C] text-white font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Switch / Add Candidate</span>
              </button>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-gray-200 hover:border-red-200 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Candidate Details & Progress */}
        <div className="bg-[#FAFAFA] border border-gray-200 rounded-2xl p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={currentProfile.name}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...currentProfile,
                      name: sanitizeStrictText(e.target.value, 100),
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={currentProfile.email}
                  readOnly
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">
                College / University
              </label>
              <div className="relative">
                <GraduationCap className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={currentProfile.university}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...currentProfile,
                      university: sanitizeStrictText(e.target.value, 160),
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">
                Graduation Year
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  maxLength={16}
                  placeholder="Enter graduation year"
                  value={currentProfile.graduationYear || ''}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...currentProfile,
                      graduationYear: sanitizeStrictText(e.target.value, 16),
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold font-mono text-gray-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {QUICK_GRAD_YEARS.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() =>
                      onUpdateProfile({
                        ...currentProfile,
                        graduationYear: yr,
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                      currentProfile.graduationYear === yr
                        ? 'bg-[#0B2545] text-white font-bold'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-200">
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-[#0B2545]">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-semibold">
                  Solved DSA Problems
                </div>
                <div className="text-base font-bold text-gray-900 font-mono tabular-nums">
                  {currentProfile.solvedDSAIds.length}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-[#B8860B]">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-semibold">
                  Completed Aptitude
                </div>
                <div className="text-base font-bold text-gray-900 font-mono tabular-nums">
                  {currentProfile.solvedAptitudeIds.length}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-semibold">
                  Byte Runner High Score
                </div>
                <div className="text-base font-bold text-gray-900 font-mono tabular-nums">
                  {currentProfile.highGameScore || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Multi-User Account Switcher (Saved Profiles on This Device) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0B2545]">
              <Users className="w-4 h-4 text-[#B8860B]" />
              <span>Multi-User Account Switcher ({savedProfiles.length})</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Switch instantaneously between candidate profiles on this device or register a new candidate. Each user&apos;s progress is isolated and cloud-synced.
            </p>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAFAFA] hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-[#0B2545] transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>+ Sign In Another Candidate</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {savedProfiles.map((prof) => {
            const isCurrent =
              prof.email.toLowerCase() === currentProfile.email.toLowerCase();
            return (
              <div
                key={prof.email}
                onClick={() => !isCurrent && onSelectProfile(prof)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isCurrent) {
                    e.preventDefault();
                    onSelectProfile(prof);
                  }
                }}
                className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-amber-50/40 border-[#D4AF37] ring-1 ring-[#D4AF37]/40 cursor-default'
                    : 'bg-[#FAFAFA] hover:bg-white border-gray-200 hover:border-gray-300 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-[#0B2545] text-[#D4AF37]'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {prof.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {prof.name}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <Check className="w-2.5 h-2.5" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">
                      {prof.email}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                      {prof.solvedDSAIds?.length || 0} DSA ·{' '}
                      {prof.solvedAptitudeIds?.length || 0} Apt ·{' '}
                      {prof.streakDays || 0}d Streak
                    </div>
                  </div>
                </div>

                {!isCurrent && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveProfile(prof.email);
                    }}
                    title="Remove saved account from device"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Live Multi-User Platform Cohort Leaderboard */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0B2545]">
                Live Multi-User Cohort Leaderboard
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {onlineCount} Active Online
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Real-time rankings across registered candidates on the Pro Placement platform (XP = 25×DSA + 10×Aptitude + 50×Streak + Arcade).
            </p>
          </div>

          <button
            type="button"
            onClick={loadCohortLeaderboard}
            disabled={loadingLeaderboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAFA] hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loadingLeaderboard ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh Rankings</span>
          </button>
        </div>

        {/* Mobile Stacked Leaderboard Cards (Zero Horizontal Scroll) */}
        <div className="md:hidden divide-y divide-gray-100">
          {leaderboard.map((cand, index) => (
            <div
              key={`${cand.id}_m_${index}`}
              className={`p-3 rounded-xl space-y-2 ${
                cand.isCurrentUser ? 'bg-amber-50/50' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-xs text-gray-600 shrink-0">
                    #{index + 1}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-[#0B2545] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {cand.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900 truncate">
                        {cand.name}
                      </span>
                      {cand.isCurrentUser && (
                        <span className="px-1.5 py-0.5 rounded bg-[#0B2545] text-[#D4AF37] text-[10px] font-bold shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">
                      {cand.university}
                      {cand.graduationYear ? ` (${cand.graduationYear})` : ''}
                    </div>
                  </div>
                </div>
                <div className="font-mono font-extrabold text-xs text-[#0B2545] shrink-0">
                  {cand.xp.toLocaleString()} XP
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pl-6 text-[11px] font-mono text-gray-600">
                <span className="inline-flex items-center gap-1 text-amber-800 font-bold">
                  <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                  {cand.streakDays}d
                </span>
                <span>DSA: <strong className="text-[#0B2545]">{cand.solvedDSACount}</strong></span>
                <span>Apt: <strong className="text-emerald-700">{cand.solvedAptitudeCount}</strong></span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Leaderboard Table */}
        <div className="hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-bold uppercase text-gray-500">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Candidate</th>
                <th className="py-2.5 px-3">Institution & Batch</th>
                <th className="py-2.5 px-3 text-center">Streak</th>
                <th className="py-2.5 px-3 text-center">DSA Solved</th>
                <th className="py-2.5 px-3 text-center">Aptitude</th>
                <th className="py-2.5 px-3 text-right">Total XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {leaderboard.map((cand, index) => (
                <tr
                  key={`${cand.id}_${index}`}
                  className={
                    cand.isCurrentUser
                      ? 'bg-amber-50/50 font-semibold'
                      : 'hover:bg-gray-50/80'
                  }
                >
                  <td className="py-3 px-3 font-mono font-bold text-gray-700">
                    #{index + 1}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0B2545] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {cand.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900">
                            {cand.name}
                          </span>
                          {cand.isCurrentUser && (
                            <span className="px-1.5 py-0.5 rounded bg-[#0B2545] text-[#D4AF37] text-[10px] font-bold">
                              You
                            </span>
                          )}
                          {cand.isOnline && (
                            <span
                              title="Online now"
                              className="w-2 h-2 rounded-full bg-emerald-500 inline-block"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-600">
                    <span>{cand.university}</span>
                    {cand.graduationYear && (
                      <span className="text-gray-400 font-mono ml-1">
                        ({cand.graduationYear})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 font-mono font-bold text-amber-900">
                      <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                      {cand.streakDays}d
                      {cand.streakShieldActive && (
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-[#0B2545]">
                    {cand.solvedDSACount}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                    {cand.solvedAptitudeCount}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-[#0B2545]">
                    {cand.xp.toLocaleString()} XP
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
