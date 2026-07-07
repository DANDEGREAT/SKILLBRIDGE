import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Lock, Bell, Eye, HelpCircle, Camera, Upload, Shield,
  Smartphone, Monitor, LogOut, Check, ChevronDown, Trash2,
  Download, MessageSquare, Mail, AlertTriangle, X, Globe,
  Briefcase, Wallet, Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { passwordStrength, validateEmail, CITIES } from '../lib/utils';

type Tab = 'profile' | 'security' | 'notifications' | 'privacy' | 'help';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'privacy', label: 'Privacy', icon: Eye },
  { key: 'help', label: 'Help', icon: HelpCircle },
];

const FAQS = [
  { q: 'How do I verify my account (KYC)?', a: 'Go to the KYC page from your profile and submit your NIN and a selfie. Verification typically takes 24-48 hours.' },
  { q: 'How does escrow payment work?', a: 'When you fund a job, your payment is held securely by SkillBridge. The technician gets paid only after you confirm the job is complete.' },
  { q: 'How do I become a premium technician?', a: 'Visit the Subscribe page to upgrade to Premium or Elite. You get more bids, better visibility, and lower commissions.' },
  { q: 'What if I have a dispute with a client/tech?', a: 'You can raise a dispute from the job page. Our support team mediates and funds remain in escrow until resolution.' },
  { q: 'How do I change my phone number?', a: 'Currently, phone number changes require contacting support. Use the Help tab to reach out.' },
  { q: 'Can I cancel a job after it starts?', a: 'Yes, but cancellation may affect your rating. If the technician hasn\'t started, you can cancel with a full refund from escrow.' },
  { q: 'How are technician ratings calculated?', a: 'Ratings are an average of all verified reviews from clients after job completion.' },
  { q: 'What is the SOS button?', a: 'The SOS button in active jobs sends an alert to SkillBridge support with your location if you feel unsafe during a job.' },
  { q: 'How do I delete my account?', a: 'Go to Privacy tab and request account deletion. There is a 30-day hold period before permanent deletion.' },
  { q: 'Is my payment information secure?', a: 'Yes. All payments are processed through Paystack with 256-bit SSL encryption. We never store your card details.' },
];

const NOTIF_PREFS = [
  { key: 'jobs', label: 'New jobs', desc: 'When new jobs match your trade', icon: Briefcase },
  { key: 'messages', label: 'New messages', desc: 'When you receive a chat message', icon: MessageSquare },
  { key: 'payments', label: 'Payment updates', desc: 'Escrow and payout notifications', icon: Wallet },
  { key: 'kyc', label: 'KYC updates', desc: 'Verification status changes', icon: Shield },
  { key: 'promotions', label: 'Promotions', desc: 'Offers and subscription deals', icon: Sparkles },
];

