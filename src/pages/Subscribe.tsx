import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Crown, Star, Zap, TrendingUp, MessageSquare, Camera,
  Shield, HeadphonesIcon, Sparkles, CreditCard, Lock, Loader2,
  ArrowLeft, X,
} from 'lucide-react';
import { updateSubscription, getSubscription } from '../lib/api';
import type { SubPlan } from '../lib/types';
import { formatNaira } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface Plan {
  key: SubPlan;
  name: string;
  price: number;
  period: string;
  tagline: string;
  features: { label: string; included: boolean }[];
  highlight?: boolean;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    key: 'basic',
    name: 'Basic',
    price: 0,
    period: 'forever',
    tagline: 'Get started for free',
    features: [
      { label: 'Profile listed', included: true },
      { label: 'Receive job requests', included: true },
      { label: 'Standard search ranking', included: true },
      { label: '5 bids per month', included: true },
      { label: '15% commission', included: true },
      { label: 'Standard support', included: true },
      { label: 'Priority search', included: false },
      { label: 'Unlimited bids', included: false },
      { label: 'Premium badge', included: false },
      { label: 'Earnings analytics', included: false },
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: 3500,
    period: 'month',
    tagline: 'For active professionals',
    highlight: true,
    badge: 'Most Popular',
    features: [
      { label: 'Priority search ranking', included: true },
      { label: 'Unlimited bids', included: true },
      { label: '30-min early access to new jobs', included: true },
      { label: '10% commission', included: true },
      { label: 'Premium badge', included: true },
      { label: 'Earnings analytics', included: true },
      { label: 'Priority chat support', included: true },
      { label: 'Featured on homepage', included: true },
      { label: '#1 placement', included: false },
      { label: 'Dedicated account manager', included: false },
    ],
  },
  {
    key: 'elite',
    name: 'Elite',
    price: 8500,
    period: 'month',
    tagline: 'Maximum visibility & perks',
    badge: 'Top Tier',
    features: [
      { label: 'Everything in Premium', included: true },
      { label: '#1 placement in search', included: true },
      { label: '5% commission', included: true },
      { label: 'Dedicated account manager', included: true },
      { label: 'Professional profile photo', included: true },
      { label: 'Elite badge', included: true },
      { label: 'Dispute priority handling', included: true },
      { label: 'Featured on homepage', included: true },
      { label: 'Unlimited bids', included: true },
      { label: 'Earnings analytics', included: true },
    ],
  },
];

const PLAN_ICONS: Record<SubPlan, any> = {
  basic: Zap,
  premium: Star,
  elite: Crown,
};

const PLAN_BADGE_VARIANT: Record<SubPlan, 'gray' | 'gold' | 'teal'> = {
  basic: 'gray',
  premium: 'gold',
  elite: 'teal',
};

export default function Subscribe() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const [currentPlan, setCurrentPlan] = useState<SubPlan>('basic');
  const [selectedPlan, setSelectedPlan] = useState<SubPlan | null>(null);
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' });
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'technician') {
      navigate('/');
      return;
    }
    if (user.id) {
      getSubscription(user.id).then((sub) => {
        if (sub) setCurrentPlan(sub.plan);
      });
    }
  }, [user, navigate]);

  const handleSelectPlan = (plan: Plan) => {
    if (plan.key === currentPlan) {
      addToast({ type: 'info', title: 'You are already on this plan' });
      return;
    }
    if (plan.price === 0) {
      doSubscribe(plan.key, 0);
      return;
    }
    setSelectedPlan(plan.key);
  };

  const doSubscribe = async (plan: SubPlan, price: number) => {
    if (!user) return;
    await updateSubscription(user.id, plan, price);
    setCurrentPlan(plan);
    setSelectedPlan(null);
    setShowSuccess(true);
    addToast({
      type: 'success',
      title: `Subscribed to ${plan.charAt(0).toUpperCase() + plan.slice(1)}!`,
      message: 'Your new badge is now active.',
    });
  };

  const handlePay = () => {
    if (!selectedPlan) return;
    if (!card.number || !card.expiry || !card.cvv) {
      addToast({ type: 'warning', title: 'Please fill in all card details' });
      return;
    }
    const plan = PLANS.find((p) => p.key === selectedPlan)!;
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      doSubscribe(selectedPlan, plan.price);
    }, 30000);
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-text-3 hover:text-text mb-5 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl sm:text-4xl font-extrabold mb-2"
          >
            Upgrade your plan
          </motion.h1>
          <p className="text-text-2 max-w-xl mx-auto">
            Get more bids, better visibility, and lower commissions. Cancel anytime.
          </p>
          {currentPlan !== 'basic' && (
            <div className="mt-3">
              <Badge variant={PLAN_BADGE_VARIANT[currentPlan]} size="md">
                Current plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </Badge>
            </div>
          )}
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {PLANS.map((plan, i) => {
            const Icon = PLAN_ICONS[plan.key];
            const isCurrent = plan.key === currentPlan;
            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`p-6 relative h-full flex flex-col ${
                    plan.highlight ? 'border-primary shadow-lg shadow-primary/10' : ''
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant={plan.highlight ? 'gold' : 'teal'} size="md">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4 mt-2">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        plan.highlight
                          ? 'bg-primary/15 text-primary-mid'
                          : plan.key === 'elite'
                          ? 'bg-accent/15 text-accent-mid'
                          : 'bg-bg-3 text-text-2'
                      }`}
                    >
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                      <p className="text-xs text-text-3">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <span className="font-display text-3xl font-extrabold text-text">
                      {plan.price === 0 ? 'Free' : formatNaira(plan.price)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm text-text-3">/{plan.period}</span>
                    )}
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        {f.included ? (
                          <Check size={16} className="text-success mt-0.5 shrink-0" />
                        ) : (
                          <X size={16} className="text-text-3 mt-0.5 shrink-0" />
                        )}
                        <span className={f.included ? 'text-text-2' : 'text-text-3 line-through'}>
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    fullWidth
                    variant={plan.highlight ? 'primary' : 'outline'}
                    disabled={isCurrent}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Choose ' + plan.name}
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Feature comparison note */}
        <p className="text-center text-xs text-text-3 mb-8">
          All plans include access to the SkillBridge platform, secure escrow payments, and dispute support.
        </p>
      </div>

      {/* ===== Payment modal ===== */}
      <AnimatePresence>
        {selectedPlan && !processing && !showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedPlan(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-2 border border-border rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-xl font-bold mb-1">Subscribe to {selectedPlan}</h3>
              <p className="text-sm text-text-2 mb-5">
                {formatNaira(PLANS.find((p) => p.key === selectedPlan)?.price || 0)} / month
              </p>

              <div className="space-y-4">
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
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" fullWidth onClick={() => setSelectedPlan(null)}>
                  Cancel
                </Button>
                <Button fullWidth onClick={handlePay}>
                  <Lock size={16} /> Pay & Subscribe
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <p className="text-sm text-text-2 mb-4">Activating your subscription.</p>
              <div className="w-full h-1.5 bg-bg-3 rounded-full overflow-hidden">
                <motion.div
                  className="h-full gold-gradient"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 30, ease: 'linear' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Success overlay ===== */}
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
              {Array.from({ length: 30 }).map((_, i) => (
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-bg-2 border border-primary/30 rounded-2xl p-8 max-w-sm w-full text-center relative z-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4"
              >
                <Sparkles size={32} className="text-primary-mid" />
              </motion.div>
              <h2 className="font-display text-2xl font-extrabold mb-1">You're {currentPlan}!</h2>
              <p className="text-text-2 text-sm mb-5">
                Your new badge is now active on your profile and all your bids.
              </p>
              <div className="flex gap-3">
                <Button fullWidth onClick={() => navigate('/profile')}>
                  View Profile
                </Button>
                <Button variant="outline" fullWidth onClick={() => navigate('/jobs')}>
                  Find Jobs
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
