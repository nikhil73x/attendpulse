import { Router, Request, Response } from 'express';
import { db, StudentItem } from '../data/store';

export const studentsRouter = Router();

const AVATAR_COLORS = [
  'from-indigo-500 to-purple-600', 'from-blue-500 to-cyan-500',
  'from-pink-500 to-rose-500',     'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',  'from-purple-500 to-indigo-500',
  'from-cyan-500 to-blue-500',
];

studentsRouter.get('/', async (_req: Request, res: Response) => {
  const students = await db.getStudents();
  res.json({ success: true, count: students.length, data: students });
});

studentsRouter.post('/', async (req: Request, res: Response) => {
  const { rollNo, name, email, avatarColor, status = 'present', notes } = req.body;
  if (!rollNo || !name || !email) return res.status(400).json({ error: 'Roll number, name, and email are required' });
  const newStudent = await db.addStudent({
    rollNo: rollNo.trim().toUpperCase(), name: name.trim(), email: email.trim().toLowerCase(),
    avatarColor: avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    status, notes,
  });
  res.status(201).json({ success: true, data: newStudent });
});

studentsRouter.put('/:id', async (req: Request, res: Response) => {
  const updated = await db.updateStudent(String(req.params.id), req.body);
  if (!updated) return res.status(404).json({ error: 'Student not found' });
  res.json({ success: true, data: updated });
});

studentsRouter.put('/:id/status', async (req: Request, res: Response) => {
  const { status, notes } = req.body;
  if (!['present', 'absent', 'late', 'excused'].includes(status)) return res.status(400).json({ error: 'Invalid attendance status' });
  const updated = await db.updateStudent(String(req.params.id), { status, ...(notes !== undefined ? { notes } : {}) });
  if (!updated) return res.status(404).json({ error: 'Student not found' });
  res.json({ success: true, data: updated });
});

studentsRouter.post('/bulk-status', async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['present', 'absent', 'late', 'excused'].includes(status)) return res.status(400).json({ error: 'Invalid attendance status' });
  const updatedStudents = await db.bulkUpdateStudentStatus(status);
  res.json({ success: true, count: updatedStudents.length, data: updatedStudents });
});

studentsRouter.post('/bulk-import', async (req: Request, res: Response) => {
  const { students: rawStudents, csvText } = req.body;
  let studentsToImport: StudentItem[] = [];

  if (csvText && typeof csvText === 'string') {
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const firstLine = lines[0];
      const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';
      const firstCols = firstLine.split(delimiter).map(c => c.trim().toLowerCase().replace(/^["']|["']$/g, ''));
      const hasHeader = firstCols.some(c => c.includes('roll') || c.includes('name') || c.includes('student') || c.includes('id') || c.includes('email'));
      
      let rollIdx = -1, nameIdx = -1, emailIdx = -1, statusIdx = -1;
      if (hasHeader) {
        firstCols.forEach((col, idx) => {
          if (col.includes('roll') || col.includes('id') || col.includes('urn') || col.includes('reg')) rollIdx = idx;
          else if (col.includes('name') || col.includes('student')) nameIdx = idx;
          else if (col.includes('email') || col.includes('mail')) emailIdx = idx;
          else if (col.includes('status') || col.includes('attendance')) statusIdx = idx;
        });
      }
      if (rollIdx === -1) rollIdx = 0;
      if (nameIdx === -1) nameIdx = 1;
      if (emailIdx === -1) emailIdx = 2;

      const startIndex = hasHeader ? 1 : 0;
      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i]
          .split(delimiter === '\t' ? '\t' : /,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2) {
          let rollNo = parts[rollIdx] || '';
          let name   = parts[nameIdx] || '';
          let email  = parts[emailIdx] || '';
          let statusRaw = (statusIdx !== -1 ? parts[statusIdx] : (parts[3] || '')).toLowerCase();

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
            email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@school.edu`;
          }

          let status: 'present' | 'absent' | 'late' | 'excused' = 'present';
          if (statusRaw.includes('absent')) status = 'absent';
          else if (statusRaw.includes('late')) status = 'late';
          else if (statusRaw.includes('excuse')) status = 'excused';

          studentsToImport.push({
            id: `stu-${Date.now()}-${i}`,
            rollNo: rollNo.toUpperCase(),
            name,
            email: email.toLowerCase(),
            avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
            status,
            notes: parts[4] || ''
          });
        }
      }
    }
  } else if (Array.isArray(rawStudents)) {
    studentsToImport = rawStudents.map((s, idx) => ({ id: s.id || `stu-${Date.now()}-${idx}`, rollNo: (s.rollNo || '').toUpperCase(), name: s.name || 'Student', email: s.email || 'student@school.edu', avatarColor: s.avatarColor || AVATAR_COLORS[idx % AVATAR_COLORS.length], status: s.status || 'present', notes: s.notes }));
  }

  if (studentsToImport.length === 0) return res.status(400).json({ error: 'No valid students found to import' });

  const current = await db.getStudents();
  const merged  = [...studentsToImport, ...current.filter(c => !studentsToImport.some(s => s.rollNo === c.rollNo))];
  await db.replaceStudents(merged);

  // Auto-sync or heal ap_users for each student so they can immediately log in as students
  for (const s of merged) {
    if (s.email) {
      try {
        const u = await db.getUserByEmail(s.email);
        if (u) {
          if (u.role !== 'student' || u.name !== s.name) {
            await db.updateUserProfile(s.email, { role: 'student', name: s.name, rollNo: s.rollNo });
          }
        } else {
          await db.addUser({
            id: `usr-${s.id || Date.now()}`,
            email: s.email.toLowerCase(),
            password: 'student123',
            role: 'student',
            name: s.name,
            rollNo: s.rollNo,
            department: 'Computer Science & Engineering',
            semester: 'Semester 6',
            institution: 'Apex Institute of Technology',
            minAttendanceGoal: 75,
            designation: 'Student'
          });
        }
      } catch (err) {
        console.warn('Student account auto-sync notice:', err);
      }
    }
  }

  res.json({ success: true, importedCount: studentsToImport.length, totalCount: merged.length, data: merged });
});

studentsRouter.get('/export-csv', async (_req: Request, res: Response) => {
  const students = await db.getStudents();
  const headers = ['Roll No', 'Name', 'Email', 'Live Status', 'Notes'];
  const rows = students.map(s => [`"${s.rollNo}"`, `"${s.name}"`, `"${s.email}"`, `"${s.status}"`, `"${(s.notes || '').replace(/"/g, '""')}"`]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=attendpulse-students-${Date.now()}.csv`);
  res.status(200).send(csv);
});
