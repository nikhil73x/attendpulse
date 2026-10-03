import React, { useState } from 'react';
import { SubjectAttendance, UserProfile } from '../../types/attendance';
import {
  IoCheckmarkCircleOutline,
  IoTrendingUpOutline,
  IoCalendarOutline,
  IoFlameOutline,
  IoSparklesOutline,
  IoAddOutline,
  IoRemoveOutline,
  IoCheckmarkSharp,
  IoDownloadOutline,
  IoRefreshOutline,
  IoLockClosedOutline,
  IoCloseOutline,
  IoChevronForwardOutline,
  IoBarChartOutline,
} from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedFlame } from '../ui/AnimatedFlame';

interface StudentDashboardProps {
  profile: UserProfile;
  subjects: SubjectAttendance[];
  /** Intentionally unused by StudentDashboard — attendance is teacher-owned and read-only for students */
  onUpdateSubject: (subjectId: string, attendedDelta: number, totalDelta: number) => void;
  isDark: boolean;
  view?: 'overview' | 'attendance';
}

// ── Per-subject local projection delta ───────────────────────────────────────
type SimDeltas = Record<string, { attended: number; total: number }>;

// ── Streak helpers ────────────────────────────────────────────────────────────
function readStreakData(): { streak: number; lastDate: string } {
  try {
    const raw = localStorage.getItem('attendance_streak');
    if (!raw) {
      return { streak: 5, lastDate: yesterdayISO() };
    }
    return JSON.parse(raw);
  } catch {
    return { streak: 5, lastDate: yesterdayISO() };
  }
}
function todayISO()     { return new Date().toISOString().split('T')[0]; }
function yesterdayISO() { return new Date(Date.now() - 86_400_000).toISOString().split('T')[0]; }

// ══════════════════════════════════════════════════════════════════════════════
// Subject Projection Modal — opens when a subject card is clicked
// ══════════════════════════════════════════════════════════════════════════════
interface SubjectProjectionModalProps {
  subject: SubjectAttendance;
  targetThreshold: number;
  isDark: boolean;
  delta: { attended: number; total: number };
  onSimAttend: () => void;
  onSimMiss: () => void;
  onResetSim: () => void;
  onClose: () => void;
}

