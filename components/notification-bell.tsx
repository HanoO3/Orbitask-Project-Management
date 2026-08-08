'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  checkApproachingDeadlines,
} from '@/lib/actions/notifications';
import { Bell, X } from 'lucide-react';

type Notification = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string | Date;
};

const typeIcon = (type: string) => {
  const icons: Record<string, string> = {
    TASK_ASSIGNED: '📋',
    TASK_STATUS_UPDATED: '🔄',
    NEW_DISCUSSION: '💬',
    DEADLINE_APPROACHING: '⏰',
    PROJECT_ASSIGNED: '📁',
  };
  return icons[type] || '🔔';
};

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    try {
      await checkApproachingDeadlines();
    } catch {}
    const [list, count] = await Promise.all([getMyNotifications(), getUnreadCount()]);
    setNotifications(list as Notification[]);
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadNotifications(), 0);
    const interval = setInterval(() => {
      void loadNotifications();
    }, 15000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (n: Notification) => {
    setOpen(false);
    if (!n.isRead) {
      await markNotificationRead(n.id);
      void loadNotifications();
    }

    if (n.type === 'PROJECT_ASSIGNED') {
      router.push('/projects');
    } else {
      router.push('/tasks');
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    void loadNotifications();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
    void loadNotifications();
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    void loadNotifications();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-[#141726] transition text-[#8E95AF] hover:text-white"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-[#5B82FF] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-[#0B0D1A] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#141726] border border-[#23263A] rounded-2xl shadow-2xl z-50 overflow-hidden text-white">
          <div className="flex justify-between items-center px-4 py-3 border-b border-[#23263A] bg-[#090B17]">
            <h3 className="font-semibold text-white text-xs uppercase tracking-wider">Notifications</h3>
            <div className="flex gap-3 text-xs">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[#5B82FF] hover:underline font-medium">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleClearAll} className="text-[#8E95AF] hover:text-rose-400 hover:underline">
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-[#23263A]">
            {notifications.length === 0 ? (
              <div className="text-[#8E95AF] text-xs text-center py-8">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-[#1C2035] transition flex gap-3 items-start group cursor-pointer ${
                    !n.isRead ? 'bg-[#181C2E]' : ''
                  }`}
                >
                  <span className="text-base shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!n.isRead ? 'font-bold text-white' : 'text-[#8E95AF]'}`}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-[#626A86] mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.isRead && <span className="w-2 h-2 bg-[#5B82FF] rounded-full shrink-0" title="Unread" />}
                    <button
                      onClick={(e) => handleDelete(e, n.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#8E95AF] hover:text-rose-400 text-xs p-1 transition"
                      title="Delete"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}