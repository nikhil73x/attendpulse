import { Router, Request, Response } from 'express';
import { db, TimetableItem } from '../data/store';

export const timetableRouter = Router();

// Get weekly timetable
timetableRouter.get('/', (req: Request, res: Response) => {
  const { day, instructor, subjectCode } = req.query;
  let timetable = db.getTimetable();

  if (day) {
    timetable = timetable.filter((t) => t.day.toLowerCase() === String(day).toLowerCase());
  }

  if (instructor) {
    const cleanInstructor = String(instructor).toLowerCase();
    timetable = timetable.filter((t) => t.instructor.toLowerCase().includes(cleanInstructor));
  }

  if (subjectCode) {
    timetable = timetable.filter((t) => t.subjectCode.toLowerCase() === String(subjectCode).toLowerCase());
  }

  res.json({ success: true, count: timetable.length, data: timetable });
});

// Add single timetable slot
timetableRouter.post('/slot', (req: Request, res: Response) => {
  const { day, time, subjectCode, subjectName, instructor, room, status = 'upcoming' } = req.body;

  if (!day || !time || !subjectCode || !subjectName || !instructor) {
    return res.status(400).json({ error: 'day, time, subjectCode, subjectName, and instructor are required' });
  }

  const newSlot = db.addTimetableSlot({
    day,
    time,
    subjectCode: subjectCode.toUpperCase(),
    subjectName,
    instructor,
    room: room || 'Hall 101',
    status,
  });

  res.status(201).json({ success: true, data: newSlot });
});

// Update slot
timetableRouter.put('/slot/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.updateTimetableSlot(id, req.body);

  if (!updated) {
    return res.status(404).json({ error: 'Timetable slot not found' });
  }

  res.json({ success: true, data: updated });
});

// Delete slot
timetableRouter.delete('/slot/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = db.deleteTimetableSlot(id);

  if (!success) {
    return res.status(404).json({ error: 'Timetable slot not found' });
  }

  res.json({ success: true, message: 'Slot deleted successfully' });
});

// Bulk Import Timetable (CSV or JSON array)
timetableRouter.post('/bulk-import', (req: Request, res: Response) => {
  const { timetable: rawSlots, csvText } = req.body;
  let importedSlots: TimetableItem[] = [];

  if (csvText && typeof csvText === 'string') {
    const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean);
    const startIndex = lines[0].toLowerCase().includes('day') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 5) {
        const day = parts[0] as any;
        const time = parts[1];
        const subjectCode = parts[2].toUpperCase();
        const subjectName = parts[3];
        const instructor = parts[4];
        const room = parts[5] || 'Hall 101';
        const status = (parts[6] as any) || 'upcoming';

        importedSlots.push({
          id: `tt-${Date.now()}-${i}`,
          day,
          time,
          subjectCode,
          subjectName,
          instructor,
          room,
          status,
        });
      }
    }
  } else if (Array.isArray(rawSlots)) {
    importedSlots = rawSlots.map((s, idx) => ({
      id: s.id || `tt-${Date.now()}-${idx}`,
      day: s.day,
      time: s.time,
      subjectCode: (s.subjectCode || '').toUpperCase(),
      subjectName: s.subjectName,
      instructor: s.instructor,
      room: s.room || 'Hall 101',
      status: s.status || 'upcoming',
    }));
  }

  if (importedSlots.length === 0) {
    return res.status(400).json({ error: 'No valid timetable entries found' });
  }

  db.replaceTimetable(importedSlots);
  res.json({
    success: true,
    importedCount: importedSlots.length,
    data: importedSlots,
  });
});

// Export Timetable to CSV
timetableRouter.get('/export-csv', (_req: Request, res: Response) => {
  const timetable = db.getTimetable();

  const headers = ['Day', 'Time', 'Course Code', 'Course Name', 'Instructor', 'Room', 'Status'];
  const rows = timetable.map((t) => [
    `"${t.day}"`,
    `"${t.time}"`,
    `"${t.subjectCode}"`,
    `"${t.subjectName}"`,
    `"${t.instructor}"`,
    `"${t.room}"`,
    `"${t.status || 'upcoming'}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=attendpulse-timetable-${Date.now()}.csv`);
  res.status(200).send(csv);
});
