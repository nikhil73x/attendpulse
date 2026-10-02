import { Router, Request, Response } from 'express';
import { db } from '../data/store';

export const subjectsRouter = Router();

subjectsRouter.get('/', async (req: Request, res: Response) => {
  const teacher = (req.query.teacher as string) || '';
  let subjects = await db.getSubjects();
  if (teacher) {
    const c = teacher.toLowerCase();
    subjects = subjects.filter(s => s.instructor.toLowerCase().includes(c) || (s.instructorEmail && s.instructorEmail.toLowerCase() === c));
  }
  res.json({ success: true, count: subjects.length, data: subjects });
});

subjectsRouter.get('/:code', async (req: Request, res: Response) => {
  const subject = await db.getSubjectByCode(String(req.params.code));
  if (!subject) return res.status(404).json({ error: `Subject ${req.params.code} not found` });
  res.json({ success: true, data: subject });
});

subjectsRouter.post('/', async (req: Request, res: Response) => {
  const { code, name, instructor, instructorEmail, room, credits, attended = 0, total = 0 } = req.body;
  if (!code || !name || !instructor) return res.status(400).json({ error: 'Code, name, and instructor are required' });
  const existing = await db.getSubjectByCode(code);
  if (existing) return res.status(409).json({ error: `Subject ${code} already exists` });
  const newSubject = await db.addSubject({ code: code.toUpperCase(), name, instructor, instructorEmail, room: room || 'Hall 101', credits: Number(credits) || 3, attended: Number(attended) || 0, total: Number(total) || 0 });
  res.status(201).json({ success: true, data: newSubject });
});

subjectsRouter.put('/:id', async (req: Request, res: Response) => {
  const updated = await db.updateSubject(String(req.params.id), req.body);
  if (!updated) return res.status(404).json({ error: 'Subject not found' });
  res.json({ success: true, data: updated });
});

subjectsRouter.post('/:id/attendance-delta', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { attendedDelta = 0, totalDelta = 0 } = req.body;
  const subjects = await db.getSubjects();
  const subject = subjects.find(s => s.id === id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  const newAttended = Math.max(0, subject.attended + Number(attendedDelta));
  const newTotal    = Math.max(newAttended, subject.total + Number(totalDelta));
  const updated = await db.updateSubject(id, { attended: newAttended, total: newTotal });
  res.json({ success: true, data: updated });
});
