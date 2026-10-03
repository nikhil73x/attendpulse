import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

import type {
  UserAccount,
  SubjectItem,
  StudentItem,
  TimetableItem,
  AttendanceSession,
  NotificationItem,
} from './store';

// ─── Initial seed (mirrors file store seed) ──────────────────────────────────
const SEED_USERS: Omit<UserAccount, never>[] = [
  { id: 'usr-1', email: 'nikhil.yadav@student.edu', password: 'student123', role: 'student', name: 'Nikhil Yadav', rollNo: '2026-CS-0455', department: 'Computer Science & Engineering', semester: 'Semester 6', institution: 'Apex Institute of Technology', minAttendanceGoal: 75, designation: 'Student' },
  { id: 'usr-2', email: 'prof.yadav@school.edu',    password: 'teacher123', role: 'teacher', name: 'Prof. Nikhil Yadav', rollNo: 'FAC-CS-108', department: 'Computer Science & Engineering', semester: 'Department Head', institution: 'Apex Institute of Technology', minAttendanceGoal: 75, designation: 'Associate Professor' },
  { id: 'usr-3', email: 'prof.anita@school.edu',    password: 'teacher123', role: 'teacher', name: 'Prof. Anita Roy', rollNo: 'FAC-CS-102', department: 'Computer Science & Engineering', semester: 'Faculty', institution: 'Apex Institute of Technology', minAttendanceGoal: 75, designation: 'Assistant Professor' },
  { id: 'usr-4', email: 'prof.sharma@school.edu',   password: 'teacher123', role: 'teacher', name: 'Dr. Rajesh Sharma', rollNo: 'FAC-CS-101', department: 'Computer Science & Engineering', semester: 'Faculty', institution: 'Apex Institute of Technology', minAttendanceGoal: 75, designation: 'Professor' },
  { id: 'usr-5', email: 'prof.singh@school.edu',    password: 'teacher123', role: 'teacher', name: 'Prof. Vikram Singh', rollNo: 'FAC-CS-103', department: 'Computer Science & Engineering', semester: 'Faculty', institution: 'Apex Institute of Technology', minAttendanceGoal: 75, designation: 'Associate Professor' },
];

const SEED_SUBJECTS: SubjectItem[] = [
  { id: 'sub-1', code: 'CS301', name: 'Computer Networks',              instructor: 'Dr. Rajesh Sharma', instructorEmail: 'prof.sharma@school.edu', room: 'Hall 302',    attended: 28, total: 30, credits: 4 },
  { id: 'sub-2', code: 'CS302', name: 'Database Systems',               instructor: 'Prof. Anita Roy',   instructorEmail: 'prof.anita@school.edu',  room: 'Lab 4',       attended: 21, total: 24, credits: 4 },
  { id: 'sub-3', code: 'CS303', name: 'Operating Systems',              instructor: 'Prof. Vikram Singh', instructorEmail: 'prof.singh@school.edu', room: 'Hall 201',    attended: 22, total: 26, credits: 4 },
  { id: 'sub-4', code: 'CS304', name: 'Design & Analysis of Algorithms',instructor: 'Prof. Nikhil Yadav', instructorEmail: 'prof.yadav@school.edu', room: 'Hall 105',    attended: 25, total: 28, credits: 4 },
  { id: 'sub-5', code: 'CS305', name: 'Artificial Intelligence & ML',   instructor: 'Prof. Nikhil Yadav', instructorEmail: 'prof.yadav@school.edu', room: 'AI Lab 2',    attended: 21, total: 22, credits: 3 },
  { id: 'sub-6', code: 'CS306', name: 'Web & Cloud Architecture',       instructor: 'Prof. Sarah Chen',   instructorEmail: 'sarah.chen@school.edu', room: 'Cloud Studio', attended: 16, total: 20, credits: 3 },
];

