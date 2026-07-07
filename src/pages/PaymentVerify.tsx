import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, MessageSquare, Briefcase, Shield, Clock,
  ArrowRight, Wallet, Sparkles,
} from 'lucide-react';
import { useUIStore } from '../store/ui';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatNaira } from '../lib/utils';

const NEXT_STEPS = [
  {
    icon: Shield,
    title: 'Funds held securely',
    desc: 'Your payment is safely held in SkillBridge escrow. The technician is notified and can begin work.',
    color: 'text-success',
    bg: 'bg-success/15',
  },
  {
    icon: Briefcase,
    title: 'Job gets done',
    desc: 'The technician completes the work. You can chat anytime to coordinate details or ask for updates.',
    color: 'text-primary-mid',
    bg: 'bg-primary/15',
  },
  {
    icon: CheckCircle2,
    title: 'You confirm',
    desc: 'Once you verify the job is done to your satisfaction, confirm completion in the app.',
    color: 'text-accent-mid',
    bg: 'bg-accent/15',
  },
  {
    icon: Wallet,
    title: 'Tech gets paid',
    desc: 'Funds are released from escrow to the technician instantly. You can leave a review.',
    color: 'text-primary-mid',
    bg: 'bg-primary/15',
  },
];

export default function PaymentVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useUIStore();
  const [mounted, setMounted] = useState(false);

  const state = (location.state || {}) as { reference?: string; amount?: number };
  const reference = state.reference || 'SB-' + Date.now() + '-DEMO';
  const amount = state.amount || 0;

  useEffect(() => {
    setMounted(true);
    addToast({
      type: 'success',
      title: 'Payment confirmed!',
      message: 'Funds are held securely in escrow.',
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="max-w-2xl w-full">
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={mounted ? { scale: 1, opacity: 1 } : {}}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="w-24 h-24 mx-auto mb-6"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#1A6B3C"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={mounted ? { pathLength: 1 } : {}}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ pathLength: 1 }}
            />
            <motion.path
              d="M28 50 L44 66 L72 36"
              fill="none"
              stroke="#1A6B3C"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={mounted ? { pathLength: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
              style={{ pathLength: 1 }}
            />
          </svg>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold mb-2">
            Payment confirmed!
          </h1>
          <p className="text-text-2">
            Your funds are now safely held in escrow.
          </p>
        </motion.div>

        {/* Reference + status card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-5 sm:p-6 mb-6">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-xl bg-bg-3">
                <p className="text-xs text-text-3 mb-1">Reference Code</p>
                <p className="font-mono text-sm font-bold text-primary-mid tracking-wider break-all">
                  {reference}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-bg-3">
                <p className="text-xs text-text-3 mb-1">Escrow Status</p>
                <p className="text-sm font-semibold text-success flex items-center gap-1.5">
                  <Shield size={14} /> Funds held securely
                </p>
              </div>
            </div>

            {/* Amount breakdown */}
            {amount > 0 && (
              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-2">Amount paid</span>
                  <span className="font-medium text-text">{formatNaira(amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-2">Platform fee (5%)</span>
                  <span className="text-sm text-text-2">{formatNaira(Math.round(amount * 0.05))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-2">Technician receives</span>
                  <span className="font-medium text-success">
                    {formatNaira(amount - Math.round(amount * 0.05))}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          <Button fullWidth size="lg" onClick={() => navigate('/chat')}>
            <MessageSquare size={18} /> Open job chat
          </Button>
          <Button variant="outline" fullWidth size="lg" onClick={() => navigate('/jobs')}>
            <Briefcase size={18} /> View all jobs
          </Button>
        </motion.div>

        {/* What happens next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold mb-1 flex items-center gap-2">
              <Sparkles size={20} className="text-primary-mid" /> What happens next
            </h2>
            <p className="text-sm text-text-3 mb-5">Here's how the rest of the process works</p>

            <div className="space-y-4">
              {NEXT_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={mounted ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className={`w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center shrink-0`}>
                      <Icon size={20} className={step.color} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-text-3">STEP {i + 1}</span>
                        {i < NEXT_STEPS.length - 1 && (
                          <ArrowRight size={12} className="text-text-3" />
                        )}
                      </div>
                      <h3 className="font-semibold text-text text-sm">{step.title}</h3>
                      <p className="text-sm text-text-2">{step.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
          className="text-center text-xs text-text-3 mt-6 flex items-center justify-center gap-1.5"
        >
          <Clock size={12} /> Funds will be held until you confirm job completion
        </motion.p>
      </div>
    </div>
  );
}
