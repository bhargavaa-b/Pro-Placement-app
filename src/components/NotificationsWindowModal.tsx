import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Flame,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Play,
  RotateCcw,
  Megaphone,
  Send,
  Lock,
  Unlock,
  Trash2,
  ExternalLink,
  CheckCheck,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import {
  streakNotificationService,
  StreakNotificationStatus,
} from '../services/streakNotificationService';
import { publishBroadcastNotificationToFirestore } from '../lib/firebase';

export interface AppBroadcastNotification {
  id: string;
  title: string;
  message: string;
  priority: 'info' | 'important' | 'urgent';
  senderName: string;
  targetTab?: string;
  createdAt: string;
}

interface NotificationsWindowModalProps {
  isOpen: boolean;
  initialView?: 'inbox' | 'admin' | 'streak';
  onClose: () => void;
  notifications: AppBroadcastNotification[];
  lastReadAtMs: number;
  unreadCount: number;
  onMarkAllRead: () => void;
  onNotificationPublished?: (notif: AppBroadcastNotification) => void;
  onNotificationDeleted?: (id: string) => void;
  userEmail: string;
  userName: string;
  streakDays: number;
  streakShieldActive: boolean;
  onNavigateToTab?: (tab: string) => void;
}

const TARGET_TAB_LABELS: Record<string, string> = {
  contents: 'Course Syllabus',
  dsa: '3,000+ DSA Hub',
  aptitude: '10,000+ Aptitude',
  voice: 'Voice Coach',
  arcade: 'Byte Runner',
  curriculum: '9-Month Course',
  interview: 'Interview Prep Tips',
  resume: 'Resume Builder',
};

function formatNotificationTime(isoString: string): string {
  const ts = Date.parse(isoString);
  if (isNaN(ts)) return 'Just now';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  try {
    return new Date(ts).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Recent';
  }
}

export const NotificationsWindowModal: React.FC<
  NotificationsWindowModalProps
