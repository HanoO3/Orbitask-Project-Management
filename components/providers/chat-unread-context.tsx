'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getUnreadCountsForChannels } from '@/lib/actions/chat';

const LAST_READ_KEY = 'orbitask_chat_last_read_map';

type ChatUnreadContextType = {
  unreadCounts: Record<string, number>;
  totalUnreadChatCount: number;
  markChannelAsRead: (channelKey: string) => void;
  refreshUnreadCounts: () => Promise<void>;
};

const ChatUnreadContext = createContext<ChatUnreadContextType>({
  unreadCounts: {},
  totalUnreadChatCount: 0,
  markChannelAsRead: () => {},
  refreshUnreadCounts: async () => {},
});

export function ChatUnreadProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const lastReadMapRef = useRef<Record<string, string>>({});
  const isFetchingRef = useRef(false);

  // Initialize lastReadMap from localStorage safely
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(LAST_READ_KEY);
      if (stored) {
        lastReadMapRef.current = JSON.parse(stored);
      }
    } catch {
      // Handled gracefully
    }
  }, []);

  const markChannelAsRead = useCallback((key: string) => {
    const nowIso = new Date().toISOString();
    lastReadMapRef.current[key] = nowIso;
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(LAST_READ_KEY);
        const map = stored ? JSON.parse(stored) : {};
        map[key] = nowIso;
        localStorage.setItem(LAST_READ_KEY, JSON.stringify(map));
      }
    } catch {
      // Handled gracefully
    }
    setUnreadCounts((prev) => ({ ...prev, [key]: 0 }));
  }, []);

  const fetchUnreadCounts = useCallback(async () => {
    if (!currentUserId || isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const counts = await getUnreadCountsForChannels(['general', 'announcements', 'random'], lastReadMapRef.current);
      setUnreadCounts(counts);
    } catch {
      // Handled gracefully
    } finally {
      isFetchingRef.current = false;
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const t = setTimeout(() => void fetchUnreadCounts(), 0);
    const interval = setInterval(() => {
      void fetchUnreadCounts();
    }, 6000);

    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [currentUserId, fetchUnreadCounts]);

  const totalUnreadChatCount = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <ChatUnreadContext.Provider
      value={{
        unreadCounts,
        totalUnreadChatCount,
        markChannelAsRead,
        refreshUnreadCounts: fetchUnreadCounts,
      }}
    >
      {children}
    </ChatUnreadContext.Provider>
  );
}

export function useChatUnread() {
  return useContext(ChatUnreadContext);
}
