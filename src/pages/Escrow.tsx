import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, CreditCard, Building2, Smartphone, Wallet,
  CheckCircle2, ChevronDown, ArrowLeft, AlertCircle, Loader2,
  PartyPopper, Clock, ArrowRight, Sparkles,
} from 'lucide-react';
import { getJobById, createPayment } from '../lib/api';
import type { JobWithDetails } from '../lib/types';
import { formatNaira, generatePaymentRef, timeAgo } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';

type PayMethod = 'card' | 'bank' | 'ussd' | 'opay' | 'palmpay';

const PAY_METHODS: { key: PayMethod; label: string; icon: any }[] = [
  { key: 'card', label: 'Card', icon: CreditCard },
  { key: 'bank', label: 'Bank Transfer', icon: Building2 },
  { key: 'ussd', label: 'USSD', icon: Smartphone },
  { key: 'opay', label: 'OPay', icon: Wallet },
  { key: 'palmpay', label: 'PalmPay', icon: Wallet },
];

const ESCROW_STEPS = [
  { label: 'Payment received', desc: 'Funds held securely by SkillBridge', icon: CheckCircle2 },
  { label: 'Job in progress', desc: 'Technician completes the work', icon: Clock },
  { label: 'You confirm', desc: 'Verify the job is done to your satisfaction', icon: Shield },
  { label: 'Tech paid', desc: 'Funds released to technician', icon: ArrowRight },
];