> = ({
  isOpen,
  initialView = 'inbox',
  onClose,
  notifications,
  lastReadAtMs,
  unreadCount,
  onMarkAllRead,
  onNotificationPublished,
  onNotificationDeleted,
  userEmail,
  userName,
  streakDays,
  streakShieldActive,
  onNavigateToTab,
}) => {
  const [activeView, setActiveView] = useState<'inbox' | 'admin' | 'streak'>(
    initialView
  );

  // Streak Alerts state
  const [streakStatus, setStreakStatus] = useState<StreakNotificationStatus>(
    () => streakNotificationService.getStatus(streakDays)
  );
  const [isRequestingPush, setIsRequestingPush] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [simulatedActive, setSimulatedActive] = useState(false);

  // Admin Verification & Broadcast state (adminToken kept strictly in React memory)
  const [adminToken, setAdminToken] = useState<string>('');
  const [adminStatus, setAdminStatus] = useState<{
    envPasscodeConfigured: boolean;
    isClaimed: boolean;
    isPrimaryAdminEmail: boolean;
  }>({
    envPasscodeConfigured: false,
    isClaimed: false,
    isPrimaryAdminEmail: false,
  });
  const [statusLoading, setStatusLoading] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [confirmPasscodeInput, setConfirmPasscodeInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);

  // Broadcast Composer state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'info' | 'important' | 'urgent'>(
    'info'
  );
  const [targetTab, setTargetTab] = useState('');
  const [senderName, setSenderName] = useState(
    userName ? `${userName} · Admin` : 'Admin · Pro Placement'
  );
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveView(initialView);
    }
  }, [isOpen, initialView]);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = streakNotificationService.subscribe((s) =>
      setStreakStatus(s)
    );
    return () => unsubscribe();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const fetchAdminStatus = async () => {
      setStatusLoading(true);
      try {
        const res = await fetch(
          `/api/admin/status?email=${encodeURIComponent(userEmail || '')}`,
          {
            headers: adminToken
              ? { Authorization: `Bearer ${adminToken}` }
              : undefined,
          }
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setAdminStatus({
            envPasscodeConfigured: Boolean(data.envPasscodeConfigured),
            isClaimed: Boolean(data.isClaimed),
            isPrimaryAdminEmail: Boolean(data.isPrimaryAdminEmail),
          });
          if (adminToken && !data.isUnlocked) {
            setAdminToken('');
          }
        }
      } catch {
        // Non-blocking
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    };
    fetchAdminStatus();
    return () => {
      cancelled = true;
    };
  }, [isOpen, userEmail, adminToken]);

  if (!isOpen) return null;

  const handleTogglePush = async () => {
    setIsRequestingPush(true);
    if (streakStatus.notificationsEnabled) {
      await streakNotificationService.setEnabled(false);
    } else {
      await streakNotificationService.setEnabled(true);
    }
    setStreakStatus(streakNotificationService.getStatus(streakDays));
    setIsRequestingPush(false);
  };

  const handleSendTest = async () => {
    setTestSent(true);
    await streakNotificationService.sendTestNotification(streakDays);
    setTimeout(() => setTestSent(false), 4000);
  };

  const handleSimulate16h = async () => {
    setSimulatedActive(true);
    const updated =
      await streakNotificationService.simulate16hInactivityAndCheck(streakDays);
    setStreakStatus(updated);
  };

  const handleResetSimulation = () => {
    setSimulatedActive(false);
    streakNotificationService.resetToActiveNow();
    setStreakStatus(streakNotificationService.getStatus(streakDays));
  };

  const handleClaimAdminPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    const cleanPass = passcodeInput.trim();
    if (cleanPass.length < 6) {
      setAdminAuthError('Passcode must be at least 6 characters long.');
      return;
    }
    if (cleanPass !== confirmPasscodeInput.trim()) {
      setAdminAuthError('Passcodes do not match. Please verify both entries.');
      return;
    }
    setIsVerifyingAdmin(true);
    try {
      const res = await fetch('/api/admin/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: cleanPass, email: userEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data?.adminToken) {
        setAdminAuthError(data?.error || 'Could not set admin passcode.');
        return;
      }
      setAdminToken(data.adminToken);
      setAdminStatus((prev) => ({ ...prev, isClaimed: true }));
      setPasscodeInput('');
      setConfirmPasscodeInput('');
    } catch {
      setAdminAuthError('Network error while setting admin passcode.');
    } finally {
      setIsVerifyingAdmin(false);
    }
  };

  const handleVerifyAdminPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    const cleanPass = passcodeInput.trim();
    if (!cleanPass) {
      setAdminAuthError('Enter your admin broadcast passcode.');
      return;
    }
    setIsVerifyingAdmin(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: cleanPass, email: userEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data?.adminToken) {
        setAdminAuthError(data?.error || 'Invalid admin passcode.');
        return;
      }
      setAdminToken(data.adminToken);
      setPasscodeInput('');
    } catch {
      setAdminAuthError('Network error while verifying admin passcode.');
    } finally {
      setIsVerifyingAdmin(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastFeedback(null);

    if (!title.trim() || !message.trim()) {
      setBroadcastFeedback({
        type: 'error',
        text: 'Please provide both a notification headline and message.',
      });
      return;
    }

    setIsSendingBroadcast(true);
    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          priority,
          targetTab,
          senderName: senderName.trim() || 'Admin · Pro Placement',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.notification) {
        if (res.status === 401) {
          setAdminToken('');
        }
        setBroadcastFeedback({
          type: 'error',
          text: data?.error || 'Failed to send broadcast notification.',
        });
        return;
      }

      const published: AppBroadcastNotification = data.notification;
      if (onNotificationPublished) {
        onNotificationPublished(published);
      }

      // Also persist to Firestore when signed in via Firebase Auth
      publishBroadcastNotificationToFirestore({
        id: published.id,
        title: published.title,
        message: published.message,
        priority: published.priority,
      }).catch(() => {});

      const connectedCount =
        typeof data.deliveredToConnectedUsers === 'number'
          ? data.deliveredToConnectedUsers
          : 1;

      setBroadcastFeedback({
        type: 'success',
        text: `Notification broadcasted to every user (${connectedCount} live session${
          connectedCount === 1 ? '' : 's'
        } connected right now).`,
      });
      setTitle('');
      setMessage('');
      setPriority('info');
      setTargetTab('');
    } catch {
      setBroadcastFeedback({
        type: 'error',
        text: 'Network error while delivering broadcast.',
      });
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok && onNotificationDeleted) {
        onNotificationDeleted(id);
      }
    } catch {
      // Non-blocking
    }
  };

  const remainingHours = Math.floor(streakStatus.hoursRemainingBeforeReset);
  const remainingMinutes = Math.floor(
    (streakStatus.hoursRemainingBeforeReset - remainingHours) * 60
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B2545] via-[#13315C] to-[#1D4E89] text-white p-4 sm:p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  Notifications &amp; Admin Broadcasts
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time announcements from Admin &amp; 24-hour phone streak reminders
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications window"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-5 pt-2.5 flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveView('inbox')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeView === 'inbox'
                ? 'bg-white text-[#0B2545] border-[#D4AF37] shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-sky-600" />
            <span>Announcements</span>
            {unreadCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-rose-600 text-white font-mono">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveView('admin')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeView === 'admin'
                ? 'bg-white text-[#0B2545] border-[#D4AF37] shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-600" />
            <span>Admin Broadcast</span>
            {adminToken ? (
              <Unlock className="w-3 h-3 text-emerald-600" />
            ) : (
              <Lock className="w-3 h-3 text-slate-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveView('streak')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeView === 'streak'
                ? 'bg-white text-[#0B2545] border-pink-500 shadow-2xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-pink-600" />
            <span>Streak Alerts ({streakDays}d)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-slate-800 text-xs">
          {/* TAB 1: ANNOUNCEMENTS INBOX */}
          {activeView === 'inbox' && (
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-600 font-medium">
                  {notifications.length === 0
                    ? 'No admin announcements yet.'
                    : `Showing ${notifications.length} broadcast announcement${
                        notifications.length === 1 ? '' : 's'
                      }`}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={onMarkAllRead}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-semibold text-xs transition cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark All Read</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveView('admin')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs transition cursor-pointer"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-amber-700" />
                    <span>Send as Admin</span>
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="py-12 px-4 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    All Caught Up
                  </h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                    When an Admin sends an announcement, placement drive alert, or study update, it arrives live inside this notification window for every user.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((item) => {
                    const createdTs = Date.parse(item.createdAt) || 0;
                    const isUnread = createdTs > lastReadAtMs;
                    const priorityStyle =
                      item.priority === 'urgent'
                        ? {
                            card: 'bg-rose-50/80 border-rose-200',
                            badge: 'bg-rose-600 text-white',
                            label: 'Urgent',
                          }
                        : item.priority === 'important'
                        ? {
                            card: 'bg-amber-50/80 border-amber-200',
                            badge: 'bg-amber-500 text-stone-950',
                            label: 'Important',
                          }
                        : {
                            card: 'bg-white border-slate-200',
                            badge: 'bg-sky-100 text-sky-800',
                            label: 'Announcement',
                          };

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-4 space-y-2 shadow-2xs transition ${priorityStyle.card}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${priorityStyle.badge}`}
                            >
                              {priorityStyle.label}
                            </span>
                            {isUnread && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                New
                              </span>
                            )}
                            <span className="text-[11px] font-semibold text-slate-500">
                              {item.senderName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-mono text-slate-500">
                              {formatNotificationTime(item.createdAt)}
                            </span>
                            {adminToken && (
                              <button
                                type="button"
                                onClick={() => handleDeleteNotification(item.id)}
                                title="Delete notification for all users"
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900">
                          {item.title}
                        </h4>
                        <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {item.message}
                        </p>

                        {item.targetTab && onNavigateToTab && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onNavigateToTab(item.targetTab!);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B2545] hover:bg-[#13315C] text-white text-xs font-semibold transition cursor-pointer"
                            >
                              <span>
                                Open {TARGET_TAB_LABELS[item.targetTab] || item.targetTab}
                              </span>
                              <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADMIN BROADCAST WINDOW */}
          {activeView === 'admin' && (
            <div className="space-y-4">
              {statusLoading ? (
                <div className="py-10 text-center text-slate-500">
                  Checking admin broadcast status...
                </div>
              ) : !adminToken ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0B2545] text-[#D4AF37] flex items-center justify-center shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {!adminStatus.isClaimed &&
                        !adminStatus.envPasscodeConfigured
                          ? 'First-Time Admin Key Setup'
                          : 'Admin Verification Required'}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {!adminStatus.isClaimed &&
                        !adminStatus.envPasscodeConfigured
                          ? 'Create a server-verified Admin Broadcast passcode (6+ characters) to authorize sending global notifications to every user.'
                          : 'Enter your Admin Broadcast passcode to unlock sending real-time notifications to every candidate.'}
                      </p>
                    </div>
                  </div>

                  {!adminStatus.envPasscodeConfigured && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                      <strong>Security Tip:</strong> For production deployments, you can set{' '}
                      <code className="font-mono bg-amber-100 px-1 rounded">
                        ADMIN_PASSCODE
                      </code>{' '}
                      in Settings &rarr; Secrets to lock admin access exclusively to that server secret.
                    </div>
                  )}

                  {adminAuthError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{adminAuthError}</span>
                    </div>
                  )}

                  {!adminStatus.isClaimed &&
                  !adminStatus.envPasscodeConfigured ? (
                    <form
                      onSubmit={handleClaimAdminPasscode}
                      className="space-y-3"
                    >
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Create Admin Passcode
                        </label>
                        <input
                          type="password"
                          value={passcodeInput}
                          onChange={(e) => setPasscodeInput(e.target.value)}
                          placeholder="Minimum 6 characters"
                          minLength={6}
                          maxLength={128}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Confirm Admin Passcode
                        </label>
                        <input
                          type="password"
                          value={confirmPasscodeInput}
                          onChange={(e) =>
                            setConfirmPasscodeInput(e.target.value)
                          }
                          placeholder="Re-enter passcode"
                          minLength={6}
                          maxLength={128}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isVerifyingAdmin}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#0B2545] hover:bg-[#13315C] text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-60"
                      >
                        {isVerifyingAdmin
                          ? 'Configuring Admin Key...'
                          : 'Set Admin Passcode & Unlock'}
                      </button>
                    </form>
                  ) : (
                    <form
                      onSubmit={handleVerifyAdminPasscode}
                      className="space-y-3"
                    >
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Admin Broadcast Passcode
                        </label>
                        <input
                          type="password"
                          value={passcodeInput}
                          onChange={(e) => setPasscodeInput(e.target.value)}
                          placeholder="Enter admin passcode"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isVerifyingAdmin}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#0B2545] hover:bg-[#13315C] text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-60"
                      >
                        {isVerifyingAdmin
                          ? 'Verifying...'
                          : 'Unlock Admin Notification Window'}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={handleSendBroadcast}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Admin Unlocked</span>
                      </span>
                      <span className="text-xs text-slate-600">
                        Reaches every user&apos;s Bell icon instantly
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminToken('')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Lock Admin</span>
                    </button>
                  </div>

                  {broadcastFeedback && (
                    <div
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                        broadcastFeedback.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      {broadcastFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{broadcastFeedback.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Notification Headline
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Mock Interview Drive Tonight at 8 PM"
                        maxLength={120}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Sender Label
                      </label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Bhargava B · Admin"
                        maxLength={80}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Priority Level
                      </label>
                      <select
                        value={priority}
                        onChange={(e) =>
                          setPriority(
                            e.target.value as 'info' | 'important' | 'urgent'
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
                      >
                        <option value="info">General Announcement</option>
                        <option value="important">Important Update</option>
                        <option value="urgent">Urgent Alert</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Quick-Jump Module (Optional)
                      </label>
                      <select
                        value={targetTab}
                        onChange={(e) => setTargetTab(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
                      >
                        <option value="">No module shortcut</option>
                        <option value="contents">Course Syllabus</option>
                        <option value="dsa">3,000+ DSA Hub</option>
                        <option value="aptitude">10,000+ Aptitude Arena</option>
                        <option value="voice">Voice Coach</option>
                        <option value="arcade">Byte Runner</option>
                        <option value="curriculum">9-Month Course</option>
                        <option value="interview">Interview Prep Tips</option>
                        <option value="resume">ATS Resume Builder</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Message to Every User
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your announcement, schedule reminder, placement update, or motivation note..."
                      rows={4}
                      maxLength={800}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B2545] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingBroadcast}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0B2545] to-[#1D4E89] hover:from-[#13315C] hover:to-[#0B2545] text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-4 h-4 text-[#D4AF37]" />
                    <span>
                      {isSendingBroadcast
                        ? 'Broadcasting Live...'
                        : 'Send Notification to Every User'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: PHONE STREAK RETENTION ALERTS */}
          {activeView === 'streak' && (
            <div className="space-y-4">
              {/* Current Streak & Inactivity Status Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-pink-600 fill-pink-400" />
                    <span className="font-bold text-slate-900 text-sm">
                      Active Streak: {streakDays} Days
                    </span>
                    {streakShieldActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Shield Active
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    24h Cycle
                  </span>
                </div>

                {streakStatus.isIn8HourDangerWindow ? (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2.5 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs">
                        URGENT: Inside 8-Hour Danger Window
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        You have not practiced in{' '}
                        {streakStatus.hoursSinceLastActive} hours. Only{' '}
                        <strong>
                          {remainingHours}h {remainingMinutes}m remaining
                        </strong>{' '}
                        before your {streakDays}-day streak resets in 24 hours.
                      </p>
                    </div>
                  </div>
                ) : streakStatus.isExpired ? (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg flex items-start gap-2.5 text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs">
                        Streak Time Limit Reached (24h Elapsed)
                      </div>
                      <p className="text-[11px] text-rose-800 mt-0.5">
                        {streakShieldActive
                          ? 'Your Streak Shield has protected your streak! Practice now to maintain momentum.'
                          : 'More than 24 hours have passed without practice. Solve 1 question now to restart your streak!'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs">
                        Streak Protected &amp; Safe
                      </div>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Last active {streakStatus.hoursSinceLastActive}h ago.
                        Next danger alert scheduled at the 16th hour (
                        {Math.max(
                          0,
                          Math.round(16 - streakStatus.hoursSinceLastActive)
                        )}
                        h from now).
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Master Notification Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-pink-500 text-white shadow-xs">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      Phone Retention Push Notifications
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Fires within 8 hours before 24h reset (at 16h inactivity)
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTogglePush}
                  disabled={isRequestingPush}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    streakStatus.notificationsEnabled
                      ? 'bg-pink-600'
                      : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      streakStatus.notificationsEnabled
                        ? 'translate-x-5'
                        : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Test Notification & Simulate Inactivity Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleSendTest}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
                >
                  <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                  <span>
                    {testSent
                      ? 'Sent to Phone!'
                      : 'Test Notification on Phone'}
                  </span>
                </button>

                {!simulatedActive ? (
                  <button
                    type="button"
                    onClick={handleSimulate16h}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200/80 text-amber-900 border border-amber-300 font-semibold text-xs transition cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Simulate 16h Inactivity (8h Left)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetSimulation}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                    <span>Reset Simulation to Active</span>
                  </button>
                )}
              </div>

              {/* Phone Setup Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0B2545]" />
                  <span>How Phone Notifications Work:</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc pl-4 leading-relaxed">
                  <li>
                    <strong>Android Phones (Chrome / Edge):</strong> Tap{' '}
                    <em>&ldquo;Allow&rdquo;</em> when prompted for instant
                    lock-screen alerts.
                  </li>
                  <li>
                    <strong>iPhones (Safari iOS 16.4+):</strong> Tap Share &rarr;{' '}
                    <em>&ldquo;Add to Home Screen&rdquo;</em> and open Pro
                    Placement from your Home Screen.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 font-medium">
            {activeView === 'streak'
              ? `Push Alerts: ${
                  streakStatus.notificationsEnabled
                    ? 'Enabled'
                    : 'Permission Required'
                }`
              : 'Live Notification Channel Connected'}
          </div>

          <div className="flex items-center gap-2">
            {activeView === 'streak' && onNavigateToTab && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToTab('dsa');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs transition cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Practice Now</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
