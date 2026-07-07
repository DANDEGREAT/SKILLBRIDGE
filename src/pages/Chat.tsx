import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, PenSquare, Phone, Info, MoreVertical, Paperclip, Send, Check, CheckCheck,
  MapPin, FileText, Image as ImageIcon, Quote, X, ChevronDown, Star, Lock, Unlock,
  AlertTriangle, Siren, Camera, CheckCircle2, Clock, ArrowDown, Check as CheckIcon,
  Briefcase, Wallet, Calendar, Shield, MessageSquare, User as UserIcon,
} from 'lucide-react';
import {
  getChatRoomsForUser, getChatRoomForJob, getMessages, sendMessage,
  markMessagesRead, getJobById, releasePayment, createReview, createSosAlert, createDispute,
} from '../lib/api';
import type {
  ChatRoomWithDetails, Message, JobWithDetails, User, TechnicianProfile, Payment,
} from '../lib/types';
import { formatNaira, formatNairaShort, formatTime, formatDate, getInitials, getAvatarColor } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

// ---------- helpers ----------

const TECH_AUTO_REPLIES = [
  'Understood, I will take care of that right away.',
  'Thank you for the update. I am on my way.',
  'I have all the necessary tools and materials for this job.',
  'That will not be a problem at all. I will sort it out.',
  'I will confirm when I arrive at your gate. Thank you.',
  'Noted. I will call you when I am 5 minutes away.',
  'The job is progressing well. Should be done by 4pm.',
];
const CLIENT_AUTO_REPLIES = [
  'Thank you Ade, that sounds great.',
  'Perfect, please let me know when you are done.',
  'Okay, the gate code is 1234. Let yourself in.',
  'How much longer do you think it will take?',
  'Great work so far, thank you.',
];

const statusVariant: Record<string, 'gold' | 'teal' | 'green' | 'red' | 'gray' | 'amber'> = {
  open: 'green', bidding: 'gold', in_progress: 'teal',
  completed: 'gray', disputed: 'red', cancelled: 'gray',
  client_confirmed: 'teal', tech_confirmed: 'teal',
};
const statusLabel: Record<string, string> = {
  open: 'Open', bidding: 'Bidding', in_progress: 'In Progress',
  completed: 'Completed', disputed: 'Disputed', cancelled: 'Cancelled',
  client_confirmed: 'Client Confirmed', tech_confirmed: 'Tech Confirmed',
};

function dateKey(d: string | Date) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
}
function dateLabel(d: string | Date) {
  const dt = new Date(d);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (dateKey(dt) === dateKey(today)) return 'Today';
  if (dateKey(dt) === dateKey(yesterday)) return 'Yesterday';
  return formatDate(dt, 'dd MMM yyyy');
}
function isOnline(user: User | null | undefined): boolean {
  if (!user?.last_seen) return true;
  return Date.now() - new Date(user.last_seen).getTime() < 5 * 60 * 1000;
}
function otherParty(room: ChatRoomWithDetails, meId: string): { user: User | null; profile: TechnicianProfile | null; role: 'client' | 'tech' } {
  if (room.client_id === meId) return { user: room.tech, profile: room.tech_profile, role: 'tech' };
  return { user: room.client, profile: null, role: 'client' };
}
function partyName(u: User | null): string {
  if (!u) return 'Unknown';
  return `${u.first_name} ${u.last_name}`;
}

// ---------- main component ----------