const SEED_STUDENTS: StudentItem[] = [
  { id: 'stu-1',  rollNo: '2026-CS-0455', name: 'Nikhil Yadav',    email: 'nikhil.yadav@student.edu', avatarColor: 'from-indigo-500 to-purple-600',  status: 'present', notes: 'Regular attendee' },
  { id: 'stu-2',  rollNo: '2026-CS-0401', name: 'Aarav Patel',     email: 'aarav.patel@school.edu',   avatarColor: 'from-blue-500 to-cyan-500',      status: 'present' },
  { id: 'stu-3',  rollNo: '2026-CS-0412', name: 'Ananya Sharma',   email: 'ananya.s@school.edu',      avatarColor: 'from-pink-500 to-rose-500',      status: 'present' },
  { id: 'stu-4',  rollNo: '2026-CS-0428', name: 'Rohan Verma',     email: 'rohan.v@school.edu',       avatarColor: 'from-amber-500 to-orange-500',   status: 'late',    notes: 'Arrived 15m late' },
  { id: 'stu-5',  rollNo: '2026-CS-0433', name: 'Priya Nair',      email: 'priya.n@school.edu',       avatarColor: 'from-emerald-500 to-teal-500',   status: 'present' },
  { id: 'stu-6',  rollNo: '2026-CS-0447', name: 'Kabir Mehta',     email: 'kabir.m@school.edu',       avatarColor: 'from-red-500 to-rose-600',       status: 'absent' },
  { id: 'stu-7',  rollNo: '2026-CS-0460', name: 'Sneha Gupta',     email: 'sneha.g@school.edu',       avatarColor: 'from-purple-500 to-indigo-500',  status: 'present' },
  { id: 'stu-8',  rollNo: '2026-CS-0472', name: 'Ishaan Malhotra', email: 'ishaan.m@school.edu',      avatarColor: 'from-sky-500 to-blue-600',       status: 'excused', notes: 'Medical Leave' },
  { id: 'stu-9',  rollNo: '2026-CS-0485', name: 'Riya Sen',        email: 'riya.sen@school.edu',      avatarColor: 'from-fuchsia-500 to-pink-500',   status: 'present' },
  { id: 'stu-10', rollNo: '2026-CS-0491', name: 'Devansh Joshi',   email: 'devansh.j@school.edu',     avatarColor: 'from-cyan-500 to-blue-500',      status: 'present' },
  { id: 'stu-11', rollNo: '2026-CS-0504', name: 'Meera Kulkarni',  email: 'meera.k@school.edu',       avatarColor: 'from-rose-500 to-red-500',       status: 'absent' },
  { id: 'stu-12', rollNo: '2026-CS-0518', name: 'Siddharth Rao',   email: 'sid.rao@school.edu',       avatarColor: 'from-teal-500 to-emerald-500',   status: 'present' },
];

const SEED_TIMETABLE: TimetableItem[] = [
  { id: 'tt-1',  day: 'Monday',    time: '09:30 AM - 10:30 AM', subjectCode: 'CS301', subjectName: 'Computer Networks',             instructor: 'Dr. Rajesh Sharma', room: 'Hall 302',       status: 'completed' },
  { id: 'tt-2',  day: 'Monday',    time: '11:00 AM - 12:30 PM', subjectCode: 'CS302', subjectName: 'Database Systems',              instructor: 'Prof. Anita Roy',   room: 'Lab 4',          status: 'ongoing' },
  { id: 'tt-3',  day: 'Monday',    time: '02:00 PM - 03:30 PM', subjectCode: 'CS303', subjectName: 'Operating Systems',             instructor: 'Prof. Vikram Singh',room: 'Hall 201',       status: 'upcoming' },
  { id: 'tt-4',  day: 'Tuesday',   time: '09:30 AM - 11:00 AM', subjectCode: 'CS304', subjectName: 'Design & Analysis of Algorithms',instructor: 'Prof. Nikhil Yadav',room: 'Hall 105',      status: 'upcoming' },
  { id: 'tt-5',  day: 'Tuesday',   time: '11:30 AM - 01:00 PM', subjectCode: 'CS305', subjectName: 'Artificial Intelligence & ML', instructor: 'Prof. Nikhil Yadav',room: 'AI Lab 2',       status: 'upcoming' },
  { id: 'tt-6',  day: 'Wednesday', time: '10:00 AM - 11:30 AM', subjectCode: 'CS306', subjectName: 'Web & Cloud Architecture',     instructor: 'Prof. Sarah Chen',  room: 'Cloud Studio',   status: 'upcoming' },
  { id: 'tt-7',  day: 'Wednesday', time: '01:30 PM - 03:00 PM', subjectCode: 'CS301', subjectName: 'Computer Networks Lab',        instructor: 'Dr. Rajesh Sharma', room: 'Network Lab 1',  status: 'upcoming' },
  { id: 'tt-8',  day: 'Thursday',  time: '09:30 AM - 11:00 AM', subjectCode: 'CS302', subjectName: 'Advanced Databases Lab',       instructor: 'Prof. Anita Roy',   room: 'Lab 4',          status: 'upcoming' },
  { id: 'tt-9',  day: 'Thursday',  time: '11:30 AM - 01:00 PM', subjectCode: 'CS303', subjectName: 'Systems Architecture',        instructor: 'Prof. Vikram Singh',room: 'Hall 201',       status: 'upcoming' },
  { id: 'tt-10', day: 'Friday',    time: '10:00 AM - 12:00 PM', subjectCode: 'CS305', subjectName: 'AI Capstone & Seminar',       instructor: 'Prof. Nikhil Yadav',room: 'Auditorium 1',   status: 'upcoming' },
];

