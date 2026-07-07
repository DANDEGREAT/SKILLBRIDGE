import { formatDistanceToNow, format } from 'date-fns';

export function formatNaira(amount: number): string {
  return '\u20A6' + amount.toLocaleString('en-NG');
}

export function formatNairaShort(amount: number): string {
  if (amount >= 1000000) return '\u20A6' + (amount / 1000000).toFixed(1) + 'M';
  if (amount >= 1000) return '\u20A6' + (amount / 1000).toFixed(0) + 'K';
  return '\u20A6' + amount.toString();
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date: string | Date, fmt: string = 'dd MMM yyyy'): string {
  return format(new Date(date), fmt);
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm');
}

export function getInitials(firstName: string, lastName: string): string {
  return (firstName[0] || '') + (lastName[0] || '');
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-primary', 'bg-accent', 'bg-success', 'bg-power',
    'bg-primary-mid', 'bg-accent-mid',
  ];
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function generateId(prefix: string = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function generatePaymentRef(): string {
  return 'SB-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  return phone.slice(0, 4) + '****' + phone.slice(-3);
}

export function maskNin(nin: string): string {
  if (nin.length < 6) return nin;
  return nin.slice(0, 5) + '****' + nin.slice(-2);
}

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function passwordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['#B22222', '#B22222', '#E8960A', '#1A6B3C', '#1A6B3C'];
  const idx = Math.min(score, 4);
  return { score: idx, label: labels[idx], color: colors[idx] };
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  return /^0[789]\d{9}$/.test(cleaned);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateNin(nin: string): boolean {
  return /^\d{11}$/.test(nin);
}

export function tradeIcon(trade: string): string {
  const map: Record<string, string> = {
    'Electrician': 'Zap',
    'Plumber': 'Droplet',
    'AC & Cooling': 'Wind',
    'Carpenter': 'Hammer',
    'Painter': 'Paintbrush',
    'Mason': 'Building2',
    'Electronics': 'Cpu',
    'Moving': 'Truck',
  };
  return map[trade] || 'Wrench';
}

export const TRADES = [
  'Electrician', 'Plumber', 'AC & Cooling', 'Carpenter',
  'Painter', 'Mason', 'Electronics', 'Moving',
];

export const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan'];

export function distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
