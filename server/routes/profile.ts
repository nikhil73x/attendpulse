import { Router, Request, Response } from 'express';
import { db } from '../data/store';

export const profileRouter = Router();

profileRouter.get('/', (req: Request, res: Response) => {
  const email = (req.query.email as string) || '';
  if (!email) {
    return res.status(400).json({ error: 'Email query parameter required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  res.json({
    success: true,
    data: {
      name: user.name,
      email: user.email,
      role: user.role,
      rollNo: user.rollNo,
      department: user.department,
      semester: user.semester,
      institution: user.institution,
      minAttendanceGoal: user.minAttendanceGoal,
      designation: user.designation,
    },
  });
});

profileRouter.put('/', (req: Request, res: Response) => {
  const { email, ...updates } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required to update profile' });
  }

  const updated = db.updateUserProfile(email, updates);
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    success: true,
    data: {
      name: updated.name,
      email: updated.email,
      role: updated.role,
      rollNo: updated.rollNo,
      department: updated.department,
      semester: updated.semester,
      institution: updated.institution,
      minAttendanceGoal: updated.minAttendanceGoal,
      designation: updated.designation,
    },
  });
});
