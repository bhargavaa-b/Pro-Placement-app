import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  Code2,
  Brain,
  Mic,
  Calendar,
  Zap,
  FileText,
  Compass,
  User,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  Flame,
} from 'lucide-react';
import { UserProfile } from './types';
import { ProfileManager } from './components/ProfileManager';
import { CandidateLoginPage } from './components/CandidateLoginPage';
import { ContentsList } from './components/ContentsList';
import { DsaHub } from './components/DsaHub';
import { AptitudeArena } from './components/AptitudeArena';
import { VoiceCoach } from './components/VoiceCoach';
import { CurriculumRoadmap } from './components/CurriculumRoadmap';
import { ByteRunnerGame } from './components/ByteRunnerGame';
import { AtsResumeBuilder } from './components/AtsResumeBuilder';
import { InterviewHub } from './components/InterviewHub';
import {
  LegalModals,
  CookieConsentBanner,
  LegalModalType,
} from './components/LegalModals';
import { ProPlacementAppLogo } from './components/ProPlacementAppLogo';
import { IntroSplashAnimation } from './components/IntroSplashAnimation';
import {
  loadSecureProfile,
  saveSecureProfile,
  clearSecureVault,
} from './utils/securityVault';
import {
  auth,
  onAuthStateChanged,
  syncCandidateToFirestore,
  recordSolvedProblemInFirestore,
  loadCandidateFromFirestore,
} from './lib/firebase';
import {
  syncCandidateToSupabase,
  loadCandidateFromSupabase,
} from './lib/supabase';

