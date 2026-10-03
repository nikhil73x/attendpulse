import { neon } from '@neondatabase/serverless';
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

// ─── DDL ─────────────────────────────────────────────────────────────────────
const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS ap_users (
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
  )`,
  `CREATE TABLE IF NOT EXISTS ap_subjects (
    id               TEXT PRIMARY KEY,
    code             TEXT UNIQUE NOT NULL,
    name             TEXT NOT NULL,
    instructor       TEXT,
    instructor_email TEXT,
    room             TEXT,
    attended         INTEGER DEFAULT 0,
    total            INTEGER DEFAULT 0,
    credits          INTEGER DEFAULT 3
  )`,
  `CREATE TABLE IF NOT EXISTS ap_students (
    id           TEXT PRIMARY KEY,
    roll_no      TEXT,
    name         TEXT NOT NULL,
    email        TEXT,
    avatar_color TEXT,
    status       TEXT DEFAULT 'present',
    notes        TEXT,
    sort_order   SERIAL
  )`,
  `CREATE TABLE IF NOT EXISTS ap_timetable (
    id           TEXT PRIMARY KEY,
    day          TEXT NOT NULL,
    time         TEXT NOT NULL,
    subject_code TEXT,
    subject_name TEXT,
    instructor   TEXT,
    room         TEXT,
    status       TEXT DEFAULT 'upcoming',
    sort_order   SERIAL
  )`,
  `CREATE TABLE IF NOT EXISTS ap_sessions (
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
  )`,
  `CREATE TABLE IF NOT EXISTS ap_notifications (
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
  )`
];

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
  private sql: any;
  private ready: Promise<void>;

  constructor() {
    const rawUrl = process.env.DATABASE_URL || '';
    const cleanUrl = rawUrl.replace(/channel_binding=[^&]*&?/, '').replace(/[?&]$/, '');

    this.sql = neon(cleanUrl);
    this.ready = this._init();
  }

  private async _init(): Promise<void> {
    try {
      for (const ddl of DDL_STATEMENTS) {
        await this.sql.query(ddl);
      }
      console.log('✅ PostgreSQL store initialized via Neon HTTP driver');
    } catch (err) {
      console.error('❌ Failed to initialize PostgreSQL store:', err);
    }
  }

  private async q<T = any>(sqlText: string, params: any[] = []): Promise<T[]> {
    await this.ready;
    const rows = await this.sql.query(sqlText, params);
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
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (email) DO UPDATE SET
         role = EXCLUDED.role,
         name = EXCLUDED.name,
         roll_no = EXCLUDED.roll_no,
         password = EXCLUDED.password`,
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
      role: 'role',
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
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (code) DO UPDATE SET
         name = EXCLUDED.name,
         instructor = EXCLUDED.instructor,
         instructor_email = EXCLUDED.instructor_email,
         room = EXCLUDED.room,
         credits = EXCLUDED.credits`,
      [id, subject.code, subject.name, subject.instructor, subject.instructorEmail || null,
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

  async replaceSubjects(subjects: SubjectItem[]): Promise<SubjectItem[]> {
    await this.q('DELETE FROM ap_subjects');
    for (const s of subjects) {
      await this.q(
        `INSERT INTO ap_subjects (id,code,name,instructor,instructor_email,room,attended,total,credits)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (code) DO UPDATE SET
           name = EXCLUDED.name,
           instructor = EXCLUDED.instructor,
           instructor_email = EXCLUDED.instructor_email,
           room = EXCLUDED.room,
           credits = EXCLUDED.credits`,
        [s.id || `sub-${Date.now()}-${Math.random()}`, s.code, s.name, s.instructor, s.instructorEmail || null, s.room || 'Hall 101', s.attended || 0, s.total || 0, s.credits || 3]
      );
    }
    return this.getSubjects();
  }

  // ── Students ───────────────────────────────────────────────────────────────
  async getStudents(): Promise<StudentItem[]> {
    const rows = await this.q('SELECT * FROM ap_students ORDER BY sort_order ASC, id ASC');
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
    await this.q('DELETE FROM ap_students');
    for (const s of students) {
      await this.q(
        `INSERT INTO ap_students (id,roll_no,name,email,avatar_color,status,notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [s.id, s.rollNo, s.name, s.email, s.avatarColor, s.status, s.notes || null]
      );
    }
    return this.getStudents();
  }

  // ── Timetable ──────────────────────────────────────────────────────────────
  async getTimetable(): Promise<TimetableItem[]> {
    const rows = await this.q('SELECT * FROM ap_timetable ORDER BY sort_order ASC, id ASC');
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
    const res = await this.sql.query('DELETE FROM ap_timetable WHERE id=$1', [id], { fullResults: true });
    return (res.rowCount ?? 0) > 0;
  }

  async replaceTimetable(timetable: TimetableItem[]): Promise<TimetableItem[]> {
    await this.q('DELETE FROM ap_timetable');
    for (const tt of timetable) {
      await this.q(
        `INSERT INTO ap_timetable (id,day,time,subject_code,subject_name,instructor,room,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [tt.id, tt.day, tt.time, tt.subjectCode, tt.subjectName, tt.instructor, tt.room, tt.status]
      );
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
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const time = `Today, ${formattedTime}`;
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
    await this.q('DELETE FROM ap_notifications WHERE id=$1', [id]);
    return true;
  }

  async clearNotifications(): Promise<boolean> {
    await this.q('DELETE FROM ap_notifications');
    return true;
  }
}
