import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Zap, Droplet, Wind, Hammer, Paintbrush, Building2, Cpu, Truck,
  ShieldCheck, MapPin, Lock, Star, MessageSquare, Award, ArrowRight,
  CheckCircle2, Users, Briefcase, TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';

const trades = [
  { name: 'Electrician', icon: Zap, color: 'text-primary-mid' },
  { name: 'Plumber', icon: Droplet, color: 'text-accent-mid' },
  { name: 'AC & Cooling', icon: Wind, color: 'text-success' },
  { name: 'Carpenter', icon: Hammer, color: 'text-primary-mid' },
  { name: 'Painter', icon: Paintbrush, color: 'text-accent-mid' },
  { name: 'Mason', icon: Building2, color: 'text-success' },
  { name: 'Electronics', icon: Cpu, color: 'text-primary-mid' },
  { name: 'Moving', icon: Truck, color: 'text-accent-mid' },
];

const features = [
  { icon: ShieldCheck, title: 'KYC Verified', desc: 'Every technician is identity-verified with NIN and selfie checks before they can bid on your job.' },
  { icon: MapPin, title: 'Live Tracking', desc: 'See your technician arriving in real-time. Know exactly when they will reach your location.' },
  { icon: Lock, title: 'Escrow Payments', desc: 'Your money is held safely in escrow. Released only when you confirm the job is done.' },
  { icon: Star, title: 'Rated & Reviewed', desc: 'Real reviews from real clients. Hire with confidence based on verified ratings.' },
  { icon: MessageSquare, title: 'Dispute Cover', desc: 'Something went wrong? Our dispute resolution team has your back, every time.' },
  { icon: Award, title: 'Certified Pros', desc: 'From standard to elite tiers, find the right level of expertise for your budget.' },
];

const testimonials = [
  { name: 'Chioma Eze', role: 'Homeowner, Lekki', text: 'SkillBridge connected me with an electrician in 30 minutes. The escrow payment gave me peace of mind. Best service in Lagos!', rating: 5, trade: 'Electrical Wiring' },
  { name: 'Ibrahim Musa', role: 'Business Owner, Abuja', text: 'I have used SkillBridge for 5 jobs now. Every technician was verified and professional. This is how it should work.', rating: 5, trade: 'AC Servicing' },
  { name: 'Funmi Davies', role: 'Homeowner, Yaba', text: 'The live tracking feature is incredible. I knew exactly when the plumber was arriving. No more waiting all day.', rating: 5, trade: 'Plumbing' },
];

const stats = [
  { value: 5000, suffix: '+', label: 'Verified Technicians' },
  { value: 25000, suffix: '+', label: 'Jobs Completed' },
  { value: 0, prefix: '\u20A6', label: 'Fraud Cases' },
  { value: 4.8, suffix: '\u2605', label: 'Average Rating', decimal: true },
];

const trustPills = ['5,000+ Verified', '25,000+ Jobs', '\u20A60 Fraud', '4.8\u2605 Rating'];

function CountUp({ value, suffix, prefix, decimal }: { value: number; suffix?: string; prefix?: string; decimal?: boolean }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      const duration = 1500;
      const steps = 60;
      const stepValue = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(decimal ? Math.round(current * 10) / 10 : Math.round(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }
  }, [inView, value, decimal]);

  return (
    <span ref={ref}>
      {prefix}{decimal ? count.toFixed(1) : count.toLocaleString()}{suffix}
    </span>
  );
}

function HeroParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: 2 + Math.random() * 6,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 6,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function RotatingTrustPill() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % trustPills.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bg-3 border border-border">
      <span className="w-2 h-2 rounded-full bg-success online-pulse" />
      <motion.span
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-sm font-medium text-text"
      >
        {trustPills[index]}
      </motion.span>
    </div>
  );
}

