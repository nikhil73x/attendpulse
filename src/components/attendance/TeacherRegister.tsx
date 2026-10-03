import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Student, SubjectAttendance, AttendanceStatus } from '../../types/attendance';
import {
  IoSearchOutline,
  IoCheckmarkCircle,
  IoDownloadOutline,
  IoCloudUploadOutline,
  IoPersonAddOutline,
  IoSaveOutline,
  IoDocumentTextOutline,
  IoCloseOutline,
  IoLockClosedOutline,
  IoSchoolOutline,
  IoSparklesOutline,
  IoClipboardOutline,
  IoCheckmarkSharp,
  IoAlertCircleOutline,
} from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-teal-500 to-emerald-600',
];

export function parseStudentCSV(text: string): Student[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';
  const firstCols = firstLine
    .split(delimiter)
    .map((c) => c.replace(/^["']|["']$/g, '').trim().toLowerCase());

  const hasHeader = firstCols.some((c) =>
    c.includes('roll') || c.includes('name') || c.includes('student') || c.includes('email') || c.includes('id')
  );

  let rollIdx = -1;
  let nameIdx = -1;
  let emailIdx = -1;
  let statusIdx = -1;

  if (hasHeader) {
    firstCols.forEach((col, idx) => {
      if (col.includes('roll') || col.includes('urn') || col.includes('reg') || (col.includes('id') && !col.includes('name'))) {
        rollIdx = idx;
      } else if (col.includes('name') || col.includes('student')) {
        nameIdx = idx;
      } else if (col.includes('email') || col.includes('mail')) {
        emailIdx = idx;
      } else if (col.includes('status') || col.includes('attendance')) {
        statusIdx = idx;
      }
    });
  }

  if (rollIdx === -1) rollIdx = 0;
  if (nameIdx === -1) nameIdx = 1;
  if (emailIdx === -1) emailIdx = 2;

  const startIndex = hasHeader ? 1 : 0;
  const students: Student[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const rawCols = lines[i]
      .split(delimiter === '\t' ? '\t' : /,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map((c) => c.replace(/^["']|["']$/g, '').trim());

    if (rawCols.length < 2) continue;

    let rollNo = rawCols[rollIdx] || '';
    let name = rawCols[nameIdx] || '';
    let email = rawCols[emailIdx] || '';
    const statusRaw = (statusIdx !== -1 ? rawCols[statusIdx] : (rawCols[3] || '')).toLowerCase();

    // Column swap heuristics
    if (name.includes('@') && !email.includes('@')) {
      const tmp = name; name = email; email = tmp;
    }
    if (rollNo.includes(' ') && !/\d/.test(rollNo) && /\d/.test(name) && !name.includes(' ')) {
      const tmp = rollNo; rollNo = name; name = tmp;
    }

    if (!rollNo && !name) continue;
    if (!rollNo) rollNo = `2026-CS-${1000 + i}`;
    if (!name) name = `Student ${i}`;

    if (!email || !email.includes('@')) {
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
      email = `${cleanName}@school.edu`;
    }

    let status: AttendanceStatus = 'present';
    if (statusRaw.includes('absent')) status = 'absent';
    else if (statusRaw.includes('late')) status = 'late';
    else if (statusRaw.includes('excuse')) status = 'excused';

    students.push({
      id: `imported-${Date.now()}-${i}`,
      rollNo: rollNo.toUpperCase(),
      name,
      email: email.toLowerCase(),
      avatarColor: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
      status,
    });
  }

  return students;
}

export function parseSubjectCSV(text: string): SubjectAttendance[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';
  const hasHeader = lines[0].toLowerCase().includes('code') || lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('course');
  const startIndex = hasHeader ? 1 : 0;

  const subjects: SubjectAttendance[] = [];
  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i]
      .split(delimiter === '\t' ? '\t' : /,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map((c) => c.replace(/^["']|["']$/g, '').trim());

    if (cols.length >= 2) {
      const code = cols[0] || `CS${300 + i}`;
      const name = cols[1] || 'Imported Course';
      const instructor = cols[2] || 'Faculty Incharge';
      const room = cols[3] || 'Lecture Hall';
      const attended = !isNaN(Number(cols[4])) ? Number(cols[4]) : 20;
      const total = !isNaN(Number(cols[5])) ? Number(cols[5]) : 24;
      const credits = !isNaN(Number(cols[6])) ? Number(cols[6]) : 4;
      subjects.push({
        id: `sub-${Date.now()}-${i}`,
        code: code.toUpperCase(),
        name,
        instructor,
        room,
        attended,
        total,
        credits,
      });
    }
  }
  return subjects;
}

interface TeacherRegisterProps {
  students: Student[];
  /** Pass the subject list so the course dropdown reflects real data */
  subjects?: SubjectAttendance[];
  teacherName?: string;
  initialSelectedCourse?: string;
  onUpdateStatus: (studentId: string, status: AttendanceStatus) => void;
  onBulkUpdate: (status: AttendanceStatus) => void;
  onAddStudent: (newStudent: { name: string; rollNo: string; email: string }) => void;
  onImportStudents: (imported: Student[]) => void;
  onImportSubjects?: (imported: SubjectAttendance[]) => void;
  isDark: boolean;
}

export const TeacherRegister: React.FC<TeacherRegisterProps> = ({
  students,
  subjects,
  teacherName,
  initialSelectedCourse,
  onUpdateStatus,
  onBulkUpdate,
  onAddStudent,
  onImportStudents,
  onImportSubjects,
  isDark,
}) => {
  // FIX #13: Build course list from subjects prop — fall back to hardcoded if not provided
  const courseList = useMemo(() => {
    if (subjects && subjects.length > 0) {
      return subjects.map((s) => ({
        value: `${s.code} - ${s.name}`,
        label: `${s.code} - ${s.name} (${s.room})`,
      }));
    }
    return [];
  }, [subjects]);

  // Check if a subject belongs to the logged-in teacher
  const isSubjectMine = (s: { code: string; name: string; instructor?: string }) => {
    if (!teacherName) return true;
    const cleanTeacher = teacherName.toLowerCase().replace(/^(prof\.|dr\.)\s*/, '').trim();
    const cleanInst = (s.instructor || '').toLowerCase().replace(/^(prof\.|dr\.)\s*/, '').trim();
    if (cleanInst.includes(cleanTeacher) || cleanTeacher.includes(cleanInst)) return true;
    // Default assignment for Prof. Nikhil Yadav / default faculty account: CS302 Database Systems
    if (cleanTeacher.includes('yadav') && (s.code === 'CS302' || cleanInst.includes('anita') || cleanInst.includes('yadav'))) {
      return true;
    }
    return false;
  };

  const [selectedCourse, setSelectedCourse] = useState(() => {
    if (initialSelectedCourse) {
      const match = courseList.find((c) => c.value.includes(initialSelectedCourse));
      if (match) return match.value;
    }
    if (subjects && subjects.length > 0) {
      const mySub = subjects.find((s) => isSubjectMine(s));
      if (mySub) return `${mySub.code} - ${mySub.name}`;
    }
    return courseList[0]?.value ?? 'CS302 - Database Systems';
  });

  // Keep selectedCourse updated if initialSelectedCourse prop changes
  useEffect(() => {
    if (initialSelectedCourse) {
      const match = courseList.find((c) => c.value.includes(initialSelectedCourse));
      if (match) setSelectedCourse(match.value);
    }
  }, [initialSelectedCourse, courseList]);

  const currentSubjectObj = useMemo(() => {
    return subjects?.find((s) => selectedCourse.includes(s.code) || selectedCourse.includes(s.name));
  }, [subjects, selectedCourse]);

  const isCourseAssignedToMe = useMemo(() => {
    if (!teacherName) return true;
    if (!currentSubjectObj) return true;
    return isSubjectMine(currentSubjectObj);
  }, [teacherName, currentSubjectObj]);
  const [sessionDate, setSessionDate]         = useState(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery]         = useState('');
  const [statusFilter, setStatusFilter]       = useState<'all' | AttendanceStatus>('all');
  const [isAddModalOpen, setIsAddModalOpen]   = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab]             = useState<'paste' | 'file'>('paste');
  const [importTarget, setImportTarget]       = useState<'students' | 'subjects'>('students');
  const [pastedCSV, setPastedCSV]             = useState('');
  const [importError, setImportError]         = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice]     = useState(false);
  const [importSuccessNotice, setImportSuccessNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newName,   setNewName]   = useState('');
  const [newRollNo, setNewRollNo] = useState('');
  const [newEmail,  setNewEmail]  = useState('');

  // Derived counts
  const totalCount     = students.length;
  const presentCount   = students.filter((s) => s.status === 'present').length;
  const absentCount    = students.filter((s) => s.status === 'absent').length;
  const lateCount      = students.filter((s) => s.status === 'late').length;
  const excusedCount   = students.filter((s) => s.status === 'excused').length;
  const attendanceRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  // FIX #10: Save Session now actually persists to localStorage
  const handleSaveSession = () => {
    const sessionRecord = {
      id: `session-${Date.now()}`,
      date: sessionDate,
      course: selectedCourse,
      savedAt: new Date().toISOString(),
      summary: { totalCount, presentCount, absentCount, lateCount, excusedCount, attendanceRate: +attendanceRate.toFixed(1) },
      roster: students.map((s) => ({ rollNo: s.rollNo, name: s.name, status: s.status })),
    };
    try {
      const existing: unknown[] = JSON.parse(localStorage.getItem('attendance_saved_sessions') || '[]');
      localStorage.setItem(
        'attendance_saved_sessions',
        JSON.stringify([sessionRecord, ...existing].slice(0, 50)), // keep last 50 sessions
      );
    } catch (err) {
      console.error('Failed to persist session:', err);
    }

    // Live backend save
    const courseCode = selectedCourse.split(' - ')[0] || selectedCourse;
    api.saveAttendanceSession({
      courseCode,
      teacherName: teacherName || '',
      date: sessionDate,
      records: students.map((s) => ({
        studentId: s.id,
        rollNo: s.rollNo,
        name: s.name,
        status: s.status,
        notes: s.notes,
      })),
    }).catch((err) => console.warn('Backend attendance session notice:', err));

    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRollNo) return;
    onAddStudent({ name: newName, rollNo: newRollNo, email: newEmail || `${newRollNo.toLowerCase()}@school.edu` });
    setNewName(''); setNewRollNo(''); setNewEmail('');
    setIsAddModalOpen(false);
  };

  const cleanCsvField = (val: string) => {
    let clean = String(val ?? '').replace(/"/g, '""');
    // Prevent CSV formula injection in spreadsheet software like Excel
    if (/^[=+\-@\t\r]/.test(clean)) {
      clean = `'${clean}`;
    }
    return `"${clean}"`;
  };

  // FIX #15: revokeObjectURL after each CSV download (x2)
  const handleExportCSV = () => {
    const headers = 'Roll No,Student Name,Email,Attendance Status,Date,Course\n';
    const rows = students
      .map((s) => `${cleanCsvField(s.rollNo)},${cleanCsvField(s.name)},${cleanCsvField(s.email)},${cleanCsvField(s.status.toUpperCase())},${cleanCsvField(sessionDate)},${cleanCsvField(selectedCourse)}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_${selectedCourse.split(' ')[0]}_${sessionDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // FIX #15
  };

  const handleDownloadTemplate = () => {
    const templateContent =
      'Roll No,Student Name,Email,Attendance Status\n' +
      '"2026-CS-0601","Aarav Sharma","aarav.s@school.edu","PRESENT"\n' +
      '"2026-CS-0602","Zara Khan","zara.k@school.edu","PRESENT"\n' +
      '"2026-CS-0603","Karan Varma","karan.v@school.edu","LATE"\n';
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Sample_Student_Roster_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // FIX #15
  };

  const sampleStudentsCSV = `Roll No,Student Name,Email,Status
2026-CS-0101,Aarav Sharma,aarav.sharma@school.edu,present
2026-CS-0102,Diya Patel,diya.patel@school.edu,present
2026-CS-0103,Rohan Gupta,rohan.gupta@school.edu,present
2026-CS-0104,Ananya Iyer,ananya.iyer@school.edu,present
2026-CS-0105,Kabir Singh,kabir.singh@school.edu,present
2026-CS-0106,Ishaan Verma,ishaan.verma@school.edu,present
2026-CS-0107,Meera Nambiar,meera.nambiar@school.edu,present
2026-CS-0108,Siddharth Rao,siddharth.rao@school.edu,present
2026-CS-0109,Pooja Reddy,pooja.reddy@school.edu,present
2026-CS-0110,Vikram Malhotra,vikram.m@school.edu,present
2026-CS-0111,Neha Choudhury,neha.c@school.edu,present
2026-CS-0112,Aditya Joshi,aditya.j@school.edu,present
2026-CS-0113,Sanya Kapoor,sanya.k@school.edu,present
2026-CS-0114,Arjun Nair,arjun.n@school.edu,present
2026-CS-0115,Tanvi Deshmukh,tanvi.d@school.edu,present
2026-CS-0116,Rishi Menon,rishi.m@school.edu,present
2026-CS-0117,Kavya Pillai,kavya.p@school.edu,present
2026-CS-0118,Devansh Bhatt,devansh.b@school.edu,present
2026-CS-0119,Rhea Mukherjee,rhea.m@school.edu,present
2026-CS-0120,Varun Sen,varun.sen@school.edu,present`;

  const sampleSubjectsCSV = `Code,Course Name,Instructor,Room,Credits
CS101,Introduction to Computer Science,Prof. Alan Turing,Hall A,4
CS102,Data Structures & Algorithms,Prof. Donald Knuth,Hall B,4
CS103,Computer Organization,Dr. Grace Hopper,Lab 1,3
CS104,Operating Systems,Prof. Linus Torvalds,Hall C,4
CS105,Database Management Systems,Dr. Edgar Codd,Lab 2,4
CS106,Artificial Intelligence & Machine Learning,Prof. Nikhil Yadav,AI Studio,4`;

  const detectedStudentCount = useMemo(() => {
    if (importTarget !== 'students' || !pastedCSV.trim()) return 0;
    return parseStudentCSV(pastedCSV).length;
  }, [pastedCSV, importTarget]);

  const detectedSubjectCount = useMemo(() => {
    if (importTarget !== 'subjects' || !pastedCSV.trim()) return 0;
    return parseSubjectCSV(pastedCSV).length;
  }, [pastedCSV, importTarget]);

  const handleConfirmImport = () => {
    setImportError(null);
    if (importTarget === 'students') {
      const parsed = parseStudentCSV(pastedCSV);
      if (parsed.length === 0) {
        setImportError('No valid student rows detected. Ensure you have Roll No and Name columns.');
        return;
      }
      onImportStudents(parsed);
      setImportSuccessNotice(`Successfully imported ${parsed.length} student records! Student accounts are now active.`);
      setIsImportModalOpen(false);
      setPastedCSV('');
      setTimeout(() => setImportSuccessNotice(null), 4000);
    } else {
      if (!onImportSubjects) return;
      const parsed = parseSubjectCSV(pastedCSV);
      if (parsed.length === 0) {
        setImportError('No valid course rows detected. Ensure Code and Course Name columns exist.');
        return;
      }
      onImportSubjects(parsed);
      setImportSuccessNotice(`Successfully imported ${parsed.length} courses!`);
      setIsImportModalOpen(false);
      setPastedCSV('');
      setTimeout(() => setImportSuccessNotice(null), 4000);
    }
  };

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;
        setPastedCSV(text);

        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (lines.length < 1) return;
        const headerLine = lines[0].toLowerCase();

        // Strict subject detection: ONLY if file has credits/instructor AND no student or roll mentions
        const isStrictSubject =
          !headerLine.includes('roll') &&
          !headerLine.includes('student') &&
          !headerLine.includes('reg') &&
          (headerLine.includes('credits') || headerLine.includes('instructor')) &&
          (headerLine.includes('code') || headerLine.includes('course'));

        if (isStrictSubject && onImportSubjects) {
          const newSubjects = parseSubjectCSV(text);
          if (newSubjects.length > 0) {
            onImportSubjects(newSubjects);
            setImportSuccessNotice(`Successfully imported ${newSubjects.length} subjects! Student portal curriculum synced in real-time.`);
            setTimeout(() => setImportSuccessNotice(null), 4000);
            return;
          }
        }

        // Default to student roster
        const newStudents = parseStudentCSV(text);
        if (newStudents.length > 0) {
          onImportStudents(newStudents);
          setImportSuccessNotice(`Successfully imported ${newStudents.length} student records from CSV!`);
          setTimeout(() => setImportSuccessNotice(null), 3500);
        }
      } catch (err) {
        console.error('Error parsing CSV file:', err);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in text-inherit">
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCSVFileChange} />

      {/* 1. Header Toolbar */}
      <div className={`relative rounded-2xl p-5 sm:p-6 border overflow-hidden transition-all ${isDark ? 'glass-panel text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-sm">
                Teacher Control Panel
              </span>
              <h2 className="text-xl font-bold tracking-tight">Class Attendance Register</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIsImportModalOpen(true)} title="Import student roster from CSV or paste table data directly"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/30 text-indigo-300'
                  : 'bg-indigo-50 hover:bg-indigo-100/90 border-indigo-200 text-indigo-700 shadow-sm hover:shadow'
              }`}>
              <IoCloudUploadOutline className="text-base" /><span>Import CSV / Paste</span>
            </button>
            <button type="button" onClick={handleExportCSV} title="Export attendance session to CSV"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm hover:shadow'
              }`}>
              <IoDownloadOutline className="text-base" /><span>Export CSV</span>
            </button>
            <button type="button"
              disabled={!isCourseAssignedToMe}
              onClick={() => isCourseAssignedToMe && setIsAddModalOpen(true)}
              title={!isCourseAssignedToMe ? "Only the assigned instructor can enroll students in this course" : "Add Student"}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                !isCourseAssignedToMe
                  ? 'opacity-40 cursor-not-allowed border-white/5 text-slate-500'
                  : isDark
                  ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-slate-200 cursor-pointer'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm hover:shadow cursor-pointer'
              }`}>
              <IoPersonAddOutline className="text-sm" /><span>Add Student</span>
            </button>
            {/* FIX #10: Save Session now persists to localStorage */}
            <button type="button"
              disabled={!isCourseAssignedToMe}
              onClick={() => isCourseAssignedToMe && handleSaveSession()}
              title={!isCourseAssignedToMe ? "You are not authorized to save attendance records for other professors' classes" : "Save Session"}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                !isCourseAssignedToMe
                  ? 'opacity-40 cursor-not-allowed bg-slate-700/50 text-slate-400'
                  : isDark
                  ? 'bg-white hover:bg-neutral-100 text-neutral-950 shadow-md shadow-white/10 cursor-pointer active:scale-95'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25 cursor-pointer active:scale-95'
              }`}>
              <IoSaveOutline className="text-sm" /><span>Save Session</span>
            </button>
          </div>
        </div>

        {/* Course & Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <div>
            <label className={`block text-[10px] uppercase font-bold tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Select Course / Lecture
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className={`w-full h-10 px-3 rounded-xl text-xs font-semibold border focus:outline-none transition-colors ${
                isDark ? 'bg-[#0e121b] border-white/15 text-white focus:border-indigo-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
              }`}
            >
              <optgroup label="⭐ Your Assigned Courses (Full Access)">
                {courseList
                  .filter((c) => {
                    const sub = subjects?.find((s) => c.value.includes(s.code));
                    return sub ? isSubjectMine(sub) : false;
                  })
                  .map((c) => (
                    <option key={c.value} value={c.value}>⭐ {c.label}</option>
                  ))}
              </optgroup>
              <optgroup label="🔒 Other Faculty Courses (Read-Only Audit)">
                {courseList
                  .filter((c) => {
                    const sub = subjects?.find((s) => c.value.includes(s.code));
                    return sub ? !isSubjectMine(sub) : true;
                  })
                  .map((c) => (
                    <option key={c.value} value={c.value}>🔒 {c.label}</option>
                  ))}
              </optgroup>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Session Date</label>
              <button type="button" onClick={handleDownloadTemplate}
                className={`text-[11px] underline flex items-center gap-1 cursor-pointer ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
                <IoDocumentTextOutline /><span>Download Sample CSV Template</span>
              </button>
            </div>
            <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)}
              className={`w-full h-10 px-3 rounded-xl text-xs font-medium border focus:outline-none transition-colors ${isDark ? 'bg-[#0e121b] border-white/15 text-white focus:border-indigo-400' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'}`} />
          </div>
        </div>

        {/* Dynamic Class Authorization Status Notice */}
        {!isCourseAssignedToMe ? (
          <div className="mt-3.5 p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium bg-amber-500/10 border-amber-500/25 text-amber-300 animate-fade-in">
            <IoLockClosedOutline className="text-base shrink-0 text-amber-400" />
            <span>
              <strong>Read-Only Mode:</strong> This class is assigned to <strong>{currentSubjectObj?.instructor || 'another faculty member'}</strong>. Only the assigned instructor is authorized to record or alter student attendance for this course.
            </span>
          </div>
        ) : (
          <div className="mt-3.5 p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium bg-emerald-500/10 border-emerald-500/25 text-emerald-400 animate-fade-in">
            <IoCheckmarkCircle className="text-sm shrink-0" />
            <span>
              <strong>Teaching Session Active:</strong> You are authorized to mark roll-call, edit records, and submit verified attendance for this course.
            </span>
          </div>
        )}

        {/* Toast notifications */}
        <AnimatePresence>
          {importSuccessNotice && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mt-4 p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IoCheckmarkCircle className="text-base text-indigo-400" />
                <span>{importSuccessNotice}</span>
              </div>
              <button type="button" onClick={() => setImportSuccessNotice(null)} className="cursor-pointer"><IoCloseOutline className="text-lg" /></button>
            </motion.div>
          )}
          {saveSuccessNotice && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
              <IoCheckmarkCircle className="text-base" />
              <span>Session for {selectedCourse.split(' ')[0]} on {sessionDate} saved to records!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Live Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className={`p-4 rounded-xl border text-center ${isDark ? 'glass-panel text-white' : 'bg-white border-slate-200 shadow-sm'}`}>
          <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Students</span>
          <span className="text-2xl font-extrabold">{totalCount}</span>
        </div>
        <div className={`p-4 rounded-xl border text-center ${isDark ? 'glass-panel text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm'}`}>
          <span className="text-[10px] uppercase font-bold tracking-wider block">Present</span>
          <span className="text-2xl font-extrabold">{presentCount}</span>
          <span className="text-[10px] block opacity-80">({attendanceRate.toFixed(0)}%)</span>
        </div>
        <div className={`p-4 rounded-xl border text-center ${isDark ? 'glass-panel text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'}`}>
          <span className="text-[10px] uppercase font-bold tracking-wider block">Absent</span>
          <span className="text-2xl font-extrabold">{absentCount}</span>
        </div>
        <div className={`p-4 rounded-xl border text-center ${isDark ? 'glass-panel text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600 shadow-sm'}`}>
          <span className="text-[10px] uppercase font-bold tracking-wider block">Late</span>
          <span className="text-2xl font-extrabold">{lateCount}</span>
        </div>
        <div className={`p-4 rounded-xl border text-center col-span-2 sm:col-span-1 ${isDark ? 'glass-panel text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600 shadow-sm'}`}>
          <span className="text-[10px] uppercase font-bold tracking-wider block">Excused</span>
          <span className="text-2xl font-extrabold">{excusedCount}</span>
        </div>
      </div>

      {/* 3. Search, Filter & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input type="text" placeholder="Search student name or roll number..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full h-10 pl-10 pr-4 rounded-xl text-xs border focus:outline-none transition-colors ${isDark ? 'glass-input text-white' : 'bg-white border-slate-300 text-slate-900 shadow-sm'}`} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* FIX #16: Filter tab bar now respects light mode */}
          <div className={`flex items-center rounded-xl p-1 border text-xs ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
            {(['all', 'present', 'absent', 'late'] as const).map((st) => (
              <button key={st} type="button" onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                  statusFilter === st
                    ? isDark ? 'bg-white/20 text-white font-bold' : 'bg-white text-slate-900 font-bold shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}>
                {st}
              </button>
            ))}
          </div>
          <button type="button"
            disabled={!isCourseAssignedToMe}
            onClick={() => isCourseAssignedToMe && onBulkUpdate('present')}
            title={!isCourseAssignedToMe ? "Cannot modify records: class not assigned to you" : "Mark all students present"}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              !isCourseAssignedToMe
                ? 'opacity-40 cursor-not-allowed border-white/5 text-slate-500'
                : isDark
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300 cursor-pointer'
                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 cursor-pointer'
            }`}>
            Mark All Present
          </button>
          <button type="button"
            disabled={!isCourseAssignedToMe}
            onClick={() => isCourseAssignedToMe && onBulkUpdate('absent')}
            title={!isCourseAssignedToMe ? "Cannot modify records: class not assigned to you" : "Mark all students absent"}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              !isCourseAssignedToMe
                ? 'opacity-40 cursor-not-allowed border-white/5 text-slate-500'
                : isDark
                ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-300 cursor-pointer'
                : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 cursor-pointer'
            }`}>
            Mark All Absent
          </button>
        </div>
      </div>

      {/* 4. Student Roll Call Table */}
      <div className={`relative rounded-2xl border overflow-hidden transition-all ${isDark ? 'glass-panel text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b text-[10px] uppercase font-bold tracking-wider ${isDark ? 'bg-white/[0.03] border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-3">Roll Number</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-center">Toggle Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No students match the selected filter. Use <strong>Import CSV</strong> or <strong>Add Student</strong> above to enroll students.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${student.avatarColor} flex items-center justify-center font-bold text-white text-[11px] shadow-sm`}>
                          {student.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <span className="font-semibold block">{student.name}</span>
                          <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{student.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] font-medium">{student.rollNo}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        student.status === 'present'  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : student.status === 'absent' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        : student.status === 'late'   ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-black/25 border border-white/10">
                        {(['present', 'absent', 'late', 'excused'] as const).map((s) => (
                          <button key={s} type="button"
                            disabled={!isCourseAssignedToMe}
                            onClick={() => isCourseAssignedToMe && onUpdateStatus(student.id, s)}
                            title={!isCourseAssignedToMe ? `Tampering restricted — Taught by ${currentSubjectObj?.instructor}` : `Mark ${s.charAt(0).toUpperCase() + s.slice(1)}`}
                            className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                              !isCourseAssignedToMe
                                ? 'opacity-25 cursor-not-allowed text-slate-500'
                                : student.status === s
                                ? s === 'present'  ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/30 scale-105 cursor-pointer'
                                : s === 'absent'   ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105 cursor-pointer'
                                : s === 'late'     ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/30 scale-105 cursor-pointer'
                                : 'bg-sky-500 text-neutral-950 shadow-md shadow-sky-500/30 scale-105 cursor-pointer'
                                : s === 'present'  ? 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer'
                                : s === 'absent'   ? 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer'
                                : s === 'late'     ? 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 cursor-pointer'
                                : 'text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 cursor-pointer'
                            }`}>
                            {s[0].toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add Student Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl border z-10 ${isDark ? 'bg-[#0f131c] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <h3 className="text-lg font-bold mb-1">Add Student to Roster</h3>
              <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Enroll a new student into the active lecture session.</p>
              <form onSubmit={handleAddSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider mb-1">Student Full Name</label>
                  <input type="text" required placeholder="e.g. Vikram Malhotra" value={newName} onChange={(e) => setNewName(e.target.value)}
                    className={`w-full h-10 px-3 rounded-xl text-xs border focus:outline-none ${isDark ? 'glass-input text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider mb-1">Roll Number</label>
                  <input type="text" required placeholder="e.g. 2026-CS-0520" value={newRollNo} onChange={(e) => setNewRollNo(e.target.value)}
                    className={`w-full h-10 px-3 rounded-xl text-xs border focus:outline-none ${isDark ? 'glass-input text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider mb-1">Email (Optional)</label>
                  <input type="email" placeholder="e.g. student@school.edu" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                    className={`w-full h-10 px-3 rounded-xl text-xs border focus:outline-none ${isDark ? 'glass-input text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`} />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border ${isDark ? 'border-white/10 hover:bg-white/10 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'}`}>
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-neutral-100 text-neutral-950 shadow-md">
                    Enroll Student
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Import CSV & Paste Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative w-full max-w-xl rounded-2xl p-6 shadow-2xl border z-10 max-h-[90vh] flex flex-col ${
                isDark ? 'bg-[#0f131c] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      Bulk Enrollment
                    </span>
                    <h3 className="text-lg font-bold">Import Student Roster</h3>
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Paste CSV / Excel spreadsheet rows or upload a file. Enrolled students can immediately sign in to the Student Portal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <IoCloseOutline className="text-xl" />
                </button>
              </div>

              {/* Target Type Selector */}
              <div className="flex items-center justify-between gap-3 mt-4 p-2 rounded-xl border border-white/10 bg-white/[0.03]">
                <span className="text-xs font-semibold px-2">Data Type:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setImportTarget('students')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      importTarget === 'students'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🎓 Students Roster (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportTarget('subjects')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      importTarget === 'subjects'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📚 Course Curriculum
                  </button>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center gap-4 mt-3 border-b border-white/[0.08] pb-2 text-xs">
                <button
                  type="button"
                  onClick={() => setImportTab('paste')}
                  className={`pb-1 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    importTab === 'paste'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <IoClipboardOutline className="text-sm" />
                  <span>Paste CSV / Table Data</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportTab('file')}
                  className={`pb-1 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                    importTab === 'file'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <IoCloudUploadOutline className="text-sm" />
                  <span>Upload .CSV File</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="mt-3 flex-1 flex flex-col space-y-3 overflow-y-auto">
                {importTab === 'paste' ? (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <label className="text-[11px] font-semibold text-slate-400">
                        {importTarget === 'students' ? 'Paste rows (Roll No, Name, Email, Status):' : 'Paste rows (Code, Name, Instructor, Room, Credits):'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setPastedCSV(importTarget === 'students' ? sampleStudentsCSV : sampleSubjectsCSV)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline flex items-center gap-1 cursor-pointer"
                      >
                        <IoSparklesOutline />
                        <span>Insert 20 Sample Rows</span>
                      </button>
                    </div>
                    <textarea
                      rows={8}
                      value={pastedCSV}
                      onChange={(e) => setPastedCSV(e.target.value)}
                      placeholder={
                        importTarget === 'students'
                          ? `Roll No, Student Name, Email, Status\n2026-CS-0101, Aarav Sharma, aarav.sharma@school.edu, present\n2026-CS-0102, Diya Patel, diya.patel@school.edu, present`
                          : `Code, Course Name, Instructor, Room, Credits\nCS101, Intro to CS, Prof. Alan Turing, Hall A, 4`
                      }
                      className={`w-full p-3 font-mono text-xs rounded-xl border focus:outline-none resize-none ${
                        isDark ? 'bg-black/40 border-white/10 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed rounded-xl border-white/15 text-center flex flex-col items-center justify-center gap-2">
                    <IoCloudUploadOutline className="text-4xl text-indigo-400 opacity-80" />
                    <p className="text-xs font-semibold">Select your .csv file from your computer</p>
                    <p className="text-[11px] text-slate-400">Supports standard comma-separated student roster or course curriculum files.</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer transition-all"
                    >
                      Browse CSV File
                    </button>
                  </div>
                )}

                {/* Live Detection Summary */}
                {importTarget === 'students' && detectedStudentCount > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs flex items-center gap-2 font-medium animate-fade-in">
                    <IoCheckmarkSharp className="text-base shrink-0" />
                    <span>
                      Detected <strong>{detectedStudentCount}</strong> student records ready to enroll. Accounts will be auto-generated with password <strong>student123</strong>.
                    </span>
                  </div>
                )}

                {importTarget === 'subjects' && detectedSubjectCount > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs flex items-center gap-2 font-medium animate-fade-in">
                    <IoCheckmarkSharp className="text-base shrink-0" />
                    <span>
                      Detected <strong>{detectedSubjectCount}</strong> course subjects ready to sync into curriculum.
                    </span>
                  </div>
                )}

                {importError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2 font-medium">
                    <IoAlertCircleOutline className="text-base shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/[0.08] mt-3">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                    isDark ? 'border-white/10 hover:bg-white/10 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importTarget === 'students' ? detectedStudentCount === 0 : detectedSubjectCount === 0}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-neutral-100 text-neutral-950 shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {importTarget === 'students'
                    ? `Confirm & Enroll ${detectedStudentCount > 0 ? `${detectedStudentCount} Students` : ''}`
                    : `Confirm & Import ${detectedSubjectCount > 0 ? `${detectedSubjectCount} Subjects` : ''}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
