import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Shared type definitions (used by all stores) ─────────────────────────────

export interface UserAccount {
  id: string;
  email: string;
  password: string;
  role: 'student' | 'teacher';
  name: string;
  rollNo: string;
  department: string;
  semester: string;
  institution: string;
  minAttendanceGoal: number;
  designation: string;
}

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  instructor: string;
  instructorEmail?: string;
  room: string;
  attended: number;
  total: number;
  credits: number;
}

export interface StudentItem {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  avatarColor: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface TimetableItem {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  time: string;
  subjectCode: string;
  subjectName: string;
  instructor: string;
  room: string;
  status?: 'completed' | 'ongoing' | 'upcoming';
}

export interface AttendanceRecord {
  studentId: string;
  rollNo: string;
  name: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface AttendanceSession {
  id: string;
  date: string;
  timestamp: number;
  subjectCode: string;
  subjectName: string;
  instructor: string;
  markedBy: string;
  markedByEmail: string;
  records: AttendanceRecord[];
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'alert' | 'success' | 'info';
  read: boolean;
  sender?: { name: string; role: 'teacher' | 'system' | 'student'; email?: string };
  target?: { scope: 'all' | 'selected'; studentIds?: string[]; studentNames?: string[] };
  attachments?: Array<{ name: string; size?: string; url: string; type?: string }>;
  links?: Array<{ title: string; url: string }>;
}

export interface DatabaseSchema {
  users: UserAccount[];
  subjects: SubjectItem[];
  students: StudentItem[];
  timetable: TimetableItem[];
  sessions: AttendanceSession[];
  notifications: NotificationItem[];
}

// ─── File-based store (local dev fallback) ────────────────────────────────────

const isVercel       = Boolean(process.env.VERCEL);
const LOCAL_DATA_FILE = path.join(__dirname, 'database.json');
const DATA_FILE = process.env.DATABASE_PATH
  ? process.env.DATABASE_PATH
  : process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'database.json')
  : isVercel
  ? path.join('/tmp', 'database.json')
  : LOCAL_DATA_FILE;

const initialSeed: DatabaseSchema = {
  users: [
    { id: 'usr-1', email: 'nikhil.yadav@student.edu', password: 'student123', role: 'student', name: 'Nikhil Yadav', rollNo: '2026-CS-0455', department: 'Computer Science & Engineering', semester: 'Semester 6', institution: 'Apex Institute of Technology', minAttendanceGoal: 75, designation: 'Student' },
    { id: 'usr-2', email: 'prof.yadav@school.edu', password: 'teacher123', role: 'teacher', name: 'Prof. Nikhil Yadav', rollNo: 'FAC-CS-108', department: 'Computer Science & Engineering', semester: 'Department Head', institution: 'Apex Institute of Technology', minAttendanceGoal: 75, designation: 'Associate Professor' },
    { id: 'usr-3', email: 'prof.anita@school.edu', password: 'teacher123', role: 'teacher', name: 'Prof. Anita Roy', rollNo: 'FAC-CS-102', department: 'Computer Science & Engineering', semester: 'Faculty', institution: 'Apex Institute of Technology', minAttendanceGoal: 75, designation: 'Assistant Professor' },
    { id: 'usr-4', email: 'prof.sharma@school.edu', password: 'teacher123', role: 'teacher', name: 'Dr. Rajesh Sharma', rollNo: 'FAC-CS-101', department: 'Computer Science & Engineering', semester: 'Faculty', institution: 'Apex Institute of Technology', minAttendanceGoal: 75, designation: 'Professor' },
    { id: 'usr-5', email: 'prof.singh@school.edu', password: 'teacher123', role: 'teacher', name: 'Prof. Vikram Singh', rollNo: 'FAC-CS-103', department: 'Computer Science & Engineering', semester: 'Faculty', institution: 'Apex Institute of Technology', minAttendanceGoal: 75, designation: 'Associate Professor' },
  ],
  subjects: [
    { id: 'sub-1', code: 'CS301', name: 'Computer Networks', instructor: 'Dr. Rajesh Sharma', instructorEmail: 'prof.sharma@school.edu', room: 'Hall 302', attended: 28, total: 30, credits: 4 },
    { id: 'sub-2', code: 'CS302', name: 'Database Systems', instructor: 'Prof. Anita Roy', instructorEmail: 'prof.anita@school.edu', room: 'Lab 4', attended: 21, total: 24, credits: 4 },
    { id: 'sub-3', code: 'CS303', name: 'Operating Systems', instructor: 'Prof. Vikram Singh', instructorEmail: 'prof.singh@school.edu', room: 'Hall 201', attended: 22, total: 26, credits: 4 },
    { id: 'sub-4', code: 'CS304', name: 'Design & Analysis of Algorithms', instructor: 'Prof. Nikhil Yadav', instructorEmail: 'prof.yadav@school.edu', room: 'Hall 105', attended: 25, total: 28, credits: 4 },
    { id: 'sub-5', code: 'CS305', name: 'Artificial Intelligence & ML', instructor: 'Prof. Nikhil Yadav', instructorEmail: 'prof.yadav@school.edu', room: 'AI Lab 2', attended: 21, total: 22, credits: 3 },
    { id: 'sub-6', code: 'CS306', name: 'Web & Cloud Architecture', instructor: 'Prof. Sarah Chen', instructorEmail: 'sarah.chen@school.edu', room: 'Cloud Studio', attended: 16, total: 20, credits: 3 },
  ],
  students: [
    { id: 'stu-1',  rollNo: '2026-CS-0455', name: 'Nikhil Yadav',    email: 'nikhil.yadav@student.edu', avatarColor: 'from-indigo-500 to-purple-600', status: 'present', notes: 'Regular attendee' },
    { id: 'stu-2',  rollNo: '2026-CS-0401', name: 'Aarav Patel',     email: 'aarav.patel@school.edu',   avatarColor: 'from-blue-500 to-cyan-500',     status: 'present' },
    { id: 'stu-3',  rollNo: '2026-CS-0412', name: 'Ananya Sharma',   email: 'ananya.s@school.edu',      avatarColor: 'from-pink-500 to-rose-500',     status: 'present' },
    { id: 'stu-4',  rollNo: '2026-CS-0428', name: 'Rohan Verma',     email: 'rohan.v@school.edu',       avatarColor: 'from-amber-500 to-orange-500',  status: 'late', notes: 'Arrived 15m late' },
    { id: 'stu-5',  rollNo: '2026-CS-0433', name: 'Priya Nair',      email: 'priya.n@school.edu',       avatarColor: 'from-emerald-500 to-teal-500',  status: 'present' },
    { id: 'stu-6',  rollNo: '2026-CS-0447', name: 'Kabir Mehta',     email: 'kabir.m@school.edu',       avatarColor: 'from-red-500 to-rose-600',      status: 'absent' },
    { id: 'stu-7',  rollNo: '2026-CS-0460', name: 'Sneha Gupta',     email: 'sneha.g@school.edu',       avatarColor: 'from-purple-500 to-indigo-500', status: 'present' },
    { id: 'stu-8',  rollNo: '2026-CS-0472', name: 'Ishaan Malhotra', email: 'ishaan.m@school.edu',      avatarColor: 'from-sky-500 to-blue-600',      status: 'excused', notes: 'Medical Leave' },
    { id: 'stu-9',  rollNo: '2026-CS-0485', name: 'Riya Sen',        email: 'riya.sen@school.edu',      avatarColor: 'from-fuchsia-500 to-pink-500',  status: 'present' },
    { id: 'stu-10', rollNo: '2026-CS-0491', name: 'Devansh Joshi',   email: 'devansh.j@school.edu',     avatarColor: 'from-cyan-500 to-blue-500',     status: 'present' },
    { id: 'stu-11', rollNo: '2026-CS-0504', name: 'Meera Kulkarni',  email: 'meera.k@school.edu',       avatarColor: 'from-rose-500 to-red-500',      status: 'absent' },
    { id: 'stu-12', rollNo: '2026-CS-0518', name: 'Siddharth Rao',   email: 'sid.rao@school.edu',       avatarColor: 'from-teal-500 to-emerald-500',  status: 'present' },
  ],
  timetable: [
    { id: 'tt-1',  day: 'Monday',    time: '09:30 AM - 10:30 AM', subjectCode: 'CS301', subjectName: 'Computer Networks',              instructor: 'Dr. Rajesh Sharma', room: 'Hall 302',      status: 'completed' },
    { id: 'tt-2',  day: 'Monday',    time: '11:00 AM - 12:30 PM', subjectCode: 'CS302', subjectName: 'Database Systems',               instructor: 'Prof. Anita Roy',   room: 'Lab 4',         status: 'ongoing' },
    { id: 'tt-3',  day: 'Monday',    time: '02:00 PM - 03:30 PM', subjectCode: 'CS303', subjectName: 'Operating Systems',              instructor: 'Prof. Vikram Singh',room: 'Hall 201',      status: 'upcoming' },
    { id: 'tt-4',  day: 'Tuesday',   time: '09:30 AM - 11:00 AM', subjectCode: 'CS304', subjectName: 'Design & Analysis of Algorithms',instructor: 'Prof. Nikhil Yadav',room: 'Hall 105',      status: 'upcoming' },
    { id: 'tt-5',  day: 'Tuesday',   time: '11:30 AM - 01:00 PM', subjectCode: 'CS305', subjectName: 'Artificial Intelligence & ML',  instructor: 'Prof. Nikhil Yadav',room: 'AI Lab 2',      status: 'upcoming' },
    { id: 'tt-6',  day: 'Wednesday', time: '10:00 AM - 11:30 AM', subjectCode: 'CS306', subjectName: 'Web & Cloud Architecture',      instructor: 'Prof. Sarah Chen',  room: 'Cloud Studio',  status: 'upcoming' },
    { id: 'tt-7',  day: 'Wednesday', time: '01:30 PM - 03:00 PM', subjectCode: 'CS301', subjectName: 'Computer Networks Lab',         instructor: 'Dr. Rajesh Sharma', room: 'Network Lab 1', status: 'upcoming' },
    { id: 'tt-8',  day: 'Thursday',  time: '09:30 AM - 11:00 AM', subjectCode: 'CS302', subjectName: 'Advanced Databases Lab',        instructor: 'Prof. Anita Roy',   room: 'Lab 4',         status: 'upcoming' },
    { id: 'tt-9',  day: 'Thursday',  time: '11:30 AM - 01:00 PM', subjectCode: 'CS303', subjectName: 'Systems Architecture',         instructor: 'Prof. Vikram Singh',room: 'Hall 201',      status: 'upcoming' },
    { id: 'tt-10', day: 'Friday',    time: '10:00 AM - 12:00 PM', subjectCode: 'CS305', subjectName: 'AI Capstone & Seminar',        instructor: 'Prof. Nikhil Yadav',room: 'Auditorium 1',  status: 'upcoming' },
  ],
  sessions: [],
  notifications: [
    { id: 'notif-1', title: 'Monthly Roll-Call Audit Notice', message: 'Monthly attendance reports for Semester 6 are now consolidated. Students under 75% threshold must meet their academic advisors before Friday.', time: '10 mins ago', type: 'alert', read: false, sender: { name: 'Dr. Rajesh Sharma', role: 'teacher', email: 'prof.sharma@school.edu' }, target: { scope: 'all' } },
    { id: 'notif-2', title: 'Lab Session Rescheduled', message: 'Database Systems (CS302) Thursday Lab is shifted from Lab 4 to Systems Cloud Studio due to scheduled network maintenance.', time: '2 hours ago', type: 'info', read: false, sender: { name: 'Prof. Anita Roy', role: 'teacher', email: 'prof.anita@school.edu' }, target: { scope: 'all' } },
    { id: 'notif-3', title: 'Attendance Goal Achieved', message: 'Congratulations! Your overall cumulative attendance reached 84.6%, safely meeting your 75% minimum semester requirement.', time: '1 day ago', type: 'success', read: true, sender: { name: 'AttendPulse Academic Engine', role: 'system' }, target: { scope: 'all' } },
  ],
};

// ─── Async File Store (local dev) ─────────────────────────────────────────────
class FileStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this._load();
  }

  private _load(): DatabaseSchema {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return { ...initialSeed, ...JSON.parse(raw) };
      }
    } catch { /* use seed */ }
    this._save(initialSeed);
    return { ...initialSeed };
  }

  private _save(d?: DatabaseSchema) {
    try {
      const payload = d || this.data;
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tmp = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tmp, DATA_FILE);
    } catch (err) { console.error('File store write failed:', err); }
  }

  getEngineType()  { return `Atomic File Store (${path.basename(DATA_FILE)})`; }
  getStoragePath() { return DATA_FILE; }

  // Users
  async getUsers()                                     { return this.data.users; }
  async getUserByEmail(email: string)                  { return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
  async addUser(user: UserAccount)                     { this.data.users.push(user); this._save(); return user; }
  async updateUserProfile(email: string, p: Partial<UserAccount>) {
    const u = this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!u) return null;
    Object.assign(u, p); this._save(); return u;
  }

  // Subjects
  async getSubjects()                                  { return this.data.subjects; }
  async getSubjectByCode(code: string)                 { return this.data.subjects.find(s => s.code.toLowerCase() === code.toLowerCase()); }
  async addSubject(s: Omit<SubjectItem, 'id'>)         { const n = { ...s, id: `sub-${Date.now()}` }; this.data.subjects.push(n); this._save(); return n; }
  async updateSubject(id: string, p: Partial<SubjectItem>) {
    const s = this.data.subjects.find(s => s.id === id);
    if (!s) return null;
    Object.assign(s, p); this._save(); return s;
  }

  // Students
  async getStudents()                                  { return this.data.students; }
  async getStudentById(id: string)                     { return this.data.students.find(s => s.id === id); }
  async addStudent(s: Omit<StudentItem, 'id'>)         { const n = { ...s, id: `stu-${Date.now()}` }; this.data.students.unshift(n); this._save(); return n; }
  async updateStudent(id: string, p: Partial<StudentItem>) {
    const s = this.data.students.find(s => s.id === id);
    if (!s) return null;
    Object.assign(s, p); this._save(); return s;
  }
  async bulkUpdateStudentStatus(status: StudentItem['status']) {
    this.data.students.forEach(s => { s.status = status; }); this._save(); return this.data.students;
  }
  async replaceStudents(students: StudentItem[])       { this.data.students = students; this._save(); return students; }

  // Timetable
  async getTimetable()                                 { return this.data.timetable; }
  async addTimetableSlot(s: Omit<TimetableItem, 'id'>) { const n = { ...s, id: `tt-${Date.now()}` }; this.data.timetable.push(n as TimetableItem); this._save(); return n as TimetableItem; }
  async updateTimetableSlot(id: string, p: Partial<TimetableItem>) {
    const s = this.data.timetable.find(s => s.id === id);
    if (!s) return null;
    Object.assign(s, p); this._save(); return s;
  }
  async deleteTimetableSlot(id: string) {
    const idx = this.data.timetable.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.data.timetable.splice(idx, 1); this._save(); return true;
  }
  async replaceTimetable(timetable: TimetableItem[])   { this.data.timetable = timetable; this._save(); return timetable; }

  // Sessions
  async getSessions()                                  { return this.data.sessions; }
  async addSession(session: Omit<AttendanceSession, 'id' | 'timestamp'>) {
    const n: AttendanceSession = { ...session, id: `ses-${Date.now()}`, timestamp: Date.now() };
    this.data.sessions.unshift(n);
    const sub = this.data.subjects.find(s => s.code.toLowerCase() === session.subjectCode.toLowerCase());
    if (sub) { sub.total += 1; if (session.summary.percentage >= 50) sub.attended += 1; }
    this._save(); return n;
  }

  // Notifications
  async getNotifications()                             { return this.data.notifications; }
  async addNotification(n: Omit<NotificationItem, 'id' | 'time' | 'read'>) {
    const newN: NotificationItem = { ...n, id: `notif-${Date.now()}`, time: 'Just now', read: false };
    this.data.notifications.unshift(newN); this._save(); return newN;
  }
  async markNotificationAsRead(id: string) {
    const n = this.data.notifications.find(n => n.id === id);
    if (!n) return null;
    n.read = true; this._save(); return n;
  }
  async deleteNotification(id: string) {
    const idx = this.data.notifications.findIndex(n => n.id === id);
    if (idx === -1) return false;
    this.data.notifications.splice(idx, 1); this._save(); return true;
  }
}

// ─── Export: pick the right store automatically ───────────────────────────────
import { PostgresStore } from './pg-store.js';

type AnyStore = FileStore | PostgresStore;

function createStore(): AnyStore {
  if (process.env.DATABASE_URL) {
    console.log('🐘 Using PostgreSQL store');
    return new PostgresStore();
  }
  console.log('📁 Using File store (local dev)');
  return new FileStore();
}

export const db: AnyStore = createStore();
