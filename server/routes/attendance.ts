import { Router, Request, Response } from 'express';
import { db } from '../data/store';

export const attendanceRouter = Router();

// Tamper Prevention & Audit Mode permission verification
attendanceRouter.post('/check-permission', (req: Request, res: Response) => {
  const { courseCode, teacherName, teacherEmail } = req.body;

  if (!courseCode) {
    return res.status(400).json({ error: 'courseCode is required' });
  }

  const subject = db.getSubjectByCode(courseCode);
  if (!subject) {
    return res.status(404).json({ error: `Course ${courseCode} not found` });
  }

  const assignedInstructor = subject.instructor;
  const assignedEmail = subject.instructorEmail;

  // Normalize strings for resilient matching
  const cleanTeacherName = (teacherName || '').toLowerCase().replace(/^(prof\.|dr\.|mr\.|ms\.)\s*/, '').trim();
  const cleanAssignedName = (assignedInstructor || '').toLowerCase().replace(/^(prof\.|dr\.|mr\.|ms\.)\s*/, '').trim();

  const isAssigned =
    (teacherEmail && assignedEmail && teacherEmail.toLowerCase() === assignedEmail.toLowerCase()) ||
    (cleanTeacherName && cleanAssignedName && (cleanTeacherName === cleanAssignedName || cleanAssignedName.includes(cleanTeacherName)));

  if (isAssigned) {
    return res.json({
      allowed: true,
      readOnly: false,
      courseCode: subject.code,
      courseName: subject.name,
      instructor: assignedInstructor,
    });
  }

  // Audit / Read-Only Mode enforced
  return res.json({
    allowed: false,
    readOnly: true,
    courseCode: subject.code,
    courseName: subject.name,
    instructor: assignedInstructor,
    message: `🔒 Read-Only Mode: This class is instructed by ${assignedInstructor}. Only the assigned instructor is authorized to record or alter student attendance for this course.`,
  });
});

// Save an attendance roll-call session
attendanceRouter.post('/session', (req: Request, res: Response) => {
  const {
    courseCode,
    teacherName,
    teacherEmail,
    date,
    records,
  } = req.body;

  if (!courseCode || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'courseCode and records array are required' });
  }

  const subject = db.getSubjectByCode(courseCode);
  if (!subject) {
    return res.status(404).json({ error: `Course ${courseCode} not found` });
  }

  // Enforce server-side tamper prevention audit
  const cleanTeacherName = (teacherName || '').toLowerCase().replace(/^(prof\.|dr\.|mr\.|ms\.)\s*/, '').trim();
  const cleanAssignedName = (subject.instructor || '').toLowerCase().replace(/^(prof\.|dr\.|mr\.|ms\.)\s*/, '').trim();

  const isAssigned =
    (teacherEmail && subject.instructorEmail && teacherEmail.toLowerCase() === subject.instructorEmail.toLowerCase()) ||
    (cleanTeacherName && cleanAssignedName && (cleanTeacherName === cleanAssignedName || cleanAssignedName.includes(cleanTeacherName)));

  if (!isAssigned) {
    return res.status(403).json({
      error: 'Security Audit Violation',
      message: `🔒 Read-Only Mode: This class is instructed by ${subject.instructor}. You are not authorized to alter or record attendance for this course.`,
    });
  }

  // Compute session metrics
  const total = records.length;
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  for (const r of records) {
    if (r.status === 'present') present++;
    else if (r.status === 'absent') absent++;
    else if (r.status === 'late') late++;
    else if (r.status === 'excused') excused++;
  }

  const percentage = total > 0 ? Math.round(((present + late * 0.75) / total) * 100) : 0;

  const session = db.addSession({
    date: date || new Date().toISOString().split('T')[0],
    subjectCode: subject.code,
    subjectName: subject.name,
    instructor: subject.instructor,
    markedBy: teacherName || subject.instructor,
    markedByEmail: teacherEmail || '',
    records,
    summary: {
      total,
      present,
      absent,
      late,
      excused,
      percentage,
    },
  });

  res.status(201).json({
    success: true,
    message: `Attendance session successfully logged for ${subject.code} (${percentage}% attendance)`,
    data: session,
  });
});

// Get attendance history sessions
attendanceRouter.get('/history', (req: Request, res: Response) => {
  const { courseCode } = req.query;
  let sessions = db.getSessions();

  if (courseCode) {
    sessions = sessions.filter((s) => s.subjectCode.toLowerCase() === String(courseCode).toLowerCase());
  }

  res.json({ success: true, count: sessions.length, data: sessions });
});

// Export a session report to CSV
attendanceRouter.get('/export-session/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const sessions = db.getSessions();
  const session = sessions.find((s) => s.id === id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const headers = ['Roll No', 'Student Name', 'Status', 'Notes'];
  const rows = session.records.map((r) => [
    `"${r.rollNo}"`,
    `"${r.name}"`,
    `"${r.status}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);

  const metadata = [
    `"AttendPulse Roll-Call Session"`,
    `"Course: ${session.subjectCode} - ${session.subjectName}"`,
    `"Instructor: ${session.instructor}"`,
    `"Date: ${session.date}"`,
    `"Attendance Percentage: ${session.summary.percentage}%"`,
    `"Present: ${session.summary.present}, Absent: ${session.summary.absent}, Late: ${session.summary.late}, Excused: ${session.summary.excused}"`,
    ``,
  ].join('\n');

  const csv = metadata + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=attendance-${session.subjectCode}-${session.date}.csv`);
  res.status(200).send(csv);
});
