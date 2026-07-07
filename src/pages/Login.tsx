import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Login() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await login(phone, password);
    if (success) {
      addToast({ type: 'success', title: 'Welcome back!' });
      navigate('/');
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  const fillDemo = (demoPhone: string, demoPass: string) => {
    setPhone(demoPhone);
    setPassword(demoPass);
  };

  const demoCreds = [
    { role: 'Client', phone: '08011111111', pass: 'client123' },
    { role: 'Technician', phone: '08022222222', pass: 'tech123' },
    { role: 'Admin', phone: '08000000000', pass: 'admin123' },
    { role: 'Store', phone: '08066666666', pass: 'store123' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-md ${shake ? 'animate-shake' : ''}`}
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="font-display font-extrabold text-2xl">
              <span className="text-primary-mid">Skill</span>
              <span className="text-text">Bridge</span>
            </span>
          </Link>
        </div>

        <div className="bg-bg-2 border border-border rounded-2xl p-8">
          <h1 className="font-display text-2xl font-extrabold text-primary-mid mb-1">
            Welcome back
          </h1>
          <p className="text-text-2 text-sm mb-6">Sign in to your SkillBridge account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Phone number"
              type="tel"
              placeholder="08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone size={18} />}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} />}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-3 hover:text-text"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              required
            />

            <div className="flex justify-end">
              <button type="button" className="text-sm text-text-3 hover:text-primary-mid">
                Forgot password?
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-power bg-power/10 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" fullWidth size="lg" loading={isLoading}>
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-text-2 mt-6">
            Don't have an account?{' '}
            <Link to="/auth/register" className="text-primary-mid font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="mt-4">
          <button
            onClick={() => setShowDemo(!showDemo)}
            className="w-full flex items-center justify-between px-4 py-3 bg-bg-2 border border-border rounded-xl text-sm text-text-2 hover:text-text transition-colors"
          >
            <span>Demo credentials</span>
            <ChevronDown size={16} className={`transition-transform ${showDemo ? 'rotate-180' : ''}`} />
          </button>
          {showDemo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 bg-bg-2 border border-border rounded-xl overflow-hidden"
            >
              {demoCreds.map((cred) => (
                <button
                  key={cred.role}
                  onClick={() => fillDemo(cred.phone, cred.pass)}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-bg-3 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-text">{cred.role}</span>
                  <span className="text-xs text-text-3 font-mono">{cred.phone} / {cred.pass}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
