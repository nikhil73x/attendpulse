// server/index.ts
import dotenv3 from "dotenv";
import express from "express";
import cors from "cors";

// server/data/store.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv2 from "dotenv";

// server/data/pg-store.ts
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();
var SEED_USERS = [
  { id: "usr-1", email: "nikhil.yadav@student.edu", password: "student123", role: "student", name: "Nikhil Yadav", rollNo: "2026-CS-0455", department: "Computer Science & Engineering", semester: "Semester 6", institution: "Apex Institute of Technology", minAttendanceGoal: 75, designation: "Student" },
  { id: "usr-2", email: "prof.yadav@school.edu", password: "teacher123", role: "teacher", name: "Prof. Nikhil Yadav", rollNo: "FAC-CS-108", department: "Computer Science & Engineering", semester: "Department Head", institution: "Apex Institute of Technology", minAttendanceGoal: 75, designation: "Associate Professor" },
  { id: "usr-3", email: "prof.anita@school.edu", password: "teacher123", role: "teacher", name: "Prof. Anita Roy", rollNo: "FAC-CS-102", department: "Computer Science & Engineering", semester: "Faculty", institution: "Apex Institute of Technology", minAttendanceGoal: 75, designation: "Assistant Professor" },
  { id: "usr-4", email: "prof.sharma@school.edu", password: "teacher123", role: "teacher", name: "Dr. Rajesh Sharma", rollNo: "FAC-CS-101", department: "Computer Science & Engineering", semester: "Faculty", institution: "Apex Institute of Technology", minAttendanceGoal: 75, designation: "Professor" },
  { id: "usr-5", email: "prof.singh@school.edu", password: "teacher123", role: "teacher", name: "Prof. Vikram Singh", rollNo: "FAC-CS-103", department: "Computer Science & Engineering", semester: "Faculty", institution: "Apex Institute of Technology", minAttendanceGoal: 75, designation: "Associate Professor" }
];
var SEED_SUBJECTS = [
  { id: "sub-1", code: "CS301", name: "Computer Networks", instructor: "Dr. Rajesh Sharma", instructorEmail: "prof.sharma@school.edu", room: "Hall 302", attended: 28, total: 30, credits: 4 },
  { id: "sub-2", code: "CS302", name: "Database Systems", instructor: "Prof. Anita Roy", instructorEmail: "prof.anita@school.edu", room: "Lab 4", attended: 21, total: 24, credits: 4 },
  { id: "sub-3", code: "CS303", name: "Operating Systems", instructor: "Prof. Vikram Singh", instructorEmail: "prof.singh@school.edu", room: "Hall 201", attended: 22, total: 26, credits: 4 },
  { id: "sub-4", code: "CS304", name: "Design & Analysis of Algorithms", instructor: "Prof. Nikhil Yadav", instructorEmail: "prof.yadav@school.edu", room: "Hall 105", attended: 25, total: 28, credits: 4 },
  { id: "sub-5", code: "CS305", name: "Artificial Intelligence & ML", instructor: "Prof. Nikhil Yadav", instructorEmail: "prof.yadav@school.edu", room: "AI Lab 2", attended: 21, total: 22, credits: 3 },
  { id: "sub-6", code: "CS306", name: "Web & Cloud Architecture", instructor: "Prof. Sarah Chen", instructorEmail: "sarah.chen@school.edu", room: "Cloud Studio", attended: 16, total: 20, credits: 3 }
];
var SEED_STUDENTS = [
  { id: "stu-1", rollNo: "2026-CS-0455", name: "Nikhil Yadav", email: "nikhil.yadav@student.edu", avatarColor: "from-indigo-500 to-purple-600", status: "present", notes: "Regular attendee" },
  { id: "stu-2", rollNo: "2026-CS-0401", name: "Aarav Patel", email: "aarav.patel@school.edu", avatarColor: "from-blue-500 to-cyan-500", status: "present" },
  { id: "stu-3", rollNo: "2026-CS-0412", name: "Ananya Sharma", email: "ananya.s@school.edu", avatarColor: "from-pink-500 to-rose-500", status: "present" },
  { id: "stu-4", rollNo: "2026-CS-0428", name: "Rohan Verma", email: "rohan.v@school.edu", avatarColor: "from-amber-500 to-orange-500", status: "late", notes: "Arrived 15m late" },
  { id: "stu-5", rollNo: "2026-CS-0433", name: "Priya Nair", email: "priya.n@school.edu", avatarColor: "from-emerald-500 to-teal-500", status: "present" },
  { id: "stu-6", rollNo: "2026-CS-0447", name: "Kabir Mehta", email: "kabir.m@school.edu", avatarColor: "from-red-500 to-rose-600", status: "absent" },
  { id: "stu-7", rollNo: "2026-CS-0460", name: "Sneha Gupta", email: "sneha.g@school.edu", avatarColor: "from-purple-500 to-indigo-500", status: "present" },
  { id: "stu-8", rollNo: "2026-CS-0472", name: "Ishaan Malhotra", email: "ishaan.m@school.edu", avatarColor: "from-sky-500 to-blue-600", status: "excused", notes: "Medical Leave" },
  { id: "stu-9", rollNo: "2026-CS-0485", name: "Riya Sen", email: "riya.sen@school.edu", avatarColor: "from-fuchsia-500 to-pink-500", status: "present" },
  { id: "stu-10", rollNo: "2026-CS-0491", name: "Devansh Joshi", email: "devansh.j@school.edu", avatarColor: "from-cyan-500 to-blue-500", status: "present" },
  { id: "stu-11", rollNo: "2026-CS-0504", name: "Meera Kulkarni", email: "meera.k@school.edu", avatarColor: "from-rose-500 to-red-500", status: "absent" },
  { id: "stu-12", rollNo: "2026-CS-0518", name: "Siddharth Rao", email: "sid.rao@school.edu", avatarColor: "from-teal-500 to-emerald-500", status: "present" }
];
var SEED_TIMETABLE = [
  { id: "tt-1", day: "Monday", time: "09:30 AM - 10:30 AM", subjectCode: "CS301", subjectName: "Computer Networks", instructor: "Dr. Rajesh Sharma", room: "Hall 302", status: "completed" },
  { id: "tt-2", day: "Monday", time: "11:00 AM - 12:30 PM", subjectCode: "CS302", subjectName: "Database Systems", instructor: "Prof. Anita Roy", room: "Lab 4", status: "ongoing" },
  { id: "tt-3", day: "Monday", time: "02:00 PM - 03:30 PM", subjectCode: "CS303", subjectName: "Operating Systems", instructor: "Prof. Vikram Singh", room: "Hall 201", status: "upcoming" },
  { id: "tt-4", day: "Tuesday", time: "09:30 AM - 11:00 AM", subjectCode: "CS304", subjectName: "Design & Analysis of Algorithms", instructor: "Prof. Nikhil Yadav", room: "Hall 105", status: "upcoming" },
  { id: "tt-5", day: "Tuesday", time: "11:30 AM - 01:00 PM", subjectCode: "CS305", subjectName: "Artificial Intelligence & ML", instructor: "Prof. Nikhil Yadav", room: "AI Lab 2", status: "upcoming" },
  { id: "tt-6", day: "Wednesday", time: "10:00 AM - 11:30 AM", subjectCode: "CS306", subjectName: "Web & Cloud Architecture", instructor: "Prof. Sarah Chen", room: "Cloud Studio", status: "upcoming" },
  { id: "tt-7", day: "Wednesday", time: "01:30 PM - 03:00 PM", subjectCode: "CS301", subjectName: "Computer Networks Lab", instructor: "Dr. Rajesh Sharma", room: "Network Lab 1", status: "upcoming" },
  { id: "tt-8", day: "Thursday", time: "09:30 AM - 11:00 AM", subjectCode: "CS302", subjectName: "Advanced Databases Lab", instructor: "Prof. Anita Roy", room: "Lab 4", status: "upcoming" },
  { id: "tt-9", day: "Thursday", time: "11:30 AM - 01:00 PM", subjectCode: "CS303", subjectName: "Systems Architecture", instructor: "Prof. Vikram Singh", room: "Hall 201", status: "upcoming" },
  { id: "tt-10", day: "Friday", time: "10:00 AM - 12:00 PM", subjectCode: "CS305", subjectName: "AI Capstone & Seminar", instructor: "Prof. Nikhil Yadav", room: "Auditorium 1", status: "upcoming" }
];
var SEED_NOTIFICATIONS = [
  { id: "notif-1", title: "Monthly Roll-Call Audit Notice", message: "Monthly attendance reports for Semester 6 are now consolidated. Students under 75% threshold must meet their academic advisors before Friday.", time: "10 mins ago", type: "alert", read: false, sender: { name: "Dr. Rajesh Sharma", role: "teacher", email: "prof.sharma@school.edu" }, target: { scope: "all" } },
  { id: "notif-2", title: "Lab Session Rescheduled", message: "Database Systems (CS302) Thursday Lab is shifted from Lab 4 to Systems Cloud Studio due to scheduled network maintenance.", time: "2 hours ago", type: "info", read: false, sender: { name: "Prof. Anita Roy", role: "teacher", email: "prof.anita@school.edu" }, target: { scope: "all" } },
  { id: "notif-3", title: "Attendance Goal Achieved", message: "Congratulations! Your overall cumulative attendance reached 84.6%, safely meeting your 75% minimum semester requirement.", time: "1 day ago", type: "success", read: true, sender: { name: "AttendPulse Academic Engine", role: "system" }, target: { scope: "all" } }
];
var CREATE_TABLES_SQL = `
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
function rowToUser(r) {
  return {
    id: r.id,
    email: r.email,
    password: r.password,
    role: r.role,
    name: r.name,
    rollNo: r.roll_no,
    department: r.department,
    semester: r.semester,
    institution: r.institution,
    minAttendanceGoal: r.min_attendance_goal,
    designation: r.designation
  };
}
function rowToSubject(r) {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    instructor: r.instructor,
    instructorEmail: r.instructor_email,
    room: r.room,
    attended: r.attended,
    total: r.total,
    credits: r.credits
  };
}
function rowToStudent(r) {
  return {
    id: r.id,
    rollNo: r.roll_no,
    name: r.name,
    email: r.email,
    avatarColor: r.avatar_color,
    status: r.status,
    notes: r.notes
  };
}
function rowToTimetable(r) {
  return {
    id: r.id,
    day: r.day,
    time: r.time,
    subjectCode: r.subject_code,
    subjectName: r.subject_name,
    instructor: r.instructor,
    room: r.room,
    status: r.status
  };
}
function rowToSession(r) {
  return {
    id: r.id,
    date: r.date,
    timestamp: Number(r.timestamp),
    subjectCode: r.subject_code,
    subjectName: r.subject_name,
    instructor: r.instructor,
    markedBy: r.marked_by,
    markedByEmail: r.marked_by_email,
    records: r.records,
    summary: r.summary
  };
}
function rowToNotification(r) {
  return {
    id: r.id,
    title: r.title,
    message: r.message,
    time: r.time,
    type: r.type,
    read: r.read,
    sender: r.sender,
    target: r.target,
    attachments: r.attachments,
    links: r.links
  };
}
var PostgresStore = class {
  pool;
  ready;
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 5e3
    });
    this.ready = this._init();
  }
  async _init() {
    const client = await this.pool.connect();
    try {
      await client.query(CREATE_TABLES_SQL);
      const { rows: uRows } = await client.query("SELECT COUNT(*) AS c FROM ap_users");
      if (parseInt(uRows[0].c, 10) === 0) {
        for (const u of SEED_USERS) {
          await client.query(
            `INSERT INTO ap_users (id,email,password,role,name,roll_no,department,semester,institution,min_attendance_goal,designation)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING`,
            [u.id, u.email, u.password, u.role, u.name, u.rollNo, u.department, u.semester, u.institution, u.minAttendanceGoal, u.designation]
          );
        }
      }
      const { rows: sRows } = await client.query("SELECT COUNT(*) AS c FROM ap_subjects");
      if (parseInt(sRows[0].c, 10) === 0) {
        for (const s of SEED_SUBJECTS) {
          await client.query(
            `INSERT INTO ap_subjects (id,code,name,instructor,instructor_email,room,attended,total,credits)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
            [s.id, s.code, s.name, s.instructor, s.instructorEmail, s.room, s.attended, s.total, s.credits]
          );
        }
      }
      const { rows: stRows } = await client.query("SELECT COUNT(*) AS c FROM ap_students");
      if (parseInt(stRows[0].c, 10) === 0) {
        for (const st of SEED_STUDENTS) {
          await client.query(
            `INSERT INTO ap_students (id,roll_no,name,email,avatar_color,status,notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
            [st.id, st.rollNo, st.name, st.email, st.avatarColor, st.status, st.notes || null]
          );
        }
      }
      const { rows: ttRows } = await client.query("SELECT COUNT(*) AS c FROM ap_timetable");
      if (parseInt(ttRows[0].c, 10) === 0) {
        for (const tt of SEED_TIMETABLE) {
          await client.query(
            `INSERT INTO ap_timetable (id,day,time,subject_code,subject_name,instructor,room,status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
            [tt.id, tt.day, tt.time, tt.subjectCode, tt.subjectName, tt.instructor, tt.room, tt.status]
          );
        }
      }
      const { rows: nRows } = await client.query("SELECT COUNT(*) AS c FROM ap_notifications");
      if (parseInt(nRows[0].c, 10) === 0) {
        for (const n of SEED_NOTIFICATIONS) {
          await client.query(
            `INSERT INTO ap_notifications (id,title,message,time,type,read,sender,target)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
            [
              n.id,
              n.title,
              n.message,
              n.time,
              n.type,
              n.read,
              JSON.stringify(n.sender),
              JSON.stringify(n.target)
            ]
          );
        }
      }
      console.log("\u2705 PostgreSQL store initialized & seeded");
    } finally {
      client.release();
    }
  }
  async q(sql, params = []) {
    await this.ready;
    const { rows } = await this.pool.query(sql, params);
    return rows;
  }
  getEngineType() {
    return `PostgreSQL (${process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "cloud"})`;
  }
  getStoragePath() {
    return "PostgreSQL cloud database";
  }
  // ── Users ──────────────────────────────────────────────────────────────────
  async getUsers() {
    const rows = await this.q("SELECT * FROM ap_users");
    return rows.map(rowToUser);
  }
  async getUserByEmail(email) {
    const rows = await this.q("SELECT * FROM ap_users WHERE LOWER(email)=LOWER($1) LIMIT 1", [email]);
    return rows[0] ? rowToUser(rows[0]) : void 0;
  }
  async addUser(user) {
    await this.q(
      `INSERT INTO ap_users (id,email,password,role,name,roll_no,department,semester,institution,min_attendance_goal,designation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (email) DO NOTHING`,
      [
        user.id,
        user.email,
        user.password,
        user.role,
        user.name,
        user.rollNo,
        user.department,
        user.semester,
        user.institution,
        user.minAttendanceGoal,
        user.designation
      ]
    );
    return user;
  }
  async updateUserProfile(email, partial) {
    const fields = [];
    const values = [];
    let i = 1;
    const map = {
      name: "name",
      rollNo: "roll_no",
      department: "department",
      semester: "semester",
      institution: "institution",
      minAttendanceGoal: "min_attendance_goal",
      designation: "designation"
    };
    for (const [key, col] of Object.entries(map)) {
      if (partial[key] !== void 0) {
        fields.push(`${col}=$${i++}`);
        values.push(partial[key]);
      }
    }
    if (fields.length === 0) return await this.getUserByEmail(email) ?? null;
    values.push(email);
    await this.q(`UPDATE ap_users SET ${fields.join(",")} WHERE LOWER(email)=LOWER($${i})`, values);
    return await this.getUserByEmail(email) ?? null;
  }
  // ── Subjects ───────────────────────────────────────────────────────────────
  async getSubjects() {
    const rows = await this.q("SELECT * FROM ap_subjects ORDER BY code");
    return rows.map(rowToSubject);
  }
  async getSubjectByCode(code) {
    const rows = await this.q("SELECT * FROM ap_subjects WHERE LOWER(code)=LOWER($1) LIMIT 1", [code]);
    return rows[0] ? rowToSubject(rows[0]) : void 0;
  }
  async addSubject(subject) {
    const id = `sub-${Date.now()}`;
    await this.q(
      `INSERT INTO ap_subjects (id,code,name,instructor,instructor_email,room,attended,total,credits)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id,
        subject.code,
        subject.name,
        subject.instructor,
        subject.instructorEmail,
        subject.room,
        subject.attended,
        subject.total,
        subject.credits
      ]
    );
    return { id, ...subject };
  }
  async updateSubject(id, partial) {
    const fields = [];
    const values = [];
    let i = 1;
    const map = {
      code: "code",
      name: "name",
      instructor: "instructor",
      instructorEmail: "instructor_email",
      room: "room",
      attended: "attended",
      total: "total",
      credits: "credits"
    };
    for (const [key, col] of Object.entries(map)) {
      if (partial[key] !== void 0) {
        fields.push(`${col}=$${i++}`);
        values.push(partial[key]);
      }
    }
    if (fields.length === 0) {
      const rows2 = await this.q("SELECT * FROM ap_subjects WHERE id=$1", [id]);
      return rows2[0] ? rowToSubject(rows2[0]) : null;
    }
    values.push(id);
    await this.q(`UPDATE ap_subjects SET ${fields.join(",")} WHERE id=$${i}`, values);
    const rows = await this.q("SELECT * FROM ap_subjects WHERE id=$1", [id]);
    return rows[0] ? rowToSubject(rows[0]) : null;
  }
  // ── Students ───────────────────────────────────────────────────────────────
  async getStudents() {
    const rows = await this.q("SELECT * FROM ap_students ORDER BY sort_order ASC");
    return rows.map(rowToStudent);
  }
  async getStudentById(id) {
    const rows = await this.q("SELECT * FROM ap_students WHERE id=$1 LIMIT 1", [id]);
    return rows[0] ? rowToStudent(rows[0]) : void 0;
  }
  async addStudent(student) {
    const id = `stu-${Date.now()}`;
    await this.q(
      `INSERT INTO ap_students (id,roll_no,name,email,avatar_color,status,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        id,
        student.rollNo,
        student.name,
        student.email,
        student.avatarColor,
        student.status,
        student.notes || null
      ]
    );
    return { id, ...student };
  }
  async updateStudent(id, partial) {
    const fields = [];
    const values = [];
    let i = 1;
    const map = {
      rollNo: "roll_no",
      name: "name",
      email: "email",
      avatarColor: "avatar_color",
      status: "status",
      notes: "notes"
    };
    for (const [key, col] of Object.entries(map)) {
      if (partial[key] !== void 0) {
        fields.push(`${col}=$${i++}`);
        values.push(partial[key]);
      }
    }
    if (fields.length === 0) return await this.getStudentById(id) ?? null;
    values.push(id);
    await this.q(`UPDATE ap_students SET ${fields.join(",")} WHERE id=$${i}`, values);
    return await this.getStudentById(id) ?? null;
  }
  async bulkUpdateStudentStatus(status) {
    await this.q("UPDATE ap_students SET status=$1", [status]);
    return this.getStudents();
  }
  async replaceStudents(students) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM ap_students");
      for (const s of students) {
        await client.query(
          `INSERT INTO ap_students (id,roll_no,name,email,avatar_color,status,notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [s.id, s.rollNo, s.name, s.email, s.avatarColor, s.status, s.notes || null]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
    return this.getStudents();
  }
  // ── Timetable ──────────────────────────────────────────────────────────────
  async getTimetable() {
    const rows = await this.q("SELECT * FROM ap_timetable ORDER BY sort_order ASC");
    return rows.map(rowToTimetable);
  }
  async addTimetableSlot(slot) {
    const id = `tt-${Date.now()}`;
    await this.q(
      `INSERT INTO ap_timetable (id,day,time,subject_code,subject_name,instructor,room,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, slot.day, slot.time, slot.subjectCode, slot.subjectName, slot.instructor, slot.room, slot.status]
    );
    return { id, ...slot };
  }
  async updateTimetableSlot(id, partial) {
    const fields = [];
    const values = [];
    let i = 1;
    const map = {
      day: "day",
      time: "time",
      subjectCode: "subject_code",
      subjectName: "subject_name",
      instructor: "instructor",
      room: "room",
      status: "status"
    };
    for (const [key, col] of Object.entries(map)) {
      if (partial[key] !== void 0) {
        fields.push(`${col}=$${i++}`);
        values.push(partial[key]);
      }
    }
    if (fields.length === 0) {
      const rows2 = await this.q("SELECT * FROM ap_timetable WHERE id=$1", [id]);
      return rows2[0] ? rowToTimetable(rows2[0]) : null;
    }
    values.push(id);
    await this.q(`UPDATE ap_timetable SET ${fields.join(",")} WHERE id=$${i}`, values);
    const rows = await this.q("SELECT * FROM ap_timetable WHERE id=$1", [id]);
    return rows[0] ? rowToTimetable(rows[0]) : null;
  }
  async deleteTimetableSlot(id) {
    const result = await this.pool.query("DELETE FROM ap_timetable WHERE id=$1", [id]);
    return (result.rowCount ?? 0) > 0;
  }
  async replaceTimetable(timetable) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM ap_timetable");
      for (const tt of timetable) {
        await client.query(
          `INSERT INTO ap_timetable (id,day,time,subject_code,subject_name,instructor,room,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [tt.id, tt.day, tt.time, tt.subjectCode, tt.subjectName, tt.instructor, tt.room, tt.status]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
    return this.getTimetable();
  }
  // ── Sessions ───────────────────────────────────────────────────────────────
  async getSessions() {
    const rows = await this.q("SELECT * FROM ap_sessions ORDER BY created_at DESC");
    return rows.map(rowToSession);
  }
  async addSession(session) {
    const id = `ses-${Date.now()}`;
    const timestamp = Date.now();
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
      [
        id,
        session.date,
        timestamp,
        session.subjectCode,
        session.subjectName,
        session.instructor,
        session.markedBy,
        session.markedByEmail,
        JSON.stringify(session.records),
        JSON.stringify(session.summary)
      ]
    );
    return { id, timestamp, ...session };
  }
  // ── Notifications ──────────────────────────────────────────────────────────
  async getNotifications() {
    const rows = await this.q("SELECT * FROM ap_notifications ORDER BY created_at DESC");
    return rows.map(rowToNotification);
  }
  async addNotification(notification) {
    const id = `notif-${Date.now()}`;
    const time = "Just now";
    await this.q(
      `INSERT INTO ap_notifications (id,title,message,time,type,read,sender,target,attachments,links)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        notification.title,
        notification.message,
        time,
        notification.type,
        false,
        JSON.stringify(notification.sender),
        JSON.stringify(notification.target),
        JSON.stringify(notification.attachments ?? null),
        JSON.stringify(notification.links ?? null)
      ]
    );
    return { id, time, read: false, ...notification };
  }
  async markNotificationAsRead(id) {
    await this.q("UPDATE ap_notifications SET read=true WHERE id=$1", [id]);
    const rows = await this.q("SELECT * FROM ap_notifications WHERE id=$1", [id]);
    return rows[0] ? rowToNotification(rows[0]) : null;
  }
  async deleteNotification(id) {
    const result = await this.pool.query("DELETE FROM ap_notifications WHERE id=$1", [id]);
    return (result.rowCount ?? 0) > 0;
  }
};

// server/data/store.ts
dotenv2.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var isVercel = Boolean(process.env.VERCEL);
var LOCAL_DATA_FILE = path.join(__dirname, "database.json");
var DATA_FILE = process.env.DATABASE_PATH ? process.env.DATABASE_PATH : process.env.DATA_DIR ? path.join(process.env.DATA_DIR, "database.json") : isVercel ? path.join("/tmp", "database.json") : LOCAL_DATA_FILE;
var initialSeed = {
  users: [
    { id: "usr-1", email: "nikhil.yadav@student.edu", password: "student123", role: "student", name: "Nikhil Yadav", rollNo: "2026-CS-0455", department: "Computer Science & Engineering", semester: "Semester 6", institution: "Apex Institute of Technology", minAttendanceGoal: 75, designation: "Student" },
    { id: "usr-2", email: "prof.yadav@school.edu", password: "teacher123", role: "teacher", name: "Prof. Nikhil Yadav", rollNo: "FAC-CS-108", department: "Computer Science & Engineering", semester: "Department Head", institution: "Apex Institute of Technology", minAttendanceGoal: 75, designation: "Associate Professor" },
    { id: "usr-3", email: "prof.anita@school.edu", password: "teacher123", role: "teacher", name: "Prof. Anita Roy", rollNo: "FAC-CS-102", department: "Computer Science & Engineering", semester: "Faculty", institution: "Apex Institute of Technology", minAttendanceGoal: 75, designation: "Assistant Professor" },
    { id: "usr-4", email: "prof.sharma@school.edu", password: "teacher123", role: "teacher", name: "Dr. Rajesh Sharma", rollNo: "FAC-CS-101", department: "Computer Science & Engineering", semester: "Faculty", institution: "Apex Institute of Technology", minAttendanceGoal: 75, designation: "Professor" },
    { id: "usr-5", email: "prof.singh@school.edu", password: "teacher123", role: "teacher", name: "Prof. Vikram Singh", rollNo: "FAC-CS-103", department: "Computer Science & Engineering", semester: "Faculty", institution: "Apex Institute of Technology", minAttendanceGoal: 75, designation: "Associate Professor" }
  ],
  subjects: [
    { id: "sub-1", code: "CS301", name: "Computer Networks", instructor: "Dr. Rajesh Sharma", instructorEmail: "prof.sharma@school.edu", room: "Hall 302", attended: 28, total: 30, credits: 4 },
    { id: "sub-2", code: "CS302", name: "Database Systems", instructor: "Prof. Anita Roy", instructorEmail: "prof.anita@school.edu", room: "Lab 4", attended: 21, total: 24, credits: 4 },
    { id: "sub-3", code: "CS303", name: "Operating Systems", instructor: "Prof. Vikram Singh", instructorEmail: "prof.singh@school.edu", room: "Hall 201", attended: 22, total: 26, credits: 4 },
    { id: "sub-4", code: "CS304", name: "Design & Analysis of Algorithms", instructor: "Prof. Nikhil Yadav", instructorEmail: "prof.yadav@school.edu", room: "Hall 105", attended: 25, total: 28, credits: 4 },
    { id: "sub-5", code: "CS305", name: "Artificial Intelligence & ML", instructor: "Prof. Nikhil Yadav", instructorEmail: "prof.yadav@school.edu", room: "AI Lab 2", attended: 21, total: 22, credits: 3 },
    { id: "sub-6", code: "CS306", name: "Web & Cloud Architecture", instructor: "Prof. Sarah Chen", instructorEmail: "sarah.chen@school.edu", room: "Cloud Studio", attended: 16, total: 20, credits: 3 }
  ],
  students: [
    { id: "stu-1", rollNo: "2026-CS-0455", name: "Nikhil Yadav", email: "nikhil.yadav@student.edu", avatarColor: "from-indigo-500 to-purple-600", status: "present", notes: "Regular attendee" },
    { id: "stu-2", rollNo: "2026-CS-0401", name: "Aarav Patel", email: "aarav.patel@school.edu", avatarColor: "from-blue-500 to-cyan-500", status: "present" },
    { id: "stu-3", rollNo: "2026-CS-0412", name: "Ananya Sharma", email: "ananya.s@school.edu", avatarColor: "from-pink-500 to-rose-500", status: "present" },
    { id: "stu-4", rollNo: "2026-CS-0428", name: "Rohan Verma", email: "rohan.v@school.edu", avatarColor: "from-amber-500 to-orange-500", status: "late", notes: "Arrived 15m late" },
    { id: "stu-5", rollNo: "2026-CS-0433", name: "Priya Nair", email: "priya.n@school.edu", avatarColor: "from-emerald-500 to-teal-500", status: "present" },
    { id: "stu-6", rollNo: "2026-CS-0447", name: "Kabir Mehta", email: "kabir.m@school.edu", avatarColor: "from-red-500 to-rose-600", status: "absent" },
    { id: "stu-7", rollNo: "2026-CS-0460", name: "Sneha Gupta", email: "sneha.g@school.edu", avatarColor: "from-purple-500 to-indigo-500", status: "present" },
    { id: "stu-8", rollNo: "2026-CS-0472", name: "Ishaan Malhotra", email: "ishaan.m@school.edu", avatarColor: "from-sky-500 to-blue-600", status: "excused", notes: "Medical Leave" },
    { id: "stu-9", rollNo: "2026-CS-0485", name: "Riya Sen", email: "riya.sen@school.edu", avatarColor: "from-fuchsia-500 to-pink-500", status: "present" },
    { id: "stu-10", rollNo: "2026-CS-0491", name: "Devansh Joshi", email: "devansh.j@school.edu", avatarColor: "from-cyan-500 to-blue-500", status: "present" },
    { id: "stu-11", rollNo: "2026-CS-0504", name: "Meera Kulkarni", email: "meera.k@school.edu", avatarColor: "from-rose-500 to-red-500", status: "absent" },
    { id: "stu-12", rollNo: "2026-CS-0518", name: "Siddharth Rao", email: "sid.rao@school.edu", avatarColor: "from-teal-500 to-emerald-500", status: "present" }
  ],
  timetable: [
    { id: "tt-1", day: "Monday", time: "09:30 AM - 10:30 AM", subjectCode: "CS301", subjectName: "Computer Networks", instructor: "Dr. Rajesh Sharma", room: "Hall 302", status: "completed" },
    { id: "tt-2", day: "Monday", time: "11:00 AM - 12:30 PM", subjectCode: "CS302", subjectName: "Database Systems", instructor: "Prof. Anita Roy", room: "Lab 4", status: "ongoing" },
    { id: "tt-3", day: "Monday", time: "02:00 PM - 03:30 PM", subjectCode: "CS303", subjectName: "Operating Systems", instructor: "Prof. Vikram Singh", room: "Hall 201", status: "upcoming" },
    { id: "tt-4", day: "Tuesday", time: "09:30 AM - 11:00 AM", subjectCode: "CS304", subjectName: "Design & Analysis of Algorithms", instructor: "Prof. Nikhil Yadav", room: "Hall 105", status: "upcoming" },
    { id: "tt-5", day: "Tuesday", time: "11:30 AM - 01:00 PM", subjectCode: "CS305", subjectName: "Artificial Intelligence & ML", instructor: "Prof. Nikhil Yadav", room: "AI Lab 2", status: "upcoming" },
    { id: "tt-6", day: "Wednesday", time: "10:00 AM - 11:30 AM", subjectCode: "CS306", subjectName: "Web & Cloud Architecture", instructor: "Prof. Sarah Chen", room: "Cloud Studio", status: "upcoming" },
    { id: "tt-7", day: "Wednesday", time: "01:30 PM - 03:00 PM", subjectCode: "CS301", subjectName: "Computer Networks Lab", instructor: "Dr. Rajesh Sharma", room: "Network Lab 1", status: "upcoming" },
    { id: "tt-8", day: "Thursday", time: "09:30 AM - 11:00 AM", subjectCode: "CS302", subjectName: "Advanced Databases Lab", instructor: "Prof. Anita Roy", room: "Lab 4", status: "upcoming" },
    { id: "tt-9", day: "Thursday", time: "11:30 AM - 01:00 PM", subjectCode: "CS303", subjectName: "Systems Architecture", instructor: "Prof. Vikram Singh", room: "Hall 201", status: "upcoming" },
    { id: "tt-10", day: "Friday", time: "10:00 AM - 12:00 PM", subjectCode: "CS305", subjectName: "AI Capstone & Seminar", instructor: "Prof. Nikhil Yadav", room: "Auditorium 1", status: "upcoming" }
  ],
  sessions: [],
  notifications: [
    { id: "notif-1", title: "Monthly Roll-Call Audit Notice", message: "Monthly attendance reports for Semester 6 are now consolidated. Students under 75% threshold must meet their academic advisors before Friday.", time: "10 mins ago", type: "alert", read: false, sender: { name: "Dr. Rajesh Sharma", role: "teacher", email: "prof.sharma@school.edu" }, target: { scope: "all" } },
    { id: "notif-2", title: "Lab Session Rescheduled", message: "Database Systems (CS302) Thursday Lab is shifted from Lab 4 to Systems Cloud Studio due to scheduled network maintenance.", time: "2 hours ago", type: "info", read: false, sender: { name: "Prof. Anita Roy", role: "teacher", email: "prof.anita@school.edu" }, target: { scope: "all" } },
    { id: "notif-3", title: "Attendance Goal Achieved", message: "Congratulations! Your overall cumulative attendance reached 84.6%, safely meeting your 75% minimum semester requirement.", time: "1 day ago", type: "success", read: true, sender: { name: "AttendPulse Academic Engine", role: "system" }, target: { scope: "all" } }
  ]
};
var FileStore = class {
  data;
  constructor() {
    this.data = this._load();
  }
  _load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        return { ...initialSeed, ...JSON.parse(raw) };
      }
    } catch {
    }
    this._save(initialSeed);
    return { ...initialSeed };
  }
  _save(d) {
    try {
      const payload = d || this.data;
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tmp = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(payload, null, 2), "utf-8");
      fs.renameSync(tmp, DATA_FILE);
    } catch (err) {
      console.error("File store write failed:", err);
    }
  }
  getEngineType() {
    return `Atomic File Store (${path.basename(DATA_FILE)})`;
  }
  getStoragePath() {
    return DATA_FILE;
  }
  // Users
  async getUsers() {
    return this.data.users;
  }
  async getUserByEmail(email) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
  async addUser(user) {
    this.data.users.push(user);
    this._save();
    return user;
  }
  async updateUserProfile(email, p) {
    const u = this.data.users.find((u2) => u2.email.toLowerCase() === email.toLowerCase());
    if (!u) return null;
    Object.assign(u, p);
    this._save();
    return u;
  }
  // Subjects
  async getSubjects() {
    return this.data.subjects;
  }
  async getSubjectByCode(code) {
    return this.data.subjects.find((s) => s.code.toLowerCase() === code.toLowerCase());
  }
  async addSubject(s) {
    const n = { ...s, id: `sub-${Date.now()}` };
    this.data.subjects.push(n);
    this._save();
    return n;
  }
  async updateSubject(id, p) {
    const s = this.data.subjects.find((s2) => s2.id === id);
    if (!s) return null;
    Object.assign(s, p);
    this._save();
    return s;
  }
  // Students
  async getStudents() {
    return this.data.students;
  }
  async getStudentById(id) {
    return this.data.students.find((s) => s.id === id);
  }
  async addStudent(s) {
    const n = { ...s, id: `stu-${Date.now()}` };
    this.data.students.unshift(n);
    this._save();
    return n;
  }
  async updateStudent(id, p) {
    const s = this.data.students.find((s2) => s2.id === id);
    if (!s) return null;
    Object.assign(s, p);
    this._save();
    return s;
  }
  async bulkUpdateStudentStatus(status) {
    this.data.students.forEach((s) => {
      s.status = status;
    });
    this._save();
    return this.data.students;
  }
  async replaceStudents(students) {
    this.data.students = students;
    this._save();
    return students;
  }
  // Timetable
  async getTimetable() {
    return this.data.timetable;
  }
  async addTimetableSlot(s) {
    const n = { ...s, id: `tt-${Date.now()}` };
    this.data.timetable.push(n);
    this._save();
    return n;
  }
  async updateTimetableSlot(id, p) {
    const s = this.data.timetable.find((s2) => s2.id === id);
    if (!s) return null;
    Object.assign(s, p);
    this._save();
    return s;
  }
  async deleteTimetableSlot(id) {
    const idx = this.data.timetable.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.data.timetable.splice(idx, 1);
    this._save();
    return true;
  }
  async replaceTimetable(timetable) {
    this.data.timetable = timetable;
    this._save();
    return timetable;
  }
  // Sessions
  async getSessions() {
    return this.data.sessions;
  }
  async addSession(session) {
    const n = { ...session, id: `ses-${Date.now()}`, timestamp: Date.now() };
    this.data.sessions.unshift(n);
    const sub = this.data.subjects.find((s) => s.code.toLowerCase() === session.subjectCode.toLowerCase());
    if (sub) {
      sub.total += 1;
      if (session.summary.percentage >= 50) sub.attended += 1;
    }
    this._save();
    return n;
  }
  // Notifications
  async getNotifications() {
    return this.data.notifications;
  }
  async addNotification(n) {
    const newN = { ...n, id: `notif-${Date.now()}`, time: "Just now", read: false };
    this.data.notifications.unshift(newN);
    this._save();
    return newN;
  }
  async markNotificationAsRead(id) {
    const n = this.data.notifications.find((n2) => n2.id === id);
    if (!n) return null;
    n.read = true;
    this._save();
    return n;
  }
  async deleteNotification(id) {
    const idx = this.data.notifications.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    this.data.notifications.splice(idx, 1);
    this._save();
    return true;
  }
};
function createStore() {
  if (process.env.DATABASE_URL) {
    console.log("\u{1F418} Using PostgreSQL store");
    return new PostgresStore();
  }
  console.log("\u{1F4C1} Using File store (local dev)");
  return new FileStore();
}
var db = createStore();

// server/routes/auth.ts
import { Router } from "express";
var authRouter = Router();
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: "Email address is required" });
  let cleanEmail = email.trim().toLowerCase();
  if (["prof", "professor", "faculty", "teacher", "yadav"].includes(cleanEmail)) cleanEmail = "prof.yadav@school.edu";
  else if (["student", "nikhil"].includes(cleanEmail)) cleanEmail = "nikhil.yadav@student.edu";
  const user = await db.getUserByEmail(cleanEmail);
  if (user) {
    const validPasswords = [user.password, "teacher123", "faculty123", "student123", "demo1234", "prof123", "password", ""];
    if (password && !validPasswords.includes(password)) {
      return res.status(401).json({ error: "Invalid password credentials" });
    }
    return res.json({
      success: true,
      token: `sess_${user.id}_${Date.now()}`,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, rollNo: user.rollNo, department: user.department, semester: user.semester, institution: user.institution, minAttendanceGoal: user.minAttendanceGoal, designation: user.designation }
    });
  }
  const isSchool = cleanEmail.includes("@school.edu") || cleanEmail.includes("@student.edu");
  if (isSchool || cleanEmail.includes("prof") || cleanEmail.includes("student")) {
    const isTeacher = cleanEmail.startsWith("prof.") || cleanEmail.includes("teacher") || cleanEmail.includes("@school.edu");
    const local = cleanEmail.split("@")[0];
    const parts = local.split(/[._-]/).filter(Boolean);
    const capitalized = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    const name = isTeacher ? `Prof. ${capitalized}` : capitalized;
    const role = isTeacher ? "teacher" : "student";
    const newUser = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      password: password || "demo1234",
      role,
      name,
      rollNo: role === "teacher" ? `FAC-CS-${Math.floor(100 + Math.random() * 900)}` : `2026-CS-${Math.floor(1e3 + Math.random() * 9e3)}`,
      department: "Computer Science & Engineering",
      semester: role === "teacher" ? "Faculty" : "Semester 6",
      institution: "Apex Institute of Technology",
      minAttendanceGoal: 75,
      designation: role === "teacher" ? "Associate Professor" : "Student"
    };
    await db.addUser(newUser);
    return res.json({ success: true, token: `sess_${newUser.id}_${Date.now()}`, user: newUser });
  }
  return res.status(401).json({ error: "Account not recognized. Please use registered school credentials." });
});
authRouter.get("/me", async (req, res) => {
  const email = req.query.email || "";
  if (!email) return res.status(400).json({ error: "Email parameter required" });
  const user = await db.getUserByEmail(email);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, rollNo: user.rollNo, department: user.department, semester: user.semester, institution: user.institution, minAttendanceGoal: user.minAttendanceGoal, designation: user.designation });
});
authRouter.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Signed out successfully" });
});

// server/routes/subjects.ts
import { Router as Router2 } from "express";
var subjectsRouter = Router2();
subjectsRouter.get("/", async (req, res) => {
  const teacher = req.query.teacher || "";
  let subjects = await db.getSubjects();
  if (teacher) {
    const c = teacher.toLowerCase();
    subjects = subjects.filter((s) => s.instructor.toLowerCase().includes(c) || s.instructorEmail && s.instructorEmail.toLowerCase() === c);
  }
  res.json({ success: true, count: subjects.length, data: subjects });
});
subjectsRouter.get("/:code", async (req, res) => {
  const subject = await db.getSubjectByCode(String(req.params.code));
  if (!subject) return res.status(404).json({ error: `Subject ${req.params.code} not found` });
  res.json({ success: true, data: subject });
});
subjectsRouter.post("/", async (req, res) => {
  const { code, name, instructor, instructorEmail, room, credits, attended = 0, total = 0 } = req.body;
  if (!code || !name || !instructor) return res.status(400).json({ error: "Code, name, and instructor are required" });
  const existing = await db.getSubjectByCode(code);
  if (existing) return res.status(409).json({ error: `Subject ${code} already exists` });
  const newSubject = await db.addSubject({ code: code.toUpperCase(), name, instructor, instructorEmail, room: room || "Hall 101", credits: Number(credits) || 3, attended: Number(attended) || 0, total: Number(total) || 0 });
  res.status(201).json({ success: true, data: newSubject });
});
subjectsRouter.put("/:id", async (req, res) => {
  const updated = await db.updateSubject(String(req.params.id), req.body);
  if (!updated) return res.status(404).json({ error: "Subject not found" });
  res.json({ success: true, data: updated });
});
subjectsRouter.post("/:id/attendance-delta", async (req, res) => {
  const id = String(req.params.id);
  const { attendedDelta = 0, totalDelta = 0 } = req.body;
  const subjects = await db.getSubjects();
  const subject = subjects.find((s) => s.id === id);
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  const newAttended = Math.max(0, subject.attended + Number(attendedDelta));
  const newTotal = Math.max(newAttended, subject.total + Number(totalDelta));
  const updated = await db.updateSubject(id, { attended: newAttended, total: newTotal });
  res.json({ success: true, data: updated });
});

// server/routes/students.ts
import { Router as Router3 } from "express";
var studentsRouter = Router3();
var AVATAR_COLORS = [
  "from-indigo-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-pink-500 to-rose-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-purple-500 to-indigo-500",
  "from-cyan-500 to-blue-500"
];
studentsRouter.get("/", async (_req, res) => {
  const students = await db.getStudents();
  res.json({ success: true, count: students.length, data: students });
});
studentsRouter.post("/", async (req, res) => {
  const { rollNo, name, email, avatarColor, status = "present", notes } = req.body;
  if (!rollNo || !name || !email) return res.status(400).json({ error: "Roll number, name, and email are required" });
  const newStudent = await db.addStudent({
    rollNo: rollNo.trim().toUpperCase(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    avatarColor: avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    status,
    notes
  });
  res.status(201).json({ success: true, data: newStudent });
});
studentsRouter.put("/:id", async (req, res) => {
  const updated = await db.updateStudent(String(req.params.id), req.body);
  if (!updated) return res.status(404).json({ error: "Student not found" });
  res.json({ success: true, data: updated });
});
studentsRouter.put("/:id/status", async (req, res) => {
  const { status, notes } = req.body;
  if (!["present", "absent", "late", "excused"].includes(status)) return res.status(400).json({ error: "Invalid attendance status" });
  const updated = await db.updateStudent(String(req.params.id), { status, ...notes !== void 0 ? { notes } : {} });
  if (!updated) return res.status(404).json({ error: "Student not found" });
  res.json({ success: true, data: updated });
});
studentsRouter.post("/bulk-status", async (req, res) => {
  const { status } = req.body;
  if (!["present", "absent", "late", "excused"].includes(status)) return res.status(400).json({ error: "Invalid attendance status" });
  const updatedStudents = await db.bulkUpdateStudentStatus(status);
  res.json({ success: true, count: updatedStudents.length, data: updatedStudents });
});
studentsRouter.post("/bulk-import", async (req, res) => {
  const { students: rawStudents, csvText } = req.body;
  let studentsToImport = [];
  if (csvText && typeof csvText === "string") {
    const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
    const startIndex = lines[0].toLowerCase().includes("roll") ? 1 : 0;
    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length >= 2) {
        const rollNo = parts[0].toUpperCase();
        const name = parts[1];
        const email = parts[2] || `${name.toLowerCase().replace(/\s+/g, ".")}@school.edu`;
        const status = parts[3]?.toLowerCase() || "present";
        studentsToImport.push({ id: `stu-${Date.now()}-${i}`, rollNo, name, email, avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length], status: ["present", "absent", "late", "excused"].includes(status) ? status : "present", notes: parts[4] || "" });
      }
    }
  } else if (Array.isArray(rawStudents)) {
    studentsToImport = rawStudents.map((s, idx) => ({ id: s.id || `stu-${Date.now()}-${idx}`, rollNo: (s.rollNo || "").toUpperCase(), name: s.name || "Student", email: s.email || "student@school.edu", avatarColor: s.avatarColor || AVATAR_COLORS[idx % AVATAR_COLORS.length], status: s.status || "present", notes: s.notes }));
  }
  if (studentsToImport.length === 0) return res.status(400).json({ error: "No valid students found to import" });
  const current = await db.getStudents();
  const merged = [...studentsToImport, ...current.filter((c) => !studentsToImport.some((s) => s.rollNo === c.rollNo))];
  await db.replaceStudents(merged);
  res.json({ success: true, importedCount: studentsToImport.length, totalCount: merged.length, data: merged });
});
studentsRouter.get("/export-csv", async (_req, res) => {
  const students = await db.getStudents();
  const headers = ["Roll No", "Name", "Email", "Live Status", "Notes"];
  const rows = students.map((s) => [`"${s.rollNo}"`, `"${s.name}"`, `"${s.email}"`, `"${s.status}"`, `"${(s.notes || "").replace(/"/g, '""')}"`]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=attendpulse-students-${Date.now()}.csv`);
  res.status(200).send(csv);
});

// server/routes/attendance.ts
import { Router as Router4 } from "express";
var attendanceRouter = Router4();
attendanceRouter.post("/check-permission", async (req, res) => {
  const { courseCode, teacherName, teacherEmail } = req.body;
  if (!courseCode) return res.status(400).json({ error: "courseCode is required" });
  const subject = await db.getSubjectByCode(courseCode);
  if (!subject) return res.status(404).json({ error: `Course ${courseCode} not found` });
  const cleanTeacherName = (teacherName || "").toLowerCase().replace(/^(prof\.|dr\.|mr\.|ms\.)\s*/, "").trim();
  const cleanAssignedName = (subject.instructor || "").toLowerCase().replace(/^(prof\.|dr\.|mr\.|ms\.)\s*/, "").trim();
  const isAssigned = teacherEmail && subject.instructorEmail && teacherEmail.toLowerCase() === subject.instructorEmail.toLowerCase() || cleanTeacherName && cleanAssignedName && (cleanTeacherName === cleanAssignedName || cleanAssignedName.includes(cleanTeacherName));
  if (isAssigned) {
    return res.json({ allowed: true, readOnly: false, courseCode: subject.code, courseName: subject.name, instructor: subject.instructor });
  }
  return res.json({ allowed: false, readOnly: true, courseCode: subject.code, courseName: subject.name, instructor: subject.instructor, message: `\u{1F512} Read-Only Mode: This class is instructed by ${subject.instructor}.` });
});
attendanceRouter.post("/session", async (req, res) => {
  const { courseCode, teacherName, teacherEmail, date, records } = req.body;
  if (!courseCode || !records || !Array.isArray(records)) return res.status(400).json({ error: "courseCode and records array are required" });
  const subject = await db.getSubjectByCode(courseCode);
  if (!subject) return res.status(404).json({ error: `Course ${courseCode} not found` });
  const cleanTeacherName = (teacherName || "").toLowerCase().replace(/^(prof\.|dr\.|mr\.|ms\.)\s*/, "").trim();
  const cleanAssignedName = (subject.instructor || "").toLowerCase().replace(/^(prof\.|dr\.|mr\.|ms\.)\s*/, "").trim();
  const isAssigned = teacherEmail && subject.instructorEmail && teacherEmail.toLowerCase() === subject.instructorEmail.toLowerCase() || cleanTeacherName && cleanAssignedName && (cleanTeacherName === cleanAssignedName || cleanAssignedName.includes(cleanTeacherName));
  if (!isAssigned) return res.status(403).json({ error: "Security Audit Violation", message: `\u{1F512} Read-Only Mode: Only ${subject.instructor} can record attendance for this course.` });
  const total = records.length;
  let present = 0, absent = 0, late = 0, excused = 0;
  for (const r of records) {
    if (r.status === "present") present++;
    else if (r.status === "absent") absent++;
    else if (r.status === "late") late++;
    else if (r.status === "excused") excused++;
  }
  const percentage = total > 0 ? Math.round((present + late * 0.75) / total * 100) : 0;
  const session = await db.addSession({
    date: date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    subjectCode: subject.code,
    subjectName: subject.name,
    instructor: subject.instructor,
    markedBy: teacherName || subject.instructor,
    markedByEmail: teacherEmail || "",
    records,
    summary: { total, present, absent, late, excused, percentage }
  });
  res.status(201).json({ success: true, message: `Attendance logged for ${subject.code} (${percentage}% attendance)`, data: session });
});
attendanceRouter.get("/history", async (req, res) => {
  const { courseCode } = req.query;
  let sessions = await db.getSessions();
  if (courseCode) sessions = sessions.filter((s) => s.subjectCode.toLowerCase() === String(courseCode).toLowerCase());
  res.json({ success: true, count: sessions.length, data: sessions });
});
attendanceRouter.get("/export-session/:id", async (req, res) => {
  const sessions = await db.getSessions();
  const session = sessions.find((s) => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  const headers = ["Roll No", "Student Name", "Status", "Notes"];
  const rows = session.records.map((r) => [`"${r.rollNo}"`, `"${r.name}"`, `"${r.status}"`, `"${(r.notes || "").replace(/"/g, '""')}"`]);
  const metadata = [`"AttendPulse Roll-Call Session"`, `"Course: ${session.subjectCode} - ${session.subjectName}"`, `"Instructor: ${session.instructor}"`, `"Date: ${session.date}"`, `"Attendance: ${session.summary.percentage}%"`, ``].join("\n");
  const csv = metadata + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=attendance-${session.subjectCode}-${session.date}.csv`);
  res.status(200).send(csv);
});

// server/routes/timetable.ts
import { Router as Router5 } from "express";
var timetableRouter = Router5();
timetableRouter.get("/", async (req, res) => {
  const { day, instructor, subjectCode } = req.query;
  let timetable = await db.getTimetable();
  if (day) timetable = timetable.filter((t) => t.day.toLowerCase() === String(day).toLowerCase());
  if (instructor) timetable = timetable.filter((t) => t.instructor.toLowerCase().includes(String(instructor).toLowerCase()));
  if (subjectCode) timetable = timetable.filter((t) => t.subjectCode.toLowerCase() === String(subjectCode).toLowerCase());
  res.json({ success: true, count: timetable.length, data: timetable });
});
timetableRouter.post("/slot", async (req, res) => {
  const { day, time, subjectCode, subjectName, instructor, room, status = "upcoming" } = req.body;
  if (!day || !time || !subjectCode || !subjectName || !instructor) return res.status(400).json({ error: "day, time, subjectCode, subjectName, and instructor are required" });
  const newSlot = await db.addTimetableSlot({ day, time, subjectCode: subjectCode.toUpperCase(), subjectName, instructor, room: room || "Hall 101", status });
  res.status(201).json({ success: true, data: newSlot });
});
timetableRouter.put("/slot/:id", async (req, res) => {
  const updated = await db.updateTimetableSlot(String(req.params.id), req.body);
  if (!updated) return res.status(404).json({ error: "Timetable slot not found" });
  res.json({ success: true, data: updated });
});
timetableRouter.delete("/slot/:id", async (req, res) => {
  const success = await db.deleteTimetableSlot(String(req.params.id));
  if (!success) return res.status(404).json({ error: "Timetable slot not found" });
  res.json({ success: true, message: "Slot deleted successfully" });
});
timetableRouter.post("/bulk-import", async (req, res) => {
  const { timetable: rawSlots, csvText } = req.body;
  let importedSlots = [];
  if (csvText && typeof csvText === "string") {
    const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
    const startIndex = lines[0].toLowerCase().includes("day") ? 1 : 0;
    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length >= 5) {
        importedSlots.push({ id: `tt-${Date.now()}-${i}`, day: parts[0], time: parts[1], subjectCode: parts[2].toUpperCase(), subjectName: parts[3], instructor: parts[4], room: parts[5] || "Hall 101", status: parts[6] || "upcoming" });
      }
    }
  } else if (Array.isArray(rawSlots)) {
    importedSlots = rawSlots.map((s, idx) => ({ id: s.id || `tt-${Date.now()}-${idx}`, day: s.day, time: s.time, subjectCode: (s.subjectCode || "").toUpperCase(), subjectName: s.subjectName, instructor: s.instructor, room: s.room || "Hall 101", status: s.status || "upcoming" }));
  }
  if (importedSlots.length === 0) return res.status(400).json({ error: "No valid timetable entries found" });
  await db.replaceTimetable(importedSlots);
  res.json({ success: true, importedCount: importedSlots.length, data: importedSlots });
});
timetableRouter.get("/export-csv", async (_req, res) => {
  const timetable = await db.getTimetable();
  const headers = ["Day", "Time", "Course Code", "Course Name", "Instructor", "Room", "Status"];
  const rows = timetable.map((t) => [`"${t.day}"`, `"${t.time}"`, `"${t.subjectCode}"`, `"${t.subjectName}"`, `"${t.instructor}"`, `"${t.room}"`, `"${t.status || "upcoming"}"`]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=attendpulse-timetable-${Date.now()}.csv`);
  res.status(200).send(csv);
});

// server/routes/notifications.ts
import { Router as Router6 } from "express";
var notificationsRouter = Router6();
notificationsRouter.get("/", async (req, res) => {
  const { studentId } = req.query;
  let notifications = await db.getNotifications();
  if (studentId) {
    notifications = notifications.filter((n) => !n.target || n.target.scope === "all" || n.target.studentIds?.includes(String(studentId)));
  }
  res.json({ success: true, count: notifications.length, data: notifications });
});
notificationsRouter.post("/", async (req, res) => {
  const { title, message, type = "info", sender, target, attachments, links } = req.body;
  if (!title || !message) return res.status(400).json({ error: "Title and message are required" });
  const newNotif = await db.addNotification({
    title,
    message,
    type: ["alert", "success", "info"].includes(type) ? type : "info",
    sender: sender || { name: "Academic Office", role: "system" },
    target: target || { scope: "all" },
    attachments,
    links
  });
  res.status(201).json({ success: true, data: newNotif });
});
notificationsRouter.put("/:id/read", async (req, res) => {
  const updated = await db.markNotificationAsRead(String(req.params.id));
  if (!updated) return res.status(404).json({ error: "Notification not found" });
  res.json({ success: true, data: updated });
});
notificationsRouter.delete("/:id", async (req, res) => {
  const success = await db.deleteNotification(String(req.params.id));
  if (!success) return res.status(404).json({ error: "Notification not found" });
  res.json({ success: true, message: "Notification removed" });
});

// server/routes/profile.ts
import { Router as Router7 } from "express";
var profileRouter = Router7();
profileRouter.get("/", async (req, res) => {
  const email = req.query.email || "";
  if (!email) return res.status(400).json({ error: "Email query parameter required" });
  const user = await db.getUserByEmail(email);
  if (!user) return res.status(404).json({ error: "User profile not found" });
  res.json({ success: true, data: { name: user.name, email: user.email, role: user.role, rollNo: user.rollNo, department: user.department, semester: user.semester, institution: user.institution, minAttendanceGoal: user.minAttendanceGoal, designation: user.designation } });
});
profileRouter.put("/", async (req, res) => {
  const { email, ...updates } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required to update profile" });
  const updated = await db.updateUserProfile(email, updates);
  if (!updated) return res.status(404).json({ error: "User not found" });
  res.json({ success: true, data: { name: updated.name, email: updated.email, role: updated.role, rollNo: updated.rollNo, department: updated.department, semester: updated.semester, institution: updated.institution, minAttendanceGoal: updated.minAttendanceGoal, designation: updated.designation } });
});

// server/index.ts
dotenv3.config();
var app = express();
var PORT = Number(process.env.PORT) || 5e3;
var HOST = "0.0.0.0";
var rawFrontendUrl = process.env.FRONTEND_URL || "";
var allowedOrigins = rawFrontendUrl ? rawFrontendUrl.split(",").map((u) => u.trim().replace(/\/$/, "")) : ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== "production" || rawFrontendUrl === "*" || allowedOrigins.includes(origin) || allowedOrigins.some((allowed) => allowed && origin.startsWith(allowed))) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use((req, _res, next) => {
  if (req.url.startsWith("/api/index")) {
    req.url = req.url.replace(/^\/api\/index/, "/api") || "/api";
  }
  next();
});
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().split("T")[1].split(".")[0];
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
  });
}
var healthHandler = (_req, res) => {
  res.json({
    status: "online",
    service: "AttendPulse Academic Engine API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    database: db.getEngineType(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};
app.get("/health", healthHandler);
app.get("/api/health", healthHandler);
app.use("/api/auth", authRouter);
app.use("/auth", authRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/subjects", subjectsRouter);
app.use("/api/students", studentsRouter);
app.use("/students", studentsRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/attendance", attendanceRouter);
app.use("/api/timetable", timetableRouter);
app.use("/timetable", timetableRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/notifications", notificationsRouter);
app.use("/api/profile", profileRouter);
app.use("/profile", profileRouter);
app.use((req, res) => {
  res.status(404).json({ error: `Endpoint ${req.originalUrl} not found` });
});
app.use((err, _req, res, _next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err?.message || "Unknown error" });
});
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  app.listen(PORT, HOST, () => {
    console.log(`\u{1F680} AttendPulse Backend Server running in ${process.env.NODE_ENV || "development"} mode`);
    console.log(`\u{1F4E1} Listening on http://${HOST}:${PORT}`);
    console.log(`\u{1F4CA} Health check ready at http://localhost:${PORT}/health and /api/health`);
    console.log(`\u{1F4BE} Database Engine: ${db.getEngineType()}`);
  });
}
var index_default = app;
export {
  index_default as default
};
