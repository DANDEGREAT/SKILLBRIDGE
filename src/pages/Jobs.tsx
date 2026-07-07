import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Clock, Zap, Droplet, Wind, Hammer, Paintbrush, Building2,
  Cpu, Truck, Wrench, Plus, AlertCircle, Briefcase,
  ChevronRight, Gavel,
} from 'lucide-react';
import { getJobs } from '../lib/api';
import type { Job } from '../lib/types';
import { formatNairaShort, timeAgo } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SkeletonCard } from '../components/ui/Skeleton';

const FILTER_TABS = ['All', 'Electrical', 'Plumbing', 'AC', 'Carpentry', 'Painting', 'Other'];
const SORT_OPTIONS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'budget', label: 'Highest budget' },
  { value: 'bids', label: 'Most bids' },
  { value: 'urgent', label: 'Urgent first' },
];

const tabToTrade: Record<string, string | undefined> = {
  All: undefined, Electrical: 'Electrician', Plumbing: 'Plumber',
  AC: 'AC & Cooling', Carpentry: 'Carpenter', Painting: 'Painter', Other: undefined,
};

const tradeIconMap: Record<string, any> = {
  Electrician: Zap, Plumber: Droplet, 'AC & Cooling': Wind, Carpenter: Hammer,
  Painter: Paintbrush, Mason: Building2, Electronics: Cpu, Moving: Truck,
};

const statusVariant: Record<string, 'gold' | 'teal' | 'green' | 'red' | 'gray' | 'amber'> = {
  open: 'green', bidding: 'gold', in_progress: 'teal',
  completed: 'gray', disputed: 'red', cancelled: 'gray',
};

export default function Jobs() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [sort, setSort] = useState('recent');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getJobs({ search: search || undefined }).then((data) => {
      if (active) { setJobs(data); setLoading(false); }
    });
    return () => { active = false; };
  }, [search]);

  const tabFiltered = useMemo(() => {
    if (activeTab === 'All') return jobs;
    if (activeTab === 'Other') {
      const known = ['Electrician', 'Plumber', 'AC & Cooling', 'Carpenter', 'Painter'];
      return jobs.filter((j) => !known.includes(j.trade));
    }
    const trade = tabToTrade[activeTab];
    return jobs.filter((j) => j.trade === trade);
  }, [jobs, activeTab]);

  const sorted = useMemo(() => {
    const arr = [...tabFiltered];
    switch (sort) {
      case 'budget': return arr.sort((a, b) => (b.budget_min || 0) - (a.budget_min || 0));
      case 'bids': return arr.sort((a, b) => (a.status === 'bidding' ? -1 : 0) - (b.status === 'bidding' ? -1 : 0));
      case 'urgent': return arr.sort((a, b) => (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0));
      default: return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [tabFiltered, sort]);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold">Job Board</h1>
            <p className="text-text-2 text-sm mt-1">{loading ? 'Loading jobs...' : `${sorted.length} job${sorted.length !== 1 ? 's' : ''} available`}</p>
          </div>
          <Button onClick={() => navigate('/jobs/post')}><Plus size={18} /> Post a job</Button>
        </motion.div>

        <div className="mb-5">
          <Input placeholder="Search by title or location..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={18} />} className="text-sm" />
        </div>

        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
          {FILTER_TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`btn-press px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-all ${activeTab === tab ? 'gold-gradient text-bg border-primary' : 'bg-bg-2 text-text-2 border-border hover:border-primary/30'}`}>{tab}</button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-text-3">Showing <span className="text-text font-semibold">{sorted.length}</span> results</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-3">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-bg-2 border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:border-primary cursor-pointer">
              {SORT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value} className="bg-bg-2">{opt.label}</option>))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : sorted.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-bg-3 flex items-center justify-center mx-auto mb-4"><Briefcase size={36} className="text-text-3" /></div>
              <h3 className="font-display text-xl font-bold mb-2">No jobs yet</h3>
              <p className="text-text-2 text-sm mb-6 max-w-sm mx-auto">Be the first to post a job on SkillBridge. Get bids from verified technicians in minutes.</p>
              <Button onClick={() => navigate('/jobs/post')}><Plus size={18} /> Post the first job</Button>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {sorted.map((job, i) => {
                const TradeIcon = tradeIconMap[job.trade] || Wrench;
                return (
                  <motion.div key={job.id} layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
                    <Card hover onClick={() => navigate(`/jobs/${job.id}`)} className="p-4 sm:p-5 cursor-pointer relative overflow-hidden">
                      {job.is_urgent && (<div className="absolute left-0 top-0 bottom-0 w-1 bg-power"><div className="w-full h-full bg-power animate-pulse" /></div>)}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            {job.is_urgent && (<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-power/15 text-power border border-power/30 text-xs font-semibold animate-pulse"><AlertCircle size={11} /> URGENT</span>)}
                            <Badge variant={statusVariant[job.status] || 'gray'}>{job.status.replace('_', ' ')}</Badge>
                          </div>
                          <h3 className="font-display text-lg font-bold text-text leading-tight">{job.title}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-bg-3 flex items-center justify-center shrink-0"><TradeIcon size={20} className="text-primary-mid" /></div>
                      </div>
                      {job.description && (<p className="text-sm text-text-2 line-clamp-2 mb-3">{job.description}</p>)}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-3 mb-3">
                        <span className="flex items-center gap-1"><MapPin size={12} />{job.location_text || 'Location not specified'}</span>
                        <span className="flex items-center gap-1"><Clock size={12} />{timeAgo(job.created_at)}</span>
                        <span className="flex items-center gap-1"><Briefcase size={12} />{job.trade}</span>
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-text-3 flex items-center gap-1"><Gavel size={11} /> Bid activity</span>
                          <span className="text-text-3">{job.status === 'bidding' ? 'Active bidding' : job.status === 'open' ? 'Accepting bids' : 'Closed'}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-bg-3 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: job.status === 'bidding' ? '70%' : job.status === 'open' ? '30%' : '100%' }} transition={{ duration: 0.8, delay: 0.2 }} className={`h-full rounded-full ${job.status === 'bidding' ? 'gold-gradient' : job.status === 'open' ? 'bg-accent' : 'bg-text-3'}`} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-xs text-text-3">Budget</p>
                            <p className="font-display text-lg font-bold text-primary-mid">{job.budget_min ? formatNairaShort(job.budget_min) : 'Negotiable'}</p>
                          </div>
                          {job.agreed_amount && (<div className="pl-3 border-l border-border"><p className="text-xs text-text-3">Agreed</p><p className="font-semibold text-sm text-success">{formatNairaShort(job.agreed_amount)}</p></div>)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar firstName="A" lastName="C" size="sm" />
                          <Button size="sm" variant="outline" onClick={(e: any) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}>View details <ChevronRight size={14} /></Button>
                          {user && user.role === 'technician' && job.status === 'open' && (<Button size="sm" onClick={(e: any) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}>Quick bid</Button>)}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
