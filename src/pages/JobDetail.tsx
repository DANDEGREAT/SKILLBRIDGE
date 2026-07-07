import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, Zap, Droplet, Wind, Hammer, Paintbrush, Building2,
  Cpu, Truck, Wrench, Star, ArrowLeft, CheckCircle2, XCircle, MessageSquare,
  AlertCircle, Briefcase, Gavel, Wallet, Calendar, User as UserIcon,
  ChevronRight, Send, TrendingUp,
} from 'lucide-react';
import { getJobById, getJobs, createBid, acceptBid, getChatRoomForJob } from '../lib/api';
import type { JobWithDetails, Job, Bid } from '../lib/types';
import { formatNaira, formatNairaShort, timeAgo, formatDate } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Skeleton, SkeletonText, SkeletonCard } from '../components/ui/Skeleton';

const tradeIconMap: Record<string, any> = {
  Electrician: Zap, Plumber: Droplet, 'AC & Cooling': Wind, Carpenter: Hammer,
  Painter: Paintbrush, Mason: Building2, Electronics: Cpu, Moving: Truck,
};

const statusVariant: Record<string, 'gold' | 'teal' | 'green' | 'red' | 'gray' | 'amber'> = {
  open: 'green', bidding: 'gold', in_progress: 'teal',
  completed: 'gray', disputed: 'red', cancelled: 'gray',
  client_confirmed: 'teal', tech_confirmed: 'teal',
};

