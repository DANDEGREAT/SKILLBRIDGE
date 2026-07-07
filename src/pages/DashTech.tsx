import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, Wallet, Star, ShieldCheck, Settings, Bell,
  Zap, TrendingUp, Clock, CheckCircle2, AlertCircle, Plus, DollarSign,
  ArrowUpRight, Camera, MapPin, X,
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import {
  getTechnicianProfile, getJobs, getTechnicianReviews, getKycStatus,
  updateTechnicianProfile, createBid, createJob, getNotifications,
  submitKyc,
} from '../lib/api';
import type { TechnicianProfile, Job, Review, KycVerification, Notification } from '../lib/types';
import { formatNaira, formatNairaShort, timeAgo, formatDate, getGreeting, TRADES, CITIES } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';

type Tab = 'overview' | 'jobs' | 'earnings' | 'reviews' | 'kyc' | 'settings' | 'notifications';

const NAV_ITEMS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'jobs', label: 'My Jobs', icon: Briefcase },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'kyc', label: 'KYC Status', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function DashTech() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [profile, setProfile] = useState<TechnicianProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [kyc, setKyc] = useState<KycVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [bidModalJob, setBidModalJob] = useState<Job | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMsg, setBidMsg] = useState('');
  const [bidding, setBidding] = useState(false);
  const [postJobOpen, setPostJobOpen] = useState(false);

  const isTech = user?.role === 'technician';
  const isClient = user?.role === 'client';

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    try {
      if (isTech) {
        const [p, allJobs, rev, k] = await Promise.all([
          getTechnicianProfile(user.id), getJobs({ technicianId: user.id }),
          getTechnicianReviews(user.id), getKycStatus(user.id),
        ]);
        setProfile(p); setJobs(allJobs); setReviews(rev); setKyc(k);
        if (p) {
          const available = await getJobs({ trade: p.trade, status: 'open' });
          setAvailableJobs(available);
        }
      } else if (isClient) {
        const allJobs = await getJobs({ clientId: user.id });
        setJobs(allJobs);
      }
    } finally { setLoading(false); }
  }

  const stats = useMemo(() => {
    const completed = jobs.filter((j) => j.status === 'completed');
    const active = jobs.filter((j) => ['in_progress', 'bidding', 'client_confirmed', 'tech_confirmed'].includes(j.status));
    const monthEarnings = completed.reduce((s, j) => s + (j.agreed_amount || 0), 0);
    return { monthEarnings, jobsDone: completed.length, rating: profile?.rating || 0, pendingBids: availableJobs.length, active };
  }, [jobs, profile, availableJobs]);

  const earningsData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const total = jobs.filter((j) => j.status === 'completed' && j.completed_at && new Date(j.completed_at).toDateString() === d.toDateString())
        .reduce((s, j) => s + (j.agreed_amount || 0), 0);
      return { day: d.toLocaleDateString('en', { weekday: 'short' }), amount: total };
    });
  }, [jobs]);

  async function handleBid() {
    if (!bidModalJob || !user) return;
    setBidding(true);
    try {
      await createBid({ job_id: bidModalJob.id, technician_id: user.id, amount: Number(bidAmount), message: bidMsg });
      addToast({ type: 'success', title: 'Bid sent!', message: 'The client will review your offer.' });
      setBidModalJob(null); setBidAmount(''); setBidMsg('');
    } catch { addToast({ type: 'error', title: 'Failed to send bid' }); }
    finally { setBidding(false); }
  }

  async function toggleAvailability() {
    if (!profile) return;
    const newVal = !profile.is_available;
    await updateTechnicianProfile(profile.user_id, { is_available: newVal });
    setProfile({ ...profile, is_available: newVal });
    addToast({ type: 'success', title: newVal ? 'You are now online' : 'You are now offline' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <Skeleton className="h-96" />
          <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 p-4 sm:p-6">
        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className="w-9 h-9 gold-gradient rounded-xl flex items-center justify-center">
              <Zap className="text-bg" size={20} fill="currentColor" />
            </div>
            <span className="font-display text-xl font-bold text-text">SkillBridge</span>
          </div>
          {user && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Avatar firstName={user.first_name} lastName={user.last_name} size="md" online={profile?.is_available} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text truncate">{user.first_name} {user.last_name}</p>
                  {profile && <Badge variant={profile.tier === 'elite' ? 'gold' : profile.tier === 'certified' ? 'teal' : 'gray'} className="mt-1">{profile.tier}</Badge>}
                </div>
              </div>
              {isTech && profile && (
                <button onClick={toggleAvailability} className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-lg bg-bg-3 hover:bg-bg-3/70 transition-colors">
                  <span className="text-xs text-text-2">Availability</span>
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${profile.is_available ? 'text-success' : 'text-text-3'}`}>
                    <span className={`w-2 h-2 rounded-full ${profile.is_available ? 'bg-success online-pulse' : 'bg-text-3'}`} />
                    {profile.is_available ? 'Online' : 'Offline'}
                  </span>
                </button>
              )}
            </Card>
          )}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button key={item.id} onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-primary/15 text-primary border border-primary/30' : 'text-text-2 hover:text-text hover:bg-bg-2 border border transparent'}`}>
                  <Icon size={18} /> {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {tab === 'overview' && <OverviewTab user={user!} profile={profile} jobs={jobs} availableJobs={availableJobs} stats={stats} earningsData={earningsData} isTech={isTech} isClient={isClient} onBid={(job: Job) => setBidModalJob(job)} onPostJob={() => setPostJobOpen(true)} toggleAvailability={toggleAvailability} />}
              {tab === 'jobs' && <JobsTab jobs={jobs} />}
              {tab === 'earnings' && <EarningsTab jobs={jobs} />}
              {tab === 'reviews' && <ReviewsTab reviews={reviews} profile={profile} />}
              {tab === 'kyc' && <KycTab kyc={kyc} userId={user!.id} onUpdate={loadData} />}
              {tab === 'settings' && <SettingsTab profile={profile} userId={user!.id} onUpdate={loadData} />}
              {tab === 'notifications' && <NotificationsTab userId={user!.id} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Modal open={!!bidModalJob} onClose={() => setBidModalJob(null)} title="Place a Bid">
        {bidModalJob && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-2">{bidModalJob.title}</p>
              <p className="text-xs text-text-3 mt-1">Budget: {formatNaira(bidModalJob.budget_min || 0)} • {bidModalJob.location_text || 'Location TBD'}</p>
            </div>
            <Input label="Your Bid Amount (₦)" type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder="e.g. 15000" />
            <Textarea label="Message to client" rows={3} value={bidMsg} onChange={(e) => setBidMsg(e.target.value)} placeholder="Describe your approach, timeline, etc." />
            <Button variant="primary" fullWidth loading={bidding} onClick={handleBid}>Send Bid</Button>
          </div>
        )}
      </Modal>

      <Modal open={postJobOpen} onClose={() => setPostJobOpen(false)} title="Post a New Job" size="lg">
        <PostJobForm userId={user!.id} onDone={() => { setPostJobOpen(false); loadData(); addToast({ type: 'success', title: 'Job posted!' }); }} />
      </Modal>
    </div>
  );
}

// ============ STAT CARD ============
function StatCard({ icon: Icon, label, value, color }: any) {
  const cm: Record<string, string> = { primary: 'text-primary bg-primary/10', success: 'text-success bg-success/10', amber: 'text-amber-500 bg-amber-500/10', accent: 'text-accent bg-accent/10' };
  return (
    <Card className="p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cm[color]}`}><Icon size={20} /></div>
      <p className="text-2xl font-bold text-text font-display">{value}</p>
      <p className="text-xs text-text-3 mt-1">{label}</p>
    </Card>
  );
}

// ============ OVERVIEW TAB ============
function OverviewTab({ user, profile, jobs, availableJobs, stats, earningsData, isTech, isClient, onBid, onPostJob, toggleAvailability }: any) {
  const greeting = getGreeting();
  const activeJob = stats.active?.[0];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">{greeting}, {user.first_name} 👋</h1>
        <p className="text-text-2 text-sm mt-1">{isTech ? `Here's what's happening with your ${profile?.trade || 'trade'} business today.` : 'Manage your jobs and find technicians.'}</p>
      </div>

      {activeJob && (
        <Card className="p-4 border-l-4 !border-l-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center"><Briefcase className="text-primary" size={20} /></div>
              <div>
                <p className="text-sm font-semibold text-text">{activeJob.title}</p>
                <p className="text-xs text-text-2">Status: <Badge variant="amber" size="sm">{activeJob.status.replace(/_/g, ' ')}</Badge></p>
              </div>
            </div>
            <Button variant="outline" size="sm">View Details</Button>
          </div>
        </Card>
      )}

      {isClient && (
        <Card className="p-6 gold-gradient">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-bg">Need a technician?</h3>
              <p className="text-bg/80 text-sm">Post a job and get bids in minutes.</p>
            </div>
            <Button variant="secondary" size="lg" onClick={onPostJob}><Plus size={18} /> Post Job</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Month Earnings" value={formatNairaShort(stats.monthEarnings)} color="primary" />
        <StatCard icon={CheckCircle2} label="Jobs Done" value={String(stats.jobsDone)} color="success" />
        <StatCard icon={Star} label="Rating" value={stats.rating > 0 ? stats.rating.toFixed(1) : '—'} color="amber" />
        <StatCard icon={Clock} label="Pending Bids" value={String(stats.pendingBids)} color="accent" />
      </div>

      {isTech && profile && (
        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${profile.is_available ? 'bg-success online-pulse' : 'bg-text-3'}`} />
            <div>
              <p className="text-sm font-semibold text-text">{profile.is_available ? 'Available for work' : 'Currently offline'}</p>
              <p className="text-xs text-text-2">Toggle to show clients you're ready</p>
            </div>
          </div>
          <button onClick={toggleAvailability} className={`relative w-12 h-6 rounded-full transition-colors ${profile.is_available ? 'bg-success' : 'bg-bg-3'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${profile.is_available ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </Card>
      )}

      {isTech && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-bold text-text">Available Jobs</h3>
            <Badge variant="gold">{availableJobs.length} new</Badge>
          </div>
          <div className="space-y-3">
            {availableJobs.length === 0 ? (
              <Card className="p-6 text-center"><p className="text-text-2 text-sm">No open jobs in your trade right now. Check back soon!</p></Card>
            ) : availableJobs.slice(0, 5).map((job: Job) => (
              <Card key={job.id} hover className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-text">{job.title}</p>
                      {job.is_urgent && <Badge variant="red">Urgent</Badge>}
                    </div>
                    <p className="text-xs text-text-2 mt-1 flex items-center gap-1"><MapPin size={12} /> {job.location_text || 'Location TBD'}</p>
                    <p className="text-xs text-text-3 mt-1">Budget: {formatNaira(job.budget_min || 0)}</p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => onBid(job)}>Bid Now</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isClient && (
        <div>
          <h3 className="font-display text-lg font-bold text-text mb-3">My Active Jobs</h3>
          <div className="space-y-3">
            {jobs.filter((j: Job) => !['completed', 'cancelled'].includes(j.status)).length === 0 ? (
              <Card className="p-6 text-center"><p className="text-text-2 text-sm">No active jobs. Post one to get started!</p></Card>
            ) : jobs.filter((j: Job) => !['completed', 'cancelled'].includes(j.status)).map((job: Job) => (
              <Card key={job.id} hover className="p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-semibold text-text">{job.title}</p><p className="text-xs text-text-2 mt-1">{job.status.replace(/_/g, ' ')}</p></div>
                  <Badge variant="amber">{job.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isTech && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-bold text-text">Earnings (7 days)</h3>
            <TrendingUp className="text-success" size={18} />
          </div>
          <div className="flex items-end justify-between gap-2 h-40">
            {earningsData.map((d: any, i: number) => {
              const max = Math.max(...earningsData.map((x: any) => x.amount), 1);
              const h = (d.amount / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(h, 4)}%` }} transition={{ duration: 0.5, delay: i * 0.05 }}
                      className={`w-full rounded-t-md ${d.amount > 0 ? 'gold-gradient' : 'bg-bg-3'}`} />
                  </div>
                  <span className="text-xs text-text-3">{d.day}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {isClient && (
        <Card className="p-5">
          <h3 className="font-display text-base font-bold text-text mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job: Job) => (
              <div key={job.id} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-bg-3 flex items-center justify-center"><Briefcase className="text-text-2" size={14} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-text truncate">{job.title}</p>
                  <p className="text-xs text-text-3">{timeAgo(job.created_at)}</p>
                </div>
                <Badge variant="gray">{job.status}</Badge>
              </div>
            ))}
            {jobs.length === 0 && <p className="text-text-2 text-sm text-center py-4">No activity yet.</p>}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============ JOBS TAB ============
function JobsTab({ jobs }: { jobs: Job[] }) {
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [selected, setSelected] = useState<Job | null>(null);
  const filtered = jobs.filter((j) => filter === 'active' ? !['completed', 'cancelled'].includes(j.status) : filter === 'completed' ? j.status === 'completed' : true);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-text">My Jobs</h2>
        <div className="flex gap-1 bg-bg-2 rounded-xl p-1">
          {(['active', 'completed', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-primary text-bg' : 'text-text-2 hover:text-text'}`}>{f}</button>
          ))}
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-text-3 text-xs uppercase tracking-wider"><th className="px-4 py-3 font-medium">Job Title</th><th className="px-4 py-3 font-medium">Client</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Action</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-2">No jobs found.</td></tr>
              ) : filtered.map((job) => (
                <tr key={job.id} onClick={() => setSelected(job)} className="border-b border-border/50 hover:bg-bg-3/50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 text-text font-medium">{job.title}</td><td className="px-4 py-3 text-text-2">—</td>
                  <td className="px-4 py-3 text-text-2">{formatDate(job.created_at)}</td>
                  <td className="px-4 py-3"><Badge variant="amber">{job.status.replace(/_/g, ' ')}</Badge></td>
                  <td className="px-4 py-3 text-text font-medium">{job.agreed_amount ? formatNaira(job.agreed_amount) : '—'}</td>
                  <td className="px-4 py-3"><ArrowUpRight className="text-text-3" size={16} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Job Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div><h3 className="font-display text-lg font-bold text-text">{selected.title}</h3><p className="text-text-2 text-sm mt-1">{selected.description || 'No description provided.'}</p></div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-text-3">Trade:</span> <span className="text-text">{selected.trade}</span></div>
              <div><span className="text-text-3">Status:</span> <Badge variant="amber">{selected.status}</Badge></div>
              <div><span className="text-text-3">Location:</span> <span className="text-text">{selected.location_text || '—'}</span></div>
              <div><span className="text-text-3">Budget:</span> <span className="text-text">{formatNaira(selected.budget_min || 0)}</span></div>
              <div><span className="text-text-3">Urgent:</span> <span className="text-text">{selected.is_urgent ? 'Yes' : 'No'}</span></div>
              <div><span className="text-text-3">Created:</span> <span className="text-text">{formatDate(selected.created_at)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============ EARNINGS TAB ============
function EarningsTab({ jobs }: { jobs: Job[] }) {
  const completed = jobs.filter((j) => j.status === 'completed');
  const totalEarned = completed.reduce((s, j) => s + (j.agreed_amount || 0), 0);
  const pendingPayout = jobs.filter((j) => ['in_progress', 'client_confirmed', 'tech_confirmed'].includes(j.status)).reduce((s, j) => s + (j.agreed_amount || 0), 0);
  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-text">Earnings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-6"><p className="text-text-2 text-sm">Total Earned</p><p className="font-display text-4xl font-extrabold text-primary mt-2">{formatNaira(totalEarned)}</p><p className="text-xs text-text-3 mt-2">{completed.length} completed jobs</p></Card>
        <Card className="p-6"><p className="text-text-2 text-sm">Pending Payout</p><p className="font-display text-4xl font-extrabold text-amber-500 mt-2">{formatNaira(pendingPayout)}</p><p className="text-xs text-text-3 mt-2">In escrow / in progress</p></Card>
      </div>
      <Button variant="primary" size="lg"><DollarSign size={18} /> Request Withdrawal</Button>
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h3 className="font-display text-base font-bold text-text">Payment History</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-text-3 text-xs uppercase"><th className="px-5 py-3 font-medium">Job</th><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Amount</th><th className="px-5 py-3 font-medium">Status</th></tr></thead>
            <tbody>
              {completed.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-text-2">No payments yet.</td></tr>
              ) : completed.map((job) => (
                <tr key={job.id} className="border-b border-border/50"><td className="px-5 py-3 text-text">{job.title}</td><td className="px-5 py-3 text-text-2">{job.completed_at ? formatDate(job.completed_at) : '—'}</td><td className="px-5 py-3 text-text font-medium">{formatNaira(job.agreed_amount || 0)}</td><td className="px-5 py-3"><Badge variant="green">Paid</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============ REVIEWS TAB ============
function ReviewsTab({ reviews, profile }: { reviews: Review[]; profile: TechnicianProfile | null }) {
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const avgRating = profile?.rating || 0;
  const total = reviews.length;
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => Math.round(r.rating) === star).length }));
  const filtered = reviews.filter((r) => filter === 'positive' ? r.rating >= 4 : filter === 'negative' ? r.rating < 3 : true);
  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-text">Reviews</h2>
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center">
            <p className="font-display text-5xl font-extrabold text-primary">{avgRating.toFixed(1)}</p>
            <div className="flex justify-center gap-0.5 mt-2">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={20} className={s <= Math.round(avgRating) ? 'text-primary fill-primary' : 'text-bg-3'} />)}
            </div>
            <p className="text-xs text-text-3 mt-1">{total} reviews</p>
          </div>
          <div className="flex-1 w-full space-y-1.5">
            {breakdown.map((b) => (
              <div key={b.star} className="flex items-center gap-2 text-sm">
                <span className="text-text-2 w-6">{b.star}★</span>
                <div className="flex-1 h-2 rounded-full bg-bg-3 overflow-hidden"><div className="h-full gold-gradient rounded-full" style={{ width: `${total > 0 ? (b.count / total) * 100 : 0}%` }} /></div>
                <span className="text-text-3 text-xs w-8 text-right">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <div className="flex gap-1 bg-bg-2 rounded-xl p-1 w-fit">
        {(['all', 'positive', 'negative'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-primary text-bg' : 'text-text-2 hover:text-text'}`}>{f}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-6 text-center"><p className="text-text-2 text-sm">No reviews yet.</p></Card>
        ) : filtered.map((rev) => (
          <Card key={rev.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} className={s <= rev.rating ? 'text-primary fill-primary' : 'text-bg-3'} />)}</div>
                <span className="text-xs text-text-3">{timeAgo(rev.created_at)}</span>
              </div>
              {rev.is_verified && <Badge variant="green">Verified</Badge>}
            </div>
            <p className="text-sm text-text-2 mt-2">{rev.comment || 'No comment provided.'}</p>
            <button onClick={() => setReplyTo(replyTo === rev.id ? null : rev.id)} className="text-xs text-primary hover:underline mt-2">{replyTo === rev.id ? 'Cancel' : 'Reply'}</button>
            {replyTo === rev.id && (
              <div className="mt-2 space-y-2"><Textarea rows={2} placeholder="Write a reply..." /><Button variant="primary" size="sm">Send Reply</Button></div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ KYC TAB ============
function KycTab({ kyc, userId, onUpdate }: { kyc: KycVerification | null; userId: string; onUpdate: () => void }) {
  const { addToast } = useUIStore();
  const [submitting, setSubmitting] = useState(false);
  const [nin, setNin] = useState('');
  const [idType, setIdType] = useState('NIN');
  const sc: Record<string, { variant: any; label: string; icon: any }> = {
    not_submitted: { variant: 'gray', label: 'Not Submitted', icon: AlertCircle },
    pending: { variant: 'amber', label: 'Pending Review', icon: Clock },
    approved: { variant: 'green', label: 'Approved', icon: CheckCircle2 },
    rejected: { variant: 'red', label: 'Rejected', icon: AlertCircle },
  };
  const cfg = sc[kyc?.status || 'not_submitted'];
  const StatusIcon = cfg?.icon || AlertCircle;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitKyc({ user_id: userId, id_type: idType, nin_hash: nin });
      addToast({ type: 'success', title: 'KYC submitted!', message: 'We will review your documents.' });
      onUpdate();
    } finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-text">KYC Status</h2>
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${kyc?.status === 'approved' ? 'bg-success/15' : kyc?.status === 'rejected' ? 'bg-power/15' : 'bg-primary/15'}`}>
            <StatusIcon size={28} className={kyc?.status === 'approved' ? 'text-success' : kyc?.status === 'rejected' ? 'text-power' : 'text-primary'} />
          </div>
          <div>
            <p className="text-sm text-text-2">Verification Status</p>
            <Badge variant={cfg?.variant} size="md">{cfg?.label}</Badge>
          </div>
        </div>
        {kyc?.status === 'rejected' && kyc.rejection_reason && (
          <div className="mt-4 p-3 rounded-lg bg-power/10 border border-power/30">
            <p className="text-xs text-power font-medium">Rejection Reason:</p>
            <p className="text-sm text-text-2 mt-1">{kyc.rejection_reason}</p>
          </div>
        )}
        {kyc?.status === 'approved' && (
          <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30">
            <p className="text-sm text-success flex items-center gap-2"><CheckCircle2 size={16} /> Your identity is verified. You can bid on all jobs.</p>
          </div>
        )}
      </Card>
      {(!kyc || kyc.status === 'not_submitted' || kyc.status === 'rejected') && (
        <Card className="p-6 space-y-4">
          <h3 className="font-display text-base font-bold text-text">{kyc?.status === 'rejected' ? 'Re-submit KYC' : 'Submit Your KYC'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-2 mb-1.5">ID Type</label>
              <select value={idType} onChange={(e) => setIdType(e.target.value)} className="input-base">
                <option value="NIN">NIN</option><option value="Drivers License">Driver's License</option>
                <option value="Voters Card">Voter's Card</option><option value="Passport">Passport</option>
              </select>
            </div>
            <Input label="ID Number" value={nin} onChange={(e) => setNin(e.target.value)} placeholder="Enter your ID number" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['ID Document Photo', 'Selfie Photo'].map((label) => (
              <div key={label}>
                <label className="block text-sm font-medium text-text-2 mb-1.5">{label}</label>
                <div className="border-2 border-dashed border-border-2 rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors">
                  <Camera className="text-text-3 mx-auto mb-2" size={24} /><p className="text-xs text-text-3">Click to upload</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="primary" fullWidth loading={submitting} onClick={handleSubmit}>Submit for Review</Button>
        </Card>
      )}
      {kyc?.submitted_at && (
        <Card className="p-4">
          <p className="text-xs text-text-3">Submitted on: {formatDate(kyc.submitted_at)}</p>
          {kyc.reviewed_at && <p className="text-xs text-text-3 mt-1">Reviewed on: {formatDate(kyc.reviewed_at)}</p>}
        </Card>
      )}
    </div>
  );
}

// ============ SETTINGS TAB ============
function SettingsTab({ profile, userId, onUpdate }: { profile: TechnicianProfile | null; userId: string; onUpdate: () => void }) {
  const { addToast } = useUIStore();
  const [bio, setBio] = useState(profile?.bio || '');
  const [trade, setTrade] = useState(profile?.trade || 'Electrician');
  const [rate, setRate] = useState(String(profile?.hourly_rate || 3000));
  const [city, setCity] = useState(profile?.city || 'Lagos');
  const [skills, setSkills] = useState((profile?.skills || '').split(',').filter(Boolean));
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteHold, setDeleteHold] = useState(0);
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    if (!holding && deleteHold > 0) {
      const t = setTimeout(() => setDeleteHold(0), 500);
      return () => clearTimeout(t);
    }
  }, [holding, deleteHold]);

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) { setSkills([...skills, s]); setSkillInput(''); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateTechnicianProfile(userId, { bio, trade, hourly_rate: Number(rate), city, skills: skills.join(',') });
      addToast({ type: 'success', title: 'Profile updated!' });
      onUpdate();
    } finally { setSaving(false); }
  }

  function handleDeleteHold() {
    setHolding(true);
    if (deleteHold < 100) {
      const interval = setInterval(() => {
        setDeleteHold((p) => {
          if (p >= 100) { clearInterval(interval); setHolding(false); addToast({ type: 'error', title: 'Account deletion not implemented in demo' }); return 100; }
          return p + 2;
        });
      }, 30);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-text">Settings</h2>
      <Card className="p-6">
        <h3 className="font-display text-base font-bold text-text mb-4">Profile Photo</h3>
        <div className="flex items-center gap-4">
          <Avatar firstName="You" lastName="" size="xl" />
          <div><Button variant="outline" size="sm"><Camera size={16} /> Upload New</Button><p className="text-xs text-text-3 mt-2">JPG or PNG, max 2MB</p></div>
        </div>
      </Card>
      <Card className="p-6 space-y-4">
        <h3 className="font-display text-base font-bold text-text">Profile Information</h3>
        <Textarea label="Bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell clients about yourself..." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1.5">Trade</label>
            <select value={trade} onChange={(e) => setTrade(e.target.value)} className="input-base">
              {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-2 mb-1.5">City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="input-base">
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <Input label="Hourly Rate (₦)" type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-text-2 mb-1.5">Skills</label>
          <div className="flex gap-2">
            <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add a skill and press Enter" />
            <Button variant="outline" size="md" onClick={addSkill}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {skills.map((s) => (
              <Badge key={s} variant="teal" size="md">
                {s}
                <button onClick={() => setSkills(skills.filter((x) => x !== s))} className="ml-1 hover:text-power"><X size={12} /></button>
              </Badge>
            ))}
          </div>
        </div>
        <Button variant="primary" loading={saving} onClick={handleSave}>Save Changes</Button>
      </Card>
      <Card className="p-6 space-y-3">
        <h3 className="font-display text-base font-bold text-text">Notification Preferences</h3>
        {['New job matches', 'Bid accepted/rejected', 'New reviews', 'Payment updates', 'Marketing emails'].map((pref, i) => (
          <label key={pref} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-text-2">{pref}</span><input type="checkbox" defaultChecked={i < 4} className="toggle-checkbox" />
          </label>
        ))}
      </Card>
      <Card className="p-6 border-power/30">
        <h3 className="font-display text-base font-bold text-power mb-2">Danger Zone</h3>
        <p className="text-xs text-text-2 mb-4">Permanently delete your account and all data. This cannot be undone.</p>
        <div className="relative w-full h-10 rounded-xl bg-bg-3 overflow-hidden">
          <div className="absolute inset-0 bg-power/20" style={{ width: `${deleteHold}%` }} />
          <button
            onMouseDown={handleDeleteHold} onMouseUp={() => setHolding(false)} onMouseLeave={() => setHolding(false)}
            onTouchStart={handleDeleteHold} onTouchEnd={() => setHolding(false)}
            className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-power"
          >
            {deleteHold >= 100 ? 'Deleting...' : 'Hold to Delete Account'}
          </button>
        </div>
      </Card>
    </div>
  );
}

// ============ NOTIFICATIONS TAB ============
function NotificationsTab({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { setNotifications(await getNotifications(userId)); setLoading(false); })(); }, [userId]);
  if (loading) return <SkeletonCard />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-text">Notifications</h2>
        <Button variant="ghost" size="sm">Mark all read</Button>
      </div>
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card className="p-6 text-center"><Bell className="text-text-3 mx-auto mb-2" size={24} /><p className="text-text-2 text-sm">No notifications yet.</p></Card>
        ) : notifications.map((n) => (
          <Card key={n.id} className={`p-4 ${!n.is_read ? 'border-primary/30' : ''}`}>
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 ${n.is_read ? 'bg-text-3' : 'bg-primary'}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-text">{n.title}</p>
                <p className="text-xs text-text-2 mt-0.5">{n.body}</p>
                <p className="text-xs text-text-3 mt-1">{timeAgo(n.created_at)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============ POST JOB FORM (client) ============
function PostJobForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const { addToast } = useUIStore();
  const [title, setTitle] = useState('');
  const [trade, setTrade] = useState('Electrician');
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!title || !desc || !location) { addToast({ type: 'warning', title: 'Please fill all fields' }); return; }
    setSaving(true);
    try {
      await createJob({ client_id: userId, title, trade, description: desc, location_text: location, budget_min: Number(budget) || 0, is_urgent: urgent });
      onDone();
    } catch { addToast({ type: 'error', title: 'Failed to post job' }); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <Input label="Job Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Fix ceiling fan wiring" />
      <div>
        <label className="block text-sm font-medium text-text-2 mb-1.5">Trade</label>
        <select value={trade} onChange={(e) => setTrade(e.target.value)} className="input-base">
          {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <Textarea label="Description" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe the problem..." />
      <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lekki Phase 1, Lagos" />
      <Input label="Budget (₦)" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 15000" />
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
        <span className="text-sm text-text-2">Mark as urgent</span>
      </label>
      <Button variant="primary" fullWidth loading={saving} onClick={handleSubmit}>Post Job</Button>
    </div>
  );
}
