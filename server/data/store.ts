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
  target?: {
    scope: 'all' | 'selected';
    studentIds?: string[];
    studentNames?: string[];
    studentEmails?: string[];
    studentRollNos?: string[];
  };
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
  ],
  subjects: [],
  students: [],
  timetable: [],
  sessions: [],
  notifications: [],
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
  async replaceSubjects(subjects: SubjectItem[])       { this.data.subjects = subjects; this._save(); return subjects; }

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
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newN: NotificationItem = { ...n, id: `notif-${Date.now()}`, time: `Today, ${formattedTime}`, read: false };
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
  async clearNotifications() {
    this.data.notifications = [];
    this._save();
    return true;
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
