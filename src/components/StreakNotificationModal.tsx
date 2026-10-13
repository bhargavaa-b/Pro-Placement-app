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
  Sparkles,
  X,
  Play,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import {
  streakNotificationService,
  StreakNotificationStatus,
} from '../services/streakNotificationService';

interface StreakNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakDays: number;
  streakShieldActive: boolean;
  onNavigateToPractice?: (tab: string) => void;
}

export const StreakNotificationModal: React.FC<StreakNotificationModalProps> = ({
  isOpen,
  onClose,
  streakDays,
  streakShieldActive,
  onNavigateToPractice,
}) => {
  const [status, setStatus] = useState<StreakNotificationStatus>(() =>
    streakNotificationService.getStatus(streakDays)
  );
  const [isRequesting, setIsRequesting] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [simulatedActive, setSimulatedActive] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = streakNotificationService.subscribe((s) => setStatus(s));
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = async () => {
    setIsRequesting(true);
    if (status.notificationsEnabled) {
      await streakNotificationService.setEnabled(false);
    } else {
      await streakNotificationService.setEnabled(true);
    }
    setStatus(streakNotificationService.getStatus(streakDays));
    setIsRequesting(false);
  };

  const handleSendTest = async () => {
    setTestSent(true);
    await streakNotificationService.sendTestNotification(streakDays);
    setTimeout(() => setTestSent(false), 4000);
  };

  const handleSimulate16h = async () => {
    setSimulatedActive(true);
    const updated = await streakNotificationService.simulate16hInactivityAndCheck(streakDays);
    setStatus(updated);
  };

  const handleResetSimulation = () => {
    setSimulatedActive(false);
    streakNotificationService.resetToActiveNow();
    setStatus(streakNotificationService.getStatus(streakDays));
  };

  const remainingHours = Math.floor(status.hoursRemainingBeforeReset);
  const remainingMinutes = Math.floor(
    (status.hoursRemainingBeforeReset - remainingHours) * 60
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B2545] via-[#13315C] to-[#1D4E89] text-white p-4 sm:p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 shadow-inner">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  Phone Streak Notifications
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-pink-500/30 text-pink-200 border border-pink-400/30">
                  24h Window
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Automatic phone alert within 8 hours before streak expiration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-slate-800 text-xs">
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

            {/* Danger Status / Countdown Indicator */}
            {status.isIn8HourDangerWindow ? (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">
                    ⚠️ URGENT: Inside 8-Hour Danger Window!
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    You have not practiced in {status.hoursSinceLastActive} hours. Only{' '}
                    <strong>
                      {remainingHours}h {remainingMinutes}m remaining
                    </strong>{' '}
                    before your {streakDays}-day streak resets in 24 hours.
                  </p>
                </div>
              </div>
            ) : status.isExpired ? (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg flex items-start gap-2.5 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">Streak Time Limit Reached (24h Elapsed)</div>
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
                  <div className="font-bold text-xs">Streak Protected & Safe</div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Last active {status.hoursSinceLastActive}h ago. Next danger alert scheduled at the 16th hour ({Math.max(0, Math.round(16 - status.hoursSinceLastActive))}h from now).
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
              onClick={handleToggle}
              disabled={isRequesting}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                status.notificationsEnabled ? 'bg-pink-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  status.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
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
              <span>{testSent ? '✓ Sent to Phone!' : 'Test Notification on Phone'}</span>
            </button>

            {!simulatedActive ? (
              <button
                type="button"
                onClick={handleSimulate16h}
                title="Simulate 16h elapsed (within 8h prior to 24h limit) to test alert"
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

          {/* Phone Setup Guide for Android and iOS */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#0B2545]" />
              <span>How Phone Notifications Work:</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Android Phones (Chrome / Edge):</strong> Tap{' '}
                <em>"Allow"</em> when prompted. The Service Worker delivers lock-screen alerts with vibration even when the app is closed.
              </li>
              <li>
                <strong>iPhones (Safari iOS 16.4+):</strong> Tap the Safari Share button (
                <code>⬆️</code>) → <em>"Add to Home Screen"</em>. Open Pro Placement from your Home Screen to enable Web Push.
              </li>
              <li>
                <strong>Exact Rule:</strong> If you haven't opened Pro Placement in 16 hours, your phone receives an alert giving you 8 hours to practice and keep your streak intact before it reaches 24 hours.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 font-medium">
            Status: {status.notificationsEnabled ? '🟢 Enabled' : '⚪ Permission Required'}
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToPractice && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToPractice('dsa');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs transition cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Practice Now to Protect Streak</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
