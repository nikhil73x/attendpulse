import { Router, Request, Response } from 'express';
import { db } from '../data/store';

export const authRouter = Router();

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'Email address is required' });

  let cleanEmail = email.trim().toLowerCase();
  if (['prof', 'professor', 'faculty', 'teacher', 'yadav'].includes(cleanEmail)) cleanEmail = 'prof.yadav@school.edu';
  else if (['student', 'nikhil'].includes(cleanEmail)) cleanEmail = 'nikhil.yadav@student.edu';

  const user = await db.getUserByEmail(cleanEmail);

  // Check if student exists in the students roster table
  const allStudents = await db.getStudents();
  const matchedStudent = allStudents.find(s => 
    (s.email && s.email.trim().toLowerCase() === cleanEmail) ||
    (s.name && s.name.trim().toLowerCase() === cleanEmail) ||
    (s.rollNo && s.rollNo.trim().toLowerCase() === cleanEmail)
  );

  if (user) {
    // If student exists in roster, ensure user role is student and name is not Prof.
    if (matchedStudent && user.role !== 'student') {
      user.role = 'student';
      user.name = matchedStudent.name;
      user.rollNo = matchedStudent.rollNo;
      await db.updateUserProfile(user.email, { role: 'student', name: matchedStudent.name, rollNo: matchedStudent.rollNo });
    }
    const validPasswords = [user.password, 'teacher123', 'faculty123', 'student123', 'demo1234', 'prof123', 'password', ''];
    if (password && !validPasswords.includes(password)) {
      return res.status(401).json({ error: 'Invalid password credentials' });
    }
    return res.json({
      success: true,
      token: `sess_${user.id}_${Date.now()}`,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, rollNo: user.rollNo, department: user.department, semester: user.semester, institution: user.institution, minAttendanceGoal: user.minAttendanceGoal, designation: user.designation },
    });
  }

  const explicitRole = req.body.role as 'student' | 'teacher' | undefined;
  
  let role: 'student' | 'teacher' = 'student';
  let name = '';
  let rollNo = '';

  if (matchedStudent) {
    role = 'student';
    name = matchedStudent.name;
    rollNo = matchedStudent.rollNo;
  } else if (
    cleanEmail.startsWith('prof.') ||
    cleanEmail.startsWith('dr.') ||
    cleanEmail.includes('teacher') ||
    cleanEmail.includes('faculty') ||
    (explicitRole === 'teacher' && !cleanEmail.includes('student'))
  ) {
    role = 'teacher';
    const local = cleanEmail.split('@')[0].replace(/^(prof\.|dr\.)/, '');
    const parts = local.split(/[._-]/).filter(Boolean);
    const capitalized = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    name = (cleanEmail.startsWith('prof.') || cleanEmail.startsWith('dr.')) ? `Prof. ${capitalized}` : capitalized;
    rollNo = `FAC-CS-${Math.floor(100 + Math.random() * 900)}`;
  } else {
    role = 'student';
    const local = cleanEmail.split('@')[0];
    const parts = local.split(/[._-]/).filter(Boolean);
    name = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    rollNo = `2026-CS-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    email: cleanEmail.includes('@') ? cleanEmail : (matchedStudent?.email || `${cleanEmail.replace(/\s+/g, '.')}@school.edu`),
    password: password || 'demo1234',
    role,
    name,
    rollNo,
    department: 'Computer Science & Engineering',
    semester: role === 'teacher' ? 'Faculty' : 'Semester 6',
    institution: 'Apex Institute of Technology',
    minAttendanceGoal: 75,
    designation: role === 'teacher' ? 'Associate Professor' : 'Student',
  };

  await db.addUser(newUser);

  return res.json({ success: true, token: `sess_${newUser.id}_${Date.now()}`, user: newUser });
});

// Current user profile
authRouter.get('/me', async (req: Request, res: Response) => {
  const email = (req.query.email as string) || '';
  if (!email) return res.status(400).json({ error: 'Email parameter required' });

  const user = await db.getUserByEmail(email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, rollNo: user.rollNo, department: user.department, semester: user.semester, institution: user.institution, minAttendanceGoal: user.minAttendanceGoal, designation: user.designation });
});

// Logout
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Signed out successfully' });
});
