import React, { useState, useEffect } from 'react';
import { Flame, Bell, ShieldAlert, ArrowRight, X } from 'lucide-react';
import {
  streakNotificationService,
  StreakNotificationStatus,
} from '../services/streakNotificationService';

interface StreakUrgencyBannerProps {
  streakDays: number;
  streakShieldActive: boolean;
  onOpenNotificationModal: () => void;
  onPracticeClick: () => void;
}

export const StreakUrgencyBanner: React.FC<StreakUrgencyBannerProps> = ({
  streakDays,
  streakShieldActive,
  onOpenNotificationModal,
  onPracticeClick,
}) => {
  const [status, setStatus] = useState<StreakNotificationStatus>(() =>
    streakNotificationService.getStatus(streakDays)
  );
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const unsub = streakNotificationService.subscribe((s) => setStatus(s));
    return () => unsub();
  }, [streakDays]);

  // Only show if inside the 8-hour danger window (16h to 24h since last activity)
  if (!status.isIn8HourDangerWindow || isDismissed) {
    return null;
  }

  const hoursLeft = Math.floor(status.hoursRemainingBeforeReset);
  const minutesLeft = Math.floor(
    (status.hoursRemainingBeforeReset - hoursLeft) * 60
  );

  return (
    <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 text-white shadow-md relative z-30 animate-in slide-in-from-top-2 duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Urgent streak message */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-white/20 text-white shrink-0 animate-bounce">
            <Flame className="w-4 h-4 fill-amber-300 text-amber-200" />
          </div>
          <div className="text-xs font-medium leading-snug">
            <span className="font-extrabold uppercase tracking-wide bg-white/20 px-1.5 py-0.5 rounded text-[10px] mr-1.5">
              Streak Danger Alert
            </span>
            <span>
              You haven't practiced in {status.hoursSinceLastActive}h! Only{' '}
              <strong className="font-mono font-bold text-amber-200 text-sm">
                {hoursLeft}h {minutesLeft}m left
              </strong>{' '}
              to practice and protect your {streakDays}-day streak before the 24h reset!
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <button
            type="button"
            onClick={onPracticeClick}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-rose-700 hover:bg-amber-100 font-bold text-xs transition cursor-pointer shadow-xs whitespace-nowrap"
          >
            <span>Practice Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenNotificationModal}
            title="Configure Phone Notifications"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/25 hover:bg-black/40 text-white text-xs font-semibold transition cursor-pointer border border-white/20 whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Phone Alerts</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss banner"
            className="p-1 text-white/80 hover:text-white rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
