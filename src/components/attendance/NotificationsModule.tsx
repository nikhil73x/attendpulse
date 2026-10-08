import React, { useState, useRef } from 'react';
import {
  AttendanceNotification,
  Student,
  NotificationAttachment,
  NotificationLink,
  UserProfile,
} from '../../types/attendance';
import {
  IoNotificationsOutline,
  IoCheckmarkDoneOutline,
  IoTrashOutline,
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoInformationCircleOutline,
  IoMegaphoneOutline,
  IoAttachOutline,
  IoLinkOutline,
  IoSendOutline,
  IoCloseOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoDocumentAttachOutline,
  IoOpenOutline,
  IoSparklesOutline,
  IoTimeOutline,
} from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationsModuleProps {
  notifications: AttendanceNotification[];
  students?: Student[];
  currentUser?: UserProfile;
  isTeacher?: boolean;
  onSendAnnouncement?: (
    notification: Omit<AttendanceNotification, 'id' | 'time' | 'read'>
  ) => void;
  onMarkAllRead: () => void;
  onMarkAsRead?: (id: string) => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
  isDark: boolean;
}

export const NotificationsModule: React.FC<NotificationsModuleProps> = ({
  notifications,
  students = [],
  currentUser,
  isTeacher = false,
  onSendAnnouncement,
  onMarkAllRead,
  onMarkAsRead,
  onClearAll,
  onDeleteNotification,
  isDark,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Compose form states
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'alert' | 'success'>('info');
  const [targetScope, setTargetScope] = useState<'all' | 'selected'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Links state
  const [links, setLinks] = useState<NotificationLink[]>([]);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showAddLink, setShowAddLink] = useState(false);

  // Files state
  const [attachments, setAttachments] = useState<NotificationAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sendSuccessMessage, setSendSuccessMessage] = useState(false);

  // Target filtering: teachers see all announcements, students only see broadcasts for all or specifically for them
  const studentFilteredList = isTeacher
    ? notifications
    : notifications.filter((notif) => {
        if (!notif.target || notif.target.scope === 'all') return true;
        const target = notif.target as any;
        const myEmail = currentUser?.email?.toLowerCase().trim();
        const myRoll = currentUser?.rollNo?.toLowerCase().trim();
        const myName = currentUser?.name?.toLowerCase().trim();

        // 1. Direct match on studentEmails / studentRollNos / studentNames
        const matchEmail = myEmail && target.studentEmails?.some((e: string) => e?.toLowerCase().trim() === myEmail);
        const matchRoll = myRoll && target.studentRollNos?.some((r: string) => r?.toLowerCase().trim() === myRoll);
        const matchName = myName && target.studentNames?.some((n: string) => n?.toLowerCase().trim() === myName);
        if (matchEmail || matchRoll || matchName) return true;

        // 2. Check if student's roster ID was targeted
        const rosterStudent = students.find((s) =>
          (myEmail && s.email?.toLowerCase().trim() === myEmail) ||
          (myRoll && s.rollNo?.toLowerCase().trim() === myRoll) ||
          (myName && s.name?.toLowerCase().trim() === myName)
        );
        if (rosterStudent && target.studentIds?.includes(rosterStudent.id)) {
          return true;
        }

        // 3. Check direct studentIds match
        if (myRoll && target.studentIds?.some((id: string) => id?.toLowerCase().trim() === myRoll)) return true;
        if (myEmail && target.studentIds?.some((id: string) => id?.toLowerCase().trim() === myEmail)) return true;

        return false;
      });

  const unreadCount = studentFilteredList.filter((n) => !n.read).length;
  const filteredList = studentFilteredList.filter((n) =>
    filter === 'all' ? true : !n.read
  );

  const getTypeIcon = (notifType: AttendanceNotification['type']) => {
    switch (notifType) {
      case 'success':
        return <IoCheckmarkCircleOutline className="text-emerald-400 text-lg" />;
      case 'alert':
        return <IoAlertCircleOutline className="text-amber-400 text-lg" />;
      default:
        return <IoInformationCircleOutline className="text-sky-400 text-lg" />;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const sizeKb = (file.size / 1024).toFixed(1);
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${sizeKb} KB`;

      // Read as Data URL so attached files persist and work across devices
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            size: sizeStr,
            url: dataUrl,
            type: file.type || 'application/octet-stream',
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    const formattedUrl =
      linkUrl.startsWith('http://') || linkUrl.startsWith('https://')
        ? linkUrl.trim()
        : `https://${linkUrl.trim()}`;

    setLinks((prev) => [
      ...prev,
      {
        title: linkTitle.trim() || linkUrl.trim(),
        url: formattedUrl,
      },
    ]);
    setLinkTitle('');
    setLinkUrl('');
    setShowAddLink(false);
  };

  const handleRemoveLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const targetStudents =
      targetScope === 'selected'
        ? students.filter((s) => selectedStudentIds.includes(s.id))
        : [];

    onSendAnnouncement?.({
      title: title.trim(),
      message: message.trim(),
      type,
      sender: {
        name: currentUser?.name || 'Prof. Nikhil Yadav',
        role: 'teacher',
        email: currentUser?.email,
      },
      target: {
        scope: targetScope,
        studentIds:
          targetScope === 'selected'
            ? selectedStudentIds
            : undefined,
        studentNames:
          targetScope === 'selected'
            ? targetStudents.map((s) => s.name)
            : undefined,
        studentEmails:
          targetScope === 'selected'
            ? (targetStudents.map((s) => s.email?.toLowerCase().trim()).filter(Boolean) as string[])
            : undefined,
        studentRollNos:
          targetScope === 'selected'
            ? (targetStudents.map((s) => s.rollNo?.toLowerCase().trim()).filter(Boolean) as string[])
            : undefined,
      },
      attachments: attachments.length > 0 ? attachments : undefined,
      links: links.length > 0 ? links : undefined,
    });

    // Reset form
    setTitle('');
    setMessage('');
    setType('info');
    setTargetScope('all');
    setSelectedStudentIds([]);
    setAttachments([]);
    setLinks([]);
    setIsComposeOpen(false);

    setSendSuccessMessage(true);
    setTimeout(() => setSendSuccessMessage(false), 4000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in text-inherit">
      {/* Success banner */}
      <AnimatePresence>
        {sendSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-lg backdrop-blur-md"
          >
            <IoCheckmarkCircleOutline className="text-lg shrink-0" />
            <span>
              Message, files, and links broadcast successfully to{' '}
              {targetScope === 'all'
                ? 'all students'
                : `${selectedStudentIds.length} student(s)`}
              !
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Toolbar */}
      <div
        className={`relative rounded-2xl p-5 sm:p-6 border overflow-hidden transition-all ${
          isDark
            ? 'glass-panel text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-md'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <IoNotificationsOutline className="text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  {isTeacher ? 'Broadcasts & Notifications' : 'Notification Center'}
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {isTeacher
                  ? 'Send texts, study material, links, and updates to your students.'
                  : 'Teacher announcements, session verifications, and academic updates.'}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Teacher broadcast trigger */}
            {isTeacher && (
              <button
                type="button"
                onClick={() => setIsComposeOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                  isComposeOpen
                    ? 'bg-rose-500/20 border border-rose-500/30 text-rose-300'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-95'
                }`}
              >
                {isComposeOpen ? (
                  <>
                    <IoCloseOutline className="text-base" />
                    <span>Close Composer</span>
                  </>
                ) : (
                  <>
                    <IoMegaphoneOutline className="text-sm" />
                    <span>Send Announcement</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onMarkAllRead}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              }`}
            >
              <IoCheckmarkDoneOutline className="text-sm" />
              <span>Mark All Read</span>
            </button>

            <button
              type="button"
              onClick={onClearAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-300'
                  : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
              }`}
            >
              <IoTrashOutline className="text-sm" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? isDark
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'bg-indigo-600 text-white shadow-sm'
                : isDark
                ? 'bg-white/[0.05] text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({studentFilteredList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filter === 'unread'
                ? isDark
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'bg-indigo-600 text-white shadow-sm'
                : isDark
                ? 'bg-white/[0.05] text-slate-400 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* 2. Faculty Broadcast Composer */}
      <AnimatePresence>
        {isTeacher && isComposeOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSend}
              className={`rounded-2xl p-6 border space-y-5 transition-all ${
                isDark
                  ? 'bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black/60 border-indigo-500/30 text-white shadow-2xl'
                  : 'bg-white border-indigo-200 text-slate-900 shadow-xl'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <IoMegaphoneOutline className="text-lg" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight">
                      Broadcast to Students
                    </h3>
                    <p
                      className={`text-[11px] ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Share notices, resources, files, and links with your class
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <IoSparklesOutline /> Faculty Tool
                </span>
              </div>

              {/* Recipient Audience Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center justify-between">
                  <span>Target Recipients</span>
                  {targetScope === 'selected' && (
                    <span className="text-[11px] text-indigo-400 font-normal">
                      {selectedStudentIds.length} of {students.length} selected
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetScope('all')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      targetScope === 'all'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : isDark
                        ? 'bg-white/[0.05] border-white/10 text-slate-300 hover:bg-white/[0.1]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <IoPeopleOutline className="text-base" />
                    <span>All Enrolled Students ({students.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetScope('selected')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      targetScope === 'selected'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : isDark
                        ? 'bg-white/[0.05] border-white/10 text-slate-300 hover:bg-white/[0.1]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <IoPersonOutline className="text-base" />
                    <span>Choose Specific Students</span>
                  </button>
                </div>

                {/* Selected students checkboxes */}
                {targetScope === 'selected' && (
                  <div
                    className={`mt-2 p-3 rounded-xl border max-h-48 overflow-y-auto space-y-1.5 ${
                      isDark
                        ? 'bg-black/40 border-white/10'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-white/[0.08] text-[11px]">
                      <span className="text-slate-400">Click to select students:</span>
                      <button
                        type="button"
                        onClick={handleSelectAllStudents}
                        className="text-indigo-400 hover:underline font-semibold cursor-pointer"
                      >
                        {selectedStudentIds.length === students.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {students.map((stu) => {
                        const checked = selectedStudentIds.includes(stu.id);
                        return (
                          <label
                            key={stu.id}
                            className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                              checked
                                ? isDark
                                  ? 'bg-indigo-500/20 text-white'
                                  : 'bg-indigo-50 text-indigo-900 font-medium'
                                : isDark
                                ? 'hover:bg-white/[0.04] text-slate-300'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleStudent(stu.id)}
                              className="rounded accent-indigo-600 cursor-pointer"
                            />
                            <span className="font-mono text-[10px] text-slate-400">
                              {stu.rollNo}
                            </span>
                            <span className="truncate">{stu.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Title, Type, Message */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold">Subject / Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lab Manual Submission Deadline & Extra Reading"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none transition-all ${
                        isDark
                          ? 'bg-black/30 border-white/15 focus:border-indigo-400 text-white'
                          : 'bg-slate-50 border-slate-300 focus:border-indigo-500 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">Priority Type</label>
                    <select
                      value={type}
                      onChange={(e) =>
                        setType(e.target.value as 'info' | 'alert' | 'success')
                      }
                      className={`w-full px-3 py-2 rounded-xl text-xs border outline-none cursor-pointer ${
                        isDark
                          ? 'bg-[#151922] border-white/15 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="info">Info / General</option>
                      <option value="alert">Alert / Urgent</option>
                      <option value="success">Success / Good News</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Message Body</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Write detailed instructions, announcement message, or lecture notes reference..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none resize-none transition-all ${
                      isDark
                        ? 'bg-black/30 border-white/15 focus:border-indigo-400 text-white'
                        : 'bg-slate-50 border-slate-300 focus:border-indigo-500 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Attachments & Links Preview & Add Controls */}
              <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                {/* Action buttons to trigger file and link inputs */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isDark
                        ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-slate-200'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    }`}
                  >
                    <IoAttachOutline className="text-sm" />
                    <span>Attach Files ({attachments.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddLink((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      showAddLink
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : isDark
                        ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-slate-200'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    }`}
                  >
                    <IoLinkOutline className="text-sm" />
                    <span>Add Link ({links.length})</span>
                  </button>
                </div>

                {/* Inline link input box */}
                {showAddLink && (
                  <div
                    className={`p-3 rounded-xl border space-y-2 ${
                      isDark
                        ? 'bg-black/30 border-white/10'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Link Label (e.g. Lecture Slides / Google Drive)"
                        value={linkTitle}
                        onChange={(e) => setLinkTitle(e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs border outline-none ${
                          isDark
                            ? 'bg-black/40 border-white/15 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      <input
                        type="url"
                        placeholder="https://drive.google.com/... or github.com/..."
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs border outline-none ${
                          isDark
                            ? 'bg-black/40 border-white/15 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddLink(false)}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddLink}
                        disabled={!linkUrl.trim()}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white disabled:opacity-50 cursor-pointer"
                      >
                        Save Link
                      </button>
                    </div>
                  </div>
                )}

                {/* Attached files chips */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] border ${
                          isDark
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        }`}
                      >
                        <IoDocumentAttachOutline className="text-sm shrink-0" />
                        <span className="truncate max-w-[160px] font-medium">
                          {file.name}
                        </span>
                        {file.size && (
                          <span className="text-[10px] opacity-70">
                            ({file.size})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="hover:text-rose-400 ml-1 cursor-pointer"
                        >
                          <IoCloseOutline />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Added links chips */}
                {links.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {links.map((link, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] border ${
                          isDark
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                            : 'bg-purple-50 border-purple-200 text-purple-700'
                        }`}
                      >
                        <IoLinkOutline className="text-sm shrink-0" />
                        <span className="truncate max-w-[180px] font-medium">
                          {link.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(idx)}
                          className="hover:text-rose-400 ml-1 cursor-pointer"
                        >
                          <IoCloseOutline />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit / Cancel Bar */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={
                    !title.trim() ||
                    !message.trim() ||
                    (targetScope === 'selected' &&
                      selectedStudentIds.length === 0)
                  }
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
                >
                  <IoSendOutline className="text-sm" />
                  <span>
                    Send to{' '}
                    {targetScope === 'all'
                      ? 'All Students'
                      : `${selectedStudentIds.length} Student(s)`}
                  </span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Notifications List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredList.length === 0 ? (
            <div
              className={`p-12 text-center rounded-2xl border ${
                isDark
                  ? 'glass-panel text-slate-400'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <IoNotificationsOutline className="text-4xl mx-auto mb-2 opacity-40" />
              <h4 className="font-semibold text-sm">All caught up!</h4>
              <p className="text-xs text-slate-500 mt-1">
                No notifications matching the selected filter.
              </p>
            </div>
          ) : (
            filteredList.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative rounded-2xl p-4 sm:p-5 border transition-all flex items-start gap-4 ${
                  !notif.read
                    ? isDark
                      ? 'bg-white/[0.05] border-white/20 shadow-md'
                      : 'bg-indigo-50/50 border-indigo-200 shadow-sm'
                    : isDark
                    ? 'glass-panel opacity-90 hover:opacity-100'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="mt-0.5 shrink-0">{getTypeIcon(notif.type)}</div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm tracking-tight">
                        {notif.title}
                      </h4>

                      {/* Recipient scope badge */}
                      {notif.target && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            notif.target.scope === 'all'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {notif.target.scope === 'all'
                            ? 'All Class'
                            : `Selected (${notif.target.studentIds?.length || 'Specific'})`}
                        </span>
                      )}

                      {/* Sender badge */}
                      {notif.sender && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          From: {notif.sender.name}
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[11px] shrink-0 flex items-center gap-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      <IoTimeOutline />
                      {notif.time}
                    </span>
                  </div>

                  <p
                    className={`text-xs leading-relaxed whitespace-pre-line ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {notif.message}
                  </p>

                  {/* Target student names pills if selected subset */}
                  {notif.target?.scope === 'selected' &&
                    notif.target.studentNames &&
                    notif.target.studentNames.length > 0 && (
                      <div className="text-[11px] text-slate-400">
                        <span className="font-medium text-slate-300">
                          Recipients:{' '}
                        </span>
                        {notif.target.studentNames.join(', ')}
                      </div>
                    )}

                  {/* Attachments Section */}
                  {notif.attachments && notif.attachments.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                        Attached Files ({notif.attachments.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {notif.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            download={att.name}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-colors ${
                              isDark
                                ? 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                                : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700'
                            }`}
                          >
                            <IoDocumentAttachOutline className="text-sm shrink-0" />
                            <span className="font-semibold underline">
                              {att.name}
                            </span>
                            {att.size && (
                              <span className="text-[10px] opacity-75">
                                ({att.size})
                              </span>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Links Section */}
                  {notif.links && notif.links.length > 0 && (
                    <div className="pt-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                        Resources & Links ({notif.links.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {notif.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-colors ${
                              isDark
                                ? 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-300'
                                : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
                            }`}
                          >
                            <IoLinkOutline className="text-sm shrink-0" />
                            <span className="font-semibold underline">
                              {link.title}
                            </span>
                            <IoOpenOutline className="text-[11px] opacity-80" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-start">
                  {!notif.read && onMarkAsRead && (
                    <button
                      type="button"
                      onClick={() => onMarkAsRead(notif.id)}
                      title="Mark as read"
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isDark
                          ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm'
                      }`}
                    >
                      <IoCheckmarkDoneOutline className="text-sm" />
                      <span className="hidden sm:inline">Mark Read</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteNotification(notif.id)}
                    title={isTeacher ? 'Delete broadcast' : 'Remove notification'}
                    className={`p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity cursor-pointer ${
                      isDark
                        ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                        : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    <IoTrashOutline className="text-base" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
