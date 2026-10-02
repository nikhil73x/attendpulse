export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  avatarColor: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface SubjectAttendance {
  id: string;
  code: string;
  name: string;
  instructor: string;
  room: string;
  attended: number;
  total: number;
  credits: number;
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  time: string;
  subjectCode: string;
  subjectName: string;
  instructor: string;
  room: string;
  status?: 'completed' | 'ongoing' | 'upcoming';
}

export interface NotificationAttachment {
  name: string;
  size?: string;
  url: string;
  type?: string;
}

export interface NotificationLink {
  title: string;
  url: string;
}

export interface AttendanceNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'alert' | 'success' | 'info';
  read: boolean;
  sender?: {
    name: string;
    role: 'teacher' | 'system' | 'student';
    email?: string;
  };
  target?: {
    scope: 'all' | 'selected';
    studentIds?: string[];
    studentNames?: string[];
  };
  attachments?: NotificationAttachment[];
  links?: NotificationLink[];
}

export interface UserProfile {
  name: string;
  email: string;
  role: 'student' | 'teacher';
  rollNo: string;
  department: string;
  semester: string;
  institution: string;
  minAttendanceGoal: number; // e.g. 75
  designation?: string;      // e.g. "Associate Professor" for teachers, "Student" for students
}