export default function Home() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <HeroParticles />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            {user ? (
              <>
                <h1 className="font-display text-4xl sm:text-5xl font-extrabold mb-4">
                  Welcome back, <span className="text-gradient-gold">{user.first_name}</span>
                </h1>
                <p className="text-lg text-text-2 mb-8">
                  Ready to get things done?
                </p>
                <Button size="lg" onClick={() => navigate(user.role === 'technician' ? '/dashboard/technician' : user.role === 'admin' ? '/admin' : user.role === 'store_owner' ? '/dashboard/store' : '/dashboard/client')}>
                  Go to Dashboard <ArrowRight size={18} />
                </Button>
              </>
            ) : (
              <>
                <div className="mb-6 flex justify-center">
                  <RotatingTrustPill />
                </div>
                <h1 className="font-display text-4xl sm:text-6xl font-extrabold mb-6 text-balance">
                  You always know <span className="text-gradient-gold">who's coming</span> to your home.
                </h1>
                <p className="text-lg sm:text-xl text-text-2 mb-10 max-w-2xl mx-auto text-balance">
                  Hire KYC-verified technicians in Nigeria. Track them live, pay safely through escrow, and rate the work when it's done.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button size="lg" onClick={() => navigate('/find')}>
                    Find a Technician
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/jobs')}>
                    Browse Jobs
                  </Button>
                  <Button size="lg" variant="ghost" onClick={() => navigate('/auth/register')}>
                    Create Account
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative">
        <div className="gold-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center text-bg">
                  <div className="font-display text-3xl sm:text-4xl font-extrabold">
                    <CountUp
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      decimal={stat.decimal}
                    />
                  </div>
                  <div className="text-sm font-medium mt-1 text-bg/80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trades grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-3">
            Find a pro for any trade
          </h2>
          <p className="text-text-2">From wiring to plumbing, we have verified experts for every job.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {trades.map((trade, i) => {
            const Icon = trade.icon;
            return (
              <motion.div
                key={trade.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/find?trade=${encodeURIComponent(trade.name)}`}>
                  <Card hover className="p-6 text-center group">
                    <div className={`w-14 h-14 rounded-2xl bg-bg-3 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors`}>
                      <Icon size={28} className={trade.color} />
                    </div>
                    <h3 className="font-semibold text-text">{trade.name}</h3>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-bg-2 border-y border-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-3">
              How SkillBridge works
            </h2>
            <p className="text-text-2">Three simple steps from problem to solution.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Post your job', desc: 'Describe what you need, set your budget, and choose a preferred date. It takes less than 2 minutes.' },
              { num: '02', title: 'Verified pros bid', desc: 'KYC-verified technicians in your area send competitive bids. Compare profiles, ratings, and prices.' },
              { num: '03', title: 'Pay safely via escrow', desc: 'Your payment is held securely. Release it only when the job is done to your satisfaction.' },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="font-display text-5xl font-extrabold text-primary/20 mb-4">{step.num}</div>
                <h3 className="font-display text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-text-2 text-sm leading-relaxed">{step.desc}</p>
                {i < 2 && (
                  <ArrowRight size={24} className="hidden md:block absolute top-0 -right-4 text-text-3" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-3">
            Built for trust
          </h2>
          <p className="text-text-2">Every feature designed to protect you and your home.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card hover className="p-6 h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon size={24} className="text-primary-mid" />
                  </div>
                  <h3 className="font-semibold text-text mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-2 leading-relaxed">{feature.desc}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-bg-2 border-y border-border py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold mb-3">
              Loved by Nigerians
            </h2>
            <p className="text-text-2">Real stories from real clients across the country.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 h-full">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} size={16} className="fill-primary-mid text-primary-mid" />
                    ))}
                  </div>
                  <p className="text-text-2 text-sm leading-relaxed mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar firstName={t.name.split(' ')[0]} lastName={t.name.split(' ')[1]} size="md" />
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-text-3">{t.role}</p>
                    </div>
                  </div>
                  <Badge variant="gold" className="mt-4">{t.trade}</Badge>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technician CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-bg-2 to-bg-3 p-8 sm:p-12"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold mb-2">
                Are you a skilled technician?
              </h2>
              <p className="text-text-2">
                Join 5,000+ verified pros earning more on SkillBridge.
              </p>
            </div>
            <Button size="lg" onClick={() => navigate('/auth/register')}>
              Register as technician <ArrowRight size={18} />
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
