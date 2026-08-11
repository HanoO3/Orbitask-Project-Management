'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  Send,
  Hash,
  MessageSquare,
  Loader2,
  Search,
  Smile,
  Reply,
  Trash2,
  Paperclip,
  X,
  FileText,
  ArrowDown,
  Eye,
  Download,
  MoreVertical,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUserProjects } from '@/lib/actions/projects';
import { getWorkspaceUsers } from '@/lib/actions/users';
import {
  getChannelMessages,
  getUnreadCountsForChannels,
  sendChatMessage,
  deleteChatMessage,
  toggleMessageReaction,
} from '@/lib/actions/chat';

type WorkspaceUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
};

type WorkspaceProject = {
  id: string;
  name: string;
  description?: string;
};

type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  senderRole?: string;
  avatarBg?: string;
  text: string;
  time: string;
  isSelf: boolean;
  isDeleted: boolean;
  replyTo?: { id: string; senderName: string; text: string } | null;
  reactions: { id: string; emoji: string; userId: string; userName: string }[];
  attachments: { id: string; fileName: string; fileUrl: string; fileType: string; fileSize: number }[];
};

function getInitials(name: string) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatRole(role?: string) {
  if (!role) return 'Member';
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'PROJECT_MANAGER':
      return 'Project Manager';
    case 'TEAM_MEMBER':
      return 'Team Member';
    default:
      return role;
  }
}

const colorPalette = [
  'bg-blue-600',
  'bg-purple-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-indigo-600',
];

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

const LAST_READ_KEY = 'orbitask_chat_last_read_map';