type NavTab =
  | 'contents'
  | 'dsa'
  | 'aptitude'
  | 'voice'
  | 'curriculum'
  | 'interview'
  | 'resume'
  | 'arcade'
  | 'profile';

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDaysDifference(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 999;
  const start = new Date(startDateStr + 'T00:00:00Z').getTime();
  const end = new Date(endDateStr + 'T00:00:00Z').getTime();
  if (isNaN(start) || isNaN(end)) return 999;
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

/**
 * Enforces that daily streak ONLY counts if the candidate completes
 * at least 1 daily task every day, and increments by at most 1 per calendar day.
 */
function normalizeDailyStreak(profile: UserProfile): {
  streakDays: number;
  lastStreakDate: string;
  dailyTasksDate: string;
  loginStartDate: string;
  dailyTasksCompleted: UserProfile['dailyTasksCompleted'];
} {
  const todayStr = getTodayDateString();
  const loginStartDate = profile.loginStartDate || todayStr;
  const prevTasksDate =
    profile.dailyTasksDate ||
    (profile.lastStreakDate === todayStr ? todayStr : '');

  let dailyTasksCompleted = {
    dsaToday: Boolean(profile.dailyTasksCompleted?.dsaToday),
    aptitudeToday: Boolean(profile.dailyTasksCompleted?.aptitudeToday),
    commToday: Boolean(profile.dailyTasksCompleted?.commToday),
    streakShieldChecked: Boolean(
      profile.dailyTasksCompleted?.streakShieldChecked
    ),
  };

  // Reset daily task flags if the calendar day has changed
  if (prevTasksDate && prevTasksDate !== todayStr) {
    dailyTasksCompleted = {
      dsaToday: false,
      aptitudeToday: false,
      commToday: false,
      streakShieldChecked: false,
    };
  }

  const hasCompletedAnyTaskToday = Boolean(
    dailyTasksCompleted.dsaToday ||
      dailyTasksCompleted.aptitudeToday ||
      dailyTasksCompleted.commToday ||
      dailyTasksCompleted.streakShieldChecked
  );

  let streakDays =
    typeof profile.streakDays === 'number' && profile.streakDays >= 0
      ? profile.streakDays
      : 0;
  let lastStreakDate = profile.lastStreakDate || '';

  if (hasCompletedAnyTaskToday) {
    if (lastStreakDate === todayStr && streakDays >= 1) {
      // Already credited today's streak
      streakDays = Math.max(1, streakDays);
    } else if (lastStreakDate && lastStreakDate !== todayStr) {
      const diff = getDaysDifference(lastStreakDate, todayStr);
      if (diff === 1 || (diff === 2 && profile.streakShieldActive)) {
        streakDays = Math.max(0, streakDays) + 1;
      } else {
        streakDays = 1;
      }
      lastStreakDate = todayStr;
    } else {
      streakDays = 1;
      lastStreakDate = todayStr;
    }
  } else {
    // 0 daily tasks completed today: streak must NOT increment for today
    if (lastStreakDate === todayStr) {
      // Clear any legacy login-only streak that wasn't backed by a completed task
      streakDays = 0;
      lastStreakDate = '';
    } else if (lastStreakDate) {
      const diff = getDaysDifference(lastStreakDate, todayStr);
      if (diff === 1 || (diff === 2 && profile.streakShieldActive)) {
        // Keep yesterday's earned streak intact while waiting for today's task
        streakDays = Math.max(0, streakDays);
      } else {
        // Missed previous day(s)
        streakDays = 0;
        lastStreakDate = '';
      }
    } else {
      streakDays = 0;
      lastStreakDate = '';
    }
  }

  const maxPossibleStreak = getDaysDifference(loginStartDate, todayStr) + 1;
  streakDays = Math.max(0, Math.min(streakDays, maxPossibleStreak));

  return {
    streakDays,
    lastStreakDate,
    dailyTasksDate: todayStr,
    loginStartDate,
    dailyTasksCompleted,
  };
}

export default function App() {
  const [showIntroAnimation, setShowIntroAnimation] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('contents');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);

  // Active User Profile State (Loaded from Encrypted Tamper-Evident Security Vault)
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(
    () => {
      const parsed = loadSecureProfile();
      if (parsed && parsed.email && parsed.name) {
        const base: UserProfile = {
          id: parsed.id || `cand_${Date.now()}`,
          name: parsed.name,
          email: parsed.email,
          university: parsed.university || 'Engineering Institution',
          graduationYear: parsed.graduationYear || '',
          dreamCompany: '',
          targetPackage: '',
          targetRole: '',
          consentGiven: true,
          avatarSeed: parsed.avatarSeed || parsed.name.toLowerCase(),
          streakDays:
            typeof parsed.streakDays === 'number' ? parsed.streakDays : 0,
          lastStreakDate: parsed.lastStreakDate || '',
          dailyTasksDate: parsed.dailyTasksDate || '',
          loginStartDate: parsed.loginStartDate,
          streakShieldActive: Boolean(parsed.streakShieldActive),
          highGameScore:
            typeof parsed.highGameScore === 'number' ? parsed.highGameScore : 0,
          solvedDSAIds: Array.isArray(parsed.solvedDSAIds)
            ? parsed.solvedDSAIds
            : [],
          solvedAptitudeIds: Array.isArray(parsed.solvedAptitudeIds)
            ? parsed.solvedAptitudeIds
            : [],
          bookmarkedDSAIds: Array.isArray(parsed.bookmarkedDSAIds)
            ? parsed.bookmarkedDSAIds
            : [],
          dailyTasksCompleted: {
            dsaToday: Boolean(parsed.dailyTasksCompleted?.dsaToday),
            aptitudeToday: Boolean(parsed.dailyTasksCompleted?.aptitudeToday),
            commToday: Boolean(parsed.dailyTasksCompleted?.commToday),
            streakShieldChecked: Boolean(
              parsed.dailyTasksCompleted?.streakShieldChecked
            ),
          },
          mockTestsTaken:
            typeof parsed.mockTestsTaken === 'number'
              ? parsed.mockTestsTaken
              : 0,
          avgMockAccuracy:
            typeof parsed.avgMockAccuracy === 'number'
              ? parsed.avgMockAccuracy
              : 0,
        };
        const normalized = normalizeDailyStreak(base);
        const finalProfile = {
          ...base,
          ...normalized,
        };
        saveSecureProfile(finalProfile);
        return finalProfile;
      }
      return null;
    }
  );

  // Sync with Firebase Auth & Supabase on session hydration
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.emailVerified) {
        try {
          const remoteData = await loadCandidateFromFirestore();
          if (remoteData) {
            setCurrentProfile((prev) => {
              if (!prev) return prev;
              const rawMerged: UserProfile = {
                ...prev,
                ...remoteData,
                graduationYear:
                  prev.graduationYear || remoteData.graduationYear || '',
                loginStartDate: prev.loginStartDate,
                lastStreakDate: prev.lastStreakDate,
                dailyTasksDate: prev.dailyTasksDate,
                solvedDSAIds: Array.from(
                  new Set([
                    ...(prev.solvedDSAIds || []),
                    ...(remoteData.solvedDSAIds || []),
                  ])
                ),
                solvedAptitudeIds: Array.from(
                  new Set([
                    ...(prev.solvedAptitudeIds || []),
                    ...(remoteData.solvedAptitudeIds || []),
                  ])
                ),
              };
              const normalized = normalizeDailyStreak(rawMerged);
              const merged: UserProfile = { ...rawMerged, ...normalized };
              saveSecureProfile(merged);
              return merged;
            });
          }
        } catch {
          // Non-blocking
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Hydrate latest progress from Supabase when profile email is active
  useEffect(() => {
    if (!currentProfile?.email) return;
    let isMounted = true;
    loadCandidateFromSupabase(currentProfile.email).then((supaData) => {
      if (!isMounted || !supaData) return;
      setCurrentProfile((prev) => {
        if (!prev) return prev;
        const rawMerged: UserProfile = {
          ...prev,
          graduationYear:
            prev.graduationYear || supaData.graduationYear || '',
          streakShieldActive:
            prev.streakShieldActive || Boolean(supaData.streakShieldActive),
          highGameScore: Math.max(
            prev.highGameScore,
            supaData.highGameScore || 0
          ),
          solvedDSAIds: Array.from(
            new Set([
              ...(prev.solvedDSAIds || []),
              ...(supaData.solvedDSAIds || []),
            ])
          ),
          solvedAptitudeIds: Array.from(
            new Set([
              ...(prev.solvedAptitudeIds || []),
              ...(supaData.solvedAptitudeIds || []),
            ])
          ),
          bookmarkedDSAIds: Array.from(
            new Set([
              ...(prev.bookmarkedDSAIds || []),
              ...(supaData.bookmarkedDSAIds || []),
            ])
          ),
        };
        const normalized = normalizeDailyStreak(rawMerged);
        const merged: UserProfile = { ...rawMerged, ...normalized };
        saveSecureProfile(merged);
        return merged;
      });
    });
    return () => {
      isMounted = false;
    };
  }, [currentProfile?.email]);

  const updateProfile = useCallback((updated: UserProfile) => {
    const normalized = normalizeDailyStreak(updated);
    const cleanProfile: UserProfile = {
      ...updated,
      ...normalized,
      dreamCompany: '',
      targetPackage: '',
      targetRole: '',
    };
    setCurrentProfile(cleanProfile);
    saveSecureProfile(cleanProfile);

    // Sync to Express API with session token verification
    const sessionToken = sessionStorage.getItem('pp_session_token') || '';
    fetch('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken,
      },
      body: JSON.stringify({ user: cleanProfile }),
    }).catch(() => {});

    // Sync to Supabase
    syncCandidateToSupabase(cleanProfile).catch(() => {});

    // Sync to Firebase Firestore
    syncCandidateToFirestore(cleanProfile).catch(() => {});
  }, []);

  const handleLogout = () => {
    clearSecureVault();
    auth.signOut().catch(() => {});
    setCurrentProfile(null);
  };

  const handleToggleSolvedDSA = (id: string) => {
    if (!currentProfile) return;
    const isAlreadySolved = currentProfile.solvedDSAIds.includes(id);
    const solved = isAlreadySolved
      ? currentProfile.solvedDSAIds.filter((item) => item !== id)
      : [...currentProfile.solvedDSAIds, id];

    const nextTasks = {
      ...currentProfile.dailyTasksCompleted,
      dsaToday: !isAlreadySolved ? true : currentProfile.dailyTasksCompleted.dsaToday,
    };

    updateProfile({
      ...currentProfile,
      solvedDSAIds: solved,
      dailyTasksDate: getTodayDateString(),
      dailyTasksCompleted: nextTasks,
    });

    recordSolvedProblemInFirestore(id, 'DSA', !isAlreadySolved).catch(() => {});
  };

  const handleToggleBookmarkDSA = (id: string) => {
    if (!currentProfile) return;
    const bookmarks = currentProfile.bookmarkedDSAIds.includes(id)
      ? currentProfile.bookmarkedDSAIds.filter((item) => item !== id)
      : [...currentProfile.bookmarkedDSAIds, id];

    updateProfile({
      ...currentProfile,
      bookmarkedDSAIds: bookmarks,
    });
  };

  const handleGamePlayed = useCallback(
    (runScore: number, unlockedShield: boolean) => {
      setCurrentProfile((prev) => {
        if (!prev) return prev;
        const nextHighScore = Math.max(prev.highGameScore || 0, runScore);
        const nextShield = prev.streakShieldActive || unlockedShield;
        const updated: UserProfile = {
          ...prev,
          highGameScore: nextHighScore,
          streakShieldActive: nextShield,
          dailyTasksDate: getTodayDateString(),
          dailyTasksCompleted: {
            ...prev.dailyTasksCompleted,
            streakShieldChecked: true,
          },
        };
        const normalized = normalizeDailyStreak(updated);
        const cleanProfile: UserProfile = {
          ...updated,
          ...normalized,
          dreamCompany: '',
          targetPackage: '',
          targetRole: '',
        };
        saveSecureProfile(cleanProfile);

        const sessionToken = sessionStorage.getItem('pp_session_token') || '';
        fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': sessionToken,
          },
          body: JSON.stringify({ user: cleanProfile }),
        }).catch(() => {});
        syncCandidateToSupabase(cleanProfile).catch(() => {});
        syncCandidateToFirestore(cleanProfile).catch(() => {});

        return cleanProfile;
      });
    },
    []
  );

  const handleShieldEarned = useCallback(() => {
    setCurrentProfile((prev) => {
      if (!prev || prev.streakShieldActive) return prev;
      const updated: UserProfile = {
        ...prev,
        streakShieldActive: true,
        dailyTasksDate: getTodayDateString(),
        dailyTasksCompleted: {
          ...prev.dailyTasksCompleted,
          streakShieldChecked: true,
        },
      };
      const normalized = normalizeDailyStreak(updated);
      const cleanProfile: UserProfile = { ...updated, ...normalized };
      saveSecureProfile(cleanProfile);
      return cleanProfile;
    });
  }, []);

  // 1. Intro Animation Screen displayed first on launch
  if (showIntroAnimation) {
    return (
      <IntroSplashAnimation onFinish={() => setShowIntroAnimation(false)} />
    );
  }

  // 2. If candidate is not signed in, show login screen
  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-[#FCFCFD] text-[#18181B] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-white">
        <CandidateLoginPage
          onLoginSuccess={(user) => {
            const normalized = normalizeDailyStreak(user);
            const finalUser = { ...user, ...normalized };
            saveSecureProfile(finalUser);
            setCurrentProfile(finalUser);
            setActiveTab('contents');
          }}
        />
        <LegalModals
          activeModal={legalModal}
          onClose={() => setLegalModal(null)}
        />
        <CookieConsentBanner />
      </div>
    );
  }

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (tab === 'arcade') {
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        }
      } catch {
        // Ignore fullscreen restrictions
      }
    } else {
      try {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
      } catch {
        // Ignore
      }
    }
  };

  // Dedicated Full-Screen Viewport for Byte Runner on Mobile & Desktop
  if (activeTab === 'arcade') {
    return (
      <ByteRunnerGame
        currentStreak={currentProfile.streakDays}
        streakShieldActive={currentProfile.streakShieldActive}
        initialHighScore={currentProfile.highGameScore}
        onShieldEarned={handleShieldEarned}
        onGamePlayed={handleGamePlayed}
        onExit={() => handleTabChange('contents')}
      />
    );
  }

  const NAV_ITEMS: {
    id: NavTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'contents',
      label: 'Course Syllabus',
      shortLabel: 'Syllabus',
      icon: LayoutGrid,
    },
    { id: 'dsa', label: '3,000+ DSA Hub', shortLabel: 'DSA Hub', icon: Code2 },
    {
      id: 'aptitude',
      label: '10,000+ Aptitude',
      shortLabel: 'Aptitude',
      icon: Brain,
    },
    {
      id: 'voice',
      label: 'Interactive Voice Coach',
      shortLabel: 'Voice Coach',
      icon: Mic,
    },
    {
      id: 'arcade',
      label: 'Byte Runner',
      shortLabel: 'Byte Runner',
      icon: Zap,
    },
    {
      id: 'curriculum',
      label: '9-Month Course',
      shortLabel: '9M Course',
      icon: Calendar,
    },
    {
      id: 'interview',
      label: 'Interview Prep Tips',
      shortLabel: 'Prep Tips',
      icon: Compass,
    },
    {
      id: 'resume',
      label: 'Resume Builder',
      shortLabel: 'Resume',
      icon: FileText,
    },
    { id: 'profile', label: 'Profile', shortLabel: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#FCFCFD] text-gray-900 flex flex-col font-sans selection:bg-[#D4AF37] selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Official Pro Placement Inner App Logo & Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleTabChange('contents')}
              className="flex items-center gap-2.5 transition text-left"
              title="Pro Placement"
            >
              <ProPlacementAppLogo size="sm" showTextBeside />
            </button>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-[#B8860B]' : 'text-gray-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Zone */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Static Daily Streak Indicator (Counts only after completing at least 1 daily task) */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs select-none">
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span className="font-mono font-bold text-gray-900 tabular-nums">
                {currentProfile.streakDays}d
              </span>
              {currentProfile.streakShieldActive && (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </div>

            {/* Candidate Profile Button */}
            <button
              onClick={() => handleTabChange('profile')}
              aria-label="Profile settings"
              className="flex items-center gap-2 p-1 sm:pl-2.5 bg-[#FAFAFA] border border-gray-200 rounded-xl hover:border-gray-300 transition"
            >
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-gray-900 truncate max-w-[110px] leading-tight">
                  {currentProfile.name}
                </div>
              </div>
              <div className="h-7 w-7 rounded-lg bg-[#18181B] text-white flex items-center justify-center text-xs font-bold">
                {currentProfile.name.charAt(0).toUpperCase()}
              </div>
            </button>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="hidden sm:flex items-center p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="xl:hidden p-2 text-gray-600 hover:text-gray-900 rounded-xl border border-gray-200"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Full Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-gray-200 bg-white p-4 space-y-1 shadow-lg">
            <div className="pb-2 mb-2 border-b border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Signed in as{' '}
                <strong className="text-gray-900">{currentProfile.name}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-red-600 hover:underline flex items-center gap-1 font-medium"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition ${
                    isActive
                      ? 'bg-[#18181B] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {activeTab === 'contents' && (
          <ContentsList
            currentProfile={currentProfile}
            onSelectTab={(tab: NavTab) => handleTabChange(tab)}
          />
        )}

        {activeTab === 'dsa' && (
          <DsaHub
            solvedIds={currentProfile.solvedDSAIds}
            bookmarkedIds={currentProfile.bookmarkedDSAIds}
            onToggleSolved={handleToggleSolvedDSA}
            onToggleBookmark={handleToggleBookmarkDSA}
          />
        )}

        {activeTab === 'aptitude' && (
          <AptitudeArena
            onScoreUpdate={() => {
              const aptCount = currentProfile.solvedAptitudeIds.length + 1;
              const nextAptIds = [
                ...currentProfile.solvedAptitudeIds,
                `apt_${Date.now()}_${aptCount}`,
              ];

              updateProfile({
                ...currentProfile,
                solvedAptitudeIds: nextAptIds,
                dailyTasksDate: getTodayDateString(),
                dailyTasksCompleted: {
                  ...currentProfile.dailyTasksCompleted,
                  aptitudeToday: true,
                },
              });
            }}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceCoach
            onSessionComplete={() => {
              updateProfile({
                ...currentProfile,
                dailyTasksDate: getTodayDateString(),
                dailyTasksCompleted: {
                  ...currentProfile.dailyTasksCompleted,
                  commToday: true,
                },
              });
            }}
          />
        )}

        {activeTab === 'curriculum' && (
          <CurriculumRoadmap
            onStartDSA={() => handleTabChange('dsa')}
            onStartAptitude={() => handleTabChange('aptitude')}
            onStartComm={() => handleTabChange('voice')}
            onDayCompleted={() => {
              updateProfile({
                ...currentProfile,
                dailyTasksDate: getTodayDateString(),
                dailyTasksCompleted: {
                  ...currentProfile.dailyTasksCompleted,
                  dsaToday: true,
                },
              });
            }}
          />
        )}

        {activeTab === 'interview' && <InterviewHub />}

        {activeTab === 'resume' && <AtsResumeBuilder />}

        {activeTab === 'profile' && (
          <ProfileManager
            currentProfile={currentProfile}
            onSelectProfile={(p) => updateProfile(p)}
            onUpdateProfile={(p) => updateProfile(p)}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Footer — Single Author Credit Only at the End of the App */}
      <footer className="border-t border-gray-200 bg-white mt-12 py-8 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left font-medium text-gray-700">
            Developed by{' '}
            <span className="font-semibold text-gray-900">Bhargava B</span> for{' '}
            <span className="font-semibold text-gray-900">3LLION Ventures</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            <button
              onClick={() => setLegalModal('PRIVACY')}
              className="hover:text-gray-900 transition underline-offset-4 hover:underline"
            >
              Privacy Policy
            </button>
            <span aria-hidden="true" className="text-gray-300">
              ·
            </span>
            <button
              onClick={() => setLegalModal('TERMS')}
              className="hover:text-gray-900 transition underline-offset-4 hover:underline"
            >
              Terms & Conditions
            </button>
            <span aria-hidden="true" className="text-gray-300">
              ·
            </span>
            <button
              onClick={() => setLegalModal('COOKIE')}
              className="hover:text-gray-900 transition underline-offset-4 hover:underline"
            >
              Cookie Policy
            </button>
            <span aria-hidden="true" className="text-gray-300">
              ·
            </span>
            <button
              onClick={() => setLegalModal('REFUND')}
              className="hover:text-gray-900 transition underline-offset-4 hover:underline"
            >
              Refund Policy
            </button>
          </div>
        </div>
      </footer>

      <LegalModals
        activeModal={legalModal}
        onClose={() => setLegalModal(null)}
      />
      <CookieConsentBanner />
    </div>
  );
}
