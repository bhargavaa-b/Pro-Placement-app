import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutGrid,
  Code2,
  Brain,
  Calendar,
  Gamepad2,
  FileText,
  Compass,
  User,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  Flame,
  ArrowLeft,
} from 'lucide-react';
import { UserProfile } from './types';
import { ProfileManager } from './components/ProfileManager';
import { CandidateLoginPage } from './components/CandidateLoginPage';
import { ContentsList, BlackRedMicIcon } from './components/ContentsList';
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
  subscribeCandidateFromFirestore,
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
 * Enforces that daily streak counts when candidate completes daily tasks,
 * and increments by at most 1 per calendar day. Preserves streak across
 * phone and laptop devices so switching devices never zeroes the streak.
 */
function normalizeDailyStreak(profile: UserProfile): {
  streakDays: number;
  lastStreakDate: string;
  dailyTasksDate: string;
  loginStartDate: string;
  lastActiveTimestamp: number;
  dailyTasksCompleted: UserProfile['dailyTasksCompleted'];
} {
  const todayStr = getTodayDateString();
  const loginStartDate = profile.loginStartDate || todayStr;
  const nowMs = Date.now();
  const emailKey = profile.email ? profile.email.trim().toLowerCase() : 'user';

  // Persist current active timestamp
  try {
    localStorage.setItem(`pp_last_active_${emailKey}`, String(nowMs));
    localStorage.setItem('pp_last_active_timestamp', String(nowMs));
  } catch {
    // Ignore
  }

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
      streakDays = Math.max(1, streakDays);
      lastStreakDate = todayStr;
    }
  } else {
    // 0 daily tasks completed today: check if yesterday's streak is still alive
    if (lastStreakDate === todayStr) {
      streakDays = Math.max(0, streakDays);
    } else if (lastStreakDate) {
      const diff = getDaysDifference(lastStreakDate, todayStr);
      if (diff === 1 || (diff === 2 && profile.streakShieldActive)) {
        // Yesterday was active; today is still pending. Keep streak intact!
        streakDays = Math.max(0, streakDays);
      } else {
        // Missed previous days without streak shield
        streakDays = 0;
        lastStreakDate = '';
      }
    } else {
      streakDays = 0;
      lastStreakDate = '';
    }
  }

  return {
    streakDays,
    lastStreakDate,
    dailyTasksDate: todayStr,
    loginStartDate,
    lastActiveTimestamp: nowMs,
    dailyTasksCompleted,
  };
}

