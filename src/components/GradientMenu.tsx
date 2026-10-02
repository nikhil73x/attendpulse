import React, { useState, useEffect } from 'react';
import {
  IoHomeOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoNotificationsOutline,
  IoSettingsOutline,
  IoLogOutOutline,
  IoSunnyOutline,
  IoMoonOutline,
  IoPersonOutline,
  IoSchoolOutline,
  IoChevronBackOutline,
  IoListOutline,
  IoMegaphoneOutline,
} from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Student,
  SubjectAttendance,
  TimetableSlot,
  AttendanceNotification,
  UserProfile,
  AttendanceStatus,
} from '../types/attendance';
import {
  initialProfile,
  initialSubjects,
  initialStudents,
  initialTimetable,
  initialNotifications,
} from '../data/mockAttendance';

import { StudentDashboard } from './attendance/StudentDashboard';
import { TeacherDashboard } from './attendance/TeacherDashboard';
import { TeacherRegister } from './attendance/TeacherRegister';
import { TimetableModule } from './attendance/TimetableModule';
import { NotificationsModule } from './attendance/NotificationsModule';
import { SettingsModal } from './attendance/SettingsModal';
import LiquidWaveSpinner from './ui/spinner-10';
import { api } from '../services/api';

export interface GradientMenuProps {
  onLogout?: () => void;
  userEmail?: string;
  userRole?: 'student' | 'teacher';
  userName?: string;
}

