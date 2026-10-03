import React, { useState, useRef } from 'react';
import { TimetableSlot, SubjectAttendance } from '../../types/attendance';
import {
  IoTimeOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoAddOutline,
  IoCheckmarkCircle,
  IoSparkles,
  IoCloudUploadOutline,
  IoLockClosedOutline,
  IoSchoolOutline,
  IoSparklesOutline,
} from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

interface TimetableModuleProps {
  slots: TimetableSlot[];
  subjects?: SubjectAttendance[];
  onAddSlot: (newSlot: Omit<TimetableSlot, 'id'>) => void;
  onImportSlots?: (newSlots: TimetableSlot[]) => void;
  onNavigateToRegister?: (subjectCode?: string) => void;
  isTeacher?: boolean;
  currentTeacherName?: string;
  isDark: boolean;
}

export const TimetableModule: React.FC<TimetableModuleProps> = ({
  slots,
  subjects = [],
  onAddSlot,
  onImportSlots,
  onNavigateToRegister,
  isTeacher = false,
  currentTeacherName,
  isDark,
}) => {
  const [selectedDay, setSelectedDay] = useState<TimetableSlot['day']>('Monday');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [attendedSlots, setAttendedSlots] = useState<Record<string, boolean>>({ 'tt-1': true });
  const [timetableImportNotice, setTimetableImportNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newInstructor, setNewInstructor] = useState(currentTeacherName || '');
  const [newRoom, setNewRoom] = useState('');

  const days: TimetableSlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const daySlots = slots.filter((s) => s.day?.trim().toLowerCase() === selectedDay.toLowerCase());

  // Check if a timetable slot belongs to the currently logged in teacher
  const isMyClass = (slot: TimetableSlot) => {
    if (!isTeacher) return false;
    if (!currentTeacherName) return true;
    const cleanTeacher = currentTeacherName.toLowerCase().replace(/^(prof\.|dr\.)\s*/, '').trim();
    const cleanInst = (slot.instructor || '').toLowerCase().replace(/^(prof\.|dr\.)\s*/, '').trim();
    if (cleanInst.includes(cleanTeacher) || cleanTeacher.includes(cleanInst)) return true;
    // Default assignment for Prof. Nikhil Yadav: CS302 Database Systems
    if (cleanTeacher.includes('yadav') && (slot.subjectCode === 'CS302' || cleanInst.includes('anita') || cleanInst.includes('yadav'))) {
      return true;
    }
    return false;
  };

  const handleToggleSlotAttended = (slotId: string) => {
    setAttendedSlots((prev) => ({
      ...prev,
      [slotId]: !prev[slotId],
    }));
  };

  const handleTimetableCSVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) return;
        const newSlots: TimetableSlot[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i]
            .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
            .map((c) => c.replace(/^["']|["']$/g, '').trim());
          if (cols.length >= 4) {
            const validDays: TimetableSlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            let dayRaw = cols[0] || 'Monday';
            let time = cols[1] || '09:00 AM - 10:00 AM';
            let subjectCode = cols[2] || `CS${300 + i}`;
            let subjectName = cols[3] || 'Course Lecture';
            let instructor = cols[4] || 'Faculty Member';
            let room = cols[5] || 'Hall 101';

            // Support Monthly Dated CSVs: Date, Day, Time, SubjectCode, SubjectName, Instructor, Room
            if (cols.length >= 5 && validDays.some((d) => d.toLowerCase() === cols[1]?.toLowerCase())) {
              dayRaw = cols[1];
              time = cols[2] || time;
              subjectCode = cols[3] || subjectCode;
              subjectName = cols[4] || subjectName;
              instructor = cols[5] || instructor;
              room = cols[6] || room;
            } else if (cols[0]?.includes('-') || cols[0]?.includes('/')) {
              // Support Date as first column (e.g. 2026-10-05) -> auto-convert to Day of Week
              const parsedDate = new Date(cols[0]);
              if (!isNaN(parsedDate.getTime())) {
                const weekday = parsedDate.toLocaleDateString('en-US', { weekday: 'long' });
                if (validDays.some((d) => d.toLowerCase() === weekday.toLowerCase())) {
                  dayRaw = weekday;
                }
              }
            }

            const day = validDays.find((d) => d.toLowerCase() === dayRaw.toLowerCase()) || 'Monday';
            newSlots.push({
              id: `tt-${Date.now()}-${i}`,
              day,
              time,
              subjectCode,
              subjectName,
              instructor,
              room,
              status: 'upcoming',
            });
          }
        }
        if (newSlots.length > 0) {
          onImportSlots?.(newSlots);
          setTimetableImportNotice(`Successfully imported ${newSlots.length} schedule slots from CSV!`);
          setTimeout(() => setTimetableImportNotice(null), 3500);
        }
      } catch (err) {
        console.error('Error parsing timetable CSV:', err);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCode || !newSubName || !newTime) return;

    onAddSlot({
      day: selectedDay,
      time: newTime,
      subjectCode: newSubCode,
      subjectName: newSubName,
      instructor: newInstructor || 'Faculty Staff',
      room: newRoom || 'Lecture Hall',
      status: 'upcoming',
    });

    setNewSubCode('');
    setNewSubName('');
    setNewTime('');
    setNewInstructor('');
    setNewRoom('');
    setIsAddOpen(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in text-inherit">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleTimetableCSVChange}
      />

      {/* 1. Header Toolbar */}
      <div
        className={`relative rounded-2xl p-5 sm:p-6 border overflow-hidden transition-all ${
          isDark ? 'glass-panel text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25">
                Class Schedule
              </span>
              <h2 className="text-xl font-bold tracking-tight">Weekly Academic Timetable</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onImportSlots && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Import schedule slots from CSV"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isDark
                    ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-slate-200'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm'
                }`}
              >
                <IoCloudUploadOutline className="text-base" />
                <span>Import Schedule</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-neutral-100 text-neutral-950 shadow-md shadow-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <IoAddOutline className="text-base" />
              <span>Add Class Slot</span>
            </button>
          </div>
        </div>

        {timetableImportNotice && (
          <div className="mt-3 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium animate-fade-in">
            {timetableImportNotice}
          </div>
        )}

        {/* Day Pills Bar */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto pb-1">
          {days.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                selectedDay === day
                  ? isDark
                    ? 'bg-white text-neutral-950 shadow-md shadow-white/15'
                    : 'bg-indigo-600 text-white shadow-md'
                  : isDark
                  ? 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Schedule Cards List */}
      <div className="space-y-3.5">
        {daySlots.length === 0 ? (
          <div
            className={`p-10 text-center rounded-2xl border ${
              isDark ? 'glass-panel text-slate-400' : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            <IoTimeOutline className="text-4xl mx-auto mb-2 opacity-40 text-indigo-400" />
            <h4 className="font-semibold text-sm">No scheduled classes for {selectedDay}</h4>
            <p className="text-xs text-slate-500 mt-1">Enjoy your study break or add a session above.</p>
            {slots.length === 0 && subjects.length > 0 && onImportSlots && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    const daysList: TimetableSlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                    const timesList = ['09:30 AM - 10:30 AM', '11:00 AM - 12:30 PM', '02:00 PM - 03:30 PM'];
                    const generated: TimetableSlot[] = subjects.map((sub, idx) => ({
                      id: `tt-${Date.now()}-${idx}`,
                      day: daysList[idx % daysList.length],
                      time: timesList[idx % timesList.length],
                      subjectCode: sub.code,
                      subjectName: sub.name,
                      instructor: sub.instructor || 'Faculty Incharge',
                      room: sub.room || 'Hall 101',
                      status: 'upcoming',
                    }));
                    onImportSlots(generated);
                    setTimetableImportNotice(`Generated ${generated.length} weekly timetable slots from your courses!`);
                    setTimeout(() => setTimetableImportNotice(null), 3500);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 cursor-pointer active:scale-95 transition-all"
                >
                  <IoSparklesOutline className="text-sm" />
                  <span>Auto-Populate Timetable from Enrolled Courses</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          daySlots.map((slot) => {
            const isAttended = Boolean(attendedSlots[slot.id]);
            const isLive = slot.status === 'ongoing';

            return (
              <motion.div
                key={slot.id}
                layout
                className={`relative rounded-2xl p-5 border transition-all ${
                  isLive
                    ? isDark
                      ? 'bg-indigo-950/40 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                      : 'bg-indigo-50/80 border-indigo-300 shadow-md'
                    : isDark
                    ? 'glass-panel text-white hover:bg-white/[0.04]'
                    : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                        {slot.subjectCode}
                      </span>

                      {isLive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                          <IoSparkles className="text-xs" />
                          Happening Now
                        </span>
                      )}

                      {/* Role & Ownership Badges */}
                      {isTeacher && isMyClass(slot) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/35">
                          <IoSchoolOutline className="text-xs text-indigo-400" />
                          Your Assigned Class
                        </span>
                      )}

                      {isTeacher && !isMyClass(slot) && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          isDark ? 'bg-white/[0.04] border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                        }`}>
                          <IoLockClosedOutline className="text-[11px]" />
                          Taught by {slot.instructor}
                        </span>
                      )}

                      <span className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        <IoTimeOutline /> {slot.time}
                      </span>
                    </div>

                    <h4 className="font-bold text-base tracking-tight">{slot.subjectName}</h4>

                    <div className={`flex flex-wrap items-center gap-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="flex items-center gap-1">
                        <IoPersonOutline /> {slot.instructor}
                      </span>
                      <span className="flex items-center gap-1">
                        <IoLocationOutline /> {slot.room}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Students mark personal attendance; Teachers ONLY tamper with their own classes */}
                  <div className="flex items-center gap-2">
                    {!isTeacher ? (
                      /* Student Personal Attendance Check-In */
                      <button
                        type="button"
                        onClick={() => handleToggleSlotAttended(slot.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isAttended
                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                            : isDark
                            ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-slate-300'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                        }`}
                      >
                        <IoCheckmarkCircle className={isAttended ? 'text-emerald-400 text-base' : 'text-slate-400 text-base'} />
                        <span>{isAttended ? 'Attended • Recorded' : 'Mark Attended'}</span>
                      </button>
                    ) : isMyClass(slot) ? (
                      /* Teacher: Authorized to conduct session / take roll-call for THEIR OWN class */
                      <button
                        type="button"
                        onClick={() => onNavigateToRegister?.(slot.subjectCode)}
                        title={`Take attendance for your ${slot.subjectName} class`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer active:scale-95"
                      >
                        <IoCheckmarkCircle className="text-base text-emerald-300" />
                        <span>Take Attendance</span>
                      </button>
                    ) : (
                      /* Teacher: Other Faculty's Class — Strictly Read-Only (Cannot tamper) */
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border select-none cursor-not-allowed ${
                          isDark
                            ? 'bg-white/[0.03] border-white/8 text-slate-400'
                            : 'bg-slate-100 border-slate-200 text-slate-500'
                        }`}
                        title="You are not authorized to alter or record attendance for other faculty's lectures"
                      >
                        <IoLockClosedOutline className="text-sm opacity-60" />
                        <span>Read-Only &bull; Other Faculty</span>
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* 3. Add Slot Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl border z-10 ${
                isDark ? 'bg-[#0f131c] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <h3 className="text-lg font-bold mb-1">Add Slot for {selectedDay}</h3>
              <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Add a new recurring course lecture to the schedule.
              </p>

              <form onSubmit={handleAddSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider mb-1">Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS307"
                      value={newSubCode}
                      onChange={(e) => setNewSubCode(e.target.value)}
                      className={`w-full h-10 px-3 rounded-xl text-xs border focus:outline-none ${
                        isDark ? 'glass-input text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider mb-1">Time</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 02:00 PM - 03:30 PM"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className={`w-full h-10 px-3 rounded-xl text-xs border focus:outline-none ${
                        isDark ? 'glass-input text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Machine Learning Specialization"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className={`w-full h-10 px-3 rounded-xl text-xs border focus:outline-none ${
                      isDark ? 'glass-input text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider mb-1">Instructor</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Miller"
                      value={newInstructor}
                      onChange={(e) => setNewInstructor(e.target.value)}
                      className={`w-full h-10 px-3 rounded-xl text-xs border focus:outline-none ${
                        isDark ? 'glass-input text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider mb-1">Room / Lab</label>
                    <input
                      type="text"
                      placeholder="e.g. Lab 3"
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                      className={`w-full h-10 px-3 rounded-xl text-xs border focus:outline-none ${
                        isDark ? 'glass-input text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                      isDark ? 'border-white/10 hover:bg-white/10 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-neutral-100 text-neutral-950 shadow-md"
                  >
                    Add Slot
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
