import React from 'react';
import { UserProfile, Student, SubjectAttendance, TimetableSlot } from '../../types/attendance';
import {
  IoSchoolOutline,
  IoPeopleOutline,
  IoStatsChartOutline,
  IoAlertCircleOutline,
  IoCalendarOutline,
  IoDownloadOutline,
  IoArrowForwardOutline,
  IoCheckmarkCircle,
} from 'react-icons/io5';
import { motion } from 'framer-motion';

interface TeacherDashboardProps {
  profile: UserProfile;
  students: Student[];
  subjects?: SubjectAttendance[];
  timetable?: TimetableSlot[];
  onNavigateToRegister: () => void;
  onNavigateToSchedule: () => void;
  onExportCSV: () => void;
  isDark: boolean;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  profile,
  students,
  subjects = [],
  timetable = [],
  onNavigateToRegister,
  onNavigateToSchedule,
  onExportCSV,
  isDark,
}) => {
  const totalStudents = students.length;
  const presentCount = students.filter((s) => s.status === 'present').length;
  const attendanceRate = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;
  const atRiskStudents = students.filter((s) => s.status === 'absent');

  const currentDayName = (() => {
    const d = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(d) ? d : 'Monday';
  })();
  const todayClasses = timetable.filter(
    (s) => s.day?.trim().toLowerCase() === currentDayName.toLowerCase()
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in text-inherit">
      {/* 1. Faculty Welcome Banner & Today's Summary */}
      <div
        className={`relative rounded-2xl p-6 sm:p-7 border overflow-hidden transition-all ${
          isDark ? 'glass-panel text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                Faculty Portal &bull; Department of CSE
              </span>
              <span className="text-xs text-slate-400 font-mono">FAC-CS-108</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Welcome back, {profile.name}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-neutral-100 text-neutral-950 shadow-md shadow-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <IoCalendarOutline className="text-sm" />
              <span>Take Attendance Now</span>
              <IoArrowForwardOutline className="text-xs" />
            </button>

            <button
              type="button"
              onClick={onExportCSV}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              }`}
            >
              <IoDownloadOutline className="text-sm" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Faculty KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Supervised Students */}
        <div
          className={`relative rounded-2xl p-5 border overflow-hidden transition-all ${
            isDark ? 'glass-panel text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Enrolled
            </span>
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
              <IoPeopleOutline className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">{totalStudents}</span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>registered students</span>
          </div>
          <p className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Section 2026-CS Roster active
          </p>
        </div>

        {/* Today's Attendance Rate */}
        <div
          className={`relative rounded-2xl p-5 border overflow-hidden transition-all ${
            isDark ? 'glass-panel text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Today&apos;s Presence
            </span>
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
              <IoCheckmarkCircle className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-emerald-400">
              {attendanceRate.toFixed(0)}%
            </span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              ({presentCount}/{totalStudents})
            </span>
          </div>
          <p className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Above institute minimum standard
          </p>
        </div>

        {/* Classes Scheduled Today */}
        <div
          className={`relative rounded-2xl p-5 border overflow-hidden transition-all ${
            isDark ? 'glass-panel text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Today&apos;s Lectures
            </span>
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-600'}`}>
              <IoCalendarOutline className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-amber-400">3</span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>sessions</span>
          </div>
          <p className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Hall 302, Lab 4, AI Studio
          </p>
        </div>

        {/* At Risk Alert */}
        <div
          className={`relative rounded-2xl p-5 border overflow-hidden transition-all ${
            isDark ? 'glass-panel text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Absentees Today
            </span>
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-50 text-rose-600'}`}>
              <IoAlertCircleOutline className="text-base" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-rose-400">
              {atRiskStudents.length}
            </span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>flagged</span>
          </div>
          <p className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Automatic warning alerts dispatched
          </p>
        </div>
      </div>

      {/* 3. Assigned Classes & Today's Timetable */}
      <div
        className={`relative rounded-2xl p-6 border overflow-hidden transition-all ${
          isDark ? 'glass-panel text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base tracking-tight">Today&apos;s Teaching Schedule</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Assigned lecture halls and live session status
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToSchedule}
            className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}
          >
            <span>Full Timetable</span>
            <IoArrowForwardOutline />
          </button>
        </div>

        <div className="space-y-3">
          {todayClasses.length === 0 ? (
            <div className={`p-6 text-center rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <IoCalendarOutline className="text-3xl mx-auto mb-2 opacity-40 text-indigo-400" />
              <p className="text-xs font-medium">No scheduled lectures for today ({currentDayName}).</p>
              <button
                type="button"
                onClick={onNavigateToSchedule}
                className="mt-2 text-xs text-indigo-400 hover:underline font-semibold cursor-pointer"
              >
                View or configure weekly timetable &rarr;
              </button>
            </div>
          ) : (
            todayClasses.map((cls) => {
              const isLive = cls.status === 'ongoing';
              return (
                <div
                  key={cls.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isLive
                      ? isDark
                        ? 'bg-indigo-950/30 border-indigo-500/30'
                        : 'bg-indigo-50 border-indigo-200'
                      : isDark
                      ? 'bg-white/[0.03] border-white/10'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400">
                        {cls.subjectCode}
                      </span>
                      <span className="font-semibold text-sm">{cls.subjectName}</span>
                      {isLive ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold animate-pulse">
                          Live Now
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 font-medium">
                          {cls.status || 'Upcoming'}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {cls.time} &bull; Room: {cls.room} &bull; Instructor: {cls.instructor}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onNavigateToRegister}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                      isLive
                        ? 'bg-white text-neutral-950 font-bold shadow-md hover:bg-neutral-100'
                        : isDark
                        ? 'bg-white/[0.05] border-white/10 text-slate-300 hover:bg-white/[0.1]'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isLive ? 'Mark Session →' : 'View Roll Call'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
