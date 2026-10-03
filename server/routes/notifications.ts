import { Router, Request, Response } from 'express';
import { db } from '../data/store';

export const notificationsRouter = Router();

notificationsRouter.get('/', async (req: Request, res: Response) => {
  const { studentId, email, rollNo } = req.query;
  let notifications = await db.getNotifications();
  if (studentId || email || rollNo) {
    const sId = studentId ? String(studentId).toLowerCase().trim() : undefined;
    const sEmail = email ? String(email).toLowerCase().trim() : undefined;
    const sRoll = rollNo ? String(rollNo).toLowerCase().trim() : undefined;

    notifications = notifications.filter((n) => {
      if (!n.target || n.target.scope === 'all') return true;
      const target = n.target as any;
      const matchId = sId && target.studentIds?.some((id: string) => id.toLowerCase().trim() === sId);
      const matchEmail = sEmail && target.studentEmails?.some((e: string) => e?.toLowerCase().trim() === sEmail);
      const matchRoll = sRoll && target.studentRollNos?.some((r: string) => r?.toLowerCase().trim() === sRoll);
      return matchId || matchEmail || matchRoll;
    });
  }
  res.json({ success: true, count: notifications.length, data: notifications });
});

notificationsRouter.post('/', async (req: Request, res: Response) => {
  const { title, message, type = 'info', sender, target, attachments, links } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });
  const newNotif = await db.addNotification({
    title, message,
    type: ['alert', 'success', 'info'].includes(type) ? type : 'info',
    sender: sender || { name: 'Academic Office', role: 'system' },
    target: target || { scope: 'all' },
    attachments, links,
  });
  res.status(201).json({ success: true, data: newNotif });
});

notificationsRouter.put('/:id/read', async (req: Request, res: Response) => {
  const updated = await db.markNotificationAsRead(String(req.params.id));
  if (!updated) return res.status(404).json({ error: 'Notification not found' });
  res.json({ success: true, data: updated });
});

notificationsRouter.delete('/', async (_req: Request, res: Response) => {
  await db.clearNotifications();
  res.json({ success: true, message: 'All notifications cleared' });
});

notificationsRouter.delete('/:id', async (req: Request, res: Response) => {
  const success = await db.deleteNotification(String(req.params.id));
  if (!success) return res.status(404).json({ error: 'Notification not found' });
  res.json({ success: true, message: 'Notification removed' });
});
