import { Router, Request, Response } from 'express';
import { db } from '../data/store';

export const notificationsRouter = Router();

// Get notifications
notificationsRouter.get('/', (req: Request, res: Response) => {
  const { studentId } = req.query;
  let notifications = db.getNotifications();

  if (studentId) {
    notifications = notifications.filter((n) => {
      if (!n.target || n.target.scope === 'all') return true;
      return n.target.studentIds?.includes(String(studentId));
    });
  }

  res.json({ success: true, count: notifications.length, data: notifications });
});

// Broadcast / Send Notification
notificationsRouter.post('/', (req: Request, res: Response) => {
  const { title, message, type = 'info', sender, target, attachments, links } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  const newNotif = db.addNotification({
    title,
    message,
    type: ['alert', 'success', 'info'].includes(type) ? type : 'info',
    sender: sender || { name: 'Academic Office', role: 'system' },
    target: target || { scope: 'all' },
    attachments,
    links,
  });

  res.status(201).json({ success: true, data: newNotif });
});

// Mark as read
notificationsRouter.put('/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = db.markNotificationAsRead(id);

  if (!updated) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  res.json({ success: true, data: updated });
});

// Delete notification
notificationsRouter.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = db.deleteNotification(id);

  if (!success) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  res.json({ success: true, message: 'Notification removed' });
});
