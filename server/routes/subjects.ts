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

  // Auto-schedule slot in timetable if none exists for this subject
  try {
    const timetable = await db.getTimetable();
    const hasSlot = timetable.some(t => t.subjectCode.toUpperCase() === newSubject.code.toUpperCase());
    if (!hasSlot) {
      const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const times = ['09:30 AM - 10:30 AM', '11:00 AM - 12:30 PM', '02:00 PM - 03:30 PM'];
      const slotDay = days[timetable.length % days.length];
      const slotTime = times[timetable.length % times.length];
      await db.addTimetableSlot({
        day: slotDay,
        time: slotTime,
        subjectCode: newSubject.code.toUpperCase(),
        subjectName: newSubject.name,
        instructor: newSubject.instructor,
        room: newSubject.room || 'Hall 101',
        status: 'upcoming'
      });
    }
  } catch (err) {
    console.warn('Auto timetable slot notice:', err);
  }

  res.status(201).json({ success: true, data: newSubject });
});

subjectsRouter.post('/bulk-import', async (req: Request, res: Response) => {
  const { subjects: rawSubjects } = req.body;
  if (!Array.isArray(rawSubjects) || rawSubjects.length === 0) {
    return res.status(400).json({ error: 'Array of subjects required' });
  }
  const formatted = rawSubjects.map((s, idx) => ({
    id: s.id || `sub-${Date.now()}-${idx}`,
    code: (s.code || '').toUpperCase(),
    name: s.name || 'Unnamed Course',
    instructor: s.instructor || 'Faculty Incharge',
    instructorEmail: s.instructorEmail || null,
    room: s.room || 'Hall 101',
    credits: Number(s.credits) || 3,
    attended: Number(s.attended) || 0,
    total: Number(s.total) || 0,
  }));
  const saved = await db.replaceSubjects(formatted);

  // Auto-schedule slots in timetable for imported subjects
  try {
    const timetable = await db.getTimetable();
    const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const times = ['09:30 AM - 10:30 AM', '11:00 AM - 12:30 PM', '02:00 PM - 03:30 PM'];
    let offset = timetable.length;
    for (const sub of formatted) {
      const hasSlot = timetable.some(t => t.subjectCode.toUpperCase() === sub.code.toUpperCase());
      if (!hasSlot) {
        const slotDay = days[offset % days.length];
        const slotTime = times[offset % times.length];
        await db.addTimetableSlot({
          day: slotDay,
          time: slotTime,
          subjectCode: sub.code.toUpperCase(),
          subjectName: sub.name,
          instructor: sub.instructor,
          room: sub.room || 'Hall 101',
          status: 'upcoming'
        });
        offset++;
      }
    }
  } catch (err) {
    console.warn('Auto bulk timetable sync notice:', err);
  }

  res.json({ success: true, count: saved.length, data: saved });
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
