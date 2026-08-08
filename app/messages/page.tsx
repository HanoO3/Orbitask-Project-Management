'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUserProjects } from '@/lib/actions/projects';
import { getWorkspaceUsers } from '@/lib/actions/users';
import {
  getChannelMessages,
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

  const currentUserId = session?.user?.id;

  // Derive target channel string for backend database
  const getChannelKey = useCallback(() => {
    if (activeChannel.type === 'channel') {
      return activeChannel.name;
    }
    // For DMs, create a deterministic key between current user and target user
    if (!currentUserId) return `dm_${activeChannel.id}`;
    const ids = [currentUserId, activeChannel.id].sort();
    return `dm_${ids[0]}_${ids[1]}`;
  }, [activeChannel, currentUserId]);

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
    } catch (err) {
      console.error('Failed to load workspace channels:', err);
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
    try {
      const dbMsgs = await getChannelMessages(channelKey);

      const formatted: ChatMessage[] = (dbMsgs as Array<Record<string, unknown>>).map((m) => {
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
          isDeleted: (m.isDeleted as boolean) || false,
          replyTo: replyTo
            ? {
                id: replyTo.id,
                senderName: replyTo.sender?.name || 'User',
                text: replyTo.isDeleted ? 'Original message deleted' : replyTo.content,
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

      setMessages(formatted);
    } catch (err) {
      console.error('Failed to fetch channel messages from DB:', err);
    }
  }, [currentUserId, getChannelKey]);

  const [mobileChatView, setMobileChatView] = useState(false);

  // Initial load and polling every 4 seconds for real-time updates
  useEffect(() => {
    const t = setTimeout(() => {
      setLoadingMessages(true);
      void fetchMessagesForActiveChannel().finally(() => setLoadingMessages(false));
    }, 0);

    const interval = setInterval(() => {
      void fetchMessagesForActiveChannel();
    }, 4000);

    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [fetchMessagesForActiveChannel]);

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
      void fetchMessagesForActiveChannel();
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    await deleteChatMessage(msgId);
    void fetchMessagesForActiveChannel();
  };

  const handleReact = async (msgId: string, emoji: string) => {
    setShowEmojiMenuMsgId(null);
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

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const showGeneral =
    searchQuery === '' || 'general'.includes(searchQuery.toLowerCase().trim());

  const filteredUsers = users
    .filter((u) => u.id !== session?.user?.id)
    .filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));

  return (
    <DashboardLayout title="Messages">
      <div className="bg-[#141726] border border-[#23263A] rounded-2xl shadow-xl overflow-hidden h-[calc(100vh-140px)] min-h-[520px] grid grid-cols-1 md:grid-cols-4">
        {/* Left Channels & DM List */}
        <div className={`md:col-span-1 border-r border-[#23263A] bg-[#090B17] p-4 flex-col justify-between overflow-y-auto ${mobileChatView ? 'hidden md:flex' : 'flex'}`}>
          <div>
            <div className="relative mb-4">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E95AF]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full bg-[#141726] border border-[#23263A] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#626A86] focus:outline-none focus:border-[#5B82FF] transition-all"
              />
            </div>

            <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-3 text-[#8E95AF]">
              Workspace Channels
            </h3>

            {loadingChannels ? (
              <div className="py-4 text-center text-xs text-[#8E95AF] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#4E75FF]" />
                <span>Loading channels...</span>
              </div>
            ) : (
              <div className="space-y-1 mb-6">
                {showGeneral && (
                  <button
                    onClick={() => {
                      setActiveChannel({ id: 'general', name: 'general', type: 'channel' });
                      setMobileChatView(true);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      activeChannel.name === 'general' && activeChannel.type === 'channel'
                        ? 'bg-[#4E75FF] text-white shadow-md'
                        : 'text-[#8E95AF] hover:text-white hover:bg-[#141726]'
                    }`}
                  >
                    <Hash className="w-4 h-4" />
                    <span>general</span>
                  </button>
                )}

                {filteredProjects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setActiveChannel({ id: proj.id, name: proj.name, type: 'channel' });
                      setMobileChatView(true);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all truncate ${
                      activeChannel.name === proj.name && activeChannel.type === 'channel'
                        ? 'bg-[#4E75FF] text-white shadow-md'
                        : 'text-[#8E95AF] hover:text-white hover:bg-[#141726]'
                    }`}
                  >
                    <Hash className="w-4 h-4 shrink-0" />
                    <span className="truncate">{proj.name}</span>
                  </button>
                ))}
              </div>
            )}

            <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-3 text-[#8E95AF]">
              Direct Messages
            </h3>

            {loadingChannels ? (
              <div className="py-4 text-center text-xs text-[#8E95AF]">Loading members...</div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {filteredUsers.map((member, idx) => {
                  const initials = getInitials(member.name);
                  const colorBg = colorPalette[idx % colorPalette.length];
                  const isSelected = activeChannel.id === member.id && activeChannel.type === 'dm';

                  return (
                    <div
                      key={member.id}
                      onClick={() => {
                        setActiveChannel({
                          id: member.id,
                          name: member.name,
                          type: 'dm',
                        });
                        setMobileChatView(true);
                      }}
                      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#1D2236] border border-[#5B82FF]/40' : 'hover:bg-[#141726]'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 uppercase ${colorBg}`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{member.name}</p>
                        <p className="text-[10px] text-[#8E95AF] truncate">{formatRole(member.role)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Active Chat View */}
        <div className={`md:col-span-3 flex-col justify-between bg-[#141726] ${!mobileChatView ? 'hidden md:flex' : 'flex'}`}>
          {/* Chat Header */}
          <div className="p-4 border-b border-[#23263A] flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setMobileChatView(false)}
                className="md:hidden text-[#8E95AF] hover:text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#090B17] border border-[#23263A] shrink-0 mr-1"
              >
                ← Channels
              </button>
              {activeChannel.type === 'channel' ? (
                <Hash className="w-5 h-5 text-[#5B82FF] shrink-0" />
              ) : (
                <MessageSquare className="w-5 h-5 text-[#5B82FF] shrink-0" />
              )}
              <h3 className="font-bold text-white text-sm sm:text-base truncate">
                {activeChannel.type === 'channel' ? `#${activeChannel.name}` : activeChannel.name}
              </h3>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
            {loadingMessages ? (
              <div className="py-16 text-center text-xs text-[#8E95AF] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#4E75FF]" />
                <span>Loading messages from database...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#8E95AF] space-y-1">
                <p className="font-semibold text-white">No messages in this chat yet</p>
                <p>Send a message below to start communicating with your team.</p>
              </div>
            ) : (
              messages.map((msg) => {
                // Group reactions by emoji
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
                    className={`group relative flex items-start gap-3 ${
                      msg.isSelf ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 uppercase shadow-sm ${
                        msg.isSelf ? 'bg-[#4E75FF]' : msg.avatarBg || 'bg-slate-700'
                      }`}
                    >
                      {msg.senderInitials}
                    </div>

                    <div className="relative max-w-md space-y-1">
                      {/* Action Menu (Reply, React, Delete) */}
                      {!msg.isDeleted && (
                        <div
                          className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1C2035] border border-[#23263A] rounded-xl p-1 flex items-center gap-1 z-10 shadow-lg ${
                            msg.isSelf ? 'right-full mr-2' : 'left-full ml-2'
                          }`}
                        >
                          <button
                            onClick={() => setReplyingMsg(msg)}
                            title="Reply"
                            className="p-1.5 hover:bg-[#2B314F] rounded-lg text-[#8E95AF] hover:text-white transition-colors"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowEmojiMenuMsgId(showEmojiMenuMsgId === msg.id ? null : msg.id)
                              }
                              title="React"
                              className="p-1.5 hover:bg-[#2B314F] rounded-lg text-[#8E95AF] hover:text-white transition-colors"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>

                            {/* Emoji Picker Popup */}
                            {showEmojiMenuMsgId === msg.id && (
                              <div className="absolute bottom-full mb-2 left-0 bg-[#0B0D1A] border border-[#23263A] rounded-xl p-2 flex gap-1 shadow-2xl z-20">
                                {EMOJI_LIST.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReact(msg.id, emoji)}
                                    className="hover:scale-125 transition-transform p-1 text-sm"
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
                              className="p-1.5 hover:bg-rose-500/20 rounded-lg text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Quoted Reply Box */}
                      {msg.replyTo && (
                        <div className="bg-[#1A1E32] border-l-2 border-[#5B82FF] px-3 py-1.5 rounded-lg text-[11px] text-[#8E95AF]">
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
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          msg.isDeleted
                            ? 'bg-[#181B2B] text-[#626A86] italic border border-[#23263A]'
                            : msg.isSelf
                            ? 'bg-[#4E75FF] text-white rounded-tr-none shadow-md'
                            : 'bg-[#0B0D1A] text-white border border-[#23263A] rounded-tl-none'
                        }`}
                      >
                        {!msg.isSelf && !msg.isDeleted && (
                          <p className="font-bold text-[#5B82FF] mb-1 text-[11px]">
                            {msg.senderName}
                            {msg.senderRole && (
                              <span className="text-[#8E95AF] font-normal ml-1 border-l border-[#23263A] pl-1">
                                {msg.senderRole}
                              </span>
                            )}
                          </p>
                        )}

                        <p className={msg.isDeleted ? 'italic' : ''}>{msg.text}</p>

                        {/* File Attachments */}
                        {msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((att) => (
                              <a
                                key={att.id}
                                href={att.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 p-2 rounded-xl bg-black/20 hover:bg-black/40 border border-white/10 text-white transition-colors"
                              >
                                <FileText className="w-4 h-4 text-[#5B82FF] shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] font-semibold truncate">{att.fileName}</p>
                                  <p className="text-[9px] text-white/70">
                                    {(att.fileSize / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </a>
                            ))}
                          </div>
                        )}

                        <p
                          className={`text-[10px] mt-1.5 text-right ${
                            msg.isSelf ? 'text-white/70' : 'text-[#8E95AF]'
                          }`}
                        >
                          {msg.time}
                        </p>
                      </div>

                      {/* Reaction Badges */}
                      {Object.keys(reactionGroups).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(reactionGroups).map(([emoji, group]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReact(msg.id, emoji)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border transition-colors ${
                                group.hasReacted
                                  ? 'bg-[#4E75FF]/20 border-[#5B82FF] text-white'
                                  : 'bg-[#141726] border-[#23263A] text-[#8E95AF] hover:text-white'
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
          </div>

          {/* Input Form & Composer */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-[#23263A] bg-[#090B17] space-y-2">
            {/* Replying Preview Banner */}
            {replyingMsg && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1D2236] border border-[#5B82FF]/40 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Reply className="w-3.5 h-3.5 text-[#5B82FF] shrink-0" />
                  <span className="text-[#8E95AF]">Replying to</span>
                  <span className="font-bold text-white truncate">{replyingMsg.senderName}</span>
                  <span className="text-[#626A86] truncate">&quot;{replyingMsg.text}&quot;</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingMsg(null)}
                  className="text-[#8E95AF] hover:text-white shrink-0 ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Selected File Attachment Banner */}
            {selectedFile && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1D2236] border border-[#5B82FF]/40 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Paperclip className="w-3.5 h-3.5 text-[#5B82FF] shrink-0" />
                  <span className="font-semibold text-white truncate">{selectedFile.fileName}</span>
                  <span className="text-[10px] text-[#8E95AF]">
                    ({(selectedFile.fileSize / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-[#8E95AF] hover:text-white shrink-0 ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <label
                htmlFor="chat-file-upload"
                className="p-2.5 bg-[#141726] border border-[#23263A] text-[#8E95AF] hover:text-white rounded-xl cursor-pointer transition-colors shrink-0"
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
                className="flex-1 bg-[#141726] border border-[#23263A] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#626A86] focus:outline-none focus:border-[#5B82FF] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={sending}
                className="bg-[#4E75FF] hover:bg-[#5B82FF] text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95 shrink-0 disabled:opacity-50"
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
    </DashboardLayout>
  );
}