export default function App() {
  const [showIntroAnimation, setShowIntroAnimation] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('legal')) return false;
    } catch {
      // Ignore
    }
    return true;
  });
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab') as NavTab | null;
      const valid: NavTab[] = [
        'contents',
        'dsa',
        'aptitude',
        'voice',
        'curriculum',
        'interview',
        'resume',
        'arcade',
        'profile',
      ];
      if (t && valid.includes(t)) return t;
    } catch {
      // Ignore
    }
    return 'contents';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tabHistory, setTabHistory] = useState<NavTab[]>(() => {
    return activeTab !== 'contents' ? ['contents', activeTab] : ['contents'];
  });
  const tabHistoryRef = useRef<NavTab[]>(tabHistory);
  useEffect(() => {
    tabHistoryRef.current = tabHistory;
  }, [tabHistory]);

  const [legalModal, setLegalModal] = useState<LegalModalType>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const legal = (params.get('legal') || '').toLowerCase();
      if (legal === 'privacy') return 'PRIVACY';
      if (legal === 'terms') return 'TERMS';
      if (legal === 'cookie') return 'COOKIE';
      if (legal === 'refund') return 'REFUND';
      if (legal === 'delete-account' || legal === 'delete') return 'DELETE_ACCOUNT';
    } catch {
      // Ignore
    }
    return null;
  });

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

  // Realtime multi-device cloud synchronizer (Phone & Laptop)
  const syncWithRemoteCloud = useCallback(async (targetEmail?: string) => {
    const email = (targetEmail || currentProfile?.email || '').trim().toLowerCase();
    if (!email) return;

    try {
      const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const payload = await res.json();
        if (payload?.success && payload?.user) {
          const remote = payload.user;
          setCurrentProfile((prev) => {
            if (!prev || prev.email.trim().toLowerCase() !== email) return prev;
            const mergedStreak = Math.max(prev.streakDays || 0, Number(remote.streakDays) || 0);
            const mergedShield = Boolean(prev.streakShieldActive || remote.streakShieldActive);
            const mergedDSA = Array.from(new Set([...(prev.solvedDSAIds || []), ...(remote.solvedDSAIds || [])]));
            const mergedApt = Array.from(new Set([...(prev.solvedAptitudeIds || []), ...(remote.solvedAptitudeIds || [])]));
            const mergedBmk = Array.from(new Set([...(prev.bookmarkedDSAIds || []), ...(remote.bookmarkedDSAIds || [])]));
            const mergedScore = Math.max(prev.highGameScore || 0, Number(remote.highGameScore) || 0);

            const todayStr = getTodayDateString();
            const prevIsToday = prev.dailyTasksDate === todayStr;
            const remoteIsToday = remote.dailyTasksDate === todayStr;

            const mergedTasks = {
              dsaToday: Boolean((prevIsToday && prev.dailyTasksCompleted?.dsaToday) || (remoteIsToday && remote.dailyTasksCompleted?.dsaToday)),
              aptitudeToday: Boolean((prevIsToday && prev.dailyTasksCompleted?.aptitudeToday) || (remoteIsToday && remote.dailyTasksCompleted?.aptitudeToday)),
              commToday: Boolean((prevIsToday && prev.dailyTasksCompleted?.commToday) || (remoteIsToday && remote.dailyTasksCompleted?.commToday)),
              streakShieldChecked: Boolean((prevIsToday && prev.dailyTasksCompleted?.streakShieldChecked) || (remoteIsToday && remote.dailyTasksCompleted?.streakShieldChecked)),
            };

            const rawMerged: UserProfile = {
              ...prev,
              name: prev.name || remote.name || 'Candidate',
              university: prev.university || remote.university || 'Engineering Institution',
              graduationYear: prev.graduationYear || remote.graduationYear || '',
              streakDays: mergedStreak,
              lastStreakDate: remote.lastStreakDate || prev.lastStreakDate || '',
              dailyTasksDate: todayStr,
              streakShieldActive: mergedShield,
              highGameScore: mergedScore,
              solvedDSAIds: mergedDSA,
              solvedAptitudeIds: mergedApt,
              bookmarkedDSAIds: mergedBmk,
              dailyTasksCompleted: mergedTasks,
            };
            const normalized = normalizeDailyStreak(rawMerged);
            const merged = { ...rawMerged, ...normalized };
            saveSecureProfile(merged);
            return merged;
          });
        }
      }
    } catch {
      // Non-blocking
    }
  }, [currentProfile?.email]);

  // Sync with Firebase Auth & Realtime Firestore listener
  useEffect(() => {
    let unsubFs: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.emailVerified && fbUser.email) {
        syncWithRemoteCloud(fbUser.email);
        try {
          unsubFs = subscribeCandidateFromFirestore((remoteData) => {
            setCurrentProfile((prev) => {
              if (!prev) return prev;
              const updated: UserProfile = {
                ...prev,
                ...remoteData,
                streakDays: Math.max(prev.streakDays || 0, remoteData.streakDays || 0),
                highGameScore: Math.max(prev.highGameScore || 0, remoteData.highGameScore || 0),
              };
              const normalized = normalizeDailyStreak(updated);
              const merged = { ...updated, ...normalized };
              saveSecureProfile(merged);
              return merged;
            });
          });
        } catch {
          // Non-blocking
        }
      }
    });
    return () => {
      unsubAuth();
      if (unsubFs) unsubFs();
    };
  }, [syncWithRemoteCloud]);

  // Realtime Polling & Window Focus/Visibility Synchronization across Phone & Laptop
  useEffect(() => {
    if (!currentProfile?.email) return;
    const activeEmail = currentProfile.email.trim().toLowerCase();

    // 1. Initial hydrate from Supabase & server
    loadCandidateFromSupabase(activeEmail).then((supaData) => {
      if (!supaData) return;
      setCurrentProfile((prev) => {
        if (!prev || prev.email.trim().toLowerCase() !== activeEmail) return prev;
        const rawMerged: UserProfile = {
          ...prev,
          graduationYear: prev.graduationYear || supaData.graduationYear || '',
          streakDays: Math.max(prev.streakDays || 0, supaData.streakDays || 0),
          streakShieldActive: prev.streakShieldActive || Boolean(supaData.streakShieldActive),
          highGameScore: Math.max(prev.highGameScore, supaData.highGameScore || 0),
          solvedDSAIds: Array.from(new Set([...(prev.solvedDSAIds || []), ...(supaData.solvedDSAIds || [])])),
          solvedAptitudeIds: Array.from(new Set([...(prev.solvedAptitudeIds || []), ...(supaData.solvedAptitudeIds || [])])),
          bookmarkedDSAIds: Array.from(new Set([...(prev.bookmarkedDSAIds || []), ...(supaData.bookmarkedDSAIds || [])])),
        };
        const normalized = normalizeDailyStreak(rawMerged);
        const merged: UserProfile = { ...rawMerged, ...normalized };
        saveSecureProfile(merged);
        return merged;
      });
    });

    syncWithRemoteCloud(activeEmail);

    // 2. Periodic background sync every 6 seconds
    const syncTimer = setInterval(() => {
      syncWithRemoteCloud(activeEmail);
    }, 6000);

    // 3. Instant sync whenever phone/laptop tab or window comes into focus
    const handleActiveFocus = () => {
      if (document.visibilityState === 'visible') {
        syncWithRemoteCloud(activeEmail);
      }
    };
    window.addEventListener('visibilitychange', handleActiveFocus);
    window.addEventListener('focus', handleActiveFocus);

    // 4. Multi-user heartbeat
    const sendHeartbeat = () => {
      fetch('/api/community/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activeEmail }),
      }).catch(() => {});
    };
    sendHeartbeat();
    const hbTimer = setInterval(sendHeartbeat, 60000);

    return () => {
      clearInterval(syncTimer);
      clearInterval(hbTimer);
      window.removeEventListener('visibilitychange', handleActiveFocus);
      window.removeEventListener('focus', handleActiveFocus);
    };
  }, [currentProfile?.email, syncWithRemoteCloud]);

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
    setTabHistory(['contents']);
    setActiveTab('contents');
    setCurrentProfile(null);
  };

  const exitFullscreenSafe = useCallback(() => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    } catch {
      // Ignore
    }
  }, []);

  // Consecutive back tracking for mobile phone back button & gesture navigation
  const consecutiveBackCountRef = useRef<number>(0);
  const lastBackTimeRef = useRef<number>(0);
  const [showExitToast, setShowExitToast] = useState(false);
  const exitToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showExitToastNotification = useCallback(() => {
    setShowExitToast(true);
    if (exitToastTimerRef.current) {
      clearTimeout(exitToastTimerRef.current);
    }
    exitToastTimerRef.current = setTimeout(() => {
      setShowExitToast(false);
    }, 2500);
  }, []);

  const performAppExit = useCallback(() => {
    setShowExitToast(false);
    consecutiveBackCountRef.current = 0;
    try {
      window.close();
    } catch {
      // Ignore
    }
    try {
      window.history.back();
    } catch {
      // Ignore
    }
  }, []);

  /**
   * Unified backward navigation handler:
   * 1. 1st back: returns to previous page (or dismisses open subviews/modals).
   * 2. 2nd back (if done twice): returns directly to Home page ('contents').
   * 3. 3rd back (if done once more from Home): exits the app.
   */
  const executeBackNavigation = useCallback((_source: 'ui' | 'popstate') => {
    // 1. Check subview handler (e.g. active question in DSA Hub or timed mock in Aptitude)
    const win = window as unknown as {
      __ppSubViewBackHandler?: (() => boolean) | null;
    };
    if (typeof win.__ppSubViewBackHandler === 'function') {
      const handled = win.__ppSubViewBackHandler();
      if (handled) {
        return;
      }
    }

    // 2. Check legal modal
    if (legalModal) {
      setLegalModal(null);
      return;
    }

    // 3. Check mobile menu
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
      return;
    }

    const now = Date.now();
    if (now - lastBackTimeRef.current < 2500) {
      consecutiveBackCountRef.current += 1;
    } else {
      consecutiveBackCountRef.current = 1;
    }
    lastBackTimeRef.current = now;

    const backCount = consecutiveBackCountRef.current;
    const currentStack = tabHistoryRef.current;
    const currentTab = currentStack[currentStack.length - 1] || activeTab;

    // RULE 1: If user presses back once (backCount === 1):
    // Return to previous page
    if (backCount === 1) {
      if (currentTab !== 'contents') {
        if (currentStack.length > 1) {
          const nextStack = currentStack.slice(0, -1);
          const prevTab = nextStack[nextStack.length - 1] || 'contents';
          tabHistoryRef.current = nextStack;
          setTabHistory(nextStack);
          setActiveTab(prevTab);
          if (prevTab !== 'arcade') {
            exitFullscreenSafe();
          }
          try {
            window.history.replaceState(
              { ppTab: prevTab },
              '',
              prevTab === 'contents' ? window.location.pathname : `?tab=${prevTab}`
            );
          } catch {
            // Ignore
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          tabHistoryRef.current = ['contents'];
          setTabHistory(['contents']);
          setActiveTab('contents');
          exitFullscreenSafe();
          try {
            window.history.replaceState(
              { ppTab: 'contents' },
              '',
              window.location.pathname
            );
          } catch {
            // Ignore
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        // User is ALREADY on Home ('contents')!
        showExitToastNotification();
      }
      return;
    }

    // RULE 2: If user presses back twice (backCount === 2):
    // "and if it does twice it must return to home page"
    if (backCount === 2) {
      if (currentTab !== 'contents') {
        tabHistoryRef.current = ['contents'];
        setTabHistory(['contents']);
        setActiveTab('contents');
        exitFullscreenSafe();
        try {
          window.history.replaceState(
            { ppTab: 'contents' },
            '',
            window.location.pathname
          );
        } catch {
          // Ignore
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showExitToastNotification();
      } else {
        // Was already on Home on 1st back, and pressed back again (twice)!
        // "then if they does it once more it must exit app fix it"
        performAppExit();
      }
      return;
    }

    // RULE 3: If user does it once more (backCount >= 3):
    // "then if they does it once more it must exit app fix it"
    performAppExit();
  }, [
    activeTab,
    exitFullscreenSafe,
    legalModal,
    mobileMenuOpen,
    performAppExit,
    showExitToastNotification,
  ]);

  const handleStepBack = useCallback(() => {
    executeBackNavigation('ui');
  }, [executeBackNavigation]);

  // Seed history guard & handle mobile hardware/swipe Back button (popstate)
  useEffect(() => {
    try {
      if (!window.history.state || !window.history.state.ppInitialized) {
        window.history.replaceState(
          { ppInitialized: true, ppTab: activeTab },
          '',
          activeTab === 'contents' ? window.location.pathname : `?tab=${activeTab}`
        );
      }
    } catch {
      // Ignore history restrictions in sandboxed frames
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      executeBackNavigation('popstate');
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [executeBackNavigation]);

  // Mobile In-Built Edge Swipe-to-Go-Back Navigation (matches default iOS / Android gesture navigation)
  const [swipeBackIndicator, setSwipeBackIndicator] = useState<{
    visible: boolean;
    x: number;
    opacity: number;
  }>({ visible: false, x: 0, opacity: 0 });

  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    isEdge: boolean;
  } | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const isEdge = touch.clientX <= 48;
      const isLeftRegion = touch.clientX <= Math.min(window.innerWidth * 0.35, 120);

      const canNavigateBack =
        activeTab !== 'contents' ||
        tabHistoryRef.current.length > 1 ||
        Boolean(legalModal) ||
        mobileMenuOpen;

      if (isEdge || (isLeftRegion && canNavigateBack)) {
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
          isEdge,
        };
      } else {
        touchStartRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      const canNavigateBack =
        activeTab !== 'contents' ||
        tabHistoryRef.current.length > 1 ||
        Boolean(legalModal) ||
        mobileMenuOpen;

      if (deltaX > 15 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && canNavigateBack) {
        const progress = Math.min(1, deltaX / 80);
        setSwipeBackIndicator({
          visible: true,
          x: Math.min(50, deltaX * 0.5),
          opacity: progress,
        });
      } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
        touchStartRef.current = null;
        setSwipeBackIndicator({ visible: false, x: 0, opacity: 0 });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) {
        setSwipeBackIndicator({ visible: false, x: 0, opacity: 0 });
        return;
      }
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;
      const isEdge = touchStartRef.current.isEdge;
      touchStartRef.current = null;
      setSwipeBackIndicator({ visible: false, x: 0, opacity: 0 });

      const threshold = isEdge ? 45 : 70;
      const velocity = deltaX / Math.max(1, elapsed);
      const isFastSwipe = deltaX > 30 && velocity > 0.3;

      if ((deltaX >= threshold || isFastSwipe) && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        handleStepBack();
      }
    };

    const handleTouchCancel = () => {
      touchStartRef.current = null;
      setSwipeBackIndicator({ visible: false, x: 0, opacity: 0 });
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [activeTab, handleStepBack, legalModal, mobileMenuOpen]);

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
          onOpenLegalModal={(modal) => setLegalModal(modal)}
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
    setMobileMenuOpen(false);
    consecutiveBackCountRef.current = 0;
    setShowExitToast(false);
    if (tab !== activeTab) {
      setTabHistory((prev) => {
        const last = prev[prev.length - 1];
        const updated = last === tab ? prev : [...prev, tab];
        tabHistoryRef.current = updated;
        return updated;
      });
      setActiveTab(tab);
      try {
        const nextUrl =
          tab === 'contents' ? window.location.pathname : `?tab=${tab}`;
        window.history.pushState(
          { ppInitialized: true, ppTab: tab },
          '',
          nextUrl
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // Ignore
      }
    }
    if (tab === 'arcade') {
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        }
      } catch {
        // Ignore fullscreen restrictions
      }
    } else {
      exitFullscreenSafe();
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
        onExit={handleStepBack}
      />
    );
  }

  const NAV_ITEMS: {
    id: NavTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
  }[] = [
    {
      id: 'contents',
      label: 'Course Syllabus',
      shortLabel: 'Syllabus',
      icon: LayoutGrid,
      colorClass: 'text-slate-700',
    },
    {
      id: 'dsa',
      label: '3,000+ DSA Hub',
      shortLabel: 'DSA Hub',
      icon: Code2,
      colorClass: 'text-emerald-600',
    },
    {
      id: 'aptitude',
      label: '10,000+ Aptitude',
      shortLabel: 'Aptitude',
      icon: Brain,
      colorClass: 'text-purple-600',
    },
    {
      id: 'voice',
      label: 'Voice Coach',
      shortLabel: 'Voice Coach',
      icon: BlackRedMicIcon,
      colorClass: 'text-red-600',
    },
    {
      id: 'arcade',
      label: 'Byte Runner',
      shortLabel: 'Byte Runner',
      icon: Gamepad2,
      colorClass: 'text-pink-500',
    },
    {
      id: 'curriculum',
      label: '9-Month Course',
      shortLabel: '9M Course',
      icon: Calendar,
      colorClass: 'text-amber-500',
    },
    {
      id: 'interview',
      label: 'Interview Prep Tips',
      shortLabel: 'Prep Tips',
      icon: Compass,
      colorClass: 'text-blue-600',
    },
    {
      id: 'resume',
      label: 'Resume Builder',
      shortLabel: 'Resume',
      icon: FileText,
      colorClass: 'text-teal-600',
    },
    {
      id: 'profile',
      label: 'Profile',
      shortLabel: 'Profile',
      icon: User,
      colorClass: 'text-slate-600',
    },
  ];

  return (
    <div className="relative min-h-screen pp-ambient-bg text-slate-900 flex flex-col font-sans selection:bg-slate-800 selection:text-white">
      {/* Architectural Background Canvas - Luminous Bright Blue & Classy */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden"
      >
        <div className="absolute inset-0 pp-architectural-grid opacity-75" />
        <div className="absolute -top-32 -left-20 w-[30rem] h-[30rem] rounded-full bg-sky-400/[0.16] blur-3xl" />
        <div className="absolute top-12 -right-20 w-[28rem] h-[28rem] rounded-full bg-blue-500/[0.14] blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-[32rem] h-[24rem] rounded-full bg-cyan-400/[0.12] blur-3xl" />
      </div>

      {/* Top Navigation - Classy Refined Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Official Pro Placement Inner App Logo & Brand + Step-Back Button */}
          <div className="flex items-center gap-2 shrink-0">
            {(activeTab !== 'contents' || tabHistory.length > 1) && (
              <button
                type="button"
                onClick={handleStepBack}
                aria-label="Go back to previous page"
                title="Back to previous page"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
            <button
              onClick={() => handleTabChange('contents')}
              className="flex items-center gap-2.5 transition text-left cursor-pointer"
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
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-bold border border-slate-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? item.colorClass : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Zone */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Daily Streak Indicator in Glassy Pink */}
            <div className="relative overflow-hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-b from-[#FFF0F5] via-[#FCE7F3] to-[#FBCFE8] border border-pink-300 rounded-xl text-xs select-none shadow-[0_2px_8px_rgba(244,114,182,0.2),inset_0_1px_1px_rgba(255,255,255,0.95)] before:absolute before:inset-x-0 before:top-0 before:h-[45%] before:bg-gradient-to-b before:from-white/80 before:to-transparent before:pointer-events-none">
              <Flame className="w-3.5 h-3.5 text-pink-600 fill-pink-400 drop-shadow-[0_1px_3px_rgba(236,72,153,0.4)] relative z-10" />
              <span className="font-mono font-bold text-black tabular-nums relative z-10">
                {currentProfile.streakDays}d
              </span>
              {currentProfile.streakShieldActive && (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 relative z-10" />
              )}
            </div>

            {/* Candidate Profile Button */}
            <button
              onClick={() => handleTabChange('profile')}
              aria-label="Profile settings"
              className="flex items-center gap-2 p-1 sm:pl-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition cursor-pointer"
            >
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 truncate max-w-[110px] leading-tight">
                  {currentProfile.name}
                </div>
              </div>
              <div className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                {currentProfile.name.charAt(0).toUpperCase()}
              </div>
            </button>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="hidden sm:flex items-center p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="xl:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 cursor-pointer"
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
          <div className="xl:hidden border-t border-slate-200 bg-white p-4 space-y-1 shadow-lg">
            <div className="pb-2 mb-2 border-b border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Signed in as{' '}
                <strong className="text-slate-900">{currentProfile.name}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-red-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
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
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.colorClass}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
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
              const newAptId = `apt_${Date.now()}_${aptCount}`;
              const nextAptIds = [
                ...currentProfile.solvedAptitudeIds,
                newAptId,
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

              recordSolvedProblemInFirestore(newAptId, 'APTITUDE', true).catch(
                () => {}
              );
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

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200/90 bg-white/90 backdrop-blur-md mt-12 py-8 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-center gap-4">
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

      {/* Default Mobile Edge Swipe Back Indicator */}
      {swipeBackIndicator.visible && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center transition-all duration-75 ease-out"
          style={{
            transform: `translate3d(${swipeBackIndicator.x - 18}px, -50%, 0)`,
            opacity: swipeBackIndicator.opacity,
          }}
        >
          <div className="w-10 h-10 rounded-full bg-[#0B2545]/90 backdrop-blur-md text-white shadow-2xl flex items-center justify-center border border-white/20">
            <ArrowLeft className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      {/* Phone Backward Navigation Exit Toast Prompt */}
      {showExitToast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-7 inset-x-0 mx-auto w-fit z-50 px-4 py-2 bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold rounded-full shadow-2xl border border-sky-400/40 flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>Press back once more to exit app</span>
        </div>
      )}

      <LegalModals
        activeModal={legalModal}
        onClose={() => setLegalModal(null)}
        activeEmail={currentProfile.email}
        onAccountDeleted={handleLogout}
      />
      <CookieConsentBanner />
    </div>
  );
}
