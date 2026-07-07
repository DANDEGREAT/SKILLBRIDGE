import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, CreditCard, Camera, FileCheck, CheckCircle2, ChevronRight, ChevronLeft,
  Upload, X, AlertCircle, ShieldCheck, Clock, Bell, Briefcase, Plus, CreditCard as IdCard,
  HelpCircle, ChevronDown, Loader2, Sparkles,
} from 'lucide-react';
import { submitKyc } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { validateNin } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const TRADE_OPTIONS = [
  'Electrician', 'Plumber', 'AC & Cooling', 'Carpenter', 'Painter', 'Mason', 'Electronics', 'Moving',
];
const DOC_TYPES = [
  { value: 'nin', label: 'NIN (Recommended)' },
  { value: 'drivers_license', label: "Driver's Licence" },
  { value: 'passport', label: 'Passport' },
];
const STEPS = [
  { num: 1, label: 'Personal Info', icon: User },
  { num: 2, label: 'Identity', icon: CreditCard },
  { num: 3, label: 'Selfie', icon: Camera },
  { num: 4, label: 'Review', icon: FileCheck },
];

interface KycFormData {
  legalName: string;
  dob: string;
  stateOfOrigin: string;
  trades: string[];
  yearsExperience: string;
  certifications: string[];
  docType: string;
  nin: string;
  documentFile: File | null;
  selfieCaptured: boolean;
  acknowledge: boolean;
}

