import {
  Student,
  SubjectAttendance,
  TimetableSlot,
  AttendanceNotification,
  UserProfile,
  AttendanceStatus,
} from '../types/attendance';

const rawApiUrl = ((import.meta as any).env?.VITE_API_URL as string | undefined) || '';
const API_BASE = rawApiUrl ? rawApiUrl.replace(/\/$/, '') : '/api';

/**
 * Universal safe fetcher with JSON parsing and fallback error handling.
 */
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options?.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  async login(email: string, password?: string, role?: 'student' | 'teacher') {
    return fetchJson<{ success: boolean; token: string; user: UserProfile }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  },

  async getMe(email: string) {
    return fetchJson<UserProfile>(`${API_BASE}/auth/me?email=${encodeURIComponent(email)}`);
  },

  // Subjects
  async getSubjects(teacherFilter?: string): Promise<SubjectAttendance[]> {
    const url = teacherFilter
      ? `${API_BASE}/subjects?teacher=${encodeURIComponent(teacherFilter)}`
      : `${API_BASE}/subjects`;
    const res = await fetchJson<{ success: boolean; data: SubjectAttendance[] }>(url);
    return res.data;
  },

  async bulkImportSubjects(subjects: SubjectAttendance[]) {
    const res = await fetchJson<{ success: boolean; count: number; data: SubjectAttendance[] }>(
      `${API_BASE}/subjects/bulk-import`,
      {
        method: 'POST',
        body: JSON.stringify({ subjects }),
      }
    );
    return res;
  },

  async updateSubjectAttendance(subjectId: string, attendedDelta: number, totalDelta: number) {
    return fetchJson<{ success: boolean; data: SubjectAttendance }>(
      `${API_BASE}/subjects/${subjectId}/attendance-delta`,
      {
        method: 'POST',
        body: JSON.stringify({ attendedDelta, totalDelta }),
      }
    );
  },

  // Students
  async getStudents(): Promise<Student[]> {
    const res = await fetchJson<{ success: boolean; data: Student[] }>(`${API_BASE}/students`);
    return res.data;
  },

  async addStudent(newStudent: { rollNo: string; name: string; email: string; avatarColor?: string }) {
    const res = await fetchJson<{ success: boolean; data: Student }>(`${API_BASE}/students`, {
      method: 'POST',
      body: JSON.stringify(newStudent),
    });
    return res.data;
  },

  async updateStudentStatus(studentId: string, status: AttendanceStatus, notes?: string) {
    const res = await fetchJson<{ success: boolean; data: Student }>(`${API_BASE}/students/${studentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
    return res.data;
  },

  async bulkUpdateStudents(status: AttendanceStatus) {
    const res = await fetchJson<{ success: boolean; data: Student[] }>(`${API_BASE}/students/bulk-status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  async bulkImportStudents(options: { students?: Student[]; csvText?: string }) {
    const res = await fetchJson<{ success: boolean; importedCount: number; data: Student[] }>(
      `${API_BASE}/students/bulk-import`,
      {
        method: 'POST',
        body: JSON.stringify(options),
      }
    );
    return res;
  },

  // Attendance & Audit Mode Permission
  async checkAttendancePermission(courseCode: string, teacherName: string, teacherEmail?: string) {
    return fetchJson<{
      allowed: boolean;
      readOnly: boolean;
      courseCode: string;
      courseName: string;
      instructor: string;
      message?: string;
    }>(`${API_BASE}/attendance/check-permission`, {
      method: 'POST',
      body: JSON.stringify({ courseCode, teacherName, teacherEmail }),
    });
  },

  async saveAttendanceSession(payload: {
    courseCode: string;
    teacherName: string;
    teacherEmail?: string;
    records: Array<{ studentId: string; rollNo: string; name: string; status: AttendanceStatus; notes?: string }>;
    date?: string;
  }) {
    return fetchJson<{ success: boolean; message: string; data: any }>(`${API_BASE}/attendance/session`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getAttendanceHistory(courseCode?: string) {
    const url = courseCode
      ? `${API_BASE}/attendance/history?courseCode=${encodeURIComponent(courseCode)}`
      : `${API_BASE}/attendance/history`;
    const res = await fetchJson<{ success: boolean; data: any[] }>(url);
    return res.data;
  },

  // Timetable
  async getTimetable(day?: string, instructor?: string): Promise<TimetableSlot[]> {
    const params = new URLSearchParams();
    if (day) params.set('day', day);
    if (instructor) params.set('instructor', instructor);

    const res = await fetchJson<{ success: boolean; data: TimetableSlot[] }>(
      `${API_BASE}/timetable${params.toString() ? `?${params.toString()}` : ''}`
    );
    return res.data;
  },

  async addTimetableSlot(slot: Omit<TimetableSlot, 'id'>) {
    const res = await fetchJson<{ success: boolean; data: TimetableSlot }>(`${API_BASE}/timetable/slot`, {
      method: 'POST',
      body: JSON.stringify(slot),
    });
    return res.data;
  },

  async bulkImportTimetable(options: { timetable?: TimetableSlot[]; csvText?: string }) {
    const res = await fetchJson<{ success: boolean; importedCount: number; data: TimetableSlot[] }>(
      `${API_BASE}/timetable/bulk-import`,
      {
        method: 'POST',
        body: JSON.stringify(options),
      }
    );
    return res;
  },

  // Notifications
  async getNotifications(studentId?: string): Promise<AttendanceNotification[]> {
    const url = studentId
      ? `${API_BASE}/notifications?studentId=${encodeURIComponent(studentId)}`
      : `${API_BASE}/notifications`;
    const res = await fetchJson<{ success: boolean; data: AttendanceNotification[] }>(url);
    return res.data;
  },

  async sendNotification(payload: Omit<AttendanceNotification, 'id' | 'time' | 'read'>) {
    const res = await fetchJson<{ success: boolean; data: AttendanceNotification }>(`${API_BASE}/notifications`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async markNotificationAsRead(id: string) {
    const res = await fetchJson<{ success: boolean; data: AttendanceNotification }>(
      `${API_BASE}/notifications/${id}/read`,
      { method: 'PUT' }
    );
    return res.data;
  },

  async deleteNotification(id: string) {
    const res = await fetchJson<{ success: boolean; message: string }>(
      `${API_BASE}/notifications/${id}`,
      { method: 'DELETE' }
    );
    return res;
  },

  async clearNotifications() {
    const res = await fetchJson<{ success: boolean; message: string }>(
      `${API_BASE}/notifications`,
      { method: 'DELETE' }
    );
    return res;
  },

  // Profile
  async updateProfile(email: string, updates: Partial<UserProfile>) {
    const res = await fetchJson<{ success: boolean; data: UserProfile }>(`${API_BASE}/profile`, {
      method: 'PUT',
      body: JSON.stringify({ email, ...updates }),
    });
    return res.data;
  },
};