const TIMELINE_STEPS = [
  { key: 'posted', label: 'Posted', icon: Briefcase },
  { key: 'accepted', label: 'Bid Accepted', icon: CheckCircle2 },
  { key: 'in_progress', label: 'In Progress', icon: TrendingUp },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
];

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
  const [bidForm, setBidForm] = useState({ amount: '', message: '', estimatedHours: '' });
  const [submittingBid, setSubmittingBid] = useState(false);
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    getJobById(id).then(async (data) => {
      if (!active) return;
      setJob(data);
      setLoading(false);
      // Fetch related jobs (same trade)
      if (data) {
        const related = await getJobs({ trade: data.trade });
        setRelatedJobs(related.filter((j) => j.id !== id).slice(0, 4));
      }
    });
    return () => { active = false; };
  }, [id]);

  const isOwner = user && job && user.id === job.client_id;
  const isTechnician = user?.role === 'technician';
  const hasBid = job?.bids?.some((b) => b.technician_id === user?.id);

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    const amount = Number(bidForm.amount);
    if (!amount || amount <= 0) {
      addToast({ type: 'error', title: 'Enter a valid bid amount' });
      return;
    }
    if (!bidForm.message.trim()) {
      addToast({ type: 'error', title: 'Please add a message with your bid' });
      return;
    }
    setSubmittingBid(true);
    const result = await createBid({
      job_id: id,
      technician_id: user.id,
      amount,
      message: bidForm.message,
      estimated_hours: bidForm.estimatedHours ? Number(bidForm.estimatedHours) : undefined,
    });
    setSubmittingBid(false);
    if (result) {
      addToast({ type: 'success', title: 'Bid placed!', message: 'The client will review your bid.' });
      setBidForm({ amount: '', message: '', estimatedHours: '' });
      // Refresh job
      const updated = await getJobById(id);
      setJob(updated);
    } else {
      addToast({ type: 'error', title: 'Failed to place bid', message: 'Try again.' });
    }
  };

  const handleAcceptBid = async (bid: Bid) => {
    if (!job) return;
    setAcceptingBid(bid.id);
    await acceptBid(bid.id, job.id, bid.technician_id, bid.amount);
    setAcceptingBid(null);
    addToast({ type: 'success', title: 'Bid accepted!', message: 'Chat room opened with technician.' });
    const updated = await getJobById(job.id);
    setJob(updated);
  };

  const handleRejectBid = async (bid: Bid) => {
    if (!job) return;
    const { updateBid } = await import('../lib/api');
    await updateBid(bid.id, { status: 'rejected' });
    addToast({ type: 'info', title: 'Bid rejected' });
    const updated = await getJobById(job.id);
    setJob(updated);
  };

  const handleOpenChat = async () => {
    if (!job) return;
    const room = await getChatRoomForJob(job.id);
    if (room) {
      navigate(`/chat/${room.id}`);
    } else {
      addToast({ type: 'error', title: 'Chat not available yet' });
    }
  };

  // Timeline progress
  const timelineProgress = useMemo(() => {
    if (!job) return 0;
    const status = job.status;
    if (status === 'completed') return 4;
    if (status === 'in_progress' || status === 'client_confirmed' || status === 'tech_confirmed') return 3;
    if (job.technician_id) return 2;
    return 1;
  }, [job]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-10 w-2/3 mb-4" />
        <SkeletonText lines={3} className="mb-6" />
        <div className="grid sm:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle size={48} className="text-text-3 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Job not found</h2>
          <p className="text-text-2 mb-6">This job may have been removed or doesn't exist.</p>
          <Button onClick={() => navigate('/jobs')}>
            <ArrowLeft size={18} /> Back to Job Board
          </Button>
        </div>
      </div>
    );
  }

  const TradeIcon = tradeIconMap[job.trade] || Wrench;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back link */}
        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center gap-1.5 text-sm text-text-3 hover:text-text mb-5 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Job Board
        </button>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* ===== MAIN CONTENT ===== */}
          <div className="space-y-5">
            {/* Job header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-5 sm:p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-bg-3 flex items-center justify-center shrink-0">
                    <TradeIcon size={28} className="text-primary-mid" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant={statusVariant[job.status] || 'gray'}>
                        {job.status.replace('_', ' ')}
                      </Badge>
                      {job.is_urgent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-power/15 text-power border border-power/30 text-xs font-semibold animate-pulse">
                          <AlertCircle size={11} /> URGENT
                        </span>
                      )}
                      <Badge variant="gray">{job.trade}</Badge>
                    </div>
                    <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">
                      {job.title}
                    </h1>
                  </div>
                </div>

                {/* Budget + agreed */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-text-3 mb-0.5">Budget</p>
                    <p className="font-display text-xl font-bold text-primary-mid">
                      {job.budget_min ? formatNaira(job.budget_min) : 'Negotiable'}
                    </p>
                  </div>
                  {job.agreed_amount && (
                    <div className="pl-4 border-l border-border">
                      <p className="text-xs text-text-3 mb-0.5">Agreed Amount</p>
                      <p className="font-display text-xl font-bold text-success">
                        {formatNaira(job.agreed_amount)}
                      </p>
                    </div>
                  )}
                  {job.scheduled_date && (
                    <div className="pl-4 border-l border-border">
                      <p className="text-xs text-text-3 mb-0.5">Preferred Date</p>
                      <p className="font-semibold text-sm flex items-center gap-1">
                        <Calendar size={14} className="text-text-3" />
                        {formatDate(job.scheduled_date)}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Description */}
            {job.description && (
              <Card className="p-5 sm:p-6">
                <h2 className="font-display text-lg font-bold mb-3">Job Description</h2>
                <p className="text-text-2 text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </Card>
            )}

            {/* Location & meta */}
            <Card className="p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold mb-4">Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bg-3 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-accent-mid" />
                  </div>
                  <div>
                    <p className="text-xs text-text-3">Location</p>
                    <p className="text-sm font-medium text-text">{job.location_text || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bg-3 flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-accent-mid" />
                  </div>
                  <div>
                    <p className="text-xs text-text-3">Posted</p>
                    <p className="text-sm font-medium text-text">{timeAgo(job.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bg-3 flex items-center justify-center shrink-0">
                    <UserIcon size={18} className="text-accent-mid" />
                  </div>
                  <div>
                    <p className="text-xs text-text-3">Client</p>
                    <p className="text-sm font-medium text-text">
                      {isOwner ? `${job.client?.first_name} ${job.client?.last_name} (You)` : 'Anonymous client'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bg-3 flex items-center justify-center shrink-0">
                    <Gavel size={18} className="text-accent-mid" />
                  </div>
                  <div>
                    <p className="text-xs text-text-3">Bids</p>
                    <p className="text-sm font-medium text-text">{job.bids?.length || 0} bid{(job.bids?.length || 0) !== 1 ? 's' : ''} placed</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold mb-5">Job Timeline</h2>
              <div className="flex items-center justify-between relative">
                {/* Progress line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-bg-3" />
                <motion.div
                  className="absolute top-5 left-0 h-0.5 gold-gradient"
                  initial={{ width: 0 }}
                  animate={{ width: `${((timelineProgress - 1) / 3) * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
                {TIMELINE_STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const isDone = i < timelineProgress;
                  const isCurrent = i === timelineProgress - 1;
                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isDone
                            ? 'gold-gradient border-primary text-bg'
                            : isCurrent
                            ? 'bg-primary/15 border-primary text-primary-mid'
                            : 'bg-bg-3 border-border text-text-3'
                        }`
                      >
                        <StepIcon size={18} />
                      </div>
                      <span className={`text-xs font-medium text-center ${isDone ? 'text-text' : 'text-text-3'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Assigned technician (if bid accepted) */}
            {job.technician && job.technician_profile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-5 sm:p-6 border-primary/30">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-bold flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-success" /> Assigned Technician
                    </h2>
                    <Badge variant="green">Accepted</Badge>
                  </div>
                  <div className="flex items-start gap-4">
                    <Avatar
                      firstName={job.technician.first_name}
                      lastName={job.technician.last_name}
                      size="lg"
                      online={job.technician_profile.is_available}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">
                          {job.technician.first_name} {job.technician.last_name}
                        </h3>
                        {job.technician_profile.tier !== 'standard' && (
                          <Badge variant={job.technician_profile.tier === 'elite' ? 'gold' : 'teal'}>
                            {job.technician_profile.tier}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-2">{job.technician_profile.trade}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-text-3">
                        <span className="flex items-center gap-1">
                          <Star size={13} className="fill-primary-mid text-primary-mid" />
                          {job.technician_profile.rating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase size={13} /> {job.technician_profile.total_jobs} jobs
                        </span>
                        <span className="flex items-center gap-1">
                          <Wallet size={13} /> {formatNaira(job.technician_profile.hourly_rate)}/hr
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button fullWidth onClick={handleOpenChat}>
                      <MessageSquare size={16} /> Open Chat
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/technician/${job.technician!.id}`)}>
                      View Profile
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Bids section */}
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold flex items-center gap-2">
                  <Gavel size={20} className="text-primary-mid" /> Bids
                </h2>
                <Badge variant="gray">{job.bids?.length || 0} total</Badge>
              </div>

              {/* Owner view: see all bids */}
              {isOwner && job.bids && job.bids.length > 0 ? (
                <div className="space-y-3">
                  {job.bids.map((bid, i) => (
                    <motion.div
                      key={bid.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-4 rounded-xl border ${
                        bid.status === 'accepted'
                          ? 'border-success/40 bg-success/5'
                          : bid.status === 'rejected'
                          ? 'border-border bg-bg-3 opacity-60'
                          : 'border-border bg-bg-3'
                      }`
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-display text-lg font-bold text-primary-mid">
                              {formatNaira(bid.amount)}
                            </span>
                            {bid.estimated_hours && (
                              <span className="text-xs text-text-3">· {bid.estimated_hours}h est.</span>
                            )}
                            <Badge
                              variant={bid.status === 'accepted' ? 'green' : bid.status === 'rejected' ? 'red' : 'gray'}
                            >
                              {bid.status}
                            </Badge>
                          </div>
                          {bid.message && (
                            <p className="text-sm text-text-2 mb-2">{bid.message}</p>
                          )}
                          <p className="text-xs text-text-3">{timeAgo(bid.created_at)}</p>
                        </div>
                        {bid.status === 'pending' && !job.technician_id && (
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              loading={acceptingBid === bid.id}
                              onClick={() => handleAcceptBid(bid)}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectBid(bid)}
                            >
                              <XCircle size={14} /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-3 text-center py-6">
                  {job.bids && job.bids.length > 0
                    ? `${job.bids.length} bid${job.bids.length !== 1 ? 's' : ''} placed — bid details visible to job owner`
                    : 'No bids yet. Be the first to bid!'}
                </p>
              )}
            </Card>

            {/* Place bid form (technician) */}
            {isTechnician && !hasBid && job.status === 'open' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-5 sm:p-6 border-primary/20">
                  <h2 className="font-display text-lg font-bold mb-1 flex items-center gap-2">
                    <Send size={20} className="text-primary-mid" /> Place Your Bid
                  </h2>
                  <p className="text-sm text-text-3 mb-4">Submit a competitive bid for this job.</p>
                  <form onSubmit={handlePlaceBid} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Bid Amount (₦)"
                        type="number"
                        placeholder="e.g. 15000"
                        value={bidForm.amount}
                        onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                        icon={<Wallet size={18} />}
                        required
                      />
                      <Input
                        label="Estimated Hours"
                        type="number"
                        placeholder="e.g. 4"
                        value={bidForm.estimatedHours}
                        onChange={(e) => setBidForm({ ...bidForm, estimatedHours: e.target.value })}
                        icon={<Clock size={18} />}
                      />
                    </div>
                    <Textarea
                      label="Message to client"
                      placeholder="Describe your approach, experience with similar jobs, and why you're the best fit..."
                      value={bidForm.message}
                      onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
                      rows={4}
                      required
                    />
                    <Button type="submit" fullWidth size="lg" loading={submittingBid}>
                      <Send size={18} /> Submit Bid
                    </Button>
                  </form>
                </Card>
              </motion.div>
            )}

            {/* Already bid notice */}
            {isTechnician && hasBid && (
              <Card className="p-5 border-success/30 bg-success/5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-success" />
                  <div>
                    <p className="font-semibold text-text">You've already bid on this job</p>
                    <p className="text-sm text-text-2">Wait for the client to review your bid.</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* ===== SIDEBAR: Related jobs ===== */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-text-3 px-1">
              Related Jobs
            </h3>
            {relatedJobs.length === 0 ? (
              <Card className="p-4 text-center">
                <p className="text-sm text-text-3">No related jobs found</p>
              </Card>
            ) : (
              relatedJobs.map((rJob, i) => {
                const RIcon = tradeIconMap[rJob.trade] || Wrench;
                return (
                  <motion.div
                    key={rJob.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card hover onClick={() => navigate(`/jobs/${rJob.id}`)} className="p-3 cursor-pointer">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-bg-3 flex items-center justify-center shrink-0">
                          <RIcon size={16} className="text-primary-mid" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-text line-clamp-1">{rJob.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-text-3">
                            <span className="flex items-center gap-0.5">
                              <MapPin size={10} /> {rJob.location_text || 'N/A'}
                            </span>
                            <span>· {timeAgo(rJob.created_at)}</span>
                          </div>
                          <p className="text-sm font-bold text-primary-mid mt-1">
                            {rJob.budget_min ? formatNairaShort(rJob.budget_min) : 'Negotiable'}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-text-3 shrink-0" />
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