export default function Kyc() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [certInput, setCertInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [selfieState, setSelfieState] = useState<'idle' | 'countdown' | 'captured' | 'verifying' | 'matched'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<KycFormData>({
    legalName: '',
    dob: '',
    stateOfOrigin: '',
    trades: [],
    yearsExperience: '',
    certifications: [],
    docType: 'nin',
    nin: '',
    documentFile: null,
    selfieCaptured: false,
    acknowledge: false,
  });

  // Redirect if not technician
  useEffect(() => {
    if (user && user.role !== 'technician') {
      addToast({ type: 'warning', title: 'Technicians only', message: 'KYC is for technician accounts.' });
      navigate('/');
    }
  }, [user, navigate, addToast]);

  // Countdown animation
  useEffect(() => {
    if (selfieState === 'countdown' && countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (selfieState === 'countdown' && countdown === 0) {
      setSelfieState('captured');
      setFormData((d) => ({ ...d, selfieCaptured: true }));
    }
  }, [selfieState, countdown]);

  // Liveness check simulation
  useEffect(() => {
    if (selfieState === 'verifying') {
      setLivenessProgress(0);
      const interval = setInterval(() => {
        setLivenessProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setSelfieState('matched');
            return 100;
          }
          return p + 4;
        });
      }, 60);
      return () => clearInterval(interval);
    }
  }, [selfieState]);

  const update = (field: keyof KycFormData, value: any) => {
    setFormData((d) => ({ ...d, [field]: value }));
  };

  const toggleTrade = (trade: string) => {
    setFormData((d) => {
      if (d.trades.includes(trade)) {
        return { ...d, trades: d.trades.filter((t) => t !== trade) };
      }
      if (d.trades.length >= 3) {
        addToast({ type: 'warning', title: 'Max 3 trades', message: 'You can select up to 3 trade categories.' });
        return d;
      }
      return { ...d, trades: [...d.trades, trade] };
    });
  };

  const addCertification = () => {
    if (!certInput.trim()) return;
    update('certifications', [...formData.certifications, certInput.trim()]);
    setCertInput('');
  };

  const removeCert = (cert: string) => {
    update('certifications', formData.certifications.filter((c) => c !== cert));
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      addToast({ type: 'error', title: 'File too large', message: 'Maximum file size is 5MB.' });
      return;
    }
    update('documentFile', file);
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          return 100;
        }
        return p + 10;
      });
    }, 100);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const takeSelfie = () => {
    setSelfieState('countdown');
    setCountdown(3);
  };

  const retakeSelfie = () => {
    setSelfieState('idle');
    setFormData((d) => ({ ...d, selfieCaptured: false }));
  };

  const verifyLiveness = () => {
    setSelfieState('verifying');
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!formData.legalName && !!formData.dob && !!formData.stateOfOrigin && formData.trades.length > 0 && !!formData.yearsExperience;
      case 2:
        return !!formData.nin && validateNin(formData.nin) && !!formData.documentFile;
      case 3:
        return selfieState === 'matched';
      case 4:
        return formData.acknowledge;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await submitKyc({
        user_id: user.id,
        id_type: formData.docType,
        nin_hash: formData.nin,
        id_document_url: formData.documentFile ? `upload://${formData.documentFile.name}` : undefined,
        selfie_url: selfieState === 'matched' ? 'selfie://captured' : undefined,
      });
      addToast({ type: 'success', title: 'KYC submitted', message: 'Your verification is under review.' });
      navigate('/kyc/status');
    } catch {
      addToast({ type: 'error', title: 'Submission failed', message: 'Please try again.' });
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-extrabold text-text">KYC Verification</h1>
          <p className="text-sm text-text-2 mt-1">Get verified to start receiving jobs on SkillBridge</p>
        </div>

        {/* ===== STEP BAR ===== */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => {
              const isActive = step === s.num;
              const isComplete = step > s.num;
              const SIcon = s.icon;
              return (
                <div key={s.num} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        backgroundColor: isComplete ? '#1A6B3C' : isActive ? '#C47A00' : '#1A1A1A',
                        borderColor: isComplete ? '#1A6B3C' : isActive ? '#C47A00' : '#2A2A2A',
                      }}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                        isComplete ? 'text-white' : isActive ? 'text-bg' : 'text-text-3'
                      }`}
                    >
                      {isComplete ? <CheckCircle2 size={18} /> : <SIcon size={18} />}
                    </motion.div>
                    <span className={`text-[10px] sm:text-xs font-medium ${isActive ? 'text-text' : 'text-text-3'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 -mt-5 rounded-full bg-bg-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: step > s.num ? '100%' : '0%' }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-success"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== STEP CONTENT ===== */}
        <AnimatePresence mode="wait">
          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 space-y-5">
                <h2 className="font-display text-lg font-bold text-text">Personal Information</h2>
                <Input
                  label="Legal name"
                  placeholder="Enter your full legal name"
                  value={formData.legalName}
                  onChange={(e) => update('legalName', e.target.value)}
                  icon={<User size={16} />}
                />
                <Input
                  label="Date of birth"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => update('dob', e.target.value)}
                />
                <Input
                  label="State of origin"
                  placeholder="e.g. Lagos State"
                  value={formData.stateOfOrigin}
                  onChange={(e) => update('stateOfOrigin', e.target.value)}
                  icon={<IdCard size={16} />}
                />

                {/* Trade category multi-select */}
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1.5">
                    Trade categories <span className="text-text-3">(up to 3)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TRADE_OPTIONS.map((t) => (
                      <button
                        key={t}
                        onClick={() => toggleTrade(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          formData.trades.includes(t)
                            ? 'gold-gradient text-bg border-primary'
                            : 'bg-bg-3 text-text-2 border-border hover:border-primary/30'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Years of experience"
                  type="number"
                  placeholder="e.g. 5"
                  value={formData.yearsExperience}
                  onChange={(e) => update('yearsExperience', e.target.value)}
                  icon={<Briefcase size={16} />}
                />

                {/* Certifications with tags */}
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1.5">Professional certifications</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. NABTEB Electrical"
                      value={certInput}
                      onChange={(e) => setCertInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCertification(); } }}
                    />
                    <Button variant="outline" size="md" onClick={addCertification}>
                      <Plus size={16} />
                    </Button>
                  </div>
                  {formData.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.certifications.map((cert, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent-mid border border-accent/20"
                        >
                          {cert}
                          <button onClick={() => removeCert(cert)} className="hover:text-power">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* STEP 2: Identity Document */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 space-y-5">
                <h2 className="font-display text-lg font-bold text-text">Identity Document</h2>

                {/* Document type */}
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1.5">Document type</label>
                  <div className="grid grid-cols-1 gap-2">
                    {DOC_TYPES.map((doc) => (
                      <button
                        key={doc.value}
                        onClick={() => update('docType', doc.value)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          formData.docType === doc.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-bg-3 hover:border-primary/30'
                        }`}
                      >
                        <span className="text-sm text-text-2 flex items-center gap-2">
                          <CreditCard size={16} className="text-text-3" />
                          {doc.label}
                        </span>
                        {formData.docType === doc.value && <CheckCircle2 size={16} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* NIN field */}
                <div>
                  <Input
                    label="NIN (11 digits)"
                    placeholder="12345678901"
                    value={formData.nin}
                    onChange={(e) => update('nin', e.target.value.replace(/\D/g, '').slice(0, 11))}
                    icon={<IdCard size={16} />}
                    maxLength={11}
                    error={formData.nin && !validateNin(formData.nin) ? 'NIN must be exactly 11 digits' : undefined}
                  />
                  {formData.nin && validateNin(formData.nin) && (
                    <p className="mt-1.5 text-sm text-success flex items-center gap-1">
                      <CheckCircle2 size={14} /> Valid NIN format
                    </p>
                  )}
                </div>

                {/* File upload */}
                <div>
                  <label className="block text-sm font-medium text-text-2 mb-1.5">Upload document</label>
                  {!formData.documentFile ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <Upload size={32} className="text-text-3 mx-auto mb-2" />
                      <p className="text-sm text-text-2 font-medium">Drag & drop or click to upload</p>
                      <p className="text-xs text-text-3 mt-1">JPG, PNG, or PDF · Max 5MB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-bg-3 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileCheck size={22} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">{formData.documentFile.name}</p>
                          <p className="text-xs text-text-3">
                            {(formData.documentFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => { update('documentFile', null); setUploadProgress(0); }}
                          className="p-2 rounded-lg hover:bg-bg text-text-3 hover:text-power"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      {uploading && (
                        <div className="mt-3">
                          <div className="h-1.5 rounded-full bg-bg overflow-hidden">
                            <motion.div
                              animate={{ width: `${uploadProgress}%` }}
                              className="h-full bg-primary"
                            />
                          </div>
                          <p className="text-xs text-text-3 mt-1">Uploading... {uploadProgress}%</p>
                        </div>
                      )}
                      {uploadProgress === 100 && !uploading && (
                        <p className="text-xs text-success flex items-center gap-1 mt-2">
                          <CheckCircle2 size={12} /> Upload complete
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* FAQ expandable */}
                <div className="rounded-lg bg-bg-3 border border-border">
                  <button
                    onClick={() => setShowFaq(!showFaq)}
                    className="w-full flex items-center justify-between p-3 text-sm text-text-2"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle size={16} className="text-text-3" />
                      Why do we need this?
                    </span>
                    <ChevronDown size={16} className={`transition-transform ${showFaq ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showFaq && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="px-3 pb-3 text-sm text-text-3 leading-relaxed">
                          We verify your identity to protect both technicians and clients on SkillBridge.
                          Your documents are encrypted and never shared with third parties. Verification
                          typically takes 24 hours.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          )}

          {/* STEP 3: Live Selfie */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 space-y-5">
                <h2 className="font-display text-lg font-bold text-text">Live Selfie</h2>

                {/* Camera preview / captured state */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-bg-3 border-2 border-border flex items-center justify-center">
                  {selfieState === 'idle' && (
                    <div className="text-center">
                      <Camera size={48} className="text-text-3 mx-auto mb-2" />
                      <p className="text-sm text-text-2">Position your face in the frame</p>
                      <p className="text-xs text-text-3 mt-1">Ensure good lighting</p>
                    </div>
                  )}

                  {selfieState === 'countdown' && (
                    <div className="text-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={countdown}
                          initial={{ scale: 2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          className="font-display text-7xl font-extrabold text-primary"
                        >
                          {countdown === 0 ? '📸' : countdown}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  )}

                  {selfieState === 'captured' && (
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 size={40} className="text-success" />
                      </div>
                      <p className="text-sm font-medium text-text">Selfie captured!</p>
                    </div>
                  )}

                  {selfieState === 'verifying' && (
                    <div className="text-center w-full px-6">
                      <Loader2 size={40} className="text-primary mx-auto mb-3 animate-spin" />
                      <p className="text-sm font-medium text-text mb-3">Verifying face match...</p>
                      <div className="h-2 rounded-full bg-bg overflow-hidden max-w-xs mx-auto">
                        <motion.div
                          animate={{ width: `${livenessProgress}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                      <p className="text-xs text-text-3 mt-2">{livenessProgress}%</p>
                    </div>
                  )}

                  {selfieState === 'matched' && (
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-2"
                      >
                        <ShieldCheck size={44} className="text-success" />
                      </motion.div>
                      <p className="text-sm font-bold text-success">Match confirmed!</p>
                    </div>
                  )}
                </div>

                {/* Side-by-side comparison */}
                {(selfieState === 'captured' || selfieState === 'verifying' || selfieState === 'matched') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-text-3 mb-1.5 text-center">ID Photo</p>
                      <div className="aspect-square rounded-xl bg-bg-3 border border-border flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 backdrop-blur-md bg-bg-3/50" />
                        <IdCard size={32} className="text-text-3" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-text-3 mb-1.5 text-center">Selfie</p>
                      <div className="aspect-square rounded-xl bg-success/10 border border-success/30 flex items-center justify-center">
                        <Camera size={32} className="text-success" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  {selfieState === 'idle' && (
                    <Button fullWidth size="lg" onClick={takeSelfie}>
                      <Camera size={18} /> Take selfie
                    </Button>
                  )}
                  {selfieState === 'captured' && (
                    <>
                      <Button variant="outline" fullWidth onClick={retakeSelfie}>
                        <X size={16} /> Retake
                      </Button>
                      <Button fullWidth onClick={verifyLiveness}>
                        <ShieldCheck size={16} /> Verify liveness
                      </Button>
                    </>
                  )}
                  {selfieState === 'matched' && (
                    <Button variant="outline" fullWidth onClick={retakeSelfie}>
                      <X size={16} /> Retake selfie
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* STEP 4: Review & Submit */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 space-y-5">
                <h2 className="font-display text-lg font-bold text-text">Review & Submit</h2>

                {/* Summary card */}
                <div className="space-y-3">
                  {/* Step 1 summary */}
                  <div className="rounded-lg bg-bg-3 border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-success" />
                      <span className="text-sm font-semibold text-text">Personal Info</span>
                    </div>
                    <div className="text-xs text-text-2 space-y-1 pl-6">
                      <p>Name: <span className="text-text">{formData.legalName}</span></p>
                      <p>DOB: <span className="text-text">{formData.dob}</span></p>
                      <p>State: <span className="text-text">{formData.stateOfOrigin}</span></p>
                      <p>Trades: <span className="text-text">{formData.trades.join(', ')}</span></p>
                      <p>Experience: <span className="text-text">{formData.yearsExperience} years</span></p>
                      {formData.certifications.length > 0 && (
                        <p>Certs: <span className="text-text">{formData.certifications.join(', ')}</span></p>
                      )}
                    </div>
                  </div>

                  {/* Step 2 summary */}
                  <div className="rounded-lg bg-bg-3 border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-success" />
                      <span className="text-sm font-semibold text-text">Identity Document</span>
                    </div>
                    <div className="text-xs text-text-2 space-y-1 pl-6">
                      <p>Type: <span className="text-text">{DOC_TYPES.find((d) => d.value === formData.docType)?.label}</span></p>
                      <p>NIN: <span className="text-text">{formData.nin.slice(0, 5)}****{formData.nin.slice(-2)}</span></p>
                      <p>Document: <span className="text-text">{formData.documentFile?.name || 'Not uploaded'}</span></p>
                    </div>
                  </div>

                  {/* Step 3 summary */}
                  <div className="rounded-lg bg-bg-3 border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-success" />
                      <span className="text-sm font-semibold text-text">Live Selfie</span>
                    </div>
                    <div className="text-xs text-text-2 space-y-1 pl-6">
                      <p>Status: <span className="text-success">Face match confirmed</span></p>
                    </div>
                  </div>
                </div>

                {/* Legal acknowledgement */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acknowledge}
                    onChange={(e) => update('acknowledge', e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-border accent-primary shrink-0"
                  />
                  <span className="text-sm text-text-2 leading-relaxed">
                    I confirm that all information provided is true and accurate. I understand that
                    providing false information may result in account suspension and legal action.
                  </span>
                </label>

                {/* What happens next */}
                <div className="rounded-lg bg-accent/5 border border-accent/20 p-4">
                  <p className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                    <Sparkles size={16} className="text-accent-mid" /> What happens next
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { icon: FileCheck, label: 'Submit your application', desc: 'We receive your details' },
                      { icon: Clock, label: '24-hour review', desc: 'Our team verifies your documents' },
                      { icon: Bell, label: 'SMS notification', desc: "You'll be notified of the result" },
                      { icon: Briefcase, label: 'Start working', desc: 'Receive jobs once approved' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <item.icon size={14} className="text-accent-mid" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-text">{item.label}</p>
                          <p className="text-[11px] text-text-3">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  fullWidth
                  size="lg"
                  loading={submitting}
                  disabled={!formData.acknowledge}
                  onClick={handleSubmit}
                >
                  <ShieldCheck size={18} /> Submit for verification
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== NAVIGATION BUTTONS ===== */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <Button variant="outline" fullWidth onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft size={16} /> Back
            </Button>
          )}
          {step < 4 && (
            <Button fullWidth disabled={!canProceed()} onClick={() => setStep((s) => s + 1)}>
              Continue <ChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
