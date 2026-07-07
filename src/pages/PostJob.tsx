import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, MapPin, Calendar, AlertCircle,
  X, Upload, FileText, DollarSign, Briefcase, Zap, Droplet, Wind, Hammer,
  Paintbrush, Building2, Cpu, Truck, Wrench, Sparkles, Link2, Plus, Info,
  CheckCircle2, PartyPopper,
} from 'lucide-react';
import { createJob } from '../lib/api';
import type { Job } from '../lib/types';
import { formatNaira, TRADES } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';

const STEPS = ['Details', 'Location & Budget', 'Review & Post'];
const TRADE_ICONS: Record<string, any> = {
  Electrician: Zap, Plumber: Droplet, 'AC & Cooling': Wind, Carpenter: Hammer,
  Painter: Paintbrush, Mason: Building2, Electronics: Cpu, Moving: Truck,
};

const BUDGET_GUIDES = [
  { label: 'Small repair', range: '₦5,000 – ₦15,000' },
  { label: 'Standard job', range: '₦15,000 – ₦50,000' },
  { label: 'Major project', range: '₦50,000 – ₦200,000' },
  { label: 'Large installation', range: '₦200,000+' },
];

interface PhotoFile {
  id: string;
  url: string;
  name: string;
}

export default function PostJob() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<Job | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Step 1 fields
  const [title, setTitle] = useState('');
  const [trade, setTrade] = useState('');
  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');

  // Step 2 fields
  const [location, setLocation] = useState('');
  const [mapPin, setMapPin] = useState<{ x: number; y: number } | null>(null);
  const [budget, setBudget] = useState(20000);
  const [budgetText, setBudgetText] = useState('20000');
  const [acceptBidsAbove, setAcceptBidsAbove] = useState(false);
  const [materialPreference, setMaterialPreference] = useState('client_provides');

  // Step 3 fields
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in or not a client
  useEffect(() => {
    if (!user) {
      addToast({ type: 'warning', title: 'Please log in to post a job' });
      navigate('/auth/login?redirect=/jobs/post');
    } else if (user.role !== 'client') {
      addToast({ type: 'warning', title: 'Only clients can post jobs' });
      navigate('/jobs');
    }
  }, [user, navigate, addToast]);

  if (!user || user.role !== 'client') return null;

  // Validation per step
  const step1Valid = title.trim().length >= 5 && trade && description.trim().length >= 50;
  const step2Valid = location.trim().length >= 3 && budget > 0;
  const step3Valid = agreed;

  const handleBudgetSlider = (val: number) => {
    setBudget(val);
    setBudgetText(String(val));
  };

  const handleBudgetText = (val: string) => {
    setBudgetText(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) setBudget(num);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMapPin({ x, y });
  };

  const handlePhotoUpload = (files: FileList | null) => {
    if (!files) return;
    const remaining = 4 - photos.length;
    const toAdd = Array.from(files).slice(0, remaining);
    toAdd.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      setPhotos((prev) => [
        ...prev,
        { id: Date.now().toString(36) + Math.random().toString(36).slice(2), url, name: file.name },
      ]);
    });
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handlePhotoUpload(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!step1Valid || !step2Valid || !step3Valid) {
      addToast({ type: 'error', title: 'Please complete all required fields' });
      return;
    }
    setSubmitting(true);
    const result = await createJob({
      client_id: user.id,
      title: title.trim(),
      trade,
      description: description.trim(),
      location_text: location.trim(),
      lat: mapPin ? 6.5 + (mapPin.y / 100) * 0.1 : undefined,
      lng: mapPin ? 3.3 + (mapPin.x / 100) * 0.1 : undefined,
      budget_min: budget,
      is_urgent: isUrgent,
      scheduled_date: preferredDate || undefined,
      photos: photos.length > 0 ? JSON.stringify(photos.map((p) => p.url)) : undefined,
    });
    setSubmitting(false);
    if (result) {
      setSuccess(result);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      addToast({ type: 'success', title: 'Job posted!', message: 'Technicians will start bidding soon.' });
    } else {
      addToast({ type: 'error', title: 'Failed to post job', message: 'Please try again.' });
    }
  };

  const resetForm = () => {
    setStep(0);
    setTitle(''); setTrade(''); setDescription(''); setIsUrgent(false); setPreferredDate('');
    setLocation(''); setMapPin(null); setBudget(20000); setBudgetText('20000');
    setAcceptBidsAbove(false); setMaterialPreference('client_provides');
    setPhotos([]); setAgreed(false);
    setSuccess(null);
  };

  const canProceed = step === 0 ? step1Valid : step === 1 ? step2Valid : step3Valid;
  const TradeIcon = trade ? TRADE_ICONS[trade] || Wrench : Briefcase;

  // ===== SUCCESS SCREEN =====
  if (success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-8 relative overflow-hidden">
        {/* Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, x: Math.random() * window.innerWidth, opacity: 1, rotate: 0 }}
                animate={{ y: window.innerHeight + 50, rotate: 360, opacity: 0 }}
                transition={{ duration: 3 + Math.random() * 2, delay: Math.random() * 1.5 }}
                className="absolute w-2 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#C47A00', '#E8960A', '#0A6B7C', '#0E8EA6', '#1A6B3C'][i % 5],
                }}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-5"
            >
              <PartyPopper size={40} className="text-success" />
            </motion.div>
            <h1 className="font-display text-2xl font-extrabold mb-2">Job Posted! 🎉</h1>
            <p className="text-text-2 text-sm mb-6">
              Your job is now live. Verified technicians will start bidding shortly.
            </p>

            {/* Job summary */}
            <div className="bg-bg-3 rounded-xl p-4 mb-5 text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-bg-2 flex items-center justify-center">
                  <TradeIcon size={16} className="text-primary-mid" />
                </div>
                <p className="font-semibold text-sm">{success.title}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-text-3">
                <span>{success.trade}</span>
                <span className="font-bold text-primary-mid">{formatNaira(success.budget_min || 0)}</span>
              </div>
            </div>

            {/* Share link */}
            <div className="flex items-center gap-2 bg-bg-3 rounded-xl p-2 mb-5">
              <Link2 size={14} className="text-text-3 ml-2" />
              <input
                readOnly
                value={`${window.location.origin}/jobs/${success.id}`}
                className="flex-1 bg-transparent text-sm text-text-2 outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/jobs/${success.id}`);
                  addToast({ type: 'success', title: 'Link copied!' });
                }}
                className="px-3 py-1.5 rounded-lg bg-bg-2 text-xs font-medium text-text-2 hover:text-text"
              >
                Copy
              </button>
            </div>

            <div className="flex gap-2">
              <Button fullWidth onClick={() => navigate(`/jobs/${success.id}`)}>
                View my job
              </Button>
              <Button variant="outline" fullWidth onClick={resetForm}>
                <Plus size={16} /> Post another
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ===== MAIN FORM =====
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center gap-1.5 text-sm text-text-3 hover:text-text mb-5 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Job Board
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-display text-3xl font-extrabold">Post a Job</h1>
          <p className="text-text-2 text-sm mt-1">Get bids from verified technicians in minutes.</p>
        </motion.div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all shrink-0 ${
                    i < step
                      ? 'gold-gradient border-primary text-bg'
                      : i === step
                      ? 'border-primary text-primary-mid bg-primary/10'
                      : 'border-border text-text-3 bg-bg-2'
                  }`}
                >
                  {i < step ? <Check size={16} /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i <= step ? 'text-text' : 'text-text-3'}`}>
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 rounded-full bg-bg-3 overflow-hidden">
                    <motion.div
                      className="h-full gold-gradient"
                      initial={{ width: 0 }}
                      animate={{ width: i < step ? '100%' : '0%' }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {/* ===== STEP 1: DETAILS ===== */}
          {step === 0 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <Card className="p-5 sm:p-6 space-y-5">
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-text-2">Job Title</label>
                    <span className={`text-xs ${title.length > 80 ? 'text-power' : 'text-text-3'}`}>
                      {title.length}/80
                    </span>
                  </div>
                  <Input
                    placeholder="e.g. Fix faulty wiring in 2-bedroom apartment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                    icon={<FileText size={18} />}
                    maxLength={80}
                  />
                </div>

                {/* Trade dropdown */}
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1.5">Trade</label>
                  <div className="relative">
                    <select
                      value={trade}
                      onChange={(e) => setTrade(e.target.value)}
                      className="input-base appearance-none cursor-pointer pr-10"
                    >
                      <option value="" className="bg-bg-2">Select a trade...</option>
                      {TRADES.map((t) => (
                        <option key={t} value={t} className="bg-bg-2">{t}</option>
                      ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none">
                      <Briefcase size={18} />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-text-2">Description</label>
                    <span className={`text-xs ${description.length < 50 ? 'text-text-3' : 'text-success'}`}>
                      {description.length}/50 min
                    </span>
                  </div>
                  <Textarea
                    placeholder="Describe the job in detail. What needs to be done? Any specific requirements? The more detail you provide, the better bids you'll get."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                  />
                </div>

                {/* Urgency toggle */}
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1.5">Urgency</label>
                  <button
                    onClick={() => setIsUrgent(!isUrgent)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-bg-3 border border-border hover:border-power/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUrgent ? 'bg-power/15' : 'bg-bg'}`}>
                        <AlertCircle size={20} className={isUrgent ? 'text-power' : 'text-text-3'} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-text">Mark as urgent</p>
                        <p className="text-xs text-text-3">Prioritized in search and bids</p>
                      </div>
                    </div>
                    <div className={`w-11 h-6 rounded-full transition-colors ${isUrgent ? 'bg-power' : 'bg-bg'}`}>
                      <motion.div
                        animate={{ x: isUrgent ? 22 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-white mt-0.5"
                      />
                    </div>
                  </button>
                </div>

                {/* Preferred date */}
                <Input
                  label="Preferred Date (optional)"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  icon={<Calendar size={18} />}
                />
              </Card>
            </motion.div>
          )}

          {/* ===== STEP 2: LOCATION & BUDGET ===== */}
          {step === 1 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Location */}
              <Card className="p-5 sm:p-6 space-y-4">
                <Input
                  label="Location"
                  placeholder="e.g. Lekki Phase 1, Lagos"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  icon={<MapPin size={18} />}
                />
                {/* Simulated map pin placement */}
                <div>
                  <p className="text-sm font-medium text-text-2 mb-1.5">Pin your location on the map</p>
                  <div
                    onClick={handleMapClick}
                    className="relative h-48 rounded-xl bg-bg-3 border border-border overflow-hidden cursor-crosshair"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
                      `,
                      backgroundSize: '40px 40px',
                    }}
                  >
                    {/* Water */}
                    <div className="absolute bottom-2 right-2 w-1/3 h-1/3 rounded-2xl bg-accent/10 blur-md" />
                    {mapPin ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${mapPin.x}%`, top: `${mapPin.y}%` }}
                      >
                        <div className="w-5 h-5 rounded-full bg-primary border-2 border-bg shadow-lg ring-4 ring-primary/30" />
                      </motion.div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-text-3 text-sm">
                        <div className="text-center">
                          <MapPin size={24} className="mx-auto mb-1 opacity-50" />
                          Click to place pin
                        </div>
                      </div>
                    )}
                  </div>
                  {mapPin && (
                    <p className="text-xs text-success mt-1.5 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Pin placed
                    </p>
                  )}
                </div>
              </Card>

              {/* Budget */}
              <Card className="p-5 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-2">Budget</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1000}
                      max={500000}
                      step={1000}
                      value={budget}
                      onChange={(e) => handleBudgetSlider(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <div className="relative w-32">
                      <Input
                        type="number"
                        value={budgetText}
                        onChange={(e) => handleBudgetText(e.target.value)}
                        className="text-sm"
                        suffix={<span className="text-xs text-text-3">₦</span>}
                      />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-primary-mid mt-2">
                    {formatNaira(budget)}
                  </p>
                </div>

                {/* Budget guide */}
                <div className="bg-bg-3 rounded-xl p-3">
                  <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Info size={12} /> Budget Guide
                  </p>
                  <div className="space-y-1.5">
                    {BUDGET_GUIDES.map((g) => (
                      <div key={g.label} className="flex items-center justify-between text-xs">
                        <span className="text-text-2">{g.label}</span>
                        <span className="text-text-3 font-mono">{g.range}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accept bids above */}
                <button
                  onClick={() => setAcceptBidsAbove(!acceptBidsAbove)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-bg-3 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${acceptBidsAbove ? 'bg-primary/15' : 'bg-bg'}`}>
                      <DollarSign size={18} className={acceptBidsAbove ? 'text-primary-mid' : 'text-text-3'} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-text">Accept bids above budget</p>
                      <p className="text-xs text-text-3">Allow technicians to bid higher</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors ${acceptBidsAbove ? 'bg-primary' : 'bg-bg'}`}>
                    <motion.div
                      animate={{ x: acceptBidsAbove ? 22 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5 h-5 rounded-full bg-white mt-0.5"
                    />
                  </div>
                </button>

                {/* Material preference */}
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-2">Material Preference</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'client_provides', label: 'I provide materials' },
                      { val: 'tech_provides', label: 'Technician provides' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => setMaterialPreference(opt.val)}
                        className={`btn-press px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          materialPreference === opt.val
                            ? 'teal-gradient text-white border-accent'
                            : 'bg-bg-3 text-text-2 border-border hover:border-accent/30'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ===== STEP 3: REVIEW & POST ===== */}
          {step === 2 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Full preview */}
              <Card className="p-5 sm:p-6">
                <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <Sparkles size={20} className="text-primary-mid" /> Job Preview
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-bg-3 flex items-center justify-center shrink-0">
                      <TradeIcon size={24} className="text-primary-mid" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-lg font-bold">{title || 'Untitled job'}</h3>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <Badge variant="gray">{trade || 'No trade selected'}</Badge>
                        {isUrgent && <Badge variant="red"><AlertCircle size={11} /> Urgent</Badge>}
                      </div>
                    </div>
                  </div>
                  {description && (
                    <p className="text-sm text-text-2 leading-relaxed bg-bg-3 rounded-xl p-3">{description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-bg-3 rounded-xl p-3">
                      <p className="text-xs text-text-3 mb-0.5">Location</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <MapPin size={14} className="text-text-3" /> {location || 'Not set'}
                      </p>
                    </div>
                    <div className="bg-bg-3 rounded-xl p-3">
                      <p className="text-xs text-text-3 mb-0.5">Budget</p>
                      <p className="text-sm font-bold text-primary-mid">{formatNaira(budget)}</p>
                    </div>
                    {preferredDate && (
                      <div className="bg-bg-3 rounded-xl p-3">
                        <p className="text-xs text-text-3 mb-0.5">Preferred Date</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Calendar size={14} className="text-text-3" /> {preferredDate}
                        </p>
                      </div>
                    )}
                    <div className="bg-bg-3 rounded-xl p-3">
                      <p className="text-xs text-text-3 mb-0.5">Materials</p>
                      <p className="text-sm font-medium">
                        {materialPreference === 'client_provides' ? 'Client provides' : 'Tech provides'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Photo upload */}
              <Card className="p-5 sm:p-6">
                <h3 className="font-display text-sm font-bold mb-3">Photos (optional, up to 4)</h3>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e.target.files)}
                  />
                  <Upload size={28} className="text-text-3 mx-auto mb-2" />
                  <p className="text-sm text-text-2 font-medium">Drag & drop or click to upload</p>
                  <p className="text-xs text-text-3 mt-1">PNG, JPG up to 4 photos</p>
                </div>

                {/* Photo thumbnails */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-bg-3">
                        <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-bg/80 flex items-center justify-center text-text-2 hover:text-power opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Agreement */}
              <Card className="p-5 sm:p-6">
                <button
                  onClick={() => setAgreed(!agreed)}
                  className="flex items-start gap-3 text-left w-full"
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                    agreed ? 'gold-gradient border-primary' : 'border-border bg-bg-3'
                  }`}>
                    {agreed && <Check size={14} className="text-bg" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">
                      I agree to SkillBridge's terms of service
                    </p>
                    <p className="text-xs text-text-3 mt-0.5">
                      I understand payment will be held in escrow and released only when the job is completed to my satisfaction. I confirm the details above are accurate.
                    </p>
                  </div>
                </button>
              </Card>

              {/* Submit button */}
              <Button
                fullWidth
                size="lg"
                loading={submitting}
                disabled={!canProceed}
                onClick={handleSubmit}
              >
                {submitting ? 'Posting...' : (
                  <>
                    <Sparkles size={18} /> Post Job
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {step < 2 && (
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              onClick={() => (step === 0 ? navigate('/jobs') : setStep(step - 1))}
            >
              <ArrowLeft size={16} /> {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed}
            >
              Continue <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