const SESSIONS = [
  { device: 'Chrome on Windows', location: 'Lagos, NG', active: true, icon: Monitor, current: true },
  { device: 'Safari on iPhone', location: 'Abuja, NG', active: false, icon: Smartphone, current: false, lastActive: '2 hours ago' },
  { device: 'Firefox on Android', location: 'Port Harcourt, NG', active: false, icon: Smartphone, current: false, lastActive: '1 day ago' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const { addToast } = useUIStore();

  const [tab, setTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);

  // Profile form
  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    city: 'Lagos',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security form
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    jobs: true, messages: true, payments: true, kyc: true, promotions: false,
  });
  const [notifChannel, setNotifChannel] = useState<'app' | 'sms'>('app');

  // Privacy
  const [visibility, setVisibility] = useState<'public' | 'clients' | 'verified'>('public');
  const [deleteText, setDeleteText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Help
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [sendingSupport, setSendingSupport] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  // ===== Profile handlers =====
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', title: 'Please upload an image file' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSaveProfile = () => {
    setSaving(true);
    setTimeout(() => {
      updateUser({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
      });
      setSaving(false);
      addToast({ type: 'success', title: 'Profile updated' });
    }, 800);
  };

  // ===== Security handlers =====
  const handleChangePassword = () => {
    setPwError('');
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      setPwError('Please fill in all password fields');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPwError('New passwords do not match');
      return;
    }
    const strength = passwordStrength(passwords.next);
    if (strength.score < 2) {
      setPwError('Password is too weak. Use 8+ chars with numbers and symbols.');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setPasswords({ current: '', next: '', confirm: '' });
      addToast({ type: 'success', title: 'Password changed successfully' });
    }, 800);
  };

  // ===== Notification handlers =====
  const togglePref = (key: string) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ===== Privacy handlers =====
  const handleDeleteAccount = () => {
    if (deleteText !== 'DELETE') {
      addToast({ type: 'warning', title: 'Type "DELETE" to confirm' });
      return;
    }
    setShowDeleteModal(false);
    addToast({
      type: 'info',
      title: 'Account deletion scheduled',
      message: 'Your account will be permanently deleted in 30 days. Contact support to cancel.',
      duration: 6000,
    });
    setTimeout(() => {
      logout();
      navigate('/');
    }, 2000);
  };

  // ===== Help handlers =====
  const handleSendSupport = () => {
    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      addToast({ type: 'warning', title: 'Please fill in subject and message' });
      return;
    }
    setSendingSupport(true);
    setTimeout(() => {
      setSendingSupport(false);
      setSupportForm({ subject: '', message: '' });
      addToast({ type: 'success', title: 'Support request sent', message: 'We\'ll respond within 24 hours.' });
    }, 800);
  };

  const pwStrength = passwords.next ? passwordStrength(passwords.next) : null;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold mb-6">Settings</h1>

        <div className="grid lg:grid-cols-[200px_1fr] gap-6">
          {/* ===== Sidebar tabs ===== */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      active
                        ? 'bg-primary/10 text-primary-mid border border-primary/30'
                        : 'text-text-2 hover:text-text hover:bg-bg-2 border border-transparent'
                    }`}
                  >
                    <Icon size={18} /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===== Content ===== */}
          <div>
            <AnimatePresence mode="wait">
              {/* ===== PROFILE ===== */}
              {tab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Card className="p-5 sm:p-6">
                    <h2 className="font-display text-lg font-bold mb-5">Profile Information</h2>

                    {/* Avatar upload */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-text-2 mb-2">Avatar</label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                          dragging ? 'border-primary bg-primary/5' : 'border-border-2 hover:border-primary/50'
                        }`}
                      >
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                          <Avatar firstName={user.first_name} lastName={user.last_name} size="lg" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text flex items-center gap-1.5">
                            <Upload size={14} /> Drag & drop or click to upload
                          </p>
                          <p className="text-xs text-text-3 mt-0.5">PNG, JPG up to 2MB</p>
                        </div>
                        {avatarPreview && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setAvatarPreview(null); }}
                            className="p-1.5 rounded-lg hover:bg-bg-3 text-text-3"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFile(file);
                        }}
                      />
                    </div>

                    {/* Form fields */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="First Name"
                        value={profile.first_name}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                      />
                      <Input
                        label="Last Name"
                        value={profile.last_name}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                      />
                      <Input
                        label="Phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        icon={<Smartphone size={18} />}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        icon={<Mail size={18} />}
                        error={profile.email && !validateEmail(profile.email) ? 'Invalid email' : undefined}
                      />
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-text-2 mb-1.5">City</label>
                        <select
                          value={profile.city}
                          onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                          className="input-base cursor-pointer"
                        >
                          {CITIES.map((c) => (
                            <option key={c} value={c} className="bg-bg-2">{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <Button className="mt-5" loading={saving} onClick={handleSaveProfile}>
                      <Check size={16} /> Save Changes
                    </Button>
                  </Card>
                </motion.div>
              )}

              {/* ===== SECURITY ===== */}
              {tab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                  <Card className="p-5 sm:p-6">
                    <h2 className="font-display text-lg font-bold mb-1">Change Password</h2>
                    <p className="text-sm text-text-3 mb-5">Use a strong, unique password</p>

                    <div className="space-y-4">
                      <Input
                        label="Current Password"
                        type="password"
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        icon={<Lock size={18} />}
                      />
                      <Input
                        label="New Password"
                        type="password"
                        value={passwords.next}
                        onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                        icon={<Lock size={18} />}
                      />
                      {pwStrength && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-bg-3 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all"
                              style={{ width: `${(pwStrength.score / 4) * 100}%`, backgroundColor: pwStrength.color }}
                            />
                          </div>
                          <span className="text-xs font-medium" style={{ color: pwStrength.color }}>
                            {pwStrength.label}
                          </span>
                        </div>
                      )}
                      <Input
                        label="Confirm New Password"
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        icon={<Lock size={18} />}
                        error={pwError || undefined}
                      />
                    </div>

                    <Button className="mt-5" loading={saving} onClick={handleChangePassword}>
                      Update Password
                    </Button>
                  </Card>

                  {/* Active sessions */}
                  <Card className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-display text-lg font-bold">Active Sessions</h2>
                      <Badge variant="gray">{SESSIONS.length} devices</Badge>
                    </div>
                    <div className="space-y-3">
                      {SESSIONS.map((s, i) => {
                        const Icon = s.icon;
                        return (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bg-3">
                            <div className="w-10 h-10 rounded-xl bg-bg-4 flex items-center justify-center shrink-0">
                              <Icon size={18} className="text-text-2" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text">
                                {s.device} {s.current && <span className="text-xs text-success">(this device)</span>}
                              </p>
                              <p className="text-xs text-text-3">
                                {s.location} · {s.active ? 'Active now' : `Last active ${s.lastActive}`}
                              </p>
                            </div>
                            {s.active ? (
                              <span className="w-2 h-2 rounded-full bg-success online-pulse" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-text-3" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <Button variant="danger" className="mt-4" onClick={() => addToast({ type: 'info', title: 'Logged out of all other devices' })}>
                      <LogOut size={16} /> Logout all devices
                    </Button>
                  </Card>
                </motion.div>
              )}

              {/* ===== NOTIFICATIONS ===== */}
              {tab === 'notifications' && (
                <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Card className="p-5 sm:p-6">
                    <h2 className="font-display text-lg font-bold mb-1">Notification Preferences</h2>
                    <p className="text-sm text-text-3 mb-5">Choose what you want to be notified about</p>

                    {/* Channel preference */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-text-2 mb-2">Delivery Method</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setNotifChannel('app')}
                          className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                            notifChannel === 'app'
                              ? 'border-primary bg-primary/10 text-primary-mid'
                              : 'border-border bg-bg-3 text-text-2'
                          }`}
                        >
                          <Smartphone size={18} /> In-App
                        </button>
                        <button
                          onClick={() => setNotifChannel('sms')}
                          className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                            notifChannel === 'sms'
                              ? 'border-primary bg-primary/10 text-primary-mid'
                              : 'border-border bg-bg-3 text-text-2'
                          }`}
                        >
                          <MessageSquare size={18} /> SMS
                        </button>
                      </div>
                    </div>

                    {/* Toggle grid */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      {NOTIF_PREFS.map((pref) => {
                        const Icon = pref.icon;
                        const enabled = notifPrefs[pref.key];
                        return (
                          <div
                            key={pref.key}
                            className={`p-4 rounded-xl border transition-all ${
                              enabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-bg-3'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                  enabled ? 'bg-primary/15 text-primary-mid' : 'bg-bg-4 text-text-3'
                                }`}>
                                  <Icon size={18} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-text">{pref.label}</p>
                                  <p className="text-xs text-text-3">{pref.desc}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => togglePref(pref.key)}
                                className={`relative w-10 h-6 rounded-full transition-all shrink-0 ${
                                  enabled ? 'bg-primary' : 'bg-bg-4'
                                }`}
                              >
                                <motion.div
                                  layout
                                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                                  animate={{ left: enabled ? 'calc(100% - 22px)' : '2px' }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Button className="mt-5" onClick={() => addToast({ type: 'success', title: 'Preferences saved' })}>
                      <Check size={16} /> Save Preferences
                    </Button>
                  </Card>
                </motion.div>
              )}

              {/* ===== PRIVACY ===== */}
              {tab === 'privacy' && (
                <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                  <Card className="p-5 sm:p-6">
                    <h2 className="font-display text-lg font-bold mb-1">Profile Visibility</h2>
                    <p className="text-sm text-text-3 mb-5">Who can see your profile</p>
                    <div className="space-y-3">
                      {[
                        { key: 'public', label: 'Public', desc: 'Anyone can view your profile', icon: Globe },
                        { key: 'clients', label: 'Clients only', desc: 'Only registered clients can view', icon: User },
                        { key: 'verified', label: 'Verified clients only', desc: 'Only KYC-verified clients', icon: Shield },
                      ].map((opt) => {
                        const Icon = opt.icon;
                        const active = visibility === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => setVisibility(opt.key as any)}
                            className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                              active ? 'border-primary bg-primary/10' : 'border-border bg-bg-3 hover:border-border-2'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              active ? 'bg-primary/15 text-primary-mid' : 'bg-bg-4 text-text-3'
                            }`}>
                              <Icon size={18} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text">{opt.label}</p>
                              <p className="text-xs text-text-3">{opt.desc}</p>
                            </div>
                            {active && <Check size={18} className="text-primary-mid" />}
                          </button>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Data download */}
                  <Card className="p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                        <Download size={18} className="text-accent-mid" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text mb-1">Download your data</h3>
                        <p className="text-sm text-text-2 mb-3">
                          Request a copy of all your data including profile, jobs, messages, and payments.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => addToast({ type: 'info', title: 'Data download requested', message: 'You\'ll receive an email within 48 hours.' })}>
                          Request Data
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Account deletion */}
                  <Card className="p-5 sm:p-6 border-power/30">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-power/15 flex items-center justify-center shrink-0">
                        <AlertTriangle size={18} className="text-power" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text mb-1">Delete account</h3>
                        <p className="text-sm text-text-2 mb-3">
                          Permanently delete your account and all associated data. This action has a 30-day hold period before it's irreversible.
                        </p>
                        <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                          <Trash2 size={16} /> Delete Account
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* ===== HELP ===== */}
              {tab === 'help' && (
                <motion.div key="help" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                  {/* FAQ accordion */}
                  <Card className="p-5 sm:p-6">
                    <h2 className="font-display text-lg font-bold mb-1">Frequently Asked Questions</h2>
                    <p className="text-sm text-text-3 mb-4">Quick answers to common questions</p>
                    <div className="space-y-2">
                      {FAQS.map((faq, i) => {
                        const open = openFaq === i;
                        return (
                          <div key={i} className="rounded-xl border border-border overflow-hidden">
                            <button
                              onClick={() => setOpenFaq(open ? null : i)}
                              className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-bg-3 transition-colors"
                            >
                              <span className="text-sm font-medium text-text">{faq.q}</span>
                              <ChevronDown
                                size={18}
                                className={`text-text-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                              />
                            </button>
                            <AnimatePresence>
                              {open && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <p className="px-4 pb-4 text-sm text-text-2">{faq.a}</p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Contact support */}
                  <Card className="p-5 sm:p-6">
                    <h2 className="font-display text-lg font-bold mb-1">Contact Support</h2>
                    <p className="text-sm text-text-3 mb-5">Can't find what you're looking for? Send us a message.</p>
                    <div className="space-y-4">
                      <Input
                        label="Subject"
                        placeholder="Briefly describe your issue"
                        value={supportForm.subject}
                        onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                      />
                      <Textarea
                        label="Message"
                        placeholder="Describe your issue in detail..."
                        rows={4}
                        value={supportForm.message}
                        onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                      />
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button loading={sendingSupport} onClick={handleSendSupport}>
                          <Mail size={16} /> Send Message
                        </Button>
                        <Button variant="outline" onClick={() => addToast({ type: 'info', title: 'Live chat coming soon!' })}>
                          <MessageSquare size={16} /> Chat with us
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ===== Delete account modal ===== */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-2 border border-power/30 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-power/15 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-power" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">Delete account?</h3>
                  <p className="text-sm text-text-2">This cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-text-2 mb-4">
                Your account will be scheduled for deletion with a 30-day hold. During this period, you can contact support to cancel. After 30 days, all your data will be permanently removed.
              </p>
              <Input
                label='Type "DELETE" to confirm'
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="DELETE"
                className="font-mono"
              />
              <div className="flex gap-3 mt-5">
                <Button variant="outline" fullWidth onClick={() => { setShowDeleteModal(false); setDeleteText(''); }}>
                  Cancel
                </Button>
                <Button variant="danger" fullWidth disabled={deleteText !== 'DELETE'} onClick={handleDeleteAccount}>
                  <Trash2 size={16} /> Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