const SubjectProjectionModal: React.FC<SubjectProjectionModalProps> = ({
  subject,
  targetThreshold,
  isDark,
  delta,
  onSimAttend,
  onSimMiss,
  onResetSim,
  onClose,
}) => {
  const realPct   = subject.total > 0 ? (subject.attended / subject.total) * 100 : 0;
  const projAttended = subject.attended + delta.attended;
  const projTotal    = subject.total    + delta.total;
  const projPct      = projTotal > 0 ? (projAttended / projTotal) * 100 : realPct;
  const hasProjection = delta.attended !== 0 || delta.total !== 0;

  const classesNeededToReach75 = Math.max(
    0,
    Math.ceil(
      ((targetThreshold / 100) * subject.total - subject.attended) /
        (1 - targetThreshold / 100),
    ),
  );
  const safeMissCount = Math.max(
    0,
    Math.floor((subject.attended / (targetThreshold / 100)) - subject.total),
  );

  const getColor = (pct: number) =>
    pct >= 85
      ? 'from-emerald-500 to-teal-400'
      : pct >= targetThreshold
      ? 'from-cyan-500 to-blue-500'
      : 'from-rose-500 to-red-500';

  const getBadge = (pct: number) =>
    pct >= 85
      ? { label: 'High',    cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
      : pct >= targetThreshold
      ? { label: 'Safe',    cls: 'text-sky-400 bg-sky-500/10 border-sky-500/20' }
      : { label: 'At Risk', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };

  const realBadge = getBadge(realPct);
  const projBadge = getBadge(projPct);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-md cursor-pointer"
      />

      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-md rounded-2xl shadow-2xl border z-10 overflow-hidden ${
          isDark ? 'bg-[#0e121b] border-white/12 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header band */}
        <div className={`px-6 pt-6 pb-4 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
          <button
            type="button" onClick={onClose} aria-label="Close"
            className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            <IoCloseOutline className="text-xl" />
          </button>

          <div className="flex items-center gap-3 pr-8">
            <span className="font-mono text-sm font-bold px-3 py-1.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
              {subject.code}
            </span>
            <div>
              <h3 className="font-bold text-base leading-tight">{subject.name}</h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {subject.instructor} &bull; {subject.room} &bull; {subject.credits} Credits
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Real attendance (teacher-recorded, read-only) ───────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <IoLockClosedOutline className="text-xs" /> Teacher-Recorded Attendance
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${realBadge.cls}`}>
                {realBadge.label}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold tracking-tight">{realPct.toFixed(1)}%</span>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {subject.attended} attended / {subject.total} total
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-700/30 overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${getColor(realPct)}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, realPct)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            {/* Quick insight */}
            <p className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {realPct >= targetThreshold
                ? <>You can miss <strong className="text-emerald-400">{safeMissCount} more</strong> class{safeMissCount !== 1 ? 'es' : ''} and still stay compliant.</>
                : <>You must attend the next <strong className="text-rose-400">{classesNeededToReach75}</strong> consecutive class{classesNeededToReach75 !== 1 ? 'es' : ''} to reach {targetThreshold}%.</>}
            </p>
          </div>

          {/* ── Projection tool (Smoothed & Animated) ─────────────────────────────────── */}
          <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <div className={`px-4 py-3 flex items-center justify-between border-b ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-md ${isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                  <IoBarChartOutline className="text-sm" />
                </div>
                <span className={`text-[11px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  What-If Projection
                </span>
              </div>
              <AnimatePresence>
                {hasProjection && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.85, x: 8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.85, x: 8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={onResetSim}
                    className={`text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition-colors cursor-pointer border ${
                      isDark
                        ? 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-slate-300 hover:text-white'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
                    }`}
                  >
                    <IoRefreshOutline className="text-xs" /> Reset
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div className="p-4 space-y-4">
              {/* +/- Simulation buttons with smooth spring tap and hover states */}
              <div className="flex items-center gap-3">
                <motion.button
                  type="button"
                  onClick={onSimAttend}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer select-none shadow-sm ${
                    isDark
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                  }`}
                >
                  <IoAddOutline className="text-sm font-bold" />
                  <span>Simulate Attending</span>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={onSimMiss}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer select-none shadow-sm ${
                    isDark
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/25 border-rose-500/30 text-rose-300'
                      : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800'
                  }`}
                >
                  <IoRemoveOutline className="text-sm font-bold" />
                  <span>Simulate Missing</span>
                </motion.button>
              </div>

              {/* Delta counter with smooth height and opacity animation */}
              <AnimatePresence>
                {hasProjection && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className={`flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl border ${
                      isDark ? 'bg-white/[0.04] border-white/8' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Simulating:</span>
                        {delta.attended > 0 && (
                          <motion.span
                            key={`att-${delta.attended}`}
                            initial={{ scale: 0.85 }}
                            animate={{ scale: 1 }}
                            className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                          >
                            +{delta.attended} attended
                          </motion.span>
                        )}
                        {(delta.total - delta.attended) > 0 && (
                          <motion.span
                            key={`miss-${delta.total - delta.attended}`}
                            initial={{ scale: 0.85 }}
                            animate={{ scale: 1 }}
                            className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-rose-500/15 text-rose-400 border border-rose-500/25"
                          >
                            +{delta.total - delta.attended} missed
                          </motion.span>
                        )}
                      </div>
                      <span className={`font-mono font-semibold text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {projAttended}/{projTotal} total
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Projected result with animated numbers and spring bar */}
              <AnimatePresence mode="wait">
                {hasProjection ? (
                  <motion.div
                    key="has-projection"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Projected Result
                      </span>
                      <motion.span
                        key={projBadge.label}
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${projBadge.cls}`}
                      >
                        {projBadge.label}
                      </motion.span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <motion.span
                        key={projPct.toFixed(1)}
                        initial={{ scale: 0.94, opacity: 0.7 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className={`text-3xl font-extrabold font-mono tracking-tight ${
                          projPct >= targetThreshold ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {projPct.toFixed(1)}%
                      </motion.span>
                      <motion.span
                        key={`delta-${(projPct - realPct).toFixed(1)}`}
                        initial={{ x: -4, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                      >
                        {projPct >= realPct ? (
                          <span className="text-emerald-400 font-bold">▲ +{(projPct - realPct).toFixed(1)}%</span>
                        ) : (
                          <span className="text-rose-400 font-bold">▼ {(projPct - realPct).toFixed(1)}%</span>
                        )}{' '}
                        from current
                      </motion.span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-700/30 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${getColor(projPct)}`}
                        initial={false}
                        animate={{ width: `${Math.min(100, Math.max(0, projPct))}%` }}
                        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                      />
                    </div>

                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {projPct >= targetThreshold ? (
                        <span className="text-emerald-400 font-medium">✓ Projected attendance satisfies the {targetThreshold}% requirement.</span>
                      ) : (
                        <span className="text-rose-400 font-medium">⚠ Projected attendance falls short of the {targetThreshold}% threshold.</span>
                      )}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-projection"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`text-xs text-center py-3.5 rounded-xl border border-dashed flex items-center justify-center gap-1.5 transition-colors ${
                      isDark ? 'border-white/10 bg-white/[0.01] text-slate-400' : 'border-slate-200 bg-slate-50/50 text-slate-500'
                    }`}
                  >
                    <IoBarChartOutline className="text-sm opacity-70" />
                    <span>Click buttons above to simulate future attendance outcomes</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Main StudentDashboard component
// ══════════════════════════════════════════════════════════════════════════════
export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  profile,
  subjects,
  isDark,
  view = 'overview',
}) => {
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(
    () => readStreakData().lastDate === todayISO(),
  );
  const [streak, setStreak]             = useState<number>(() => readStreakData().streak);
  const [bunkSimExtraMissed, setBunkSimExtraMissed] = useState(0);

  // Which subject's modal is open (null = none)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Local projection state — per subject, never written to real data
  const [simDeltas, setSimDeltas] = useState<SimDeltas>({});

  const targetThreshold   = profile.minAttendanceGoal || 75;
  const totalConducted    = subjects.reduce((s, sub) => s + sub.total, 0);
  const totalAttended     = subjects.reduce((s, sub) => s + sub.attended, 0);
  const overallPercentage = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;
  const maxSafeBunks      = Math.max(0, Math.floor((totalAttended / (targetThreshold / 100)) - totalConducted));
  const reqToReachTarget  = Math.max(0, Math.ceil(((targetThreshold / 100) * totalConducted - totalAttended) / (1 - targetThreshold / 100)));
  const bunkSimMax        = Math.max(10, maxSafeBunks + 5);
  const simTotal          = totalConducted + bunkSimExtraMissed;
  const simPercentage     = simTotal > 0 ? (totalAttended / simTotal) * 100 : overallPercentage;

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) ?? null;

  // Streak only — no data write
  const handleCheckIn = () => {
    if (hasCheckedInToday) return;
    const today = todayISO();
    const { streak: cur, lastDate } = readStreakData();
    const newStreak = lastDate === yesterdayISO() ? cur + 1 : 1;
    localStorage.setItem('attendance_streak', JSON.stringify({ streak: newStreak, lastDate: today }));
    setStreak(newStreak);
    setHasCheckedInToday(true);
  };

  const handleSimAttend = (id: string) =>
    setSimDeltas((prev) => { const d = prev[id] ?? { attended: 0, total: 0 }; return { ...prev, [id]: { attended: d.attended + 1, total: d.total + 1 } }; });

  const handleSimMiss = (id: string) =>
    setSimDeltas((prev) => { const d = prev[id] ?? { attended: 0, total: 0 }; return { ...prev, [id]: { attended: d.attended, total: d.total + 1 } }; });

  const handleResetSim = (id: string) =>
    setSimDeltas((prev) => { const next = { ...prev }; delete next[id]; return next; });

  const cleanCsvField = (val: string | number) => {
    let clean = String(val ?? '').replace(/"/g, '""');
    if (/^[=+\-@\t\r]/.test(clean)) {
      clean = `'${clean}`;
    }
    return `"${clean}"`;
  };

  const handleExportStudentCSV = () => {
    const headers = 'Subject Code,Subject Name,Instructor,Room,Credits,Attended,Total Classes,Percentage,Status\n';
    const rows = subjects.map((s) => {
      const pct = s.total > 0 ? (s.attended / s.total) * 100 : 0;
      return `${cleanCsvField(s.code)},${cleanCsvField(s.name)},${cleanCsvField(s.instructor)},${cleanCsvField(s.room)},${s.credits},${s.attended},${s.total},${cleanCsvField(`${pct.toFixed(1)}%`)},${cleanCsvField(pct >= targetThreshold ? 'COMPLIANT' : 'SHORTAGE')}`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `My_Attendance_Report_${profile.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (pct: number) =>
    pct >= 85              ? { label: 'High',    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
    : pct >= targetThreshold ? { label: 'Safe',  color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' }
    :                          { label: 'At Risk', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };

  const cardCls = `relative rounded-2xl p-5 border overflow-hidden transition-all ${isDark ? 'glass-panel text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'}`;

  // ── OVERVIEW view ────────────────────────────────────────────────────────
  if (view === 'overview') {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in text-inherit">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* Overall % */}
          <div className={cardCls}>
            <div aria-hidden className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Overall Rate</span>
              <div className={`p-1.5 rounded-lg ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}><IoTrendingUpOutline /></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">{overallPercentage.toFixed(1)}%</span>
              <span className={`text-xs font-medium ${overallPercentage >= targetThreshold ? 'text-emerald-400' : 'text-rose-400'}`}>
                {overallPercentage >= targetThreshold ? 'Above Goal' : 'Shortage'}
              </span>
            </div>
            <p className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Institute Target: <strong>{targetThreshold}%</strong>
            </p>
          </div>

          {/* Attended */}
          <div className={cardCls}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Attended</span>
              <div className={`p-1.5 rounded-lg ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}><IoCheckmarkCircleOutline /></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-400">{totalAttended}</span>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ {totalConducted} classes</span>
            </div>
            <p className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Missed: <strong className="text-rose-400">{totalConducted - totalAttended}</strong> classes
            </p>
          </div>

          {/* Streak */}
          <div className={`${cardCls} relative overflow-hidden group`}>
            {/* Ambient fire glow effect */}
            <div
              aria-hidden="true"
              className="absolute -right-3 -bottom-3 w-28 h-28 rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-transparent blur-2xl pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity duration-500"
            />

            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Streak</span>
                {streak > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    On Fire
                  </span>
                )}
              </div>
              <div className={`p-1.5 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-600'
              }`}>
                <AnimatedFlame size={16} showEmbers={false} intensity={streak >= 7 ? 'ultra' : 'normal'} />
              </div>
            </div>

            <div className="flex items-baseline gap-2 relative z-10">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 drop-shadow-sm">
                {streak}
              </span>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                consecutive days
              </span>
            </div>

            <p className={`text-[11px] mt-2 relative z-10 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {streak >= 7
                ? "🔥 Legendary streak! Dean's Honor badge unlocked!"
                : streak > 0
                ? "You're building serious momentum! Check in daily."
                : 'Check in daily to ignite your attendance streak!'}
            </p>
          </div>

          {/* Check-In */}
          <div className={`relative rounded-2xl p-5 border overflow-hidden flex flex-col justify-between transition-all ${isDark ? 'bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-black/60 border-indigo-500/30 text-white' : 'bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 border-indigo-200/80 text-slate-900 shadow-lg shadow-indigo-100/50'}`}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Daily Check-In</span>
                <IoSparklesOutline className="text-indigo-500 dark:text-indigo-400 text-sm animate-pulse" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Personal Streak Tracker</p>
            </div>
            <button type="button" disabled={hasCheckedInToday} onClick={handleCheckIn}
              className={`w-full mt-3 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                hasCheckedInToday
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default shadow-sm'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 active:scale-95 cursor-pointer'
              }`}>
              {hasCheckedInToday
                ? <><IoCheckmarkSharp className="text-sm" /><span>Checked In Today</span><AnimatedFlame size="sm" showEmbers={false} className="ml-1" /></>
                : <><IoCalendarOutline className="text-sm" /><span>Mark Today&apos;s Check-In</span></>}
            </button>
          </div>
        </div>

        {/* Bunk Calculator */}
        <div className={`relative rounded-2xl p-6 border overflow-hidden transition-all ${isDark ? 'glass-panel text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/20">Smart Analytics</span>
                <h3 className="font-bold text-base tracking-tight">Attendance Margin Calculator</h3>
              </div>
            </div>
            <div className={`px-4 py-2.5 rounded-xl border text-center ${overallPercentage >= targetThreshold ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-rose-500/10 border-rose-500/25 text-rose-400'}`}>
              {overallPercentage >= targetThreshold
                ? <div><span className="text-[10px] uppercase font-bold tracking-wider block">Safe to Miss</span><span className="text-lg font-extrabold">{maxSafeBunks} Classes</span></div>
                : <div><span className="text-[10px] uppercase font-bold tracking-wider block">Must Attend</span><span className="text-lg font-extrabold">{reqToReachTarget} Next</span></div>}
            </div>
          </div>
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between text-xs mb-2">
              <span>Simulate missing upcoming classes: <strong className="text-amber-400">+{bunkSimExtraMissed}</strong></span>
              <span className="font-mono font-bold">Projected: <span className={simPercentage >= targetThreshold ? 'text-emerald-400' : 'text-rose-400'}>{simPercentage.toFixed(1)}%</span></span>
            </div>
            <input type="range" min="0" max={bunkSimMax} value={bunkSimExtraMissed}
              onChange={(e) => setBunkSimExtraMissed(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-700/40 rounded-lg" />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0 missed</span><span>{Math.round(bunkSimMax / 2)} missed</span><span>{bunkSimMax} missed</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ATTENDANCE view — clean read-only roster, click subject → modal ───────
  return (
    <>
      <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in text-inherit">

        {/* Read-only notice */}
        <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-medium ${isDark ? 'bg-amber-500/10 border-amber-500/25 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          <IoLockClosedOutline className="text-sm shrink-0" />
          <span>
            <strong>Read-only.</strong> Attendance is recorded by your teacher.
            Click any subject card to open its <strong>What-If Projection</strong> tool.
          </span>
        </div>

        <div className={`relative rounded-2xl p-6 border overflow-hidden transition-all ${isDark ? 'glass-panel text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="font-bold text-base tracking-tight">Course Attendance Roster</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Teacher-recorded attendance. Click a subject to run projections.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleExportStudentCSV}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-slate-200'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm hover:shadow'
                }`}>
                <IoDownloadOutline className="text-sm" /><span>Export CSV</span>
              </button>
              <span className={`text-xs px-3 py-1.5 rounded-xl font-medium border ${
                isDark ? 'bg-white/[0.06] border-white/5 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                {subjects.length} Enrolled Courses
              </span>
            </div>
          </div>

          {/* Subject cards — clean, click opens modal */}
          <div className="space-y-3">
            {subjects.length === 0 && (
              <div className={`text-center py-12 px-4 rounded-xl border border-dashed ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-300 text-slate-500'}`}>
                <p className="text-sm font-semibold">No courses enrolled yet</p>
                <p className="text-xs mt-1 text-slate-500">Your attendance records will appear here once courses are added or imported.</p>
              </div>
            )}
            {subjects.map((sub) => {
              const pct   = sub.total > 0 ? (sub.attended / sub.total) * 100 : 0;
              const badge = getStatusBadge(pct);
              const hasSim = !!(simDeltas[sub.id]?.attended || simDeltas[sub.id]?.total);

              return (
                <motion.button
                  key={sub.id}
                  type="button"
                  layout
                  onClick={() => setSelectedSubjectId(sub.id)}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.998 }}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer group ${isDark ? 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-indigo-500/30' : 'bg-slate-50 hover:bg-indigo-50/60 border-slate-200 hover:border-indigo-200'}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shrink-0">{sub.code}</span>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm leading-tight truncate">{sub.name}</h4>
                        <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {sub.instructor} &bull; {sub.room} &bull; {sub.credits} Cr.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      {hasSim && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                          SIM
                        </span>
                      )}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.color}`}>{badge.label}</span>
                      <span className="text-base font-extrabold font-mono">{pct.toFixed(1)}%</span>
                      <IoChevronForwardOutline className={`text-sm transition-transform group-hover:translate-x-0.5 ${isDark ? 'text-slate-500 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-700/25 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pct >= 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : pct >= targetThreshold ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-rose-500 to-red-500'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <p className={`text-[10px] mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {sub.attended} attended &bull; {sub.total - sub.attended} missed &bull; Click to project
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subject Projection Modal */}
      <AnimatePresence>
        {selectedSubject && (
          <SubjectProjectionModal
            subject={selectedSubject}
            targetThreshold={targetThreshold}
            isDark={isDark}
            delta={simDeltas[selectedSubject.id] ?? { attended: 0, total: 0 }}
            onSimAttend={() => handleSimAttend(selectedSubject.id)}
            onSimMiss={() => handleSimMiss(selectedSubject.id)}
            onResetSim={() => handleResetSim(selectedSubject.id)}
            onClose={() => setSelectedSubjectId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
