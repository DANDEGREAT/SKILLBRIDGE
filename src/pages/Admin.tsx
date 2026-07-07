import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShieldCheck, AlertTriangle, Users, Briefcase,
  DollarSign, Siren, Settings, Zap, TrendingUp, CheckCircle2, XCircle,
  Search, Ban, Trash2, UserCheck, MapPin, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import {
  getAllUsers, getAllJobs, getAllPayments, getPendingKyc, getDisputes,
  getSosAlerts, updateKycStatus, resolveDispute, resolveSosAlert, updateUserStatus,
} from '../lib/api';
import type { User, Job, Payment, KycVerification, Dispute, SosAlert } from '../lib/types';
import { formatNaira, formatNairaShort, timeAgo, formatDate, maskNin } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';

type Tab = 'overview' | 'kyc' | 'disputes' | 'users' | 'jobs' | 'revenue' | 'sos' | 'settings';

const NAV_ITEMS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'kyc', label: 'KYC Queue', icon: ShieldCheck },
  { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'sos', label: 'SOS Alerts', icon: Siren },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [kycQueue, setKycQueue] = useState<(KycVerification & { user: User | null })[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [u, j, p, k, d, s] = await Promise.all([
        getAllUsers(), getAllJobs(), getAllPayments(), getPendingKyc(), getDisputes(), getSosAlerts(),
      ]);
      setUsers(u); setJobs(j); setPayments(p); setKycQueue(k); setDisputes(d); setSosAlerts(s);
    } finally { setLoading(false); }
  }

  const stats = useMemo(() => ({
    totalUsers: users.length,
    verifiedTechs: users.filter((u) => u.role === 'technician').length,
    totalJobs: jobs.length,
    gmv: payments.reduce((s, p) => s + p.amount, 0),
    revenue: payments.reduce((s, p) => s + (p.platform_fee || 0), 0),
    openDisputes: disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length,
    activeSos: sosAlerts.filter((s) => s.status === 'active').length,
    pendingKyc: kycQueue.length,
  }), [users, jobs, payments, disputes, sosAlerts, kycQueue]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <Skeleton className="h-96" />
          <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 p-4 sm:p-6">
        <aside className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className="w-9 h-9 gold-gradient rounded-xl flex items-center justify-center">
              <Zap className="text-bg" size={20} fill="currentColor" />
            </div>
            <div>
              <span className="font-display text-lg font-bold text-text block leading-tight">SkillBridge</span>
              <span className="text-xs text-primary font-medium">Admin Panel</span>
            </div>
          </div>
          {user && (
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Avatar firstName={user.first_name} lastName={user.last_name} size="sm" online />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text truncate">{user.first_name} {user.last_name}</p>
                  <Badge variant="gold" size="sm">Admin</Badge>
                </div>
              </div>
            </Card>
          )}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              const badge = item.id === 'kyc' ? stats.pendingKyc : item.id === 'disputes' ? stats.openDisputes : item.id === 'sos' ? stats.activeSos : 0;
              return (
                <button key={item.id} onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-primary/15 text-primary border border-primary/30' : 'text-text-2 hover:text-text hover:bg-bg-2 border border-transparent'}`}>
                  <Icon size={18} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {badge > 0 && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-primary text-bg' : 'bg-power text-white'}`}>{badge}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {tab === 'overview' && <OverviewTab stats={stats} jobs={jobs} users={users} />}
              {tab === 'kyc' && <KycTab kycQueue={kycQueue} adminId={user!.id} onUpdate={loadData} />}
              {tab === 'disputes' && <DisputesTab disputes={disputes} adminId={user!.id} onUpdate={loadData} />}
              {tab === 'users' && <UsersTab users={users} onUpdate={loadData} />}
              {tab === 'jobs' && <JobsTab jobs={jobs} />}
              {tab === 'revenue' && <RevenueTab payments={payments} />}
              {tab === 'sos' && <SosTab alerts={sosAlerts} adminId={user!.id} onUpdate={loadData} />}
              {tab === 'settings' && <SettingsTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ============ STAT CARD ============
function StatCard({ icon: Icon, label, value, color }: any) {
  const cm: Record<string, string> = { primary: 'text-primary bg-primary/10', success: 'text-success bg-success/10', amber: 'text-amber-500 bg-amber-500/10', accent: 'text-accent bg-accent/10', red: 'text-power bg-power/10' };
  return (
    <Card className="p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cm[color]}`}><Icon size={20} /></div>
      <p className="text-2xl font-bold text-text font-display">{value}</p>
      <p className="text-xs text-text-3 mt-1">{label}</p>
    </Card>
  );
}

// ============ OVERVIEW TAB ============
function OverviewTab({ stats, jobs, users }: any) {
  const activity = useMemo(() => {
    const items = [
      ...jobs.slice(0, 5).map((j: Job) => ({ type: 'job', text: `New job: ${j.title}`, time: j.created_at })),
      ...users.slice(0, 5).map((u: User) => ({ type: 'user', text: `New user: ${u.first_name} ${u.last_name}`, time: u.created_at })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);
    return items;
  }, [jobs, users]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Platform Overview</h1>
        <p className="text-text-2 text-sm mt-1">Real-time platform health and metrics.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Total Users" value={String(stats.totalUsers)} color="primary" />
        <StatCard icon={ShieldCheck} label="Verified Techs" value={String(stats.verifiedTechs)} color="success" />
        <StatCard icon={Briefcase} label="Total Jobs" value={String(stats.totalJobs)} color="accent" />
        <StatCard icon={DollarSign} label="GMV" value={formatNairaShort(stats.gmv)} color="amber" />
        <StatCard icon={TrendingUp} label="Revenue" value={formatNairaShort(stats.revenue)} color="primary" />
        <StatCard icon={AlertTriangle} label="Disputes" value={String(stats.openDisputes)} color="red" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.pendingKyc > 0 && (
          <Card className="p-4 border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center"><ShieldCheck className="text-amber-500" size={20} /></div>
              <div><p className="text-2xl font-bold text-text">{stats.pendingKyc}</p><p className="text-xs text-text-2">Pending KYC</p></div>
            </div>
          </Card>
        )}
        {stats.openDisputes > 0 && (
          <Card className="p-4 border-power/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-power/15 flex items-center justify-center"><AlertTriangle className="text-power" size={20} /></div>
              <div><p className="text-2xl font-bold text-text">{stats.openDisputes}</p><p className="text-xs text-text-2">Open Disputes</p></div>
            </div>
          </Card>
        )}
        {stats.activeSos > 0 && (
          <Card className="p-4 border-power/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-power/15 flex items-center justify-center"><Siren className="text-power" size={20} /></div>
              <div><p className="text-2xl font-bold text-text">{stats.activeSos}</p><p className="text-xs text-text-2">Unresolved SOS</p></div>
            </div>
          </Card>
        )}
      </div>
      <Card className="p-5">
        <h3 className="font-display text-base font-bold text-text mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activity.map((a: any, i: number) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-bg-3 flex items-center justify-center">
                {a.type === 'job' ? <Briefcase className="text-text-2" size={14} /> : <Users className="text-text-2" size={14} />}
              </div>
              <p className="text-text flex-1 truncate">{a.text}</p>
              <span className="text-xs text-text-3">{timeAgo(a.time)}</span>
            </div>
          ))}
          {activity.length === 0 && <p className="text-text-2 text-sm text-center py-4">No recent activity.</p>}
        </div>
      </Card>
    </div>
  );
}

// ============ KYC TAB ============
function KycTab({ kycQueue, adminId, onUpdate }: { kycQueue: (KycVerification & { user: User | null })[]; adminId: string; onUpdate: () => void }) {
  const { addToast } = useUIStore();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selected, setSelected] = useState<KycVerification & { user: User | null } | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  async function handleApprove() {
    if (!selected) return;
    setActionLoading(true);
    try {
      await updateKycStatus(selected.user_id, 'approved', adminId);
      addToast({ type: 'success', title: 'KYC approved' });
      setSelected(null); onUpdate();
    } finally { setActionLoading(false); }
  }

  async function handleReject() {
    if (!selected || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await updateKycStatus(selected.user_id, 'rejected', adminId, rejectReason);
      addToast({ type: 'success', title: 'KYC rejected' });
      setSelected(null); setRejectMode(false); setRejectReason(''); onUpdate();
    } finally { setActionLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-text">KYC Queue</h2>
        <div className="flex gap-1 bg-bg-2 rounded-xl p-1">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === f ? 'bg-primary text-bg' : 'text-text-2 hover:text-text'}`}>{f}</button>
          ))}
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-3 text-xs uppercase">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">ID Type</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {kycQueue.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-2">No pending KYC applications.</td></tr>
              ) : (
                kycQueue.map((kyc) => (
                  <tr key={kyc.id} onClick={() => setSelected(kyc)} className="border-b border-border/50 hover:bg-bg-3/50 cursor-pointer">
                    <td className="px-4 py-3 text-text font-medium">{kyc.user ? `${kyc.user.first_name} ${kyc.user.last_name}` : 'Unknown'}</td>
                    <td className="px-4 py-3 text-text-2">{kyc.id_type || '—'}</td>
                    <td className="px-4 py-3 text-text-2">{kyc.submitted_at ? formatDate(kyc.submitted_at) : '—'}</td>
                    <td className="px-4 py-3"><Badge variant="amber">{kyc.status}</Badge></td>
                    <td className="px-4 py-3"><ChevronRight className="text-text-3" size={16} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={!!selected} onClose={() => { setSelected(null); setRejectMode(false); }} title="KYC Review" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar firstName={selected.user?.first_name || '?'} lastName={selected.user?.last_name || ''} size="lg" />
              <div>
                <p className="text-sm font-semibold text-text">{selected.user?.first_name} {selected.user?.last_name}</p>
                <p className="text-xs text-text-2">{selected.user?.phone}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-text-3">ID Type:</span> <span className="text-text">{selected.id_type || '—'}</span></div>
              <div><span className="text-text-3">NIN:</span> <span className="text-text">{selected.nin_hash ? maskNin(selected.nin_hash) : '—'}</span></div>
              <div><span className="text-text-3">Submitted:</span> <span className="text-text">{selected.submitted_at ? formatDate(selected.submitted_at) : '—'}</span></div>
              <div><span className="text-text-3">Status:</span> <Badge variant="amber">{selected.status}</Badge></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['ID Document', 'Selfie'].map((label) => (
                <div key={label}>
                  <p className="text-xs text-text-2 mb-2">{label}</p>
                  <div className="aspect-video rounded-xl bg-bg-3 border border-border flex items-center justify-center">
                    {label === 'ID Document' && selected.id_document_url ? (
                      <img src={selected.id_document_url} alt="ID" className="w-full h-full object-cover rounded-xl" />
                    ) : label === 'Selfie' && selected.selfie_url ? (
                      <img src={selected.selfie_url} alt="Selfie" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <ShieldCheck className="text-text-3" size={32} />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {rejectMode ? (
              <div className="space-y-3">
                <Textarea label="Rejection Reason" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why this is rejected..." />
                <div className="flex gap-2">
                  <Button variant="danger" fullWidth loading={actionLoading} onClick={handleReject}>Confirm Reject</Button>
                  <Button variant="ghost" onClick={() => setRejectMode(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="primary" fullWidth loading={actionLoading} onClick={handleApprove}><CheckCircle2 size={16} /> Approve</Button>
                <Button variant="danger" fullWidth onClick={() => setRejectMode(true)}><XCircle size={16} /> Reject</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============ DISPUTES TAB ============
function DisputesTab({ disputes, adminId, onUpdate }: { disputes: Dispute[]; adminId: string; onUpdate: () => void }) {
  const { addToast } = useUIStore();
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [resolving, setResolving] = useState(false);

  async function handleResolve(status: string) {
    if (!selected) return;
    setResolving(true);
    try {
      await resolveDispute(selected.id, status, adminId, adminNote);
      addToast({ type: 'success', title: `Dispute resolved: ${status.replace(/_/g, ' ')}` });
      setSelected(null); setAdminNote(''); onUpdate();
    } finally { setResolving(false); }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-text">Disputes</h2>
      <div className="space-y-3">
        {disputes.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertTriangle className="text-text-3 mx-auto mb-3" size={32} />
            <p className="text-text-2 text-sm">No disputes filed.</p>
          </Card>
        ) : (
          disputes.map((d) => (
            <Card key={d.id} hover className="p-4" onClick={() => setSelected(d)}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text">{d.reason}</p>
                  <p className="text-xs text-text-2 mt-1">Job: {d.job_id}</p>
                  <p className="text-xs text-text-3 mt-1">{timeAgo(d.created_at)}</p>
                </div>
                <Badge variant={d.status === 'open' ? 'red' : d.status === 'under_review' ? 'amber' : 'green'}>{d.status.replace(/_/g, ' ')}</Badge>
              </div>
            </Card>
          ))
        )}
      </div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Dispute Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-bg-3">
              <p className="text-sm font-semibold text-text">{selected.reason}</p>
              <p className="text-xs text-text-2 mt-1">Filed {timeAgo(selected.created_at)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-text-3">Job ID:</span> <span className="text-text">{selected.job_id}</span></div>
              <div><span className="text-text-3">Status:</span> <Badge variant="amber">{selected.status}</Badge></div>
              <div><span className="text-text-3">Raised by:</span> <span className="text-text">{selected.raised_by || '—'}</span></div>
              <div><span className="text-text-3">Against:</span> <span className="text-text">{selected.against || '—'}</span></div>
            </div>
            {selected.evidence_urls && (
              <div>
                <p className="text-xs text-text-2 mb-2">Evidence</p>
                <div className="p-3 rounded-lg bg-bg-3 text-sm text-text-2">{selected.evidence_urls}</div>
              </div>
            )}
            <Textarea label="Admin Notes" rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Add resolution notes..." />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" loading={resolving} onClick={() => handleResolve('resolved_tech')}><CheckCircle2 size={16} /> Release to Tech</Button>
              <Button variant="secondary" loading={resolving} onClick={() => handleResolve('resolved_client')}><DollarSign size={16} /> Refund Client</Button>
              <Button variant="outline" loading={resolving} onClick={() => handleResolve('resolved_tech')}>Split 50/50</Button>
              <Button variant="danger" loading={resolving} onClick={() => handleResolve('dismissed')}><XCircle size={16} /> Dismiss</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============ USERS TAB ============
function UsersTab({ users, onUpdate }: { users: User[]; onUpdate: () => void }) {
  const { addToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'client' | 'technician' | 'store_owner' | 'admin'>('all');
  const [selected, setSelected] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.first_name.toLowerCase().includes(q) || u.last_name.toLowerCase().includes(q) || u.phone.includes(q);
    }
    return true;
  });

  async function handleStatusChange(active: boolean) {
    if (!selected) return;
    setActionLoading(true);
    try {
      await updateUserStatus(selected.id, active);
      addToast({ type: 'success', title: active ? 'User activated' : 'User suspended' });
      onUpdate();
    } finally { setActionLoading(false); }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-text">Users</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <Input icon={<Search size={16} />} placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)} className="input-base sm:w-40">
          <option value="all">All Roles</option>
          <option value="client">Clients</option>
          <option value="technician">Technicians</option>
          <option value="store_owner">Store Owners</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-3 text-xs uppercase">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-2">No users found.</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} onClick={() => setSelected(u)} className="border-b border-border/50 hover:bg-bg-3/50 cursor-pointer">
                    <td className="px-4 py-3 text-text font-medium">{u.first_name} {u.last_name}</td>
                    <td className="px-4 py-3 text-text-2">{u.phone}</td>
                    <td className="px-4 py-3"><Badge variant="gray">{u.role}</Badge></td>
                    <td className="px-4 py-3"><Badge variant={u.is_active ? 'green' : 'red'}>{u.is_active ? 'Active' : 'Suspended'}</Badge></td>
                    <td className="px-4 py-3 text-text-2">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3"><ChevronRight className="text-text-3" size={16} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={!!selected} onClose={() => setSelected(null)} title="User Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar firstName={selected.first_name} lastName={selected.last_name} size="lg" online={selected.is_active} />
              <div>
                <p className="text-sm font-semibold text-text">{selected.first_name} {selected.last_name}</p>
                <p className="text-xs text-text-2">{selected.phone}</p>
                <Badge variant="gray" className="mt-1">{selected.role}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-text-3">Email:</span> <span className="text-text">{selected.email || '—'}</span></div>
              <div><span className="text-text-3">Status:</span> <Badge variant={selected.is_active ? 'green' : 'red'}>{selected.is_active ? 'Active' : 'Suspended'}</Badge></div>
              <div><span className="text-text-3">Phone verified:</span> <span className="text-text">{selected.is_phone_verified ? 'Yes' : 'No'}</span></div>
              <div><span className="text-text-3">Joined:</span> <span className="text-text">{formatDate(selected.created_at)}</span></div>
            </div>
            <div className="flex gap-2 pt-2">
              {selected.is_active ? (
                <Button variant="danger" fullWidth loading={actionLoading} onClick={() => handleStatusChange(false)}><Ban size={16} /> Suspend</Button>
              ) : (
                <Button variant="primary" fullWidth loading={actionLoading} onClick={() => handleStatusChange(true)}><UserCheck size={16} /> Activate</Button>
              )}
              <Button variant="outline" onClick={() => addToast({ type: 'error', title: 'Delete not allowed in demo' })}><Trash2 size={16} /></Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============ JOBS TAB ============
function JobsTab({ jobs }: { jobs: Job[] }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-text">All Jobs</h2>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-3 text-xs uppercase">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Trade</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-text-2">No jobs found.</td></tr>
              ) : (
                jobs.slice(0, 50).map((j) => (
                  <tr key={j.id} className="border-b border-border/50 hover:bg-bg-3/50">
                    <td className="px-4 py-3 text-text font-medium">{j.title}</td>
                    <td className="px-4 py-3 text-text-2">{j.trade}</td>
                    <td className="px-4 py-3"><Badge variant="amber">{j.status.replace(/_/g, ' ')}</Badge></td>
                    <td className="px-4 py-3 text-text-2">{formatNaira(j.budget_min || 0)}</td>
                    <td className="px-4 py-3 text-text-2">{formatDate(j.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============ REVENUE TAB ============
function RevenueTab({ payments }: { payments: Payment[] }) {
  const gmv = payments.reduce((s, p) => s + p.amount, 0);
  const platformRevenue = payments.reduce((s, p) => s + (p.platform_fee || 0), 0);
  const escrowHeld = payments.filter((p) => p.status === 'held').reduce((s, p) => s + p.amount, 0);

  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    payments.forEach((p) => {
      const m = new Date(p.created_at).toLocaleDateString('en', { month: 'short' });
      months[m] = (months[m] || 0) + p.amount;
    });
    return Object.entries(months).slice(-6);
  }, [payments]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-text">Revenue</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6"><p className="text-text-2 text-sm">Total GMV</p><p className="font-display text-3xl font-extrabold text-primary mt-2">{formatNaira(gmv)}</p></Card>
        <Card className="p-6"><p className="text-text-2 text-sm">Platform Revenue</p><p className="font-display text-3xl font-extrabold text-success mt-2">{formatNaira(platformRevenue)}</p></Card>
        <Card className="p-6"><p className="text-text-2 text-sm">Escrow Held</p><p className="font-display text-3xl font-extrabold text-amber-500 mt-2">{formatNaira(escrowHeld)}</p></Card>
      </div>
      <Card className="p-5">
        <h3 className="font-display text-base font-bold text-text mb-4">GMV by Month</h3>
        <div className="flex items-end justify-between gap-2 h-48">
          {monthlyData.length === 0 ? (
            <p className="text-text-2 text-sm w-full text-center">No data yet.</p>
          ) : (
            monthlyData.map(([month, amount], i) => {
              const max = Math.max(...monthlyData.map((x) => x[1]), 1);
              const h = (amount / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-text-2 font-medium">{formatNairaShort(amount)}</span>
                  <div className="w-full flex-1 flex items-end">
                    <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(h, 4)}%` }} transition={{ duration: 0.5, delay: i * 0.05 }} className="w-full rounded-t-md gold-gradient" />
                  </div>
                  <span className="text-xs text-text-3">{month}</span>
                </div>
              );
            })
          )}
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h3 className="font-display text-base font-bold text-text">Payout History</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-3 text-xs uppercase">
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Fee</th>
                <th className="px-5 py-3 font-medium">Payout</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-text-2">No payments yet.</td></tr>
              ) : (
                payments.slice(0, 20).map((p) => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="px-5 py-3 text-text font-mono text-xs">{p.reference || '—'}</td>
                    <td className="px-5 py-3 text-text font-medium">{formatNaira(p.amount)}</td>
                    <td className="px-5 py-3 text-text-2">{formatNaira(p.platform_fee || 0)}</td>
                    <td className="px-5 py-3 text-text-2">{formatNaira(p.technician_payout || 0)}</td>
                    <td className="px-5 py-3"><Badge variant={p.status === 'released' ? 'green' : p.status === 'held' ? 'amber' : 'gray'}>{p.status}</Badge></td>
                    <td className="px-5 py-3 text-text-2">{formatDate(p.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============ SOS TAB ============
function SosTab({ alerts, adminId, onUpdate }: { alerts: SosAlert[]; adminId: string; onUpdate: () => void }) {
  const { addToast } = useUIStore();
  const [resolving, setResolving] = useState<string | null>(null);

  async function handleResolve(id: string, status: 'resolved' | 'false_alarm') {
    setResolving(id);
    try {
      await resolveSosAlert(id, adminId, status);
      addToast({ type: 'success', title: status === 'resolved' ? 'Alert resolved' : 'Marked as false alarm' });
      onUpdate();
    } finally { setResolving(null); }
  }

  const active = alerts.filter((a) => a.status === 'active');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-text">SOS Alerts</h2>
        {active.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-power animate-pulse" />
            <span className="text-sm font-semibold text-power">{active.length} Active</span>
          </div>
        )}
      </div>
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <Card className="p-8 text-center">
            <Siren className="text-text-3 mx-auto mb-3" size={32} />
            <p className="text-text-2 text-sm">No SOS alerts.</p>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id} className={`p-4 ${alert.status === 'active' ? 'border-power/40' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {alert.status === 'active' && <span className="w-2 h-2 rounded-full bg-power animate-pulse" />}
                    <p className="text-sm font-semibold text-text">{alert.alert_type || 'SOS Alert'}</p>
                  </div>
                  <p className="text-xs text-text-2 mt-1">Job: {alert.job_id}</p>
                  <p className="text-xs text-text-3 mt-1">{timeAgo(alert.created_at)}</p>
                  {alert.lat && alert.lng && (
                    <p className="text-xs text-text-3 mt-1 flex items-center gap-1"><MapPin size={12} /> {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}</p>
                  )}
                </div>
                {alert.status === 'active' ? (
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" loading={resolving === alert.id} onClick={() => handleResolve(alert.id, 'resolved')}><CheckCircle2 size={14} /> Resolve</Button>
                    <Button variant="outline" size="sm" loading={resolving === alert.id} onClick={() => handleResolve(alert.id, 'false_alarm')}>False Alarm</Button>
                  </div>
                ) : (
                  <Badge variant={alert.status === 'resolved' ? 'green' : 'gray'}>{alert.status.replace(/_/g, ' ')}</Badge>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ============ SETTINGS TAB ============
function SettingsTab() {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-text">Admin Settings</h2>
      <Card className="p-6 space-y-4">
        <h3 className="font-display text-base font-bold text-text">Platform Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Platform Fee (%)" type="number" defaultValue="10" />
          <Input label="Min Payout (₦)" type="number" defaultValue="5000" />
          <Input label="Escrow Hold Period (hours)" type="number" defaultValue="24" />
          <Input label="SOS Response Timeout (min)" type="number" defaultValue="5" />
        </div>
        <Button variant="primary">Save Settings</Button>
      </Card>
      <Card className="p-6 space-y-3">
        <h3 className="font-display text-base font-bold text-text">Feature Flags</h3>
        {['Enable KYC enforcement', 'Auto-accept bids under ₦5,000', 'SOS alerts to admin SMS', 'Auto-resolve disputes after 7 days'].map((flag) => (
          <label key={flag} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-text-2">{flag}</span>
            <input type="checkbox" className="toggle-checkbox" defaultChecked />
          </label>
        ))}
      </Card>
    </div>
  );
}