export default function Escrow() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PayMethod>('card');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' });
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [reference, setReference] = useState('');
  const [escrowExpanded, setEscrowExpanded] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'client') {
      navigate('/');
      return;
    }
    if (!jobId) return;
    let active = true;
    setLoading(true);
    getJobById(jobId).then((data) => {
      if (!active) return;
      setJob(data);
      setLoading(false);
    });
    return () => { active = false; };
  }, [jobId, user, navigate]);

  // Cost breakdown
  const breakdown = useMemo(() => {
    const amount = job?.agreed_amount || job?.budget_min || 0;
    const labour = Math.round(amount * 0.7);
    const materials = Math.round(amount * 0.25);
    const fee = Math.round(amount * 0.05);
    return { labour, materials, fee, total: amount };
  }, [job]);

  const handlePay = async () => {
    if (!agreed) {
      addToast({ type: 'warning', title: 'Please accept the terms to continue' });
      return;
    }
    if (!user || !job || !job.technician_id) return;

    setProcessing(true);
    const ref = generatePaymentRef();
    setReference(ref);

    // Simulate 30-second processing
    setTimeout(async () => {
      await createPayment({
        job_id: job.id,
        client_id: user.id,
        technician_id: job.technician_id,
        amount: breakdown.total,
        platform_fee: breakdown.fee,
        technician_payout: breakdown.total - breakdown.fee,
        reference: ref,
        payment_method: method,
      });
      setProcessing(false);
      setShowSuccess(true);
      addToast({ type: 'success', title: 'Payment held in escrow!', message: 'Funds secured.' });
    }, 30000);
  };

  // ===== Loading state =====
  if (loading) {
    return (
      <div className="min-h-screen bg-bg max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" rounded="rounded-xl" />
          <Skeleton className="h-96" rounded="rounded-xl" />
        </div>
      </div>
    );
  }

  // ===== Not found =====
  if (!job) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle size={48} className="text-text-3 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Job not found</h2>
          <p className="text-text-2 mb-6">This job may have been removed.</p>
          <Button onClick={() => navigate('/jobs')}>
            <ArrowLeft size={18} /> Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  // ===== No technician assigned =====
  if (!job.technician_id || !job.technician) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-text-3 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">No technician assigned</h2>
          <p className="text-text-2 mb-6">
            You can only fund escrow after accepting a technician's bid for this job.
          </p>
          <Button onClick={() => navigate(`/jobs/${job.id}`)}>
            <ArrowLeft size={18} /> View Job
          </Button>
        </div>
      </div>
    );
  }

  const techName = `${job.technician.first_name} ${job.technician.last_name}`;

  return (
    <div className="min-h-screen bg-bg relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back link */}
        <button
          onClick={() => navigate(`/jobs/${job.id}`)}
          className="inline-flex items-center gap-1.5 text-sm text-text-3 hover:text-text mb-5 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Job
        </button>

        <div className="mb-6">
          <h1 className="font-display text-3xl font-extrabold mb-1">Payment Escrow</h1>
          <p className="text-text-2 text-sm">Securely fund this job. Funds are held until you confirm completion.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ===== LEFT: Cost breakdown ===== */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-5 sm:p-6">
              {/* Job + tech header */}
              <div className="flex items-start gap-4 pb-5 border-b border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-3 mb-1">Job</p>
                  <h2 className="font-display text-xl font-bold leading-tight mb-2">{job.title}</h2>
                  <Badge variant="teal">{job.trade}</Badge>
                </div>
              </div>

              {/* Assigned tech */}
              <div className="flex items-center gap-3 py-5 border-b border-border">
                <Avatar
                  firstName={job.technician.first_name}
                  lastName={job.technician.last_name}
                  size="lg"
                />
                <div>
                  <p className="text-xs text-text-3 mb-0.5">Assigned Technician</p>
                  <p className="font-semibold text-text">{techName}</p>
                  {job.technician_profile && (
                    <p className="text-sm text-text-2">{job.technician_profile.trade}</p>
                  )}
                </div>
              </div>

              {/* Line items */}
              <div className="py-5 space-y-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-text-2 text-sm">Labour</span>
                  <span className="font-medium text-text">{formatNaira(breakdown.labour)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-2 text-sm">Materials estimate</span>
                  <span className="font-medium text-text">{formatNaira(breakdown.materials)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-2 text-sm">Platform fee (5%)</span>
                  <span className="font-medium text-text">{formatNaira(breakdown.fee)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between py-5">
                <span className="font-display text-lg font-bold text-text">Total</span>
                <span className="font-display text-3xl font-extrabold text-primary-mid">
                  {formatNaira(breakdown.total)}
                </span>
              </div>

              {/* How escrow protects you */}
              <div className="border-t border-border pt-4">
                <button
                  onClick={() => setEscrowExpanded(!escrowExpanded)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="flex items-center gap-2 font-semibold text-text">
                    <Shield size={18} className="text-success" />
                    How escrow protects you
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-text-3 transition-transform ${escrowExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {escrowExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-3 space-y-2 text-sm text-text-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                          Funds are held securely by SkillBridge, not released to the technician upfront.
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                          You only confirm release after verifying the job is done to your satisfaction.
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                          If a dispute arises, our team mediates and funds remain held until resolution.
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                          Full refund available if the technician doesn't start the job.
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Trust badge */}
              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-border">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-3">
                  <Lock size={16} className="text-success" />
                  <span className="text-xs font-medium text-text-2">256-bit SSL secured</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-3">
                  <span className="text-xs font-bold text-primary-mid">Paystack</span>
                  <span className="text-xs text-text-3">powered</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ===== RIGHT: Payment ===== */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold mb-1">Payment Method</h2>
              <p className="text-sm text-text-3 mb-5">Choose how you'd like to pay</p>

              {/* Method tabs */}
              <div className="grid grid-cols-5 gap-2 mb-6">
                {PAY_METHODS.map((m) => {
                  const Icon = m.icon;
                  const active = method === m.key;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setMethod(m.key)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border transition-all ${
                        active
                          ? 'border-primary bg-primary/10 text-primary-mid'
                          : 'border-border bg-bg-3 text-text-3 hover:border-border-2'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-[10px] font-medium leading-tight text-center">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Method-specific content */}
              <AnimatePresence mode="wait">
                {method === 'card' && (
                  <motion.div
                    key="card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <Input
                      label="Card Number"
                      placeholder="4084 0830 8308 4084"
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: e.target.value })}
                      icon={<CreditCard size={18} />}
                      maxLength={19}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Expiry"
                        placeholder="MM/YY"
                        value={card.expiry}
                        onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                        maxLength={5}
                      />
                      <Input
                        label="CVV"
                        placeholder="123"
                        type="password"
                        value={card.cvv}
                        onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                        maxLength={3}
                      />
                    </div>
                    <p className="text-xs text-text-3 flex items-center gap-1.5">
                      <Lock size={12} className="text-success" />
                      Simulated payment — no real card is charged.
                    </p>
                  </motion.div>
                )}

                {method === 'bank' && (
                  <motion.div
                    key="bank"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-xl bg-bg-3 border border-border">
                      <p className="text-xs text-text-3 mb-1">Bank</p>
                      <p className="font-display text-lg font-bold text-text mb-3">Wema Bank</p>
                      <p className="text-xs text-text-3 mb-1">Account Number</p>
                      <p className="font-mono text-xl font-bold text-primary-mid tracking-wider">
                        0123456789
                      </p>
                      <p className="text-xs text-text-3 mt-2">Account Name: SkillBridge Escrow</p>
                    </div>
                    <p className="text-sm text-text-2">
                      Transfer exactly <span className="font-bold text-text">{formatNaira(breakdown.total)}</span> to the account above. Payment is confirmed automatically.
                    </p>
                  </motion.div>
                )}

                {method === 'ussd' && (
                  <motion.div
                    key="ussd"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-xl bg-bg-3 border border-border text-center">
                      <p className="text-xs text-text-3 mb-2">Dial this code on your phone</p>
                      <p className="font-mono text-2xl font-bold text-primary-mid tracking-wider">
                        *737*100*{breakdown.total}*0123456789#
                      </p>
                    </div>
                    <p className="text-sm text-text-2">
                      Enter your PIN to authorize the payment of {formatNaira(breakdown.total)}.
                    </p>
                  </motion.div>
                )}

                {(method === 'opay' || method === 'palmpay') && (
                  <motion.div
                    key={method}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="p-4 rounded-xl bg-bg-3 border border-border text-center">
                      <Wallet size={32} className="text-primary-mid mx-auto mb-2" />
                      <p className="font-display text-lg font-bold text-text mb-1">
                        {method === 'opay' ? 'OPay' : 'PalmPay'} Wallet
                      </p>
                      <p className="text-sm text-text-2">
                        You'll be redirected to approve {formatNaira(breakdown.total)} from your wallet.
                      </p>
                    </div>
                    <Input
                      label="Phone Number"
                      placeholder="08012345678"
                      icon={<Smartphone size={18} />}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* T&Cs */}
              <label className="flex items-start gap-3 mt-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border-2 bg-bg-3 text-primary focus:ring-primary shrink-0"
                />
                <span className="text-sm text-text-2">
                  I agree to the <span className="text-primary-mid underline">Terms of Service</span> and understand funds will be held in escrow until I confirm job completion.
                </span>
              </label>

              {/* Pay button */}
              <Button
                fullWidth
                size="lg"
                className="mt-5"
                disabled={!agreed}
                loading={processing}
                onClick={handlePay}
              >
                <Shield size={18} />
                Pay {formatNaira(breakdown.total)} into escrow
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ===== Processing overlay ===== */}
      <AnimatePresence>
        {processing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-bg-2 border border-border rounded-2xl p-8 max-w-sm w-full text-center"
            >
              <div className="relative w-20 h-20 mx-auto mb-5">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 rounded-full border-4 border-bg-3 border-t-primary"
                />
                <Loader2 size={28} className="absolute inset-0 m-auto text-primary-mid animate-pulse" />
              </div>
              <h3 className="font-display text-xl font-bold mb-1">Processing payment...</h3>
              <p className="text-sm text-text-2 mb-4">
                Securing your funds in escrow. This takes a few seconds.
              </p>
              <div className="w-full h-1.5 bg-bg-3 rounded-full overflow-hidden">
                <motion.div
                  className="h-full gold-gradient"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 30, ease: 'linear' }}
                />
              </div>
              <p className="text-xs text-text-3 mt-3">Do not close this window</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Success slide-in ===== */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            {/* Confetti */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: -20,
                    opacity: 1,
                    rotate: 0,
                  }}
                  animate={{
                    y: window.innerHeight + 50,
                    rotate: Math.random() * 360,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    delay: Math.random() * 0.5,
                    repeat: Infinity,
                  }}
                  className="absolute w-2 h-3 rounded-sm"
                  style={{
                    backgroundColor: ['#C47A00', '#E8960A', '#0A6B7C', '#0E8EA6', '#1A6B3C'][i % 5],
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-bg-2 border border-primary/30 rounded-2xl p-6 sm:p-8 max-w-md w-full relative z-10"
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4"
                >
                  <PartyPopper size={32} className="text-success" />
                </motion.div>
                <h2 className="font-display text-2xl font-extrabold mb-1">Payment secured!</h2>
                <p className="text-text-2 text-sm">Your funds are now held safely in escrow.</p>
              </div>

              {/* Reference */}
              <div className="p-3 rounded-xl bg-bg-3 border border-border mb-5">
                <p className="text-xs text-text-3 mb-1">Reference Number</p>
                <p className="font-mono text-sm font-bold text-primary-mid tracking-wider">{reference}</p>
              </div>

              {/* Escrow timeline */}
              <div className="space-y-3 mb-6">
                {ESCROW_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const isDone = i === 0;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isDone
                            ? 'bg-success/15 text-success'
                            : 'bg-bg-3 text-text-3'
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDone ? 'text-text' : 'text-text-2'}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-text-3">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button fullWidth onClick={() => navigate('/payment/verify', { state: { reference, amount: breakdown.total } })}>
                  <Sparkles size={16} /> View Confirmation
                </Button>
                <Button variant="outline" fullWidth onClick={() => navigate('/jobs')}>
                  My Jobs
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