const SEED_NOTIFICATIONS: NotificationItem[] = [
  { id: 'notif-1', title: 'Monthly Roll-Call Audit Notice', message: 'Monthly attendance reports for Semester 6 are now consolidated. Students under 75% threshold must meet their academic advisors before Friday.', time: '10 mins ago', type: 'alert', read: false, sender: { name: 'Dr. Rajesh Sharma', role: 'teacher', email: 'prof.sharma@school.edu' }, target: { scope: 'all' } },
  { id: 'notif-2', title: 'Lab Session Rescheduled', message: 'Database Systems (CS302) Thursday Lab is shifted from Lab 4 to Systems Cloud Studio due to scheduled network maintenance.', time: '2 hours ago', type: 'info', read: false, sender: { name: 'Prof. Anita Roy', role: 'teacher', email: 'prof.anita@school.edu' }, target: { scope: 'all' } },
  { id: 'notif-3', title: 'Attendance Goal Achieved', message: 'Congratulations! Your overall cumulative attendance reached 84.6%, safely meeting your 75% minimum semester requirement.', time: '1 day ago', type: 'success', read: true, sender: { name: 'AttendPulse Academic Engine', role: 'system' }, target: { scope: 'all' } },
];

// ─── DDL ─────────────────────────────────────────────────────────────────────
const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS ap_users (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL,
  name        TEXT NOT NULL,
  roll_no     TEXT,
  department  TEXT,
  semester    TEXT,
  institution TEXT,
  min_attendance_goal INTEGER DEFAULT 75,
  designation TEXT
);

CREATE TABLE IF NOT EXISTS ap_subjects (
  id               TEXT PRIMARY KEY,
  code             TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  instructor       TEXT,
  instructor_email TEXT,
  room             TEXT,
  attended         INTEGER DEFAULT 0,
  total            INTEGER DEFAULT 0,
  credits          INTEGER DEFAULT 3
);

CREATE TABLE IF NOT EXISTS ap_students (
  id           TEXT PRIMARY KEY,
  roll_no      TEXT,
  name         TEXT NOT NULL,
  email        TEXT,
  avatar_color TEXT,
  status       TEXT DEFAULT 'present',
  notes        TEXT,
  sort_order   SERIAL
);

CREATE TABLE IF NOT EXISTS ap_timetable (
  id           TEXT PRIMARY KEY,
  day          TEXT NOT NULL,
  time         TEXT NOT NULL,
  subject_code TEXT,
  subject_name TEXT,
  instructor   TEXT,
  room         TEXT,
  status       TEXT DEFAULT 'upcoming',
  sort_order   SERIAL
);

