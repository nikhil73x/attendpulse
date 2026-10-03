import { Student, SubjectAttendance, TimetableSlot, AttendanceNotification, UserProfile } from '../types/attendance';

export const initialProfile: UserProfile = {
  name: 'Nikhil Yadav',
  email: 'nikhil.yadav@student.edu',
  role: 'student',
  rollNo: '2026-CS-0455',
  department: 'Computer Science & Engineering',
  semester: 'Semester 6',
  institution: 'Apex Institute of Technology',
  minAttendanceGoal: 75,
  designation: 'Student',
};

export const initialSubjects: SubjectAttendance[] = [];

export const initialStudents: Student[] = [];

export const initialTimetable: TimetableSlot[] = [];

export const initialNotifications: AttendanceNotification[] = [];
