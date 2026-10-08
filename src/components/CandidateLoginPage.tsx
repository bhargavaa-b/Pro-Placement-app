import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  ArrowRight,
  Users,
  Trash2,
  Flame,
  Code2,
} from 'lucide-react';
import { UserProfile } from '../types';
import { ProPlacementAppLogo } from './ProPlacementAppLogo';
import {
  saveSecureProfile,
  sanitizeStrictText,
  loadAllSavedProfiles,
  removeSavedProfile,
} from '../utils/securityVault';
import {
  loadCandidateFromFirestore,
  syncCandidateToFirestore,
  MAX_NAME_LENGTH,
  MAX_UNIVERSITY_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_GRAD_YEAR_LENGTH,
} from '../lib/firebase';
import {
  loadCandidateFromSupabase,
  syncCandidateToSupabase,
} from '../lib/supabase';
import { LegalModalType } from './LegalModals';

interface CandidateLoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onOpenLegalModal?: (modal: LegalModalType) => void;
}

const GRADUATION_YEARS = [
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

export const CandidateLoginPage: React.FC<CandidateLoginPageProps> = ({
  onLoginSuccess,
  onOpenLegalModal,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [formConsent, setFormConsent] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedProfiles, setSavedProfiles] = useState<UserProfile[]>([]);

  useEffect(() => {
    setSavedProfiles(loadAllSavedProfiles());
  }, []);

  const finalizeCandidateSession = async (baseProfile: UserProfile) => {
    const todayStr = new Date().toISOString().split('T')[0];
    let mergedProfile: UserProfile = {
      ...baseProfile,
      streakDays: Math.max(0, baseProfile.streakDays || 0),
      lastStreakDate: baseProfile.lastStreakDate || '',
      dailyTasksDate: baseProfile.dailyTasksDate || todayStr,
      loginStartDate: baseProfile.loginStartDate || todayStr,
    };

    // 1. Check Supabase for existing cloud profile
    const supaProfile = await loadCandidateFromSupabase(baseProfile.email);
    if (supaProfile) {
      mergedProfile = {
        ...mergedProfile,
        ...supaProfile,
        name: baseProfile.name || supaProfile.name || 'Candidate',
        university:
          baseProfile.university &&
          baseProfile.university !== 'Engineering Institution'
            ? baseProfile.university
            : supaProfile.university || 'Engineering Institution',
        graduationYear:
          baseProfile.graduationYear || supaProfile.graduationYear || '',
        streakDays: Math.max(
          mergedProfile.streakDays || 0,
          supaProfile.streakDays || 0
        ),
        streakShieldActive:
          mergedProfile.streakShieldActive ||
          Boolean(supaProfile.streakShieldActive),
        highGameScore: Math.max(
          mergedProfile.highGameScore || 0,
          supaProfile.highGameScore || 0
        ),
        solvedDSAIds: Array.from(
          new Set([
            ...(mergedProfile.solvedDSAIds || []),
            ...(supaProfile.solvedDSAIds || []),
          ])
        ),
        solvedAptitudeIds: Array.from(
          new Set([
            ...(mergedProfile.solvedAptitudeIds || []),
            ...(supaProfile.solvedAptitudeIds || []),
          ])
        ),
        bookmarkedDSAIds: Array.from(
          new Set([
            ...(mergedProfile.bookmarkedDSAIds || []),
            ...(supaProfile.bookmarkedDSAIds || []),
          ])
        ),
      };
    }

    // 2. Check Firestore only if signed-in Firebase user matches this candidate's email
    try {
      const firestoreProfile = await loadCandidateFromFirestore(
        baseProfile.email
      );
      if (firestoreProfile) {
        mergedProfile = {
          ...mergedProfile,
          ...firestoreProfile,
          email: baseProfile.email,
          name: baseProfile.name || firestoreProfile.name || 'Candidate',
          graduationYear:
            baseProfile.graduationYear ||
            firestoreProfile.graduationYear ||
            mergedProfile.graduationYear ||
            '',
          streakDays: Math.max(
            mergedProfile.streakDays || 0,
            firestoreProfile.streakDays || 0
          ),
          highGameScore: Math.max(
            mergedProfile.highGameScore || 0,
            firestoreProfile.highGameScore || 0
          ),
          solvedDSAIds: Array.from(
            new Set([
              ...(mergedProfile.solvedDSAIds || []),
              ...(firestoreProfile.solvedDSAIds || []),
            ])
          ),
          solvedAptitudeIds: Array.from(
            new Set([
              ...(mergedProfile.solvedAptitudeIds || []),
              ...(firestoreProfile.solvedAptitudeIds || []),
            ])
          ),
        };
      }
    } catch {
      // Non-blocking
    }

    // Save inside encrypted, tamper-evident multi-user security vault
    saveSecureProfile(mergedProfile);

    await syncCandidateToSupabase(mergedProfile);
    try {
      await syncCandidateToFirestore(mergedProfile);
    } catch {
      // Non-blocking
    }

    onLoginSuccess(mergedProfile);
  };

  const handleQuickProfileSelect = async (profile: UserProfile) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          university: profile.university,
          graduationYear: profile.graduationYear,
        }),
      });
      const data = await res.json();
      if (data?.sessionToken) {
        try {
          sessionStorage.setItem('pp_session_token', data.sessionToken);
        } catch {
          // Ignore
        }
      }
      const merged: UserProfile =
        res.ok && data.user
          ? {
              ...profile,
              ...data.user,
              graduationYear:
                profile.graduationYear || data.user.graduationYear || '',
              streakDays: Math.max(
                profile.streakDays || 0,
                data.user.streakDays || 0
              ),
              highGameScore: Math.max(
                profile.highGameScore || 0,
                data.user.highGameScore || 0
              ),
              solvedDSAIds: Array.from(
                new Set([
                  ...(profile.solvedDSAIds || []),
                  ...(data.user.solvedDSAIds || []),
                ])
              ),
              solvedAptitudeIds: Array.from(
                new Set([
                  ...(profile.solvedAptitudeIds || []),
                  ...(data.user.solvedAptitudeIds || []),
                ])
              ),
            }
          : profile;
      await finalizeCandidateSession(merged);
    } catch {
      await finalizeCandidateSession(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSavedProfile = (
    e: React.MouseEvent,
    targetEmail: string
  ) => {
    e.stopPropagation();
    const updated = removeSavedProfile(targetEmail);
    setSavedProfiles(updated);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const safeName = sanitizeStrictText(name, MAX_NAME_LENGTH);
    const safeEmail = sanitizeStrictText(
      email.toLowerCase(),
      MAX_EMAIL_LENGTH
    );
    const safeUni =
      sanitizeStrictText(university, MAX_UNIVERSITY_LENGTH) ||
      'Engineering Institution';
    const safeGradYear = sanitizeStrictText(
      graduationYear,
      MAX_GRAD_YEAR_LENGTH
    );

    if (!safeName) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!safeEmail || !safeEmail.includes('@')) {
      setErrorMsg('Please enter a valid email ID.');
      return;
    }
    if (!safeGradYear) {
      setErrorMsg('Please enter or select your graduation year.');
      return;
    }
    if (!formConsent) {
      setErrorMsg('Please accept the consent checkbox to continue.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const todayStr = new Date().toISOString().split('T')[0];

    const baseProfile: UserProfile = {
      id: `cand_${Date.now()}`,
      name: safeName,
      email: safeEmail,
      dreamCompany: '',
      targetPackage: '',
      targetRole: '',
      university: safeUni,
      graduationYear: safeGradYear,
      consentGiven: true,
      avatarSeed: safeName.toLowerCase().replace(/\s+/g, ''),
      streakDays: 0,
      lastStreakDate: '',
      dailyTasksDate: todayStr,
      loginStartDate: todayStr,
      streakShieldActive: false,
      highGameScore: 0,
      solvedDSAIds: [],
      solvedAptitudeIds: [],
      bookmarkedDSAIds: [],
      dailyTasksCompleted: {
        dsaToday: false,
        aptitudeToday: false,
        commToday: false,
        streakShieldChecked: false,
      },
      mockTestsTaken: 0,
      avgMockAccuracy: 0,
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: safeName,
          email: safeEmail,
          university: safeUni,
          graduationYear: safeGradYear,
        }),
      });

      const data = await res.json();
      if (data?.sessionToken) {
        try {
          sessionStorage.setItem('pp_session_token', data.sessionToken);
        } catch {
          // Ignore
        }
      }
      const candidateUser: UserProfile =
        res.ok && data.user
          ? {
              ...baseProfile,
              ...data.user,
              graduationYear:
                safeGradYear || data.user.graduationYear || '',
              dreamCompany: '',
              targetPackage: '',
              targetRole: '',
            }
          : baseProfile;

      await finalizeCandidateSession(candidateUser);
    } catch {
      await finalizeCandidateSession(baseProfile);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen pp-ambient-bg text-[#18181B] flex flex-col justify-between p-4 sm:p-8 font-sans overflow-hidden">
      {/* Architectural Background Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute inset-0 pp-architectural-grid" />
        <div className="absolute -top-28 -left-24 w-96 h-96 rounded-full bg-[#0B2545]/[0.06] blur-3xl" />
        <div className="absolute top-12 -right-24 w-96 h-96 rounded-full bg-[#D4AF37]/[0.10] blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-[30rem] h-[30rem] rounded-full bg-[#13315C]/[0.05] blur-3xl" />
      </div>

      {/* Top Brand Header */}
      <header className="relative z-10 max-w-4xl w-full mx-auto flex items-center justify-between py-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <ProPlacementAppLogo size="sm" showTextBeside />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Users className="w-3.5 h-3.5 text-[#0B2545]" />
          <span>Multi-User Cloud Platform · 3LLION Ventures</span>
        </div>
      </header>

      {/* Main Login Card */}
      <div className="relative z-10 max-w-lg w-full mx-auto my-auto py-8 space-y-4">
        {/* Saved Multi-User Accounts Quick Switcher */}
        {savedProfiles.length > 0 && (
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#B8860B]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#0B2545]">
                  Saved Candidate Accounts ({savedProfiles.length})
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">
                1-Click Instant Switch
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {savedProfiles.map((prof) => (
                <div
                  key={prof.email}
                  onClick={() => !isLoading && handleQuickProfileSelect(prof)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (!isLoading) handleQuickProfileSelect(prof);
                    }
                  }}
                  className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#FAFAFA] hover:bg-amber-50/50 border border-gray-200 hover:border-[#D4AF37] transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#0B2545] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {prof.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-xs font-bold text-gray-900 truncate">
                        {prof.name}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {prof.email}
                        {prof.graduationYear
                          ? ` · Batch ${prof.graduationYear}`
                          : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-mono font-bold text-amber-800">
                      <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                      {prof.streakDays || 0}d
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-bold text-[#0B2545]">
                      <Code2 className="w-3 h-3" />
                      {prof.solvedDSAIds?.length || 0}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSavedProfile(e, prof.email)}
                      title="Remove account from this device"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <div className="flex justify-center mb-3">
              <ProPlacementAppLogo size="lg" />
            </div>
            <p className="text-center text-xs uppercase tracking-[0.25em] text-[#0F3057] font-semibold mb-4">
              Engineering the future
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545] tracking-tight text-center">
              {savedProfiles.length > 0
                ? 'Sign In or Register Another Candidate'
                : 'Candidate Sign In'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 text-center">
              Sign in with your candidate details to access the course syllabus and sync your learning progress across devices.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="login-name"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  id="login-name"
                  type="text"
                  required
                  maxLength={MAX_NAME_LENGTH}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Email ID *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  id="login-email"
                  type="email"
                  required
                  maxLength={MAX_EMAIL_LENGTH}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-uni"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                College / University Name
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  id="login-uni"
                  type="text"
                  maxLength={MAX_UNIVERSITY_LENGTH}
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Enter your college or university"
                  className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-grad-year"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Graduation Year *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  id="login-grad-year"
                  type="text"
                  required
                  maxLength={MAX_GRAD_YEAR_LENGTH}
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  placeholder="Enter your graduation year (e.g. 2025, 2027, 2028)"
                  className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition font-mono"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-gray-400 mr-1">
                  Select batch:
                </span>
                {GRADUATION_YEARS.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setGraduationYear(yr)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                      graduationYear === yr
                        ? 'bg-[#0B2545] text-white font-semibold'
                        : 'bg-[#FAFAFA] text-gray-600 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={formConsent}
                  onChange={(e) => setFormConsent(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-[#18181B] focus:ring-[#D4AF37]"
                />
                <span>
                  Sync my learning progress, solved questions, and communication sessions to my cloud profile.
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#18181B] hover:bg-gray-800 text-white font-semibold text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>
                  {isLoading ? 'Signing In...' : 'Proceed to Course Syllabus'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl w-full mx-auto text-center py-4 border-t border-gray-200/80 text-xs text-gray-500 space-y-2">
        {onOpenLegalModal && (
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium text-gray-600">
            <button
              type="button"
              onClick={() => onOpenLegalModal('PRIVACY')}
              className="hover:text-gray-900 underline-offset-4 hover:underline cursor-pointer"
            >
              Privacy Policy
            </button>
            <span aria-hidden="true" className="text-gray-300">·</span>
            <button
              type="button"
              onClick={() => onOpenLegalModal('TERMS')}
              className="hover:text-gray-900 underline-offset-4 hover:underline cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};