export function GradientMenu({
  onLogout,
  userEmail,
  userRole = 'student',
  userName,
}: GradientMenuProps) {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('attendance_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  // Active view — null while loading intro plays, then 'home' after 2 s
  const [activeView, setActiveView] = useState<'home' | 'attendance' | 'timetable' | 'notifications' | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Intro animation flags
  const [navReady, setNavReady]   = useState(false); // nav pills slide down at t=100ms
  const [homeReady, setHomeReady] = useState(false); // home content appears at t=2000ms

  useEffect(() => {
    const t1 = setTimeout(() => setNavReady(true),  100);
    const t2 = setTimeout(() => { setHomeReady(true); setActiveView('home'); }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Profile state initialized with role-appropriate defaults
  const [profile, setProfile] = useState<UserProfile>(() => {
    const defaultName = userName || (userRole === 'teacher' ? 'Prof. Nikhil Yadav' : 'Nikhil Yadav');
    const defaultEmail = userEmail || (userRole === 'teacher' ? 'prof.yadav@school.edu' : 'nikhil.yadav@student.edu');
    const defaultRoll = userRole === 'teacher' ? 'FAC-CS-108' : '2026-CS-0455';

    return {
      ...initialProfile,
      name: defaultName,
      email: defaultEmail,
      role: userRole,
      rollNo: defaultRoll,
      designation: userRole === 'teacher' ? 'Associate Professor' : 'Student',
    };
  });

  const isTeacher = profile.role === 'teacher';

  // Persistent data collections
  const [subjects, setSubjects] = useState<SubjectAttendance[]>(() => {
    const saved = localStorage.getItem('attendance_subjects');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return initialSubjects;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('attendance_students');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return initialStudents;
  });

  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => {
    const saved = localStorage.getItem('attendance_timetable');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return initialTimetable;
  });

  const [notifications, setNotifications] = useState<AttendanceNotification[]>(() => {
    const saved = localStorage.getItem('attendance_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return initialNotifications;
  });

  const [selectedCourseCode, setSelectedCourseCode] = useState<string | undefined>(undefined);

  // Sync theme
  useEffect(() => {
    localStorage.setItem('attendance_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync data
  useEffect(() => {
    localStorage.setItem('attendance_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('attendance_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('attendance_timetable', JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem('attendance_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Live initial load from backend API
  useEffect(() => {
    let active = true;

    api.getSubjects().then((data) => {
      if (active && data && data.length > 0) setSubjects(data);
    }).catch(() => {});

    api.getStudents().then((data) => {
      if (active && data && data.length > 0) setStudents(data);
    }).catch(() => {});

    api.getTimetable().then((data) => {
      if (active && data && data.length > 0) setTimetable(data);
    }).catch(() => {});

    api.getNotifications().then((data) => {
      if (active && data && data.length > 0) setNotifications(data);
    }).catch(() => {});

    return () => { active = false; };
  }, []);

  // Handlers
  const handleUpdateSubject = (subjectId: string, attendedDelta: number, totalDelta: number) => {
    setSubjects((prev) =>
      prev.map((sub) => {
        if (sub.id === subjectId) {
          const newAttended = Math.max(0, sub.attended + attendedDelta);
          const newTotal = Math.max(newAttended, sub.total + totalDelta);
          return { ...sub, attended: newAttended, total: newTotal };
        }
        return sub;
      })
    );
    api.updateSubjectAttendance(subjectId, attendedDelta, totalDelta).catch(() => {});
  };

  const handleUpdateStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
    api.updateStudentStatus(studentId, status).catch(() => {});
  };

  const handleBulkUpdateStudents = (status: AttendanceStatus) => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
    api.bulkUpdateStudents(status).catch(() => {});
  };

  const handleAddStudent = (newStudent: { name: string; rollNo: string; email: string }) => {
    const colors = [
      'from-indigo-500 to-purple-600',
      'from-blue-500 to-cyan-500',
      'from-pink-500 to-rose-500',
      'from-emerald-500 to-teal-500',
      'from-amber-500 to-orange-500',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const student: Student = {
      id: `stu-${Date.now()}`,
      rollNo: newStudent.rollNo,
      name: newStudent.name,
      email: newStudent.email,
      avatarColor: randomColor,
      status: 'present',
    };
    setStudents((prev) => [student, ...prev]);
    api.addStudent(newStudent).catch(() => {});
  };

  const handleImportStudents = (imported: Student[]) => {
    setStudents((prev) => [...imported, ...prev]);
    api.bulkImportStudents({ students: imported }).catch(() => {});
  };

  const handleImportSubjects = (imported: SubjectAttendance[]) => {
    setSubjects((prev) => {
      const existingCodes = new Map(prev.map((s) => [s.code.toUpperCase(), s]));
      const updated = [...prev];
      for (const item of imported) {
        const key = item.code.toUpperCase();
        if (existingCodes.has(key)) {
          const idx = updated.findIndex((s) => s.code.toUpperCase() === key);
          if (idx !== -1) updated[idx] = { ...updated[idx], ...item };
        } else {
          updated.push(item);
        }
      }
      return updated;
    });
  };

  const handleAddTimetableSlot = (newSlot: Omit<TimetableSlot, 'id'>) => {
    const slot: TimetableSlot = {
      ...newSlot,
      id: `tt-${Date.now()}`,
    };
    setTimetable((prev) => [...prev, slot]);
  };

  const handleImportTimetable = (importedSlots: TimetableSlot[]) => {
    setTimetable((prev) => [...prev, ...importedSlots]);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSendAnnouncement = (
    newNotif: Omit<AttendanceNotification, 'id' | 'time' | 'read'>
  ) => {
    const formattedTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const notification: AttendanceNotification = {
      ...newNotif,
      id: `notif-${Date.now()}`,
      time: `Today, ${formattedTime}`,
      read: false,
    };
    setNotifications((prev) => [notification, ...prev]);
  };

  const handleResetData = () => {
    setSubjects(initialSubjects);
    setStudents(initialStudents);
    setTimetable(initialTimetable);
    setNotifications(initialNotifications);
  };

  const isDark = theme === 'dark';
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Role-Specific Menu Items
  const studentMenuItems = [
    {
      id: 'home',
      title: 'Home',
      icon: <IoHomeOutline />,
      gradientFrom: '#a955ff',
      gradientTo: '#ea51ff',
    },
    {
      id: 'attendance',
      title: 'Attendance',
      icon: <IoCalendarOutline />,
      gradientFrom: '#56CCF2',
      gradientTo: '#2F80ED',
    },
    {
      id: 'timetable',
      title: 'Timetable',
      icon: <IoTimeOutline />,
      gradientFrom: '#FF9966',
      gradientTo: '#FF5E62',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <IoNotificationsOutline />,
      gradientFrom: '#80FF72',
      gradientTo: '#7EE8FA',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <IoSettingsOutline />,
      gradientFrom: '#FA709A',
      gradientTo: '#FEE140',
    },
  ];

  const teacherMenuItems = [
    {
      id: 'home',
      title: 'Dashboard',
      icon: <IoHomeOutline />,
      gradientFrom: '#a955ff',
      gradientTo: '#ea51ff',
    },
    {
      id: 'attendance',
      title: 'Roll Call',
      icon: <IoListOutline />,
      gradientFrom: '#56CCF2',
      gradientTo: '#2F80ED',
    },
    {
      id: 'timetable',
      title: 'Schedule',
      icon: <IoTimeOutline />,
      gradientFrom: '#FF9966',
      gradientTo: '#FF5E62',
    },
    {
      id: 'notifications',
      title: 'Announce',
      icon: <IoMegaphoneOutline />,
      gradientFrom: '#80FF72',
      gradientTo: '#7EE8FA',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <IoSettingsOutline />,
      gradientFrom: '#FA709A',
      gradientTo: '#FEE140',
    },
  ];

  const currentMenuItems = (isTeacher ? teacherMenuItems : studentMenuItems).filter(
    (item) => item.id !== 'settings'
  );

  const handlePillClick = (id: string) => {
    if (id === 'settings') {
      setIsSettingsOpen(true);
    } else if (id === 'home') {
      setActiveView('home');
    } else if (id === 'attendance') {
      setActiveView('attendance');
    } else if (id === 'timetable') {
      setActiveView('timetable');
    } else if (id === 'notifications') {
      setActiveView('notifications');
    }
  };

  // CSV Export helper for Teacher Dashboard
  const triggerTeacherCSVExport = () => {
    const cleanField = (val: string) => {
      let clean = String(val ?? '').replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(clean)) {
        clean = `'${clean}`;
      }
      return `"${clean}"`;
    };

    const headers = 'Roll No,Student Name,Email,Attendance Status\n';
    const rows = students
      .map((s) => `${cleanField(s.rollNo)},${cleanField(s.name)},${cleanField(s.email)},${cleanField(s.status.toUpperCase())}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Class_Roster_Attendance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // FIX #15: release blob URL memory
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-500 relative overflow-x-hidden ${
        isDark ? 'bg-[#050608] text-white selection:bg-indigo-500/30' : 'bg-[#f8fafc] text-slate-900 selection:bg-indigo-500/20'
      }`}
    >
      {/* Background texture — dark mode only */}
      {isDark && (
        <>
          <div className="fixed inset-0 vignette-overlay pointer-events-none z-0" />
          <div aria-hidden="true" className="fixed inset-0 pointer-events-none opacity-[0.035] z-0"
            style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div aria-hidden="true"
            className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-indigo-600/12 via-purple-600/12 to-blue-600/12 rounded-full blur-3xl pointer-events-none z-0" />
        </>
      )}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-6 pt-5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            isTeacher ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-sm' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          }`}>
            {isTeacher ? <IoSchoolOutline className="text-sm text-indigo-400" /> : <IoPersonOutline className="text-sm" />}
            <span>{isTeacher ? 'Faculty Portal' : 'Student Portal'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setActiveView('notifications')} title="Notifications"
            className={`relative flex items-center justify-center w-9 h-9 rounded-full border transition-all cursor-pointer ${
              isDark ? 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-slate-300 hover:text-white' : 'bg-white hover:bg-indigo-50/80 border-slate-200/90 text-slate-700 hover:text-indigo-600 shadow-sm hover:shadow'
            }`}>
            <IoNotificationsOutline className="text-base" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
          </button>
          <button type="button" onClick={() => setTheme(isDark ? 'light' : 'dark')} title="Toggle theme"
            className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all cursor-pointer ${
              isDark ? 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-amber-300' : 'bg-white hover:bg-amber-50/80 border-slate-200/90 text-amber-600 shadow-sm hover:shadow'
            }`}>
            {isDark ? <IoSunnyOutline className="text-base" /> : <IoMoonOutline className="text-base" />}
          </button>
          <button type="button" onClick={() => setIsSettingsOpen(true)} title="Settings"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
              isDark ? 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-slate-300 hover:text-white' : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 shadow-sm hover:shadow'
            }`}>
            <IoSettingsOutline className="text-sm" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          {onLogout && (
            <button type="button" onClick={onLogout} title="Sign Out"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                isDark ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-300' : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 shadow-sm hover:shadow'
              }`}>
              <IoLogOutOutline className="text-sm" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Circular Pill Navigation — shifted up near header ────────── */}
      <motion.div
        className="relative z-20 w-full max-w-6xl mx-auto px-6 py-3 flex justify-center"
        initial={{ opacity: 0, y: -24 }}
        animate={navReady ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <ul className="flex items-center justify-center gap-4 sm:gap-5">
          {currentMenuItems.map(({ id, title, icon, gradientFrom, gradientTo }, idx) => {
            const isActive = activeView === id;
            return (
              <motion.li
                key={id}
                role="button"
                tabIndex={0}
                initial={{ opacity: 0, y: -16 }}
                animate={navReady ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
                transition={{ duration: 0.45, delay: 0.08 + idx * 0.07, ease: 'easeOut' }}
                onClick={() => handlePillClick(id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePillClick(id); } }}
                className={`group relative flex cursor-pointer items-center justify-center rounded-full transition-all duration-500 ${
                  isActive
                    ? 'h-[60px] w-[130px] sm:w-[145px] text-white shadow-xl shadow-purple-500/30'
                    : `h-[56px] w-[56px] hover:w-[130px] sm:hover:w-[140px] ${
                        isDark
                          ? 'bg-[#0d111b] border border-white/12 text-slate-300 hover:text-white shadow-lg shadow-black/80'
                          : 'bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 shadow-sm'
                      }`
                }`}
                style={{
                  '--gradient-from': gradientFrom,
                  '--gradient-to': gradientTo,
                  ...(isActive ? { background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` } : {}),
                } as React.CSSProperties}
              >
                {/* Glow behind active item */}
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-full blur-[14px] opacity-60 -z-10"
                    style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                  />
                )}

                {/* Gradient fill on hover when inactive */}
                {!isActive && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,var(--gradient-from),var(--gradient-to))] opacity-0 transition-all duration-500 group-hover:opacity-100" />
                    <span className="absolute inset-x-0 top-[8px] -z-10 h-full rounded-full bg-[linear-gradient(135deg,var(--gradient-from),var(--gradient-to))] blur-[14px] opacity-0 transition-all duration-500 group-hover:opacity-40" />
                  </>
                )}

                {/* Icon (visible when circle/inactive, shrinks away on hover or active) */}
                <span className={`relative z-10 transition-all duration-300 ${
                  isActive ? 'hidden' : 'scale-100 group-hover:hidden'
                }`}>
                  <span className={`text-xl sm:text-2xl ${isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-700'}`}>{icon}</span>
                </span>

                {/* Label (active stays visible & enlarged; inactive expands on hover) */}
                <span className={`tracking-wider uppercase font-extrabold text-white transition-all duration-300 z-10 ${
                  isActive
                    ? 'text-xs sm:text-sm scale-100 block'
                    : 'text-xs scale-0 hidden group-hover:scale-100 group-hover:block'
                }`}>
                  {title}
                </span>
              </motion.li>
            );
          })}
        </ul>
      </motion.div>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-6 flex-1">
        <AnimatePresence mode="wait">

          {/* LiquidWaveSpinner loading state — shown for the first 2 s */}
          {!homeReady && (
            <motion.div
              key="intro-spinner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center justify-center min-h-[50vh] gap-3"
            >
              <div className="w-full max-w-md p-6 flex flex-col items-center justify-center">
                <LiquidWaveSpinner size="lg" />
              </div>
            </motion.div>
          )}

          {/* Home */}
          {activeView === 'home' && homeReady && (
            <motion.div key="home-view"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}>
              {isTeacher
                ? <TeacherDashboard profile={profile} students={students}
                    onNavigateToRegister={() => setActiveView('attendance')}
                    onNavigateToSchedule={() => setActiveView('timetable')}
                    onExportCSV={triggerTeacherCSVExport} isDark={isDark} />
                : <StudentDashboard profile={profile} subjects={subjects}
                    onUpdateSubject={handleUpdateSubject} isDark={isDark} view="overview" />}
            </motion.div>
          )}

          {/* Attendance */}
          {activeView === 'attendance' && homeReady && (
            <motion.div key="attendance-view"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}>
              {isTeacher
                ? <TeacherRegister
                    students={students}
                    subjects={subjects}
                    teacherName={profile.name}
                    initialSelectedCourse={selectedCourseCode}
                    onUpdateStatus={handleUpdateStudentStatus}
                    onBulkUpdate={handleBulkUpdateStudents}
                    onAddStudent={handleAddStudent}
                    onImportStudents={handleImportStudents}
                    onImportSubjects={handleImportSubjects}
                    isDark={isDark}
                  />
                : <StudentDashboard profile={profile} subjects={subjects}
                    onUpdateSubject={handleUpdateSubject} isDark={isDark} view="attendance" />}
            </motion.div>
          )}

          {/* Timetable */}
          {activeView === 'timetable' && homeReady && (
            <motion.div key="timetable-view"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}>
              <TimetableModule
                slots={timetable}
                onAddSlot={handleAddTimetableSlot}
                onImportSlots={handleImportTimetable}
                isTeacher={isTeacher}
                currentTeacherName={profile.name}
                onNavigateToRegister={(courseCode) => {
                  setSelectedCourseCode(courseCode);
                  setActiveView('attendance');
                }}
                isDark={isDark}
              />
            </motion.div>
          )}

          {/* Notifications */}
          {activeView === 'notifications' && homeReady && (
            <motion.div key="notifications-view"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}>
              <NotificationsModule
                notifications={notifications}
                students={students}
                currentUser={profile}
                isTeacher={isTeacher}
                onSendAnnouncement={handleSendAnnouncement}
                onMarkAllRead={handleMarkAllNotificationsRead}
                onClearAll={handleClearAllNotifications}
                onDeleteNotification={handleDeleteNotification}
                isDark={isDark}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className={`relative z-10 w-full max-w-6xl mx-auto px-6 py-4 text-center text-[11px] border-t transition-colors ${
        isDark ? 'text-slate-500 border-white/[0.05]' : 'text-slate-400 border-slate-200'
      }`}>
        &copy; {new Date().getFullYear()} Attendance Tracker Portal &bull; {isTeacher ? 'Faculty Workspace' : 'Student Workspace'} &bull; All systems operational
      </footer>

      {/* ── Settings Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
            profile={profile} onUpdateProfile={(u) => setProfile((p) => ({ ...p, ...u }))}
            theme={theme} onToggleTheme={setTheme} onLogout={onLogout} onResetData={handleResetData} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default GradientMenu;