export default function MessagesPage() {
  const { data: session } = useSession();
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [activeChannel, setActiveChannel] = useState<{ id: string; name: string; type: 'channel' | 'dm' }>({
    id: 'general',
    name: 'general',
    type: 'channel',
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const [replyingMsg, setReplyingMsg] = useState<ChatMessage | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ fileName: string; fileUrl: string; fileType: string; fileSize: number } | null>(null);
  const [showEmojiMenuMsgId, setShowEmojiMenuMsgId] = useState<string | null>(null);
  const [mobileActionMenuMsgId, setMobileActionMenuMsgId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

  // Unread badge counts state with lazy initial state from localStorage
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastReadMap, setLastReadMap] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = localStorage.getItem(LAST_READ_KEY);
      return stored ? (JSON.parse(stored) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });

  // Auto-scroll & New Message Notification refs and states
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);
  const prevMsgCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  const currentUserId = session?.user?.id;

  // Save lastReadMap helper
  const markChannelAsRead = useCallback((key: string) => {
    const nowIso = new Date().toISOString();
    setLastReadMap((prev) => {
      const updated = { ...prev, [key]: nowIso };
      try {
        localStorage.setItem(LAST_READ_KEY, JSON.stringify(updated));
      } catch {
        // Handled gracefully
      }
      return updated;
    });
    setUnreadCounts((prev) => ({ ...prev, [key]: 0 }));
  }, []);

  // Derive target channel string for backend database
  const getChannelKey = useCallback(() => {
    if (activeChannel.type === 'channel') {
      return activeChannel.name;
    }
    if (!currentUserId) return `dm_${activeChannel.id}`;
    const ids = [currentUserId, activeChannel.id].sort();
    return `dm_${ids[0]}_${ids[1]}`;
  }, [activeChannel, currentUserId]);

  // Smooth / Immediate Scroll Helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  // Scroll to original message when clicking reply quote
  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[#5B82FF]', 'transition-all');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[#5B82FF]');
      }, 2000);
    }
  };

  // Track container scroll position to determine if user is near bottom
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const nearBottom = distanceFromBottom < 120;
    setIsNearBottom(nearBottom);

    if (nearBottom) {
      setHasUnreadBelow(false);
    }
  }, []);

  // Load channels & team members
  const loadChannelsAndUsers = useCallback(async () => {
    setLoadingChannels(true);
    try {
      const [projectsData, usersData] = await Promise.all([
        getUserProjects(),
        getWorkspaceUsers(),
      ]);

      const uniqueMap = new Map<string, WorkspaceProject>();
      (projectsData as Array<{ id: string; name: string }>).forEach((p) => {
        const slug = p.name.toLowerCase().replace(/\s+/g, '-');
        if (!uniqueMap.has(slug)) {
          uniqueMap.set(slug, { id: p.id, name: slug });
        }
      });

      setProjects(Array.from(uniqueMap.values()));
      setUsers(usersData as WorkspaceUser[]);
    } catch {
      // Handled gracefully
    }
    setLoadingChannels(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadChannelsAndUsers(), 0);
    return () => clearTimeout(t);
  }, [loadChannelsAndUsers]);

  // Fetch real messages for active channel from Prisma Database
  const fetchMessagesForActiveChannel = useCallback(async () => {
    if (!currentUserId) return;
    const channelKey = getChannelKey();
    markChannelAsRead(channelKey);

    try {
      const dbMsgs = await getChannelMessages(channelKey);

      // Exclude deleted messages cleanly so no "This message was deleted" bubble appears
      const formatted: ChatMessage[] = (dbMsgs as Array<Record<string, unknown>>)
        .filter((m) => !(m.isDeleted as boolean))
        .map((m) => {
          const sender = m.sender as { name?: string; role?: string } | undefined;
          const reactions = (m.reactions as Array<{ id: string; emoji: string; userId: string; user?: { name?: string } }>) || [];
          const attachments = (m.attachments as Array<{ id: string; fileName: string; fileUrl: string; fileType: string; fileSize: number }>) || [];
          const replyTo = m.replyTo as { id: string; sender?: { name?: string }; isDeleted?: boolean; content: string } | undefined;

          const isSelf = m.senderId === currentUserId;
          const senderName = sender?.name || 'User';
          const senderInitials = getInitials(senderName);
          const timeStr = new Date(m.createdAt as string | Date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return {
            id: m.id as string,
            senderId: m.senderId as string,
            senderName,
            senderInitials,
            senderRole: formatRole(sender?.role),
            avatarBg: isSelf ? 'bg-[#4E75FF]' : 'bg-emerald-600',
            text: m.content as string,
            time: timeStr,
            isSelf,
            isDeleted: false,
            replyTo: replyTo && !replyTo.isDeleted
              ? {
                  id: replyTo.id,
                  senderName: replyTo.sender?.name || 'User',
                  text: replyTo.content,
                }
              : null,
            reactions: reactions.map((r) => ({
              id: r.id,
              emoji: r.emoji,
              userId: r.userId,
              userName: r.user?.name || 'User',
            })),
            attachments,
          };
        });

      setMessages(() => {
        const prevCount = prevMsgCountRef.current;
        const newCount = formatted.length;
        prevMsgCountRef.current = newCount;

        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          setTimeout(() => scrollToBottom('auto'), 50);
        } else if (newCount > prevCount) {
          const lastMsg = formatted[formatted.length - 1];
          if (lastMsg && (lastMsg.isSelf || isNearBottom)) {
            setTimeout(() => scrollToBottom('smooth'), 50);
            setHasUnreadBelow(false);
          } else {
            setHasUnreadBelow(true);
          }
        }

        return formatted;
      });
    } catch {
      // Handled gracefully
    }
  }, [currentUserId, getChannelKey, isNearBottom, markChannelAsRead, scrollToBottom]);

  // Periodically fetch unread counts for all other channels & DMs
  const fetchUnreadCounts = useCallback(async () => {
    if (!currentUserId) return;
    const channelKeys: string[] = ['general'];
    projects.forEach((p) => channelKeys.push(p.name));
    users.forEach((u) => {
      if (u.id !== currentUserId) {
        const ids = [currentUserId, u.id].sort();
        channelKeys.push(`dm_${ids[0]}_${ids[1]}`);
      }
    });

    const activeKey = getChannelKey();
    const mapCopy = { ...lastReadMap, [activeKey]: new Date().toISOString() };

    const counts = await getUnreadCountsForChannels(channelKeys, mapCopy);
    setUnreadCounts(counts);
  }, [currentUserId, getChannelKey, lastReadMap, projects, users]);

  const [mobileChatView, setMobileChatView] = useState(false);

  // Switch channels: mark as read, reset flags and auto-scroll to bottom
  const handleSelectChannel = (channel: { id: string; name: string; type: 'channel' | 'dm' }) => {
    setActiveChannel(channel);
    setMobileChatView(true);
    setHasUnreadBelow(false);
    isInitialLoadRef.current = true;
    prevMsgCountRef.current = 0;
    setShowEmojiMenuMsgId(null);
    setMobileActionMenuMsgId(null);

    let key = channel.name;
    if (channel.type === 'dm' && currentUserId) {
      const ids = [currentUserId, channel.id].sort();
      key = `dm_${ids[0]}_${ids[1]}`;
    }
    markChannelAsRead(key);
  };

  // Initial load and polling every 4 seconds for real-time updates & unread counts
  useEffect(() => {
    isInitialLoadRef.current = true;
    prevMsgCountRef.current = 0;

    const t = setTimeout(() => {
      setLoadingMessages(true);
      void fetchMessagesForActiveChannel().finally(() => setLoadingMessages(false));
      void fetchUnreadCounts();
    }, 0);

    const interval = setInterval(() => {
      void fetchMessagesForActiveChannel();
      void fetchUnreadCounts();
    }, 4000);

    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [fetchMessagesForActiveChannel, fetchUnreadCounts]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || sending) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    const channelKey = getChannelKey();
    const replyId = replyingMsg?.id;
    const attach = selectedFile || undefined;

    setReplyingMsg(null);
    setSelectedFile(null);

    const res = await sendChatMessage(channelKey, content, replyId, attach);
    setSending(false);

    if (res.success && res.message) {
      void fetchMessagesForActiveChannel().then(() => {
        setTimeout(() => scrollToBottom('smooth'), 50);
        setHasUnreadBelow(false);
      });
    }
  };

  const handleDelete = async (msgId: string) => {
    setMobileActionMenuMsgId(null);
    setShowEmojiMenuMsgId(null);
    if (!confirm('Are you sure you want to delete this message?')) return;
    await deleteChatMessage(msgId);
    void fetchMessagesForActiveChannel();
  };

  const handleReact = async (msgId: string, emoji: string) => {
    setShowEmojiMenuMsgId(null);
    setMobileActionMenuMsgId(null);
    await toggleMessageReaction(msgId, emoji);
    void fetchMessagesForActiveChannel();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds maximum limit of 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFile({
        fileName: file.name,
        fileUrl: event.target?.result as string,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const isImageAttachment = (fileType?: string, fileUrl?: string) => {
    if (fileType && fileType.startsWith('image/')) return true;
    if (fileUrl && (fileUrl.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|svg)/i.test(fileUrl))) return true;
    return false;
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const showGeneral =
    searchQuery === '' || 'general'.includes(searchQuery.toLowerCase().trim());

  const filteredUsers = users
    .filter((u) => u.id !== session?.user?.id)
    .filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));

  const getUnreadBadge = (key: string) => {
    const count = unreadCounts[key] || 0;
    if (count <= 0) return null;
    return (
      <span className="px-2 py-0.5 rounded-full bg-[#4E75FF] text-white text-[10px] font-extrabold shrink-0 shadow-xs">
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  return (
    <DashboardLayout title="Messages">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl overflow-hidden h-[calc(100vh-140px)] min-h-[500px] flex flex-col md:grid md:grid-cols-4 transition-colors relative">
        {/* Left Channels & DM List */}
        <div
          className={`md:col-span-1 border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] p-4 flex-col justify-between overflow-y-auto ${
            mobileChatView ? 'hidden md:flex' : 'flex flex-1 h-full'
          }`}
        >
          <div>
            <div className="relative mb-4">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#5B82FF] transition-all"
              />
            </div>

            <h3 className="font-bold text-xs uppercase tracking-wider mb-3 text-[var(--text-secondary)]">
              Workspace Channels
            </h3>

            {loadingChannels ? (
              <div className="py-4 text-center text-xs text-[var(--text-secondary)] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#4E75FF]" />
                <span>Loading channels...</span>
              </div>
            ) : (
              <div className="space-y-1 mb-6">
                {showGeneral && (
                  <button
                    onClick={() =>
                      handleSelectChannel({ id: 'general', name: 'general', type: 'channel' })
                    }
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeChannel.name === 'general' && activeChannel.type === 'channel'
                        ? 'bg-[#4E75FF] text-white shadow-md'
                        : unreadCounts['general']
                        ? 'text-[var(--text-primary)] font-bold bg-[var(--bg-card-hover)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Hash className="w-4 h-4 shrink-0" />
                      <span className="truncate">general</span>
                    </div>
                    {getUnreadBadge('general')}
                  </button>
                )}

                {filteredProjects.map((proj) => {
                  const isSel = activeChannel.name === proj.name && activeChannel.type === 'channel';
                  const unread = unreadCounts[proj.name];

                  return (
                    <button
                      key={proj.id}
                      onClick={() =>
                        handleSelectChannel({ id: proj.id, name: proj.name, type: 'channel' })
                      }
                      className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSel
                          ? 'bg-[#4E75FF] text-white shadow-md'
                          : unread
                          ? 'text-[var(--text-primary)] font-bold bg-[var(--bg-card-hover)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Hash className="w-4 h-4 shrink-0" />
                        <span className="truncate">{proj.name}</span>
                      </div>
                      {getUnreadBadge(proj.name)}
                    </button>
                  );
                })}
              </div>
            )}

            <h3 className="font-bold text-xs uppercase tracking-wider mb-3 text-[var(--text-secondary)]">
              Direct Messages
            </h3>

            {loadingChannels ? (
              <div className="py-4 text-center text-xs text-[var(--text-secondary)]">Loading members...</div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {filteredUsers.map((member, idx) => {
                  const initials = getInitials(member.name);
                  const colorBg = colorPalette[idx % colorPalette.length];
                  const isSelected = activeChannel.id === member.id && activeChannel.type === 'dm';
                  const dmKey = currentUserId ? `dm_${[currentUserId, member.id].sort().join('_')}` : `dm_${member.id}`;
                  const unread = unreadCounts[dmKey];

                  return (
                    <div
                      key={member.id}
                      onClick={() =>
                        handleSelectChannel({
                          id: member.id,
                          name: member.name,
                          type: 'dm',
                        })
                      }
                      className={`flex items-center justify-between gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#5B82FF]/15 border border-[#5B82FF]/40'
                          : unread
                          ? 'bg-[var(--bg-card-hover)] font-bold'
                          : 'hover:bg-[var(--bg-card-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 uppercase ${colorBg}`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{member.name}</p>
                          <p className="text-[10px] text-[var(--text-secondary)] truncate">{formatRole(member.role)}</p>
                        </div>
                      </div>
                      {getUnreadBadge(dmKey)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Active Chat View */}
        <div
          className={`md:col-span-3 flex flex-col h-full max-h-full overflow-hidden bg-[var(--bg-card)] relative ${
            !mobileChatView ? 'hidden md:flex' : 'flex flex-1'
          }`}
        >
          {/* Chat Header */}
          <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-card)] z-10">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setMobileChatView(false)}
                className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[var(--bg-sidebar)] border border-[var(--border-color)] shrink-0 mr-1 cursor-pointer"
              >
                ← Channels
              </button>
              {activeChannel.type === 'channel' ? (
                <Hash className="w-5 h-5 text-[#5B82FF] shrink-0" />
              ) : (
                <MessageSquare className="w-5 h-5 text-[#5B82FF] shrink-0" />
              )}
              <h3 className="font-bold text-[var(--text-primary)] text-sm sm:text-base truncate">
                {activeChannel.type === 'channel' ? `#${activeChannel.name}` : activeChannel.name}
              </h3>
            </div>
          </div>

          {/* Messages Stream (Strictly Scrollable Area) */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 min-h-0 relative"
          >
            {loadingMessages ? (
              <div className="py-16 text-center text-xs text-[var(--text-secondary)] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#4E75FF]" />
                <span>Loading messages from database...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--text-secondary)] space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">No messages in this chat yet</p>
                <p>Send a message below to start communicating with your team.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const reactionGroups: Record<string, { count: number; users: string[]; hasReacted: boolean }> = {};
                msg.reactions.forEach((r) => {
                  if (!reactionGroups[r.emoji]) {
                    reactionGroups[r.emoji] = { count: 0, users: [], hasReacted: false };
                  }
                  reactionGroups[r.emoji].count += 1;
                  reactionGroups[r.emoji].users.push(r.userName);
                  if (r.userId === currentUserId) reactionGroups[r.emoji].hasReacted = true;
                });

                return (
                  <div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    className={`group relative flex items-start gap-3 transition-all ${
                      msg.isSelf ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 uppercase shadow-xs ${
                        msg.isSelf ? 'bg-[#4E75FF]' : msg.avatarBg || 'bg-slate-600'
                      }`}
                    >
                      {msg.senderInitials}
                    </div>

                    <div className="relative max-w-md space-y-1 min-w-0">
                      {/* Desktop Hover Action Pill */}
                      <div
                        className={`hidden md:flex absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-1 items-center gap-1 z-10 shadow-lg ${
                          msg.isSelf ? 'right-full mr-2' : 'left-full ml-2'
                        }`}
                      >
                        <button
                          onClick={() => setReplyingMsg(msg)}
                          title="Reply"
                          className="p-1.5 hover:bg-[var(--bg-card-hover)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowEmojiMenuMsgId(showEmojiMenuMsgId === msg.id ? null : msg.id)
                            }
                            title="React"
                            className="p-1.5 hover:bg-[var(--bg-card-hover)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>

                          {showEmojiMenuMsgId === msg.id && (
                            <div className="absolute bottom-full mb-2 left-0 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2 flex gap-1 shadow-2xl z-20">
                              {EMOJI_LIST.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReact(msg.id, emoji)}
                                  className="hover:scale-125 transition-transform p-1 text-sm cursor-pointer"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {(msg.isSelf || session?.user?.role === 'ADMIN') && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            title="Delete"
                            className="p-1.5 hover:bg-rose-500/20 rounded-lg text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Quoted Reply Box with Scroll-to-Message */}
                      {msg.replyTo && (
                        <div
                          onClick={() => msg.replyTo?.id && scrollToMessage(msg.replyTo.id)}
                          className="bg-[var(--bg-card-hover)] border-l-2 border-[#5B82FF] px-3 py-1.5 rounded-lg text-[11px] text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--bg-input)] transition-colors"
                        >
                          <span className="font-semibold text-[#5B82FF] mr-1">
                            Replying to {msg.replyTo.senderName}:
                          </span>
                          <span className="truncate inline-block max-w-[200px] align-bottom">
                            {msg.replyTo.text}
                          </span>
                        </div>
                      )}

                      {/* Main Message Bubble */}
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed break-words relative ${
                          msg.isSelf
                            ? 'bg-[#4E75FF] text-white rounded-tr-none shadow-md'
                            : 'bg-[var(--bg-sidebar)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-none'
                        }`}
                      >
                        {!msg.isSelf && (
                          <p className="font-bold text-[#5B82FF] mb-1 text-[11px]">
                            {msg.senderName}
                            {msg.senderRole && (
                              <span className="text-[var(--text-secondary)] font-normal ml-1 border-l border-[var(--border-color)] pl-1">
                                {msg.senderRole}
                              </span>
                            )}
                          </p>
                        )}

                        <p className="break-words overflow-wrap-anywhere">{msg.text}</p>

                        {/* File Attachments */}
                        {msg.attachments.length > 0 && (
                          <div className="mt-2.5 space-y-2">
                            {msg.attachments.map((att) => {
                              const isImg = isImageAttachment(att.fileType, att.fileUrl);

                              if (isImg) {
                                return (
                                  <div
                                    key={att.id}
                                    onClick={() => setLightboxImage({ url: att.fileUrl, name: att.fileName })}
                                    className="relative rounded-xl overflow-hidden border border-[var(--border-color)] cursor-pointer group max-w-xs bg-black/20"
                                  >
                                    <img
                                      src={att.fileUrl}
                                      alt={att.fileName}
                                      className="w-full max-h-48 object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                                      <Eye className="w-4 h-4" />
                                      <span>Preview Image</span>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <a
                                  key={att.id}
                                  href={att.fileUrl}
                                  download={att.fileName}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[#5B82FF] transition-colors"
                                >
                                  <FileText className="w-4 h-4 text-[#5B82FF] shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-semibold truncate">{att.fileName}</p>
                                    <p className="text-[9px] text-[var(--text-secondary)]">
                                      {(att.fileSize / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                  <Download className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
                                </a>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 mt-1.5">
                          {/* Mobile Action Menu Toggle Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setMobileActionMenuMsgId(
                                mobileActionMenuMsgId === msg.id ? null : msg.id
                              )
                            }
                            className={`md:hidden p-1 rounded-md transition-colors ${
                              msg.isSelf
                                ? 'text-white/80 hover:bg-white/10'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                            }`}
                            title="Message actions"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          <p
                            className={`text-[10px] text-right ml-auto ${
                              msg.isSelf ? 'text-white/80' : 'text-[var(--text-secondary)]'
                            }`}
                          >
                            {msg.time}
                          </p>
                        </div>
                      </div>

                      {/* Mobile Action Menu Popover */}
                      {mobileActionMenuMsgId === msg.id && (
                        <div className="md:hidden mt-2 p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl space-y-2 z-20">
                          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-1.5">
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                              Actions
                            </span>
                            <button
                              onClick={() => setMobileActionMenuMsgId(null)}
                              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => {
                                setReplyingMsg(msg);
                                setMobileActionMenuMsgId(null);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-card-hover)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[#4E75FF] hover:text-white transition-colors cursor-pointer"
                            >
                              <Reply className="w-3.5 h-3.5" />
                              <span>Reply</span>
                            </button>

                            {(msg.isSelf || session?.user?.role === 'ADMIN') && (
                              <button
                                onClick={() => handleDelete(msg.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-xs font-semibold text-rose-500 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>

                          {/* Mobile Emoji Reaction Row */}
                          <div className="flex items-center gap-1 pt-1 border-t border-[var(--border-color)] overflow-x-auto">
                            {EMOJI_LIST.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReact(msg.id, emoji)}
                                className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-sm transition-transform active:scale-125 cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reaction Badges */}
                      {Object.keys(reactionGroups).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(reactionGroups).map(([emoji, group]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReact(msg.id, emoji)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border transition-colors cursor-pointer ${
                                group.hasReacted
                                  ? 'bg-[#4E75FF]/20 border-[#5B82FF] text-[var(--text-primary)]'
                                  : 'bg-[var(--bg-card-hover)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span className="font-bold">{group.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating New Messages Indicator */}
          {hasUnreadBelow && (
            <button
              onClick={() => {
                scrollToBottom('smooth');
                setHasUnreadBelow(false);
              }}
              className="absolute bottom-20 right-6 z-30 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#4E75FF] hover:bg-[#5B82FF] text-white text-xs font-semibold shadow-xl transition-all animate-bounce cursor-pointer"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>New messages</span>
            </button>
          )}

          {/* Input Form & Composer (Sticky Bottom) */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] space-y-2 shrink-0 z-10"
          >
            {/* Replying Preview Banner */}
            {replyingMsg && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#5B82FF]/10 border border-[#5B82FF]/40 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Reply className="w-3.5 h-3.5 text-[#5B82FF] shrink-0" />
                  <span className="text-[var(--text-secondary)]">Replying to</span>
                  <span className="font-bold text-[var(--text-primary)] truncate">{replyingMsg.senderName}</span>
                  <span className="text-[var(--text-muted)] truncate">&quot;{replyingMsg.text}&quot;</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingMsg(null)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0 ml-2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Selected File Attachment Banner */}
            {selectedFile && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#5B82FF]/10 border border-[#5B82FF]/40 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Paperclip className="w-3.5 h-3.5 text-[#5B82FF] shrink-0" />
                  <span className="font-semibold text-[var(--text-primary)] truncate">{selectedFile.fileName}</span>
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    ({(selectedFile.fileSize / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0 ml-2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <label
                htmlFor="chat-file-upload"
                className="p-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl cursor-pointer transition-colors shrink-0"
                title="Attach file (max 10MB)"
              >
                <Paperclip className="w-4 h-4" />
                <input
                  id="chat-file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={sending}
                placeholder={
                  activeChannel.type === 'channel'
                    ? `Message #${activeChannel.name}...`
                    : `Message ${activeChannel.name}...`
                }
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#5B82FF] disabled:opacity-50 min-w-0"
              />
              <button
                type="submit"
                disabled={sending}
                className="bg-[#4E75FF] hover:bg-[#5B82FF] text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs transition-opacity"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                {lightboxImage.name}
              </span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-black/30 rounded-xl p-2">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.name}
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