CREATE TABLE IF NOT EXISTS ap_sessions (
  id              TEXT PRIMARY KEY,
  date            TEXT,
  timestamp       BIGINT,
  subject_code    TEXT,
  subject_name    TEXT,
  instructor      TEXT,
  marked_by       TEXT,
  marked_by_email TEXT,
  records         JSONB,
  summary         JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ap_notifications (
  id          TEXT PRIMARY KEY,
  title       TEXT,
  message     TEXT,
  time        TEXT,
  type        TEXT,
  read        BOOLEAN DEFAULT false,
  sender      JSONB,
  target      JSONB,
  attachments JSONB,
  links       JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
`;

// ─── Row → domain object mappers ─────────────────────────────────────────────
function rowToUser(r: any): UserAccount {
  return {
    id: r.id, email: r.email, password: r.password, role: r.role,
    name: r.name, rollNo: r.roll_no, department: r.department,
    semester: r.semester, institution: r.institution,
    minAttendanceGoal: r.min_attendance_goal, designation: r.designation,
  };
}

function rowToSubject(r: any): SubjectItem {
  return {
    id: r.id, code: r.code, name: r.name, instructor: r.instructor,
    instructorEmail: r.instructor_email, room: r.room,
    attended: r.attended, total: r.total, credits: r.credits,
  };
}

function rowToStudent(r: any): StudentItem {
  return {
    id: r.id, rollNo: r.roll_no, name: r.name, email: r.email,
    avatarColor: r.avatar_color, status: r.status, notes: r.notes,
  };
}

function rowToTimetable(r: any): TimetableItem {
  return {
    id: r.id, day: r.day, time: r.time, subjectCode: r.subject_code,
    subjectName: r.subject_name, instructor: r.instructor, room: r.room,
    status: r.status,
  };
}

function rowToSession(r: any): AttendanceSession {
  return {
    id: r.id, date: r.date, timestamp: Number(r.timestamp),
    subjectCode: r.subject_code, subjectName: r.subject_name,
    instructor: r.instructor, markedBy: r.marked_by,
    markedByEmail: r.marked_by_email,
    records: r.records, summary: r.summary,
  };
}

function rowToNotification(r: any): NotificationItem {
  return {
    id: r.id, title: r.title, message: r.message, time: r.time,
    type: r.type, read: r.read, sender: r.sender, target: r.target,
    attachments: r.attachments, links: r.links,
  };
}

// ─── PostgresStore ────────────────────────────────────────────────────────────
export class PostgresStore {
  private pool: Pool;
  private ready: Promise<void>;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    this.ready = this._init();
  }

  private async _init(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Create all tables
      await client.query(CREATE_TABLES_SQL);

      // Seed users if empty
      const { rows: uRows } = await client.query('SELECT COUNT(*) AS c FROM ap_users');
      if (parseInt(uRows[0].c, 10) === 0) {
        for (const u of SEED_USERS) {
          await client.query(
            `INSERT INTO ap_users (id,email,password,role,name,roll_no,department,semester,institution,min_attendance_goal,designation)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
            [u.id, u.email, u.password, u.role, u.name, u.rollNo, u.department, u.semester, u.institution, u.minAttendanceGoal, u.designation]
          );
        }
      }

      console.log('✅ PostgreSQL store initialized');
    } finally {
      client.release();
    }
  }

  private async q<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    await this.ready;
    const { rows } = await this.pool.query(sql, params);
    return rows as T[];
  }

  public getEngineType(): string {
    return `PostgreSQL (${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] ?? 'cloud'})`;
  }
  public getStoragePath(): string { return 'PostgreSQL cloud database'; }

  // ── Users ──────────────────────────────────────────────────────────────────
  async getUsers(): Promise<UserAccount[]> {
    const rows = await this.q('SELECT * FROM ap_users');
    return rows.map(rowToUser);
  }

  async getUserByEmail(email: string): Promise<UserAccount | undefined> {
    const rows = await this.q('SELECT * FROM ap_users WHERE LOWER(email)=LOWER($1) LIMIT 1', [email]);
    return rows[0] ? rowToUser(rows[0]) : undefined;
  }

  async addUser(user: UserAccount): Promise<UserAccount> {
    await this.q(
      `INSERT INTO ap_users (id,email,password,role,name,roll_no,department,semester,institution,min_attendance_goal,designation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (email) DO NOTHING`,
      [user.id, user.email, user.password, user.role, user.name, user.rollNo,
       user.department, user.semester, user.institution, user.minAttendanceGoal, user.designation]
    );
    return user;
  }

  async updateUserProfile(email: string, partial: Partial<UserAccount>): Promise<UserAccount | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    const map: Record<string, string> = {
      name: 'name', rollNo: 'roll_no', department: 'department',
      semester: 'semester', institution: 'institution',
      minAttendanceGoal: 'min_attendance_goal', designation: 'designation',
    };
    for (const [key, col] of Object.entries(map)) {
      if (partial[key as keyof UserAccount] !== undefined) {
        fields.push(`${col}=$${i++}`);
        values.push(partial[key as keyof UserAccount]);
      }
    }
    if (fields.length === 0) return (await this.getUserByEmail(email)) ?? null;
    values.push(email);
    await this.q(`UPDATE ap_users SET ${fields.join(',')} WHERE LOWER(email)=LOWER($${i})`, values);
    return (await this.getUserByEmail(email)) ?? null;
  }

  // ── Subjects ───────────────────────────────────────────────────────────────
  async getSubjects(): Promise<SubjectItem[]> {
    const rows = await this.q('SELECT * FROM ap_subjects ORDER BY code');
    return rows.map(rowToSubject);
  }

  async getSubjectByCode(code: string): Promise<SubjectItem | undefined> {
    const rows = await this.q('SELECT * FROM ap_subjects WHERE LOWER(code)=LOWER($1) LIMIT 1', [code]);
    return rows[0] ? rowToSubject(rows[0]) : undefined;
  }

  async addSubject(subject: Omit<SubjectItem, 'id'>): Promise<SubjectItem> {
    const id = `sub-${Date.now()}`;
    await this.q(
      `INSERT INTO ap_subjects (id,code,name,instructor,instructor_email,room,attended,total,credits)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, subject.code, subject.name, subject.instructor, subject.instructorEmail,
       subject.room, subject.attended, subject.total, subject.credits]
    );
    return { id, ...subject };
  }

  async updateSubject(id: string, partial: Partial<SubjectItem>): Promise<SubjectItem | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    const map: Record<string, string> = {
      code: 'code', name: 'name', instructor: 'instructor',
      instructorEmail: 'instructor_email', room: 'room',
      attended: 'attended', total: 'total', credits: 'credits',
    };
    for (const [key, col] of Object.entries(map)) {
      if (partial[key as keyof SubjectItem] !== undefined) {
        fields.push(`${col}=$${i++}`);
        values.push(partial[key as keyof SubjectItem]);
      }
    }
    if (fields.length === 0) {
      const rows = await this.q('SELECT * FROM ap_subjects WHERE id=$1', [id]);
      return rows[0] ? rowToSubject(rows[0]) : null;
    }
    values.push(id);
    await this.q(`UPDATE ap_subjects SET ${fields.join(',')} WHERE id=$${i}`, values);
    const rows = await this.q('SELECT * FROM ap_subjects WHERE id=$1', [id]);
    return rows[0] ? rowToSubject(rows[0]) : null;
  }

  // ── Students ───────────────────────────────────────────────────────────────
  async getStudents(): Promise<StudentItem[]> {
    const rows = await this.q('SELECT * FROM ap_students ORDER BY sort_order ASC');
    return rows.map(rowToStudent);
  }

  async getStudentById(id: string): Promise<StudentItem | undefined> {
    const rows = await this.q('SELECT * FROM ap_students WHERE id=$1 LIMIT 1', [id]);
    return rows[0] ? rowToStudent(rows[0]) : undefined;
  }

  async addStudent(student: Omit<StudentItem, 'id'>): Promise<StudentItem> {
    const id = `stu-${Date.now()}`;
    await this.q(
      `INSERT INTO ap_students (id,roll_no,name,email,avatar_color,status,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, student.rollNo, student.name, student.email,
       student.avatarColor, student.status, student.notes || null]
    );
    return { id, ...student };
  }

  async updateStudent(id: string, partial: Partial<StudentItem>): Promise<StudentItem | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    const map: Record<string, string> = {
      rollNo: 'roll_no', name: 'name', email: 'email',
      avatarColor: 'avatar_color', status: 'status', notes: 'notes',
    };
    for (const [key, col] of Object.entries(map)) {
      if (partial[key as keyof StudentItem] !== undefined) {
        fields.push(`${col}=$${i++}`);
        values.push(partial[key as keyof StudentItem]);
      }
    }
    if (fields.length === 0) return (await this.getStudentById(id)) ?? null;
    values.push(id);
    await this.q(`UPDATE ap_students SET ${fields.join(',')} WHERE id=$${i}`, values);
    return (await this.getStudentById(id)) ?? null;
  }

  async bulkUpdateStudentStatus(status: StudentItem['status']): Promise<StudentItem[]> {
    await this.q('UPDATE ap_students SET status=$1', [status]);
    return this.getStudents();
  }

  async replaceStudents(students: StudentItem[]): Promise<StudentItem[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM ap_students');
      for (const s of students) {
        await client.query(
          `INSERT INTO ap_students (id,roll_no,name,email,avatar_color,status,notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [s.id, s.rollNo, s.name, s.email, s.avatarColor, s.status, s.notes || null]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return this.getStudents();
  }

  // ── Timetable ──────────────────────────────────────────────────────────────
  async getTimetable(): Promise<TimetableItem[]> {
    const rows = await this.q('SELECT * FROM ap_timetable ORDER BY sort_order ASC');
    return rows.map(rowToTimetable);
  }

  async addTimetableSlot(slot: Omit<TimetableItem, 'id'>): Promise<TimetableItem> {
    const id = `tt-${Date.now()}`;
    await this.q(
      `INSERT INTO ap_timetable (id,day,time,subject_code,subject_name,instructor,room,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, slot.day, slot.time, slot.subjectCode, slot.subjectName, slot.instructor, slot.room, slot.status]
    );
    return { id, ...slot };
  }

  async updateTimetableSlot(id: string, partial: Partial<TimetableItem>): Promise<TimetableItem | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    const map: Record<string, string> = {
      day: 'day', time: 'time', subjectCode: 'subject_code',
      subjectName: 'subject_name', instructor: 'instructor',
      room: 'room', status: 'status',
    };
    for (const [key, col] of Object.entries(map)) {
      if (partial[key as keyof TimetableItem] !== undefined) {
        fields.push(`${col}=$${i++}`);
        values.push(partial[key as keyof TimetableItem]);
      }
    }
    if (fields.length === 0) {
      const rows = await this.q('SELECT * FROM ap_timetable WHERE id=$1', [id]);
      return rows[0] ? rowToTimetable(rows[0]) : null;
    }
    values.push(id);
    await this.q(`UPDATE ap_timetable SET ${fields.join(',')} WHERE id=$${i}`, values);
    const rows = await this.q('SELECT * FROM ap_timetable WHERE id=$1', [id]);
    return rows[0] ? rowToTimetable(rows[0]) : null;
  }

  async deleteTimetableSlot(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM ap_timetable WHERE id=$1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async replaceTimetable(timetable: TimetableItem[]): Promise<TimetableItem[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM ap_timetable');
      for (const tt of timetable) {
        await client.query(
          `INSERT INTO ap_timetable (id,day,time,subject_code,subject_name,instructor,room,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [tt.id, tt.day, tt.time, tt.subjectCode, tt.subjectName, tt.instructor, tt.room, tt.status]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return this.getTimetable();
  }

  // ── Sessions ───────────────────────────────────────────────────────────────
  async getSessions(): Promise<AttendanceSession[]> {
    const rows = await this.q('SELECT * FROM ap_sessions ORDER BY created_at DESC');
    return rows.map(rowToSession);
  }

  async addSession(session: Omit<AttendanceSession, 'id' | 'timestamp'>): Promise<AttendanceSession> {
    const id = `ses-${Date.now()}`;
    const timestamp = Date.now();

    // Auto-increment subject attendance
    await this.q(
      `UPDATE ap_subjects
       SET total = total + 1,
           attended = attended + CASE WHEN $1 >= 50 THEN 1 ELSE 0 END
       WHERE LOWER(code)=LOWER($2)`,
      [session.summary.percentage, session.subjectCode]
    );

    await this.q(
      `INSERT INTO ap_sessions (id,date,timestamp,subject_code,subject_name,instructor,marked_by,marked_by_email,records,summary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, session.date, timestamp, session.subjectCode, session.subjectName,
       session.instructor, session.markedBy, session.markedByEmail,
       JSON.stringify(session.records), JSON.stringify(session.summary)]
    );

    return { id, timestamp, ...session };
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  async getNotifications(): Promise<NotificationItem[]> {
    const rows = await this.q('SELECT * FROM ap_notifications ORDER BY created_at DESC');
    return rows.map(rowToNotification);
  }

  async addNotification(notification: Omit<NotificationItem, 'id' | 'time' | 'read'>): Promise<NotificationItem> {
    const id = `notif-${Date.now()}`;
    const time = 'Just now';
    await this.q(
      `INSERT INTO ap_notifications (id,title,message,time,type,read,sender,target,attachments,links)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, notification.title, notification.message, time,
       notification.type, false,
       JSON.stringify(notification.sender), JSON.stringify(notification.target),
       JSON.stringify(notification.attachments ?? null), JSON.stringify(notification.links ?? null)]
    );
    return { id, time, read: false, ...notification };
  }

  async markNotificationAsRead(id: string): Promise<NotificationItem | null> {
    await this.q('UPDATE ap_notifications SET read=true WHERE id=$1', [id]);
    const rows = await this.q('SELECT * FROM ap_notifications WHERE id=$1', [id]);
    return rows[0] ? rowToNotification(rows[0]) : null;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM ap_notifications WHERE id=$1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
