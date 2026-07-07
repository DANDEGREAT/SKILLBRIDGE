import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Briefcase, Wallet, MessageSquare, Settings as SettingsIcon,
  CheckCheck, CheckCircle2, Circle, ArrowRight, Inbox, Loader2,
} from 'lucide-react';
import {
  getNotifications, markNotificationRead, markAllNotificationsRead,
} from '../lib/api';
import type { Notification } from '../lib/types';
import { timeAgo } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';

type Tab = 'all' | 'jobs' | 'payments' | 'messages' | 'system';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'all', label: 'All', icon: Bell },
  { key: 'jobs', label: 'Jobs', icon: Briefcase },
  { key: 'payments', label: 'Payments', icon: Wallet },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'system', label: 'System', icon: SettingsIcon },
];

const TYPE_ICON: Record<string, any> = {
  job: Briefcase,
  bid: Briefcase,
  payment: Wallet,
  message: MessageSquare,
  system: SettingsIcon,
  kyc: SettingsIcon,
  subscription: Wallet,
};

const TYPE_COLOR: Record<string, string> = {
  job: 'text-primary-mid bg-primary/15',
  bid: 'text-primary-mid bg-primary/15',
  payment: 'text-success bg-success/15',
  message: 'text-accent-mid bg-accent/15',
  system: 'text-text-2 bg-bg-3',
  kyc: 'text-accent-mid bg-accent/15',
  subscription: 'text-primary-mid bg-primary/15',
};

function matchesTab(notif: Notification, tab: Tab): boolean {
  if (tab === 'all') return true;
  const type = (notif.type || '').toLowerCase();
  if (tab === 'jobs') return type === 'job' || type === 'bid';
  if (tab === 'payments') return type === 'payment' || type === 'subscription';
  if (tab === 'messages') return type === 'message';
  if (tab === 'system') return type === 'system' || type === 'kyc';
  return true;
}

function getNavPath(notif: Notification): string | null {
  const type = (notif.type || '').toLowerCase();
  const ref = notif.reference_id;
  if ((type === 'job' || type === 'bid') && ref) return `/jobs/${ref}`;
  if (type === 'job' || type === 'bid') return '/jobs';
  if (type === 'payment' && ref) return `/payment/escrow/${ref}`;
  if (type === 'payment') return '/jobs';
  if (type === 'message') return '/chat';
  if (type === 'kyc') return '/kyc/status';
  if (type === 'subscription') return '/subscribe';
  if (type === 'system') return null;
  return null;
}

const PAGE_SIZE = 10;

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getNotifications(user.id);
    setNotifications(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    load();
  }, [user, navigate, load]);

  // Reset pagination on tab change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [tab]);

  const filtered = notifications.filter((n) => matchesTab(n, tab));
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
    const path = getNavPath(notif);
    if (path) navigate(path);
  };

  const handleMarkAll = async () => {
    if (!user || unreadCount === 0) return;
    setMarkingAll(true);
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setMarkingAll(false);
    addToast({ type: 'success', title: 'All notifications marked as read' });
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
              <Bell size={26} className="text-primary-mid" /> Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-text-2 mt-1">
                You have <span className="font-semibold text-primary-mid">{unreadCount}</span> unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              loading={markingAll}
              onClick={handleMarkAll}
            >
              <CheckCheck size={16} /> Mark all read
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            const count =
              t.key === 'all'
                ? notifications.length
                : notifications.filter((n) => matchesTab(n, t.key)).length;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border whitespace-nowrap transition-all ${
                  active
                    ? 'border-primary bg-primary/10 text-primary-mid'
                    : 'border-border bg-bg-2 text-text-2 hover:border-border-2'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{t.label}</span>
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-primary/20 text-primary-mid' : 'bg-bg-3 text-text-3'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <Inbox size={40} className="text-text-3 mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold mb-1">No notifications</h3>
            <p className="text-sm text-text-2">
              {tab === 'all'
                ? "You're all caught up! New notifications will appear here."
                : `No ${tab} notifications yet.`}
            </p>
          </Card>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {visible.map((notif, i) => {
                const typeKey = (notif.type || 'system').toLowerCase();
                const Icon = TYPE_ICON[typeKey] || Bell;
                const colorClass = TYPE_COLOR[typeKey] || 'text-text-2 bg-bg-3';
                const path = getNavPath(notif);
                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card
                      hover={!!path}
                      onClick={() => handleClick(notif)}
                      className={`p-4 mb-3 ${!notif.is_read ? 'border-primary/30 bg-primary/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                          <Icon size={18} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`text-sm font-semibold ${notif.is_read ? 'text-text-2' : 'text-text'}`}>
                              {notif.title}
                            </h3>
                            <span className="text-xs text-text-3 shrink-0">
                              {timeAgo(notif.created_at)}
                            </span>
                          </div>
                          <p className={`text-sm mt-0.5 ${notif.is_read ? 'text-text-3' : 'text-text-2'}`}>
                            {notif.body}
                          </p>
                          {path && (
                            <span className="inline-flex items-center gap-1 text-xs text-primary-mid mt-2">
                              View <ArrowRight size={12} />
                            </span>
                          )}
                        </div>

                        {/* Read indicator */}
                        <div className="shrink-0 mt-1">
                          {notif.is_read ? (
                            <CheckCircle2 size={16} className="text-text-3" />
                          ) : (
                            <Circle size={16} className="text-primary-mid fill-primary/20" />
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-5">
                <Button
                  variant="outline"
                  loading={loading}
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  Load more ({filtered.length - visibleCount} remaining)
                </Button>
              </div>
            )}

            {/* End of list */}
            {!hasMore && filtered.length > PAGE_SIZE && (
              <p className="text-center text-xs text-text-3 mt-5">
                That's all your {tab !== 'all' ? tab : ''} notifications
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
