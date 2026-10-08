import React from 'react';
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  LogOut,
  Code2,
  Brain,
  Zap,
} from 'lucide-react';
import { UserProfile } from '../types';
import { sanitizeStrictText } from '../utils/securityVault';
import { ProPlacementAppLogo } from './ProPlacementAppLogo';

interface ProfileManagerProps {
  currentProfile: UserProfile;
  onSelectProfile: (profile: UserProfile) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onLogout?: () => void;
}

const QUICK_GRAD_YEARS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

export const ProfileManager: React.FC<ProfileManagerProps> = ({
  currentProfile,
  onUpdateProfile,
  onLogout,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-gray-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3.5">
          <ProPlacementAppLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#B8860B]">
                Candidate Profile
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

        <div className="flex items-center gap-2.5">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-gray-200 hover:border-red-200 font-semibold text-xs rounded-xl transition"
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
                className="w-full bg-white border border-gray-300 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold font-mono text-gray-900 focus:outline-none focus:border-[#D4AF37]"
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
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
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
                Daily Task Streak (1+ Task/Day)
              </div>
              <div className="text-base font-bold text-gray-900 font-mono tabular-nums">
                {currentProfile.streakDays}d
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
