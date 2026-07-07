import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Wrench, Store, Eye, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { validatePhone, passwordStrength, TRADES } from '../lib/utils';

const accountTypes = [
  { value: 'client', label: 'Client', desc: 'Post jobs and hire technicians', icon: Home },
  { value: 'technician', label: 'Technician', desc: 'Get verified and start bidding', icon: Wrench },
  { value: 'store_owner', label: 'Store Owner', desc: 'Supply materials to jobs', icon: Store },
  { value: 'browsing', label: "I'm browsing", desc: 'Just looking around', icon: Eye },
];

export default function Register() {
  const { register, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState('');
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', email: '',
    password: '', confirm_password: '', trade: 'Electrician',
    years_experience: 1, hourly_rate: 3000, store_name: '',
    store_category: 'Electrical', store_city: 'Lagos',
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  const strength = passwordStrength(form.password);

  const updateForm = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleNext = () => {
    if (step === 0 && !accountType) return;
    if (step === 0 && accountType === 'browsing') { navigate('/'); return; }
    if (step === 1) {
      if (!form.first_name || !form.last_name || !form.phone || !form.password) return;
      if (form.password !== form.confirm_password) { addToast({ type: 'error', title: 'Passwords do not match' }); return; }
      if (!validatePhone(form.phone)) { addToast({ type: 'error', title: 'Invalid phone number', message: 'Use format 08012345678' }); return; }
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);
      addToast({ type: 'info', title: `Demo OTP: ${newOtp}`, message: 'Auto-filling in 1.5s...' });
      setStep(2);
      setTimeout(() => { setOtp(newOtp.split('')); addToast({ type: 'success', title: 'OTP auto-filled (demo)' }); }, 1500);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) { document.getElementById(`otp-${index + 1}`)?.focus(); }
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp === generatedOtp) {
      setOtpVerified(true);
      addToast({ type: 'success', title: 'Phone verified!' });
      setTimeout(async () => {
        const role = accountType === 'browsing' ? 'client' : accountType;
        const success = await register({ ...form, role });
        if (success) { addToast({ type: 'success', title: 'Account created!' }); navigate('/'); }
      }, 1000);
    } else { addToast({ type: 'error', title: 'Invalid OTP. Try again.' }); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-bg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <span className="font-display font-extrabold text-2xl">
              <span className="text-primary-mid">Skill</span><span className="text-text">Bridge</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {[0, 1, 2].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-primary-mid' : 'bg-bg-3'}`} />
          ))}
        </div>

        <div className="bg-bg-2 border border-border rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-display text-2xl font-extrabold text-primary-mid mb-1">Create your account</h1>
                <p className="text-text-2 text-sm mb-6">Choose your account type</p>
                <div className="space-y-3">
                  {accountTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button key={type.value} onClick={() => setAccountType(type.value)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${accountType === type.value ? 'border-primary bg-primary/10' : 'border-border hover:border-border-2 hover:bg-bg-3'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accountType === type.value ? 'bg-primary text-bg' : 'bg-bg-3 text-text-2'}`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-text">{type.label}</p>
                          <p className="text-xs text-text-2">{type.desc}</p>
                        </div>
                        {accountType === type.value && <Check size={20} className="text-primary-mid" />}
                      </button>
                    );
                  })}
                </div>
                <Button fullWidth size="lg" className="mt-6" onClick={handleNext} disabled={!accountType}>
                  Continue <ArrowRight size={18} />
                </Button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="font-display text-2xl font-extrabold text-primary-mid mb-1">Your details</h1>
                <p className="text-text-2 text-sm mb-6">Tell us about yourself</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="First name" placeholder="John" value={form.first_name} onChange={(e) => updateForm('first_name', e.target.value)} />
                    <Input label="Last name" placeholder="Doe" value={form.last_name} onChange={(e) => updateForm('last_name', e.target.value)} />
                  </div>
                  <Input label="Phone number" type="tel" placeholder="08012345678" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
                  <Input label="Email (optional)" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
                  <div>
                    <Input label="Password" type="password" placeholder="Create a password" value={form.password} onChange={(e) => updateForm('password', e.target.value)} />
                    {form.password && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-bg-3 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${(strength.score / 4) * 100}%`, background: strength.color }} />
                        </div>
                        <span className="text-xs" style={{ color: strength.color }}>{strength.label}</span>
                      </div>
                    )}
                  </div>
                  <Input label="Confirm password" type="password" placeholder="Re-enter password" value={form.confirm_password} onChange={(e) => updateForm('confirm_password', e.target.value)} />
                  {accountType === 'technician' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-2 mb-1.5">Trade</label>
                        <select className="input-base" value={form.trade} onChange={(e) => updateForm('trade', e.target.value)}>
                          {TRADES.map((t) => (<option key={t} value={t}>{t}</option>))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="Years of experience" type="number" min="0" value={form.years_experience} onChange={(e) => updateForm('years_experience', parseInt(e.target.value) || 0)} />
                        <Input label="Hourly rate" type="number" min="0" value={form.hourly_rate} onChange={(e) => updateForm('hourly_rate', parseInt(e.target.value) || 0)} />
                      </div>
                    </>
                  )}
                  {accountType === 'store_owner' && (
                    <>
                      <Input label="Store name" placeholder="My Shop" value={form.store_name} onChange={(e) => updateForm('store_name', e.target.value)} />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-text-2 mb-1.5">Category</label>
                          <select className="input-base" value={form.store_category} onChange={(e) => updateForm('store_category', e.target.value)}>
                            <option>Electrical</option><option>Plumbing</option><option>Hardware</option><option>Carpentry</option><option>Paint</option>
                          </select>
                        </div>
                        <Input label="City" value={form.store_city} onChange={(e) => updateForm('store_city', e.target.value)} />
                      </div>
                    </>
                  )}
                </div>
                {error && <p className="mt-4 text-sm text-power bg-power/10 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex gap-3 mt-6">
                  <Button variant="ghost" onClick={() => setStep(0)}><ArrowLeft size={18} /> Back</Button>
                  <Button fullWidth onClick={handleNext}>Continue <ArrowRight size={18} /></Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
                {otpVerified ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="py-8">
                    <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                      <Check size={40} className="text-success" />
                    </div>
                    <h1 className="font-display text-2xl font-extrabold text-success mb-2">Verified!</h1>
                    <p className="text-text-2 text-sm">Creating your account...</p>
                  </motion.div>
                ) : (
                  <>
                    <h1 className="font-display text-2xl font-extrabold text-primary-mid mb-1">Verify your phone</h1>
                    <p className="text-text-2 text-sm mb-6">Enter the 6-digit code sent to {form.phone}</p>
                    <div className="flex gap-2 justify-center mb-6">
                      {otp.map((digit, i) => (
                        <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          className="w-12 h-14 text-center text-xl font-bold bg-bg-3 border-2 border-border rounded-xl text-text focus:border-primary outline-none transition-colors" />
                      ))}
                    </div>
                    <p className="text-sm text-text-3 mb-6">Resend OTP in 60s</p>
                    <Button fullWidth size="lg" onClick={handleVerify} loading={isLoading}>Verify & Create Account</Button>
                    <button onClick={() => setStep(1)} className="mt-4 text-sm text-text-3 hover:text-text">
                      <ArrowLeft size={16} className="inline mr-1" /> Back
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-sm text-text-2 mt-6">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-primary-mid font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
