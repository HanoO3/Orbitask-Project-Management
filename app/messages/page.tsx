'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Hash,
  Search,
  Phone,
  Video,
  MessageSquare,
  Loader2,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  Volume2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUserProjects } from '@/lib/actions/projects';
import { getWorkspaceUsers } from '@/lib/actions/users';
import { getChannelMessages, sendChatMessage } from '@/lib/actions/chat';

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

interface ChatMessage {
  id: string;
  senderName: string;
  senderInitials: string;
  senderRole?: string;
  avatarBg?: string;
  text: string;
  time: string;
  isSelf: boolean;
}

interface ActiveCall {
  type: 'audio' | 'video';
  targetName: string;
  targetInitials: string;
  status: 'calling' | 'connected';
  duration: number;
  isMuted: boolean;
  isVideoOff: boolean;
}

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

function formatCallDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const colorPalette = [
  'bg-blue-600',
  'bg-purple-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-indigo-600',
];

export default function MessagesPage() {
  const { data: session } = useSession();
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [users, setUsers] = useState<WorkspaceUser[]>([]);

  const [activeChannel, setActiveChannel] = useState<{ id: string; name: string; type: 'channel' | 'dm' }>({
    id: 'general',
    name: 'general',
    type: 'channel',
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Calling Feature State
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);

  const currentUserId = session?.user?.id;
  const currentUserName = session?.user?.name || 'User';
  const currentUserInitials = getInitials(currentUserName);

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

      const formattedProjects = (projectsData as any[]).map((p) => ({
        id: p.id,
        name: p.name.toLowerCase().replace(/\s+/g, '-'),
      }));

      setProjects(formattedProjects);
      setUsers(usersData as WorkspaceUser[]);
    } catch (err) {
      console.error('Failed to load workspace channels:', err);
    }
    setLoadingChannels(false);
  }, []);

  useEffect(() => {
    void loadChannelsAndUsers();
  }, [loadChannelsAndUsers]);

  // Fetch real messages for active channel from Prisma Database
  const fetchMessagesForActiveChannel = useCallback(async () => {
    if (!currentUserId) return;
    const channelKey = getChannelKey();
    try {
      const dbMsgs = await getChannelMessages(channelKey);

      const formatted: ChatMessage[] = dbMsgs.map((m) => {
        const isSelf = m.senderId === currentUserId;
        const senderName = m.sender.name || 'User';
        const senderInitials = getInitials(senderName);
        const timeStr = new Date(m.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        return {
          id: m.id,
          senderName,
          senderInitials,
          senderRole: formatRole(m.sender.role),
          avatarBg: isSelf ? 'bg-[#4E75FF]' : 'bg-emerald-600',
          text: m.content,
          time: timeStr,
          isSelf,
        };
      });

      setMessages(formatted);
    } catch (err) {
      console.error('Failed to fetch channel messages from DB:', err);
    }
  }, [currentUserId, getChannelKey]);

  // Initial load and polling every 4 seconds for real-time updates
  useEffect(() => {
    setLoadingMessages(true);
    void fetchMessagesForActiveChannel().finally(() => setLoadingMessages(false));

    const interval = setInterval(() => {
      void fetchMessagesForActiveChannel();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchMessagesForActiveChannel]);

  // Call timer effect
  useEffect(() => {
    if (!activeCall) return;

    let timer: NodeJS.Timeout;
    if (activeCall.status === 'calling') {
      timer = setTimeout(() => {
        setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
      }, 1800);
    } else if (activeCall.status === 'connected') {
      timer = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
      }, 1000);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(timer);
    };
  }, [activeCall?.status]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    const channelKey = getChannelKey();

    // Send message to PostgreSQL database via Server Action
    const res = await sendChatMessage(channelKey, content);
    setSending(false);

    if (res.success && res.message) {
      void fetchMessagesForActiveChannel();
    } else {
      console.error('Failed to send message:', res.error);
    }
  };

  const startCall = (type: 'audio' | 'video') => {
    const targetName = activeChannel.type === 'channel' ? `#${activeChannel.name}` : activeChannel.name;
    const targetInitials = getInitials(activeChannel.name);

    setActiveCall({
      type,
      targetName,
      targetInitials,
      status: 'calling',
      duration: 0,
      isMuted: false,
      isVideoOff: false,
    });
  };

  const endCall = () => {
    if (!activeCall) return;

    const summaryText =
      activeCall.type === 'video'
        ? `📹 Video Call ended • ${formatCallDuration(activeCall.duration)}`
        : `📞 Audio Call ended • ${formatCallDuration(activeCall.duration)}`;

    // Save call log to database
    void sendChatMessage(getChannelKey(), summaryText);

    setActiveCall(null);
  };

  return (
    <DashboardLayout title="Messages">
      <div className="bg-[#141726] border border-[#23263A] rounded-2xl shadow-xl overflow-hidden h-[calc(100vh-140px)] min-h-[520px] grid grid-cols-1 md:grid-cols-4">
        {/* Left Channels & DM List */}
        <div className="md:col-span-1 border-r border-[#23263A] bg-[#090B17] p-4 flex flex-col justify-between overflow-y-auto">
          <div>
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
                <button
                  onClick={() => setActiveChannel({ id: 'general', name: 'general', type: 'channel' })}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeChannel.name === 'general' && activeChannel.type === 'channel'
                      ? 'bg-[#4E75FF] text-white shadow-md'
                      : 'text-[#8E95AF] hover:text-white hover:bg-[#141726]'
                  }`}
                >
                  <Hash className="w-4 h-4" />
                  <span>general</span>
                </button>

                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => setActiveChannel({ id: proj.id, name: proj.name, type: 'channel' })}
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
                {users
                  .filter((u) => u.id !== session?.user?.id)
                  .map((member, idx) => {
                    const initials = getInitials(member.name);
                    const colorBg = colorPalette[idx % colorPalette.length];
                    const isSelected = activeChannel.id === member.id && activeChannel.type === 'dm';

                    return (
                      <div
                        key={member.id}
                        onClick={() =>
                          setActiveChannel({
                            id: member.id,
                            name: member.name,
                            type: 'dm',
                          })
                        }
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
        <div className="md:col-span-3 flex flex-col justify-between bg-[#141726]">
          {/* Chat Header */}
          <div className="p-4 border-b border-[#23263A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeChannel.type === 'channel' ? (
                <Hash className="w-5 h-5 text-[#5B82FF]" />
              ) : (
                <MessageSquare className="w-5 h-5 text-[#5B82FF]" />
              )}
              <h3 className="font-bold text-white text-base">
                {activeChannel.type === 'channel' ? `#${activeChannel.name}` : activeChannel.name}
              </h3>
            </div>

            <div className="flex items-center gap-2 text-[#8E95AF]">
              <button
                onClick={() => startCall('audio')}
                className="p-2 hover:text-white rounded-lg hover:bg-[#1E2338] transition-colors"
                title="Start Audio Call"
              >
                <Phone className="w-4 h-4 text-[#5B82FF]" />
              </button>
              <button
                onClick={() => startCall('video')}
                className="p-2 hover:text-white rounded-lg hover:bg-[#1E2338] transition-colors"
                title="Start Video Call"
              >
                <Video className="w-4 h-4 text-[#5B82FF]" />
              </button>
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
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
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
                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.isSelf
                        ? 'bg-[#4E75FF] text-white rounded-tr-none shadow-md'
                        : 'bg-[#0B0D1A] text-white border border-[#23263A] rounded-tl-none'
                    }`}
                  >
                    {!msg.isSelf && (
                      <p className="font-bold text-[#5B82FF] mb-1 text-[11px]">
                        {msg.senderName}
                        {msg.senderRole && (
                          <span className="text-[#8E95AF] font-normal ml-1 border-l border-[#23263A] pl-1">
                            {msg.senderRole}
                          </span>
                        )}
                      </p>
                    )}
                    <p>{msg.text}</p>
                    <p
                      className={`text-[10px] mt-1.5 text-right ${
                        msg.isSelf ? 'text-white/70' : 'text-[#8E95AF]'
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-[#23263A] bg-[#090B17]">
            <div className="flex items-center gap-2">
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

      {/* Interactive Call Overlay Modal */}
      <AnimatePresence>
        {activeCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-[#141726] border border-[#23263A] rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 relative overflow-hidden">
              {/* Top info */}
              <div className="space-y-1">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#4E75FF]/20 text-[#5B82FF] border border-[#4E75FF]/30">
                  {activeCall.type === 'video' ? '📹 Video Call' : '📞 Audio Call'}
                </span>
                <h3 className="text-xl font-bold text-white mt-2">{activeCall.targetName}</h3>
                <p className="text-xs text-[#8E95AF]">
                  {activeCall.status === 'calling'
                    ? 'Connecting & Ringing...'
                    : `Connected • ${formatCallDuration(activeCall.duration)}`}
                </p>
              </div>

              {/* Center Graphic View */}
              {activeCall.type === 'video' ? (
                <div className="w-full h-52 bg-[#090B17] border border-[#23263A] rounded-2xl relative flex items-center justify-center overflow-hidden">
                  {activeCall.isVideoOff ? (
                    <div className="text-center text-xs text-[#8E95AF] space-y-2">
                      <div className="w-16 h-16 rounded-full bg-[#1E2540] flex items-center justify-center mx-auto text-white font-bold text-xl border border-[#5B82FF]/40 uppercase">
                        {activeCall.targetInitials}
                      </div>
                      <p>Camera Off</p>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1E2540] via-[#141726] to-[#090B17] flex flex-col items-center justify-center relative">
                      <div className="w-20 h-20 rounded-full bg-[#4E75FF] text-white flex items-center justify-center font-extrabold text-2xl shadow-xl uppercase border-2 border-[#5B82FF]">
                        {activeCall.targetInitials}
                      </div>
                      <span className="text-[11px] text-white/80 font-medium mt-2">
                        {activeCall.targetName}
                      </span>

                      {/* Small camera preview thumbnail */}
                      <div className="absolute bottom-3 right-3 w-20 h-14 bg-[#090B17] border border-[#5B82FF]/40 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-[10px] text-white font-bold uppercase">
                          {currentUserInitials} (You)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 flex justify-center relative">
                  <div className="relative flex items-center justify-center">
                    {activeCall.status === 'calling' && (
                      <div className="absolute w-28 h-28 rounded-full bg-[#4E75FF]/30 animate-ping" />
                    )}
                    <div className="w-24 h-24 rounded-full bg-[#4E75FF] text-white flex items-center justify-center font-extrabold text-3xl shadow-2xl uppercase border-2 border-[#5B82FF] relative z-10">
                      {activeCall.targetInitials}
                    </div>
                  </div>
                </div>
              )}

              {/* Call Controls Bar */}
              <div className="flex items-center justify-center gap-4 pt-2">
                {/* Mute Button */}
                <button
                  onClick={() =>
                    setActiveCall((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null))
                  }
                  className={`p-3.5 rounded-full transition-all border ${
                    activeCall.isMuted
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-[#1E2338] text-white border-[#23263A] hover:bg-[#2B314F]'
                  }`}
                  title={activeCall.isMuted ? 'Unmute' : 'Mute'}
                >
                  {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Video Toggle (Only for Video Calls) */}
                {activeCall.type === 'video' && (
                  <button
                    onClick={() =>
                      setActiveCall((prev) =>
                        prev ? { ...prev, isVideoOff: !prev.isVideoOff } : null
                      )
                    }
                    className={`p-3.5 rounded-full transition-all border ${
                      activeCall.isVideoOff
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : 'bg-[#1E2338] text-white border-[#23263A] hover:bg-[#2B314F]'
                    }`}
                    title={activeCall.isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  >
                    {activeCall.isVideoOff ? (
                      <VideoOff className="w-5 h-5" />
                    ) : (
                      <Video className="w-5 h-5" />
                    )}
                  </button>
                )}

                {/* End Call Button */}
                <button
                  onClick={endCall}
                  className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-[0_0_15px_rgba(225,29,72,0.4)] active:scale-95"
                  title="End Call"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
