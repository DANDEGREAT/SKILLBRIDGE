import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hourglass, ShieldCheck, XCircle, CheckCircle2, Clock, Bell, Briefcase,
  FileCheck, AlertCircle, ChevronRight, RefreshCw, Sparkles, MessageSquare,
} from 'lucide-react';
import { getKycStatus } from '../lib/api';
import type { KycVerification } from '../lib/types';
import { useAuthStore } from '../store/auth';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

const TIMELINE_STEPS = [
  { num: 1, label: 'Submitted', icon: FileCheck, desc: 'Your application was received' },
  { num: 2, label: 'Under review', icon: Clock, desc: 'Our team is verifying your documents' },
  { num: 3, label: 'Decision made', icon: Bell, desc: 'You will be notified by SMS' },
  { num: 4, label: 'Ready to work', icon: Briefcase, desc: 'Start receiving jobs on SkillBridge' },
];

// Map KYC status to current timeline step
function getCurrentStep(status: string): number {
  switch (status) {
    case 'pending': return 2;
    case 'approved': return 4;
    case 'rejected': return 3;
    default: return 1;
  }
}

export default function KycStatus() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [kyc, setKyc] = useState<KycVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    getKycStatus(user.id).then((data) => {
      if (!active) return;
      setKyc(data);
      setLoading(false);
      if (data?.status === 'approved') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    });
    return () => { active = false; };
  }, [user]);

  // Countdown timer for pending
  useEffect(() => {
    if (kyc?.status !== 'pending') return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        let { hours, minutes, seconds } = c;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 0; minutes = 0; seconds = 0; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [kyc?.status]);

  const status = kyc?.status || 'not_submitted';
  const currentStep = getCurrentStep(status);

  // Confetti pieces
  const confettiPieces = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
    }));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-full max-w-md px-4 space-y-4">
          <Skeleton className="w-24 h-24 mx-auto" rounded="rounded-full" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const statusConfig = {
    pending: {
      icon: Hourglass,
      color: 'text-primary',
      bg: 'bg-primary/10',
      ring: 'ring-primary/20',
      headline: 'Verification in Progress',
      subheadline: 'Your documents are being reviewed',
    },
    approved: {
      icon: ShieldCheck,
      color: 'text-success',
      bg: 'bg-success/10',
      ring: 'ring-success/20',
      headline: 'You\'re Verified!',
      subheadline: 'You can now start receiving jobs',
    },
    rejected: {
      icon: XCircle,
      color: 'text-power',
      bg: 'bg-power/10',
      ring: 'ring-power/20',
      headline: 'Verification Rejected',
      subheadline: 'Please review the issue and resubmit',
    },
    not_submitted: {
      icon: FileCheck,
      color: 'text-text-3',
      bg: 'bg-bg-3',
      ring: 'ring-border',
      headline: 'Not Submitted',
      subheadline: 'Start your KYC verification',
    },
  };

  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_submitted;
  const StatusIcon = cfg.icon;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center py-8 px-4 relative overflow-hidden">
      {/* ===== CONFETTI (approved) ===== */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {confettiPieces.map((piece) => (
              <motion.div
                key={piece.id}
                initial={{ y: -20, x: `${piece.x}vw`, opacity: 1, rotate: 0 }}
                animate={{ y: '100vh', opacity: [1, 1, 0], rotate: piece.rotate }}
                transition={{ duration: piece.duration, delay: piece.delay, ease: 'easeIn' }}
                className="absolute"
                style={{
                  width: piece.size,
                  height: piece.size * 0.4,
                  background: piece.id % 2 === 0 ? '#C47A00' : '#E8960A',
                  borderRadius: '2px',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-lg">
        {/* ===== STATUS ICON ===== */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center mb-6"
        >
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${cfg.bg} ring-4 ${cfg.ring}`}>
            {status === 'pending' ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <StatusIcon size={48} className={cfg.color} />
              </motion.div>
            ) : (
              <StatusIcon size={48} className={cfg.color} />
            )}
          </div>
          <h1 className="font-display text-2xl font-extrabold text-text mt-4">{cfg.headline}</h1>
          <p className="text-sm text-text-2 mt-1">{cfg.subheadline}</p>
        </motion.div>

        {/* ===== PENDING: COUNTDOWN ===== */}
        {status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-5 mb-4">
              <p className="text-xs text-text-3 uppercase tracking-wider text-center mb-3">Estimated time remaining</p>
              <div className="flex items-center justify-center gap-4">
                {[
                  { label: 'Hours', value: countdown.hours },
                  { label: 'Minutes', value: countdown.minutes },
                  { label: 'Seconds', value: countdown.seconds },
                ].map((unit) => (
                  <div key={unit.label} className="text-center">
                    <div className="font-display text-3xl font-extrabold text-primary-mid tabular-nums">
                      {String(unit.value).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-text-3 mt-0.5">{unit.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
                <Bell size={14} className="text-accent-mid" />
                <p className="text-sm text-text-2">You'll be notified by SMS when it's done</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ===== APPROVED: CTA ===== */}
        {status === 'approved' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-5 mb-4 text-center">
              <Sparkles size={24} className="text-primary mx-auto mb-2" />
              <p className="text-sm text-text-2 mb-4">
                Congratulations! Your account is now verified. You can start receiving job requests from clients.
              </p>
              <div className="flex gap-2">
                <Button fullWidth onClick={() => navigate('/find')}>
                  <Briefcase size={16} /> Start receiving jobs
                </Button>
                <Button variant="outline" onClick={() => navigate('/chat')}>
                  <MessageSquare size={16} />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ===== REJECTED: REASON + GUIDE ===== */}
        {status === 'rejected' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 mb-4"
          >
            {/* Rejection reason */}
            <Card className="p-5 border-power/30">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-power shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-text mb-1">Rejection reason</p>
                  <p className="text-sm text-text-2">
                    {kyc?.rejection_reason || 'Your document could not be verified. Please ensure the document is clear, valid, and not expired.'}
                  </p>
                </div>
              </div>
            </Card>

            {/* What to do next */}
            <Card className="p-5">
              <p className="text-sm font-semibold text-text mb-3">What to do next</p>
              <div className="space-y-2.5">
                {[
                  'Check that your document is valid and not expired',
                  'Ensure the uploaded image is clear and all corners are visible',
                  'Retake your selfie in a well-lit environment',
                  'Make sure your NIN is correctly entered (11 digits)',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-power/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-power">{i + 1}</span>
                    </div>
                    <p className="text-sm text-text-2">{tip}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Button fullWidth size="lg" onClick={() => navigate('/kyc')}>
              <RefreshCw size={18} /> Resubmit verification
            </Button>
          </motion.div>
        )}

        {/* ===== NOT SUBMITTED ===== */}
        {status === 'not_submitted' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <Card className="p-5 text-center">
              <p className="text-sm text-text-2 mb-4">
                You haven't submitted your KYC verification yet. Complete it to start receiving jobs.
              </p>
              <Button fullWidth size="lg" onClick={() => navigate('/kyc')}>
                <FileCheck size={18} /> Start verification <ChevronRight size={16} />
              </Button>
            </Card>
          </motion.div>
        )}

        {/* ===== TIMELINE ===== */}
        <Card className="p-5">
          <p className="text-sm font-semibold text-text mb-4">Verification Timeline</p>
          <div className="space-y-1">
            {TIMELINE_STEPS.map((s, i) => {
              const isComplete = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              const isLast = i === TIMELINE_STEPS.length - 1;
              const SIcon = s.icon;
              return (
                <div key={s.num} className="flex gap-3">
                  {/* Icon + line */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={{
                        scale: isCurrent ? 1.1 : 1,
                        backgroundColor: isComplete ? '#1A6B3C' : isCurrent ? '#C47A00' : '#1A1A1A',
                        borderColor: isComplete ? '#1A6B3C' : isCurrent ? '#C47A00' : '#2A2A2A',
                      }}
                      className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isComplete ? 'text-white' : isCurrent ? 'text-bg' : 'text-text-3'
                      }`}
                    >
                      {isComplete ? <CheckCircle2 size={16} /> : <SIcon size={16} />}
                    </motion.div>
                    {!isLast && (
                      <div className="w-0.5 h-8 mt-1 rounded-full bg-bg-3 overflow-hidden">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: isComplete ? '100%' : '0%' }}
                          transition={{ duration: 0.3 }}
                          className="w-full bg-success"
                        />
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                    <p className={`text-sm font-medium ${isCurrent || isComplete ? 'text-text' : 'text-text-3'}`}>
                      {s.label}
                    </p>
                    <p className="text-xs text-text-3 mt-0.5">{s.desc}</p>
                    {isCurrent && status === 'pending' && (
                      <Badge variant="gold" size="sm" className="mt-1.5">
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          In progress
                        </motion.span>
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Submitted date */}
        {kyc?.submitted_at && (
          <p className="text-center text-xs text-text-3 mt-4">
            Submitted on {new Date(kyc.submitted_at).toLocaleDateString('en-NG', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
