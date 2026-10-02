import { Router, Request, Response } from 'express';
import { db } from '../data/store';

export const subjectsRouter = Router();

// Get all subjects
subjectsRouter.get('/', (req: Request, res: Response) => {
  const teacher = (req.query.teacher as string) || '';
  let subjects = db.getSubjects();

  if (teacher) {
    const cleanTeacher = teacher.toLowerCase();
    subjects = subjects.filter(
      (s) =>
        s.instructor.toLowerCase().includes(cleanTeacher) ||
        (s.instructorEmail && s.instructorEmail.toLowerCase() === cleanTeacher)
    );
  }

  res.json({ success: true, count: subjects.length, data: subjects });
});

// Get single subject by code
subjectsRouter.get('/:code', (req: Request, res: Response) => {
  const code = String(req.params.code);
  const subject = db.getSubjectByCode(code);
  if (!subject) {
    return res.status(404).json({ error: `Subject ${code} not found` });
  }
  res.json({ success: true, data: subject });
});

// Create new subject
subjectsRouter.post('/', (req: Request, res: Response) => {
  const { code, name, instructor, instructorEmail, room, credits, attended = 0, total = 0 } = req.body;

  if (!code || !name || !instructor) {
    return res.status(400).json({ error: 'Code, name, and instructor are required fields' });
  }

  const existing = db.getSubjectByCode(code);
  if (existing) {
    return res.status(409).json({ error: `Subject with code ${code} already exists` });
  }

  const newSubject = db.addSubject({
    code: code.toUpperCase(),
    name,
    instructor,
    instructorEmail,
    room: room || 'Hall 101',
    credits: Number(credits) || 3,
    attended: Number(attended) || 0,
    total: Number(total) || 0,
  });

  res.status(201).json({ success: true, data: newSubject });
});

// Update subject details or attendance count
subjectsRouter.put('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const updated = db.updateSubject(id, req.body);

  if (!updated) {
    return res.status(404).json({ error: 'Subject not found' });
  }

  res.json({ success: true, data: updated });
});

// Adjust subject attendance delta
subjectsRouter.post('/:id/attendance-delta', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { attendedDelta = 0, totalDelta = 0 } = req.body;

  const subjects = db.getSubjects();
  const subject = subjects.find((s) => s.id === id);

  if (!subject) {
    return res.status(404).json({ error: 'Subject not found' });
  }

  const newAttended = Math.max(0, subject.attended + Number(attendedDelta));
  const newTotal = Math.max(newAttended, subject.total + Number(totalDelta));

  const updated = db.updateSubject(id, { attended: newAttended, total: newTotal });
  res.json({ success: true, data: updated });
});
