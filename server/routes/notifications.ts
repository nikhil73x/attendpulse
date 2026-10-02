import { Router, Request, Response } from 'express';
import { db } from '../data/store';

export const notificationsRouter = Router();

notificationsRouter.get('/', async (req: Request, res: Response) => {
  const { studentId } = req.query;
  let notifications = await db.getNotifications();
  if (studentId) {
    notifications = notifications.filter(n => !n.target || n.target.scope === 'all' || n.target.studentIds?.includes(String(studentId)));
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
  const updated = await db.markNotificationAsRead(req.params.id);
  if (!updated) return res.status(404).json({ error: 'Notification not found' });
  res.json({ success: true, data: updated });
});

notificationsRouter.delete('/:id', async (req: Request, res: Response) => {
  const success = await db.deleteNotification(req.params.id);
  if (!success) return res.status(404).json({ error: 'Notification not found' });
  res.json({ success: true, message: 'Notification removed' });
});
