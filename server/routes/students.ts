import { Router, Request, Response } from 'express';
import { db, StudentItem } from '../data/store';

export const studentsRouter = Router();

const AVATAR_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-purple-500 to-indigo-500',
  'from-cyan-500 to-blue-500',
];

// Get all students
studentsRouter.get('/', (_req: Request, res: Response) => {
  const students = db.getStudents();
  res.json({ success: true, count: students.length, data: students });
});

// Add single student
studentsRouter.post('/', (req: Request, res: Response) => {
  const { rollNo, name, email, avatarColor, status = 'present', notes } = req.body;

  if (!rollNo || !name || !email) {
    return res.status(400).json({ error: 'Roll number, name, and email are required' });
  }

  const randomColor = avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const newStudent = db.addStudent({
    rollNo: rollNo.trim().toUpperCase(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    avatarColor: randomColor,
    status,
    notes,
  });

  res.status(201).json({ success: true, data: newStudent });
});

// Update student details
studentsRouter.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.updateStudent(id, req.body);

  if (!updated) {
    return res.status(404).json({ error: 'Student not found' });
  }

  res.json({ success: true, data: updated });
});

// Update single student attendance status
studentsRouter.put('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!['present', 'absent', 'late', 'excused'].includes(status)) {
    return res.status(400).json({ error: 'Invalid attendance status' });
  }

  const updated = db.updateStudent(id, { status, ...(notes !== undefined ? { notes } : {}) });
  if (!updated) {
    return res.status(404).json({ error: 'Student not found' });
  }

  res.json({ success: true, data: updated });
});

// Bulk update all students status (e.g. Mark All Present / Mark All Absent)
studentsRouter.post('/bulk-status', (req: Request, res: Response) => {
  const { status } = req.body;

  if (!['present', 'absent', 'late', 'excused'].includes(status)) {
    return res.status(400).json({ error: 'Invalid attendance status' });
  }

  const updatedStudents = db.bulkUpdateStudentStatus(status);
  res.json({ success: true, count: updatedStudents.length, data: updatedStudents });
});

// Bulk import students (CSV or JSON array)
studentsRouter.post('/bulk-import', (req: Request, res: Response) => {
  const { students: rawStudents, csvText } = req.body;

  let studentsToImport: StudentItem[] = [];

  // Parse CSV text if provided
  if (csvText && typeof csvText === 'string') {
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
    const startIndex = lines[0].toLowerCase().includes('roll') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2) {
        const rollNo = parts[0].toUpperCase();
        const name = parts[1];
        const email = parts[2] || `${name.toLowerCase().replace(/\s+/g, '.')}@school.edu`;
        const status = (parts[3]?.toLowerCase() as any) || 'present';
        const notes = parts[4] || '';

        studentsToImport.push({
          id: `stu-${Date.now()}-${i}`,
          rollNo,
          name,
          email,
          avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
          status: ['present', 'absent', 'late', 'excused'].includes(status) ? status : 'present',
          notes,
        });
      }
    }
  } else if (Array.isArray(rawStudents)) {
    studentsToImport = rawStudents.map((s, idx) => ({
      id: s.id || `stu-${Date.now()}-${idx}`,
      rollNo: (s.rollNo || '').toUpperCase(),
      name: s.name || 'Student',
      email: s.email || 'student@school.edu',
      avatarColor: s.avatarColor || AVATAR_COLORS[idx % AVATAR_COLORS.length],
      status: s.status || 'present',
      notes: s.notes,
    }));
  }

  if (studentsToImport.length === 0) {
    return res.status(400).json({ error: 'No valid students found to import' });
  }

  const current = db.getStudents();
  // Merge or prepend
  const merged = [...studentsToImport, ...current.filter((c) => !studentsToImport.some((s) => s.rollNo === c.rollNo))];
  db.replaceStudents(merged);

  res.json({
    success: true,
    importedCount: studentsToImport.length,
    totalCount: merged.length,
    data: merged,
  });
});

// Export students to CSV
studentsRouter.get('/export-csv', (_req: Request, res: Response) => {
  const students = db.getStudents();

  const headers = ['Roll No', 'Name', 'Email', 'Live Status', 'Notes'];
  const rows = students.map((s) => [
    `"${s.rollNo}"`,
    `"${s.name}"`,
    `"${s.email}"`,
    `"${s.status}"`,
    `"${(s.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=attendpulse-students-${Date.now()}.csv`);
  res.status(200).send(csv);
});