export default function Chat() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const [rooms, setRooms] = useState<ChatRoomWithDetails[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoomWithDetails | null>(null);
  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [showInfo, setShowInfo] = useState(true);
  const [showBanner, setShowBanner] = useState(true);
  const [typing, setTyping] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showSos, setShowSos] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showCall, setShowCall] = useState(false);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);
  const [unreadBelow, setUnreadBelow] = useState(0);
  const [atBottom, setAtBottom] = useState(true);

  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ---- load rooms ----
  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoadingRooms(true);
    getChatRoomsForUser(user.id).then((data) => {
      if (!active) return;
      setRooms(data);
      setLoadingRooms(false);
    });
    return () => { active = false; };
  }, [user]);

  // ---- load active room + job + messages when jobId changes ----
  useEffect(() => {
    if (!jobId || !user) return;
    let active = true;
    setLoadingThread(true);
    setShowBanner(true);
    getChatRoomForJob(jobId).then(async (room) => {
      if (!active) return;
      setActiveRoom(room);
      if (room) {
        const [msgs, jb] = await Promise.all([getMessages(room.id), getJobById(jobId)]);
        if (!active) return;
        setMessages(msgs);
        setJob(jb);
        // mark read
        markMessagesRead(room.id, user.id);
        // refresh room unread in list
        setRooms((prev) => prev.map((r) => r.id === room.id ? { ...r, unread_count: 0 } : r));
      }
      setLoadingThread(false);
    });
    return () => {
      active = false;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [jobId, user]);

  // ---- scroll to bottom on new messages ----
  const scrollToBottom = useCallback((smooth = false) => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    setAtBottom(true);
    setUnreadBelow(0);
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom(false);
  }, [messages.length, scrollToBottom]);

  // ---- scroll listener ----
  const onThreadScroll = useCallback(() => {
    const el = threadRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(nearBottom);
    if (nearBottom) setUnreadBelow(0);
  }, []);

  // ---- send message ----
  const handleSend = useCallback(async (content?: string, type: string = 'text', metadata?: string) => {
    const text = (content ?? input).trim();
    if (!text || !activeRoom || !user) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const tempId = 'temp-' + Date.now();
    const optimistic: Message = {
      id: tempId, room_id: activeRoom.id, sender_id: user.id, content: text,
      type: type as any, metadata, is_read: false, read_at: null,
      edited_at: null, deleted_at: null, reply_to_id: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom(true);

    // persist
    const saved = await sendMessage({ room_id: activeRoom.id, sender_id: user.id, content: text, type, metadata });
    if (saved) {
      setMessages((prev) => prev.map((m) => m.id === tempId ? saved : m));
    }

    // simulate read receipt after 2-3s
    const t1 = setTimeout(() => {
      setMessages((prev) => prev.map((m) => m.id === (saved?.id || tempId) ? { ...m, is_read: true, read_at: new Date().toISOString() } : m));
    }, 2000 + Math.random() * 1000);
    timersRef.current.push(t1);

    // simulate typing + auto-reply
    const other = otherParty(activeRoom, user.id);
    const pool = other.role === 'tech' ? TECH_AUTO_REPLIES : CLIENT_AUTO_REPLIES;
    const reply = pool[Math.floor(Math.random() * pool.length)];

    const t2 = setTimeout(() => setTyping(true), 1200);
    const t3 = setTimeout(() => {
      setTyping(false);
      const replyMsg: Message = {
        id: 'auto-' + Date.now(), room_id: activeRoom.id, sender_id: other.user?.id || 'other',
        content: reply, type: 'text', metadata: null, is_read: false, read_at: null,
        edited_at: null, deleted_at: null, reply_to_id: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, replyMsg]);
      // toast if not focused
      if (document.visibilityState !== 'visible' || !atBottom) {
        addToast({ type: 'info', title: partyName(other.user), message: reply, duration: 4000 });
        setUnreadBelow((n) => n + 1);
      } else {
        scrollToBottom(true);
      }
    }, 1500 + 1200 + Math.random() * 2000);
    timersRef.current.push(t2, t3);
  }, [input, activeRoom, user, atBottom, scrollToBottom, addToast]);

  // ---- auto-expand textarea ----
  const onInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 72) + 'px';
  };

  // ---- enter to send ----
  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ---- attachment send ----
  const sendAttachment = (type: 'image' | 'file' | 'location' | 'quote') => {
    setShowAttach(false);
    if (type === 'image') {
      handleSend('Shared photo', 'image', JSON.stringify({ gradient: 'from-primary to-accent' }));
    } else if (type === 'location') {
      handleSend('6.5244,3.3792', 'location', JSON.stringify({ lat: 6.5244, lng: 3.3792, label: 'Victoria Island, Lagos' }));
    } else if (type === 'quote') {
      handleSend('Quote requested', 'quote', JSON.stringify({ shop: 'Lagos Electricals', items: [{ name: 'Wiring cable 10m', price: 4500 }, { name: 'Socket set', price: 2000 }], total: 6500 }));
    } else {
      handleSend('Shared document', 'file', JSON.stringify({ name: 'invoice.pdf', size: '124 KB' }));
    }
  };

  // ---- actions ----
  const handleRelease = async () => {
    if (!jobId) return;
    await releasePayment(jobId);
    addToast({ type: 'success', title: 'Payment released', message: 'Escrow funds released to technician.' });
    if (jobId) setJob(await getJobById(jobId));
  };

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const handleSubmitReview = async () => {
    if (!job || !user || !job.technician_id || rating === 0) return;
    setSubmittingReview(true);
    await createReview({ job_id: job.id, reviewer_id: user.id, technician_id: job.technician_id, rating, comment: reviewComment });
    setSubmittingReview(false);
    addToast({ type: 'success', title: 'Review submitted', message: 'Thank you for your feedback.' });
    if (jobId) setJob(await getJobById(jobId));
  };

  const handleSos = async () => {
    if (!jobId || !user) return;
    await createSosAlert({ job_id: jobId, triggered_by: user.id, alert_type: 'safety' });
    addToast({ type: 'warning', title: 'SOS Alert sent', message: 'Support team has been notified.', duration: 6000 });
    setShowSos(false);
  };

  const handleDispute = async () => {
    if (!jobId || !user || !activeRoom) return;
    const against = activeRoom.client_id === user.id ? activeRoom.tech_id : activeRoom.client_id;
    await createDispute({ job_id: jobId, raised_by: user.id, against, reason: disputeReason || 'Unspecified issue' });
    addToast({ type: 'warning', title: 'Dispute raised', message: 'Our team will review and contact you.' });
    setShowDispute(false);
    setDisputeReason('');
    if (jobId) setJob(await getJobById(jobId));
  };

  // ---- hold-to-confirm button ----
  const HoldButton = ({ label, onConfirm, color = 'gold', holdMs = 800 }: { label: string; onConfirm: () => void; color?: 'gold' | 'teal'; holdMs?: number }) => {
    const [progress, setProgress] = useState(0);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef<number>(0);

    const start = () => {
      startRef.current = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startRef.current;
        const p = Math.min(elapsed / holdMs, 1);
        setProgress(p);
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
        else { onConfirm(); setProgress(0); }
      };
      rafRef.current = requestAnimationFrame(tick);
    };
    const cancel = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setProgress(0);
    };
    const base = color === 'gold' ? 'gold-gradient text-bg' : 'teal-gradient text-white';
    return (
      <button
        onMouseDown={start} onMouseUp={cancel} onMouseLeave={cancel}
        onTouchStart={start} onTouchEnd={cancel}
        className={`relative overflow-hidden w-full py-3 rounded-xl font-semibold text-sm ${base}`}
      >
        {progress > 0 && (
          <span className="absolute inset-0 bg-black/30" style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }} />
        )}
        <span className="relative flex items-center justify-center gap-2">
          {progress < 1 ? <Shield size={16} /> : <CheckCircle2 size={16} />}
          {progress > 0 ? `Hold ${Math.ceil((1 - progress) * (holdMs / 1000) * 10) / 10}s` : label}
        </span>
      </button>
    );
  };

  // ---- derived ----
  const filteredRooms = useMemo(() => {
    if (!search) return rooms;
    const q = search.toLowerCase();
    return rooms.filter((r) => {
      const other = otherParty(r, user?.id || '');
      const name = partyName(other.user).toLowerCase();
      const jobTitle = (r.job?.title || '').toLowerCase();
      return name.includes(q) || jobTitle.includes(q);
    });
  }, [rooms, search, user]);

  const isClient = user?.id === activeRoom?.client_id;
  const isTech = user?.id === activeRoom?.tech_id;
  const other = activeRoom ? otherParty(activeRoom, user?.id || '') : null;
  const payment = job?.payment || null;
  const hasReview = !!job?.review;

  // group messages by date
  const grouped = useMemo(() => {
    const groups: { date: string; items: Message[] }[] = [];
    for (const m of messages) {
      const k = dateKey(m.created_at);
      if (!groups.length || groups[groups.length - 1].date !== k) groups.push({ date: k, items: [m] });
      else groups[groups.length - 1].items.push(m);
    }
    return groups;
  }, [messages]);

  // ---------- render ----------
  return (
    <div className="fixed inset-0 flex bg-bg text-text font-body overflow-hidden" style={{ top: 0 }}>
      {/* LEFT SIDEBAR */}
      <aside className="w-[260px] shrink-0 border-r border-border bg-bg-2 flex flex-col">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-text">Messages</h1>
          <button className="w-9 h-9 rounded-full gold-gradient text-bg flex items-center justify-center btn-press">
            <PenSquare size={16} />
          </button>
        </div>
        <div className="px-3 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or job"
              className="w-full bg-bg-3 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {loadingRooms ? (
            <div className="px-4 py-6 space-y-3">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-bg-3 animate-pulse" />)}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <MessageSquare size={32} className="mx-auto text-text-3 mb-3" />
              <p className="text-sm text-text-2">No conversations yet</p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const o = otherParty(room, user?.id || '');
              const name = partyName(o.user);
              const last = room.last_message;
              const preview = last ? (last.content.length > 45 ? last.content.slice(0, 45) + '…' : last.content) : 'No messages yet';
              const active = room.job_id === jobId;
              return (
                <button
                  key={room.id}
                  onClick={() => navigate(`/chat/${room.job_id}`)}
                  className={`w-full flex items-start gap-3 px-3 py-3 border-l-2 transition-colors text-left ${active ? 'border-primary bg-bg-3' : 'border-transparent hover:bg-bg-3/50'}`}
                >
                  <Avatar firstName={o.user?.first_name || ''} lastName={o.user?.last_name || ''} size="md" online={isOnline(o.user)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-text truncate">{name}</span>
                      <span className="text-[10px] text-text-3 shrink-0">{last ? formatTime(last.created_at) : ''}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-xs text-text-2 truncate">{preview}</span>
                      {room.unread_count > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-bg text-[10px] font-bold flex items-center justify-center">
                          {room.unread_count}
                        </span>
                      )}
                    </div>
                    {room.job && (
                      <div className="mt-1.5">
                        <Badge variant={statusVariant[room.job.status] || 'gray'} size="sm">{statusLabel[room.job.status] || room.job.status}</Badge>
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* MAIN CHAT PANEL */}
      <main className="flex-1 flex flex-col min-w-0">
        {!activeRoom ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto text-text-3 mb-4" />
              <h2 className="font-display text-2xl font-bold text-text mb-2">Select a conversation</h2>
              <p className="text-sm text-text-2">Choose a chat from the left to start messaging.</p>
            </div>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-2/95 backdrop-blur">
              <Avatar firstName={other?.user?.first_name || ''} lastName={other?.user?.last_name || ''} size="md" online={isOnline(other?.user)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text truncate">{partyName(other?.user)}</span>
                  {other?.profile?.tier && other.profile.tier !== 'standard' && (
                    <Badge variant={other.profile.tier === 'elite' ? 'gold' : 'teal'} size="sm">
                      {other.profile.tier === 'elite' ? '★ Elite' : 'Certified'}
                    </Badge>
                  )}
                  {other?.user?.is_phone_verified && (
                    <CheckCircle2 size={14} className="text-accent-mid shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-2">
                  <span className="truncate">{job?.title || 'Job'}</span>
                  {job && <Badge variant={statusVariant[job.status] || 'gray'} size="sm">{statusLabel[job.status] || job.status}</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowCall(true)} className="w-9 h-9 rounded-lg hover:bg-bg-3 flex items-center justify-center text-text-2 hover:text-primary transition-colors" title="Call">
                  <Phone size={18} />
                </button>
                <button onClick={() => setShowInfo((s) => !s)} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${showInfo ? 'bg-bg-3 text-primary' : 'hover:bg-bg-3 text-text-2'}`} title="Job details">
                  <Info size={18} />
                </button>
                <div className="relative">
                  <button onClick={() => setShowMore((s) => !s)} className="w-9 h-9 rounded-lg hover:bg-bg-3 flex items-center justify-center text-text-2 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                  <AnimatePresence>
                    {showMore && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="absolute right-0 top-10 z-30 w-44 bg-bg-2 border border-border rounded-xl shadow-2xl py-1">
                        <button onClick={() => { setShowMore(false); setShowInfo(true); }} className="w-full px-4 py-2 text-sm text-text-2 hover:text-text hover:bg-bg-3 text-left flex items-center gap-2"><Info size={14} /> Job details</button>
                        <button onClick={() => { setShowMore(false); setShowDispute(true); }} className="w-full px-4 py-2 text-sm text-text-2 hover:text-text hover:bg-bg-3 text-left flex items-center gap-2"><AlertTriangle size={14} /> Raise dispute</button>
                        <button onClick={() => { setShowMore(false); setShowSos(true); }} className="w-full px-4 py-2 text-sm text-power hover:bg-bg-3 text-left flex items-center gap-2"><Siren size={14} /> SOS Emergency</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </header>

            {/* JOB CONTEXT BANNER */}
            <AnimatePresence>
              {showBanner && job && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 border-b border-primary/20">
                    <Wallet size={16} className="text-primary-mid shrink-0" />
                    <div className="flex-1 flex items-center gap-3 text-xs text-text-2 flex-wrap">
                      <span className="text-primary-mid font-semibold">{statusLabel[job.status] || job.status}</span>
                      <span className="text-text-3">•</span>
                      <span>Escrow: {payment ? (payment.status === 'held' ? 'Held' : payment.status === 'released' ? 'Released' : 'Pending') : 'Not funded'}</span>
                      <span className="text-text-3">•</span>
                      <span className="text-text">{job.agreed_amount ? formatNaira(job.agreed_amount) : 'No amount'}</span>
                    </div>
                    {isClient && job.status === 'open' && (
                      <Button size="sm" variant="primary" onClick={() => navigate(`/jobs/${job.id}`)}>Make payment</Button>
                    )}
                    {isClient && job.status === 'in_progress' && (
                      <Button size="sm" variant="primary" onClick={handleRelease}>Confirm completion</Button>
                    )}
                    {payment && (
                      <Button size="sm" variant="ghost" onClick={() => setShowInfo(true)}>View escrow</Button>
                    )}
                    <button onClick={() => setShowBanner(false)} className="text-text-3 hover:text-text"><X size={14} /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MESSAGE THREAD */}
            <div ref={threadRef} onScroll={onThreadScroll} className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-1">
              {loadingThread ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl bg-bg-2 animate-pulse" />)}
                </div>
              ) : (
                grouped.map((group) => (
                  <div key={group.date}>
                    <div className="flex justify-center my-3">
                      <span className="text-[11px] text-text-3 bg-bg-3 px-3 py-1 rounded-full">{dateLabel(group.date)}</span>
                    </div>
                    {group.items.map((m) => (
                      <MessageBubble key={m.id} message={m} meId={user?.id || ''} other={other} onImageClick={(g) => setShowImageModal(g)} />
                    ))}
                  </div>
                ))
              )}

              {/* typing indicator */}
              <AnimatePresence>
                {typing && other?.user && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="flex items-end gap-2 mt-2">
                    <Avatar firstName={other.user.first_name} lastName={other.user.last_name} size="xs" />
                    <div className="bg-bg-2 border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-text-2 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                      <span className="ml-2 text-xs text-text-3">{other.user.first_name} is typing…</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* scroll-to-bottom FAB */}
            <AnimatePresence>
              {(!atBottom || unreadBelow > 0) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => scrollToBottom(true)}
                  className="absolute bottom-24 right-6 w-11 h-11 rounded-full bg-bg-3 border border-border shadow-lg flex items-center justify-center text-primary hover:bg-bg-4"
                >
                  <ArrowDown size={18} />
                  {unreadBelow > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-bg text-[10px] font-bold flex items-center justify-center">{unreadBelow}</span>
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            {/* INPUT AREA */}
            <div className="relative border-t border-border bg-bg-2 px-4 py-3">
              <AnimatePresence>
                {showAttach && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="absolute bottom-16 left-4 z-20 w-44 bg-bg-2 border border-border rounded-xl shadow-2xl py-1">
                    <button onClick={() => sendAttachment('image')} className="w-full px-4 py-2.5 text-sm text-text-2 hover:text-text hover:bg-bg-3 text-left flex items-center gap-2"><ImageIcon size={15} /> Photo</button>
                    <button onClick={() => sendAttachment('file')} className="w-full px-4 py-2.5 text-sm text-text-2 hover:text-text hover:bg-bg-3 text-left flex items-center gap-2"><FileText size={15} /> File</button>
                    <button onClick={() => sendAttachment('location')} className="w-full px-4 py-2.5 text-sm text-text-2 hover:text-text hover:bg-bg-3 text-left flex items-center gap-2"><MapPin size={15} /> Location</button>
                    <button onClick={() => sendAttachment('quote')} className="w-full px-4 py-2.5 text-sm text-text-2 hover:text-text hover:bg-bg-3 text-left flex items-center gap-2"><Quote size={15} /> Quote request</button>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-end gap-2">
                <button onClick={() => setShowAttach((s) => !s)} className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-colors ${showAttach ? 'bg-primary/15 text-primary' : 'text-text-2 hover:text-text hover:bg-bg-3'}`}>
                  <Paperclip size={18} />
                </button>
                <textarea
                  ref={inputRef} value={input} onChange={onInputChange} onKeyDown={onInputKeyDown}
                  rows={1} placeholder="Type a message…"
                  className="flex-1 bg-bg-3 border border-border rounded-2xl px-4 py-2.5 text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-primary/40 resize-none max-h-[72px] no-scrollbar"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-full shrink-0 gold-gradient text-bg flex items-center justify-center btn-press disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* RIGHT INFO PANEL */}
      <AnimatePresence>
        {showInfo && activeRoom && job && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="shrink-0 border-l border-border bg-bg-2 overflow-y-auto no-scrollbar"
          >
            <div className="p-4 space-y-4">
              {/* Job card */}
              <div className="bg-bg-3 border border-border rounded-xl p-3">
                <h3 className="font-display font-bold text-text text-sm mb-1">{job.title}</h3>
                <div className="flex items-center gap-2 text-xs text-text-2 mb-2">
                  <Briefcase size={12} /> {job.trade}
                  <MapPin size={12} /> {job.location_text || 'N/A'}
                </div>
                <Badge variant={statusVariant[job.status] || 'gray'} size="sm">{statusLabel[job.status] || job.status}</Badge>
                {/* timeline */}
                <div className="flex items-center mt-3 mb-1">
                  {['open', 'bidding', 'in_progress', 'completed'].map((s, i) => {
                    const order = ['open', 'bidding', 'in_progress', 'client_confirmed', 'tech_confirmed', 'completed'];
                    const curIdx = order.indexOf(job.status);
                    const done = i <= curIdx || (job.status === 'completed' && i === 3);
                    return (
                      <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className={`w-2.5 h-2.5 rounded-full ${done ? 'bg-primary' : 'bg-bg-4'}`} />
                        {i < 3 && <div className={`flex-1 h-0.5 mx-1 ${done ? 'bg-primary' : 'bg-bg-4'}`} />}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-text-3 mt-1">
                  <span>Open</span><span>Bid</span><span>Prog</span><span>Done</span>
                </div>
                {job.agreed_amount != null && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-text-2">Agreed</span>
                    <span className="text-sm font-bold text-primary-mid">{formatNaira(job.agreed_amount)}</span>
                  </div>
                )}
                {job.scheduled_date && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-text-2">
                    <Calendar size={12} /> {formatDate(job.scheduled_date, 'dd MMM, HH:mm')}
                  </div>
                )}
              </div>

              {/* People */}
              <div>
                <h4 className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-2">People in this chat</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar firstName={job.client?.first_name || ''} lastName={job.client?.last_name || ''} size="sm" online={isOnline(job.client)} />
                    <div className="min-w-0">
                      <p className="text-sm text-text truncate">{partyName(job.client)}</p>
                      <p className="text-[10px] text-text-3">Client</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar firstName={job.technician?.first_name || ''} lastName={job.technician?.last_name || ''} size="sm" online={isOnline(job.technician)} />
                    <div className="min-w-0">
                      <p className="text-sm text-text truncate">{partyName(job.technician)}</p>
                      <div className="flex items-center gap-1">
                        <p className="text-[10px] text-text-3">Technician</p>
                        {job.technician_profile?.tier && job.technician_profile.tier !== 'standard' && (
                          <Badge variant={job.technician_profile.tier === 'elite' ? 'gold' : 'teal'} size="sm">{job.technician_profile.tier}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                {isClient && job.status === 'in_progress' && (
                  <HoldButton label="Confirm job complete" color="gold" onConfirm={handleRelease} />
                )}
                {isTech && job.status === 'in_progress' && (
                  <HoldButton label="Mark job done" color="teal" onConfirm={async () => { await releasePayment(job.id); addToast({ type: 'success', title: 'Job marked done' }); if (jobId) setJob(await getJobById(jobId)); }} />
                )}
                {isClient && job.status === 'open' && (
                  <Button variant="primary" fullWidth size="sm" onClick={() => navigate(`/jobs/${job.id}`)}>Pay into escrow</Button>
                )}
                <Button variant="outline" fullWidth size="sm" onClick={() => addToast({ type: 'info', title: 'Photo upload', message: 'Camera roll (simulated).' })}><Camera size={14} /> Upload job photos</Button>
                <Button variant="outline" fullWidth size="sm" onClick={() => setShowDispute(true)}><AlertTriangle size={14} /> Raise dispute</Button>
                <button onClick={() => setShowSos(true)} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-power/15 text-power border border-power/30 hover:bg-power/25 transition-colors flex items-center justify-center gap-2">
                  <Siren size={14} /> SOS Emergency
                </button>
              </div>

              {/* Escrow widget */}
              {payment && (
                <div className="bg-bg-3 border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-text-3 uppercase">Escrow</span>
                    {payment.status === 'held' ? <Lock size={14} className="text-primary-mid" /> : <Unlock size={14} className="text-success" />}
                  </div>
                  <div className="text-lg font-bold text-text">{formatNaira(payment.amount)}</div>
                  <div className="text-xs text-text-2 mt-0.5">Status: <span className={payment.status === 'held' ? 'text-primary-mid' : 'text-success'}>{payment.status}</span></div>
                  {payment.held_at && <div className="text-[10px] text-text-3 mt-0.5">Held {formatDate(payment.held_at, 'dd MMM')}</div>}
                  <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-text-2">Labour</span><span className="text-text">{formatNairaShort(Math.round(payment.amount * 0.7))}</span></div>
                    <div className="flex justify-between"><span className="text-text-2">Materials</span><span className="text-text">{formatNairaShort(Math.round(payment.amount * 0.25))}</span></div>
                    <div className="flex justify-between"><span className="text-text-2">Platform fee</span><span className="text-text">{formatNairaShort(payment.platform_fee || Math.round(payment.amount * 0.05))}</span></div>
                    <div className="flex justify-between pt-1 border-t border-border"><span className="text-text-2 font-semibold">Total</span><span className="text-primary-mid font-bold">{formatNaira(payment.amount)}</span></div>
                  </div>
                </div>
              )}

              {/* Rating section */}
              {job.status === 'completed' && (
                <div className="bg-bg-3 border border-border rounded-xl p-3">
                  <h4 className="text-xs font-semibold text-text-3 uppercase mb-2">Rate this job</h4>
                  {hasReview ? (
                    <div className="text-center py-2">
                      <CheckCircle2 size={20} className="mx-auto text-success mb-1" />
                      <p className="text-xs text-text-2">You've already reviewed this job.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(n)}>
                            <Star size={22} className={(hoverRating || rating) >= n ? 'text-primary fill-primary' : 'text-text-3'} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Leave a comment…" rows={2}
                        className="w-full bg-bg-2 border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-text-3 focus:outline-none focus:border-primary/40 resize-none mb-2"
                      />
                      <Button variant="primary" fullWidth size="sm" loading={submittingReview} disabled={rating === 0} onClick={handleSubmitReview}>Submit review</Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MODALS */}
      <Modal open={showCall} onClose={() => setShowCall(false)} title="Call" size="sm">
        <div className="text-center py-6">
          <Avatar firstName={other?.user?.first_name || ''} lastName={other?.user?.last_name || ''} size="xl" online />
          <h3 className="font-display text-lg font-bold text-text mt-3">{partyName(other?.user)}</h3>
          <p className="text-sm text-text-2 mb-4">Calling… (simulated)</p>
          <Button variant="danger" onClick={() => setShowCall(false)}><Phone size={16} /> End call</Button>
        </div>
      </Modal>

      <Modal open={!!showImageModal} onClose={() => setShowImageModal(null)} title="Photo" size="lg">
        {showImageModal && (
          <div className={`w-full h-64 rounded-xl bg-gradient-to-br ${showImageModal} flex items-center justify-center`}>
            <ImageIcon size={48} className="text-white/40" />
          </div>
        )}
      </Modal>

      <Modal open={showSos} onClose={() => setShowSos(false)} title="SOS Emergency" size="sm">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-power/10 border border-power/30 rounded-xl">
            <Siren size={24} className="text-power" />
            <p className="text-sm text-text-2">This will alert the SkillBridge safety team. Only use in a real emergency.</p>
          </div>
          <p className="text-sm text-text-2">Confirm to send an SOS alert for this job.</p>
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={() => setShowSos(false)}>Cancel</Button>
            <Button variant="danger" fullWidth onClick={handleSos}>Confirm SOS</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showDispute} onClose={() => setShowDispute(false)} title="Raise a dispute" size="sm">
        <div className="space-y-3">
          <p className="text-sm text-text-2">Describe the issue with this job. Our team will review and mediate.</p>
          <textarea
            value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="What went wrong?" rows={4}
            className="w-full bg-bg-3 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-3 focus:outline-none focus:border-primary/40 resize-none"
          />
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={() => setShowDispute(false)}>Cancel</Button>
            <Button variant="primary" fullWidth onClick={handleDispute}>Submit dispute</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---------- message bubble ----------

function MessageBubble({ message, meId, other, onImageClick }: {
  message: Message; meId: string; other: { user: User | null; profile: TechnicianProfile | null; role: 'client' | 'tech' } | null;
  onImageClick: (gradient: string) => void;
}) {
  const mine = message.sender_id === meId;
  const isSystem = message.type === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-text-3 bg-bg-3/70 px-3 py-1.5 rounded-full">{message.content}</span>
      </div>
    );
  }

  // special types
  if (message.type === 'quote') {
    const meta = (() => { try { return JSON.parse(message.metadata || '{}'); } catch { return {}; } })();
    return (
      <div className={`flex ${mine ? 'justify-end' : 'justify-start'} my-1`}>
        <div className={`max-w-[75%] bg-bg-2 border border-border rounded-2xl p-3 ${mine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Quote size={14} className="text-primary-mid" />
            <span className="text-xs font-semibold text-text">{meta.shop || 'Quote'}</span>
          </div>
          <div className="space-y-1 mb-2">
            {(meta.items || []).map((it: any, i: number) => (
              <div key={i} className="flex justify-between text-xs text-text-2">
                <span>{it.name}</span><span>{formatNaira(it.price)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-bold text-text pt-2 border-t border-border">
            <span>Total</span><span className="text-primary-mid">{formatNaira(meta.total || 0)}</span>
          </div>
          {!mine && <Button size="sm" variant="primary" className="mt-2" fullWidth>Accept quote</Button>}
        </div>
      </div>
    );
  }

  if (message.type === 'location') {
    const meta = (() => { try { return JSON.parse(message.metadata || '{}'); } catch { return {}; } })();
    return (
      <div className={`flex ${mine ? 'justify-end' : 'justify-start'} my-1`}>
        <div className={`max-w-[75%] bg-bg-2 border border-border rounded-2xl p-2 ${mine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
          <div className="h-32 rounded-lg bg-gradient-to-br from-accent/40 to-primary/30 flex items-center justify-center mb-2 relative overflow-hidden">
            <MapPin size={28} className="text-white/80" />
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          </div>
          <p className="text-xs text-text-2 px-1">{meta.label || message.content}</p>
          <Button size="sm" variant="ghost" className="mt-1" fullWidth>View location</Button>
          <div className="text-[10px] text-text-3 text-right mt-1 px-1">{formatTime(message.created_at)}</div>
        </div>
      </div>
    );
  }

  if (message.type === 'payment_update') {
    const meta = (() => { try { return JSON.parse(message.metadata || '{}'); } catch { return {}; } })();
    return (
      <div className={`flex ${mine ? 'justify-end' : 'justify-start'} my-1`}>
        <div className={`max-w-[75%] bg-bg-2 border border-primary/30 rounded-2xl p-3 ${mine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={14} className="text-primary-mid" />
            <span className="text-xs font-semibold text-primary-mid">Payment update</span>
          </div>
          <p className="text-sm text-text">{formatNaira(meta.amount || 0)}</p>
          <p className="text-xs text-text-2">Escrow: {meta.status || 'pending'}</p>
          {meta.reference && <p className="text-[10px] text-text-3">Ref: {meta.reference}</p>}
          <div className="text-[10px] text-text-3 text-right mt-1">{formatTime(message.created_at)}</div>
        </div>
      </div>
    );
  }

  if (message.type === 'job_update') {
    return (
      <div className={`flex ${mine ? 'justify-end' : 'justify-start'} my-1`}>
        <div className={`max-w-[75%] bg-bg-2 border border-accent/30 rounded-2xl p-3 ${mine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-accent-mid" />
            <span className="text-xs font-semibold text-accent-mid">Job update</span>
          </div>
          <p className="text-sm text-text">{message.content}</p>
          <div className="text-[10px] text-text-3 text-right mt-1">{formatTime(message.created_at)}</div>
        </div>
      </div>
    );
  }

  if (message.type === 'image') {
    const meta = (() => { try { return JSON.parse(message.metadata || '{}'); } catch { return {}; } })();
    const gradient = meta.gradient || 'from-primary to-accent';
    return (
      <div className={`flex ${mine ? 'justify-end' : 'justify-start'} my-1`}>
        <div className={`max-w-[60%] ${mine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
          <button onClick={() => onImageClick(gradient)} className={`w-48 h-48 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center hover:opacity-90 transition-opacity`}>
            <ImageIcon size={32} className="text-white/50" />
          </button>
          <div className="flex items-center gap-1 justify-end mt-1 px-1">
            <span className="text-[10px] text-text-3">{formatTime(message.created_at)}</span>
            {mine && <ReadReceipt message={message} />}
          </div>
        </div>
      </div>
    );
  }

  if (message.type === 'file') {
    const meta = (() => { try { return JSON.parse(message.metadata || '{}'); } catch { return {}; } })();
    return (
      <div className={`flex ${mine ? 'justify-end' : 'justify-start'} my-1`}>
        <div className={`max-w-[75%] bg-bg-2 border border-border rounded-2xl p-3 ${mine ? 'rounded-br-md' : 'rounded-bl-md'}`}>
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-accent-mid" />
            <div>
              <p className="text-sm text-text">{meta.name || 'Document'}</p>
              <p className="text-[10px] text-text-3">{meta.size || ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 justify-end mt-1">
            <span className="text-[10px] text-text-3">{formatTime(message.created_at)}</span>
            {mine && <ReadReceipt message={message} />}
          </div>
        </div>
      </div>
    );
  }

  // text bubble
  return (
    <div className={`flex items-end gap-2 my-0.5 ${mine ? 'justify-end' : 'justify-start'}`}>
      {!mine && other?.user && (
        <Avatar firstName={other.user.first_name} lastName={other.user.last_name} size="xs" />
      )}
      <div className={`max-w-[70%] px-3.5 py-2.5 ${mine
        ? 'gold-gradient text-bg rounded-2xl rounded-br-md'
        : 'bg-bg-2 border border-border text-text rounded-2xl rounded-bl-md'
        }`}>
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div className="flex items-center gap-1 justify-end mt-0.5">
          <span className={`text-[10px] ${mine ? 'text-bg/70' : 'text-text-3'}`}>{formatTime(message.created_at)}</span>
          {mine && <ReadReceipt message={message} />}
        </div>
      </div>
    </div>
  );
}

function ReadReceipt({ message }: { message: Message }) {
  if (!message.is_read) return <Check size={12} className="text-bg/60" />;
  return <CheckCheck size={13} className="text-bg" />;
}
