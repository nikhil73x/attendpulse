import React from 'react';
import { UserProfile } from '../../types/attendance';
import {
  IoCloseOutline,
  IoSettingsOutline,
  IoSunnyOutline,
  IoMoonOutline,
  IoLogOutOutline,
  IoShieldCheckmarkOutline,
  IoSchoolOutline,
  IoPersonOutline,
  IoRefreshOutline,
} from 'react-icons/io5';
import { motion } from 'framer-motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  theme: 'dark' | 'light';
  onToggleTheme: (newTheme: 'dark' | 'light') => void;
  onLogout?: () => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  // FIX #8: isOpen is now only used by the parent's AnimatePresence condition.
  // Removed the early `if (!isOpen) return null` that killed the exit animation.
  isOpen: _isOpen,
  onClose,
  profile,
  onUpdateProfile,
  theme,
  onToggleTheme,
  onLogout,
  onResetData,
}) => {
  const isDark = theme === 'dark';

  // FIX #6: Derive initials dynamically from profile.name
  const avatarInitials = profile.name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .slice(0, 2)
    .join('');

  // FIX #17: Wrap destructive reset with a confirmation dialog
  const handleResetData = () => {
    const confirmed = window.confirm(
      'This will restore all default attendance records.\nAny custom data will be permanently lost. Continue?',
    );
    if (confirmed) {
      onClose();
      onResetData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-md cursor-pointer"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-7 shadow-2xl border z-10 ${
          isDark
            ? 'bg-[#0e121b] border-white/12 text-white shadow-black/90'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/70'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className={`absolute top-5 right-5 p-1.5 rounded-full transition-colors cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <IoCloseOutline className="text-xl" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
            <IoSettingsOutline className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Portal Configuration</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Identity, role switcher, and visual preferences
            </p>
          </div>
        </div>

        {/* 1. Profile Card */}
        <div className={`rounded-xl p-4 sm:p-5 border mb-5 transition-colors ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-4 mb-4">
            {/* FIX #6: Dynamic avatar initials from profile.name */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-indigo-500/30 select-none">
              {avatarInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base tracking-tight truncate">{profile.name}</h4>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <IoShieldCheckmarkOutline className="text-xs" />
                  Verified
                </span>
              </div>
              <p className={`text-xs font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {profile.email}
              </p>
              <span className={`inline-block text-[11px] font-medium mt-0.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {profile.institution}
              </span>
            </div>
          </div>

          <div className={`grid grid-cols-2 gap-3 pt-3 border-t text-xs ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <div>
              <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Active Role
              </span>
              <span className="font-semibold capitalize text-emerald-400">
                {profile.role === 'teacher' ? 'Faculty Member' : 'Student Mode'}
              </span>
            </div>
            <div>
              {/* FIX #7: Use profile.rollNo for both roles — no hardcoded FAC-CS-108 */}
              <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {profile.role === 'teacher' ? 'Faculty ID' : 'Roll Number'}
              </span>
              <span className="font-mono font-medium">{profile.rollNo}</span>
            </div>
            <div>
              <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Department
              </span>
              <span className="font-medium">{profile.department}</span>
            </div>
            <div>
              {/* FIX #7: Use profile.designation — no hardcoded "Associate Professor" */}
              <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {profile.role === 'teacher' ? 'Designation' : 'Semester'}
              </span>
              <span className="font-medium">
                {profile.role === 'teacher'
                  ? (profile.designation || 'Faculty')
                  : profile.semester}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Role Switcher */}
        <div className={`rounded-xl p-4 border mb-5 transition-colors ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h5 className="font-semibold text-xs">Portal View Mode</h5>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Switch between Student Analytics and Teacher Roll-Call Register
              </p>
            </div>
          </div>
          <div className={`grid grid-cols-2 p-1 rounded-xl border ${isDark ? 'bg-black/40 border-white/10' : 'bg-slate-200/60 border-slate-300'}`}>
            <button
              type="button"
              onClick={() => onUpdateProfile({ role: 'student' })}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                profile.role === 'student'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <IoPersonOutline />
              <span>Student View</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateProfile({ role: 'teacher' })}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                profile.role === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <IoSchoolOutline />
              <span>Teacher / Admin</span>
            </button>
          </div>
        </div>

        {/* 3. Appearance Switcher */}
        <div className={`rounded-xl p-4 border mb-5 transition-colors ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h5 className="font-semibold text-xs">Appearance Theme</h5>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Switch appearance to light or dark mode
              </p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-amber-500/20 text-amber-700'}`}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
          <div className={`grid grid-cols-2 p-1 rounded-xl border ${isDark ? 'bg-black/40 border-white/10' : 'bg-slate-200/60 border-slate-300'}`}>
            <button
              type="button"
              onClick={() => onToggleTheme('dark')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isDark ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <IoMoonOutline className="text-sm" />
              <span>Dark Theme</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleTheme('light')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !isDark
                  ? 'bg-white text-slate-900 shadow-md border border-slate-200/80'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <IoSunnyOutline className="text-sm text-amber-500" />
              <span>Light Theme</span>
            </button>
          </div>
        </div>

        {/* 4. Attendance Goal Slider */}
        <div className={`rounded-xl p-4 border mb-5 transition-colors ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold">Attendance Goal / Threshold:</span>
            <span className="font-mono text-xs font-bold text-indigo-400">{profile.minAttendanceGoal}%</span>
          </div>
          <input
            type="range"
            min="60"
            max="90"
            step="5"
            value={profile.minAttendanceGoal}
            onChange={(e) => onUpdateProfile({ minAttendanceGoal: Number(e.target.value) })}
            className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-700/40 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>60% (Minimum)</span>
            <span>75% (Mandatory)</span>
            <span>90% (Distinction)</span>
          </div>
        </div>

        {/* 5. Reset & Sign Out */}
        <div className="space-y-2 pt-2 border-t border-white/[0.08]">
          {/* FIX #17: Confirm before destructive reset */}
          <button
            type="button"
            onClick={handleResetData}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              isDark ? 'border-white/10 hover:bg-white/5 text-slate-400 hover:text-slate-200' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <IoRefreshOutline className="text-sm" />
            <span>Restore Default Attendance Records</span>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={() => { onClose(); onLogout(); }}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-300 hover:text-red-200'
                  : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600 hover:text-red-700'
              }`}
            >
              <IoLogOutOutline className="text-base" />
              <span>Sign Out of Portal</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
