import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Package, BarChart3, Zap,
  TrendingUp, Plus, Trash2, Pencil, X, Check, MapPin, Clock,
  DollarSign, Star, Send,
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { getShops, getJobs } from '../lib/api';
import type { Shop, Job } from '../lib/types';
import { formatNaira, formatNairaShort, timeAgo, getGreeting } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';

type Tab = 'overview' | 'quotes' | 'products' | 'analytics';

const NAV_ITEMS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'quotes', label: 'Quote Requests', icon: FileText },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

interface Product {
  id: string;
  name: string;
  category: string;
  priceMin: number;
  priceMax: number;
  available: boolean;
}

interface QuoteItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
}

export default function DashStore() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const [tab, setTab] = useState<Tab>('overview');
  const [shop, setShop] = useState<Shop | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteModalJob, setQuoteModalJob] = useState<Job | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    try {
      const [shops, allJobs] = await Promise.all([
        getShops({}),
        getJobs({}),
      ]);
      const myShop = shops.find((s) => s.owner_id === user.id) || shops[0] || null;
      setShop(myShop);
      setJobs(allJobs.filter((j) => j.status === 'open' || j.status === 'bidding'));
      // Seed demo products
      setProducts([
        { id: 'p1', name: 'Copper Wire (1.5mm)', category: 'Electrical', priceMin: 500, priceMax: 800, available: true },
        { id: 'p2', name: 'PVC Pipe (20mm)', category: 'Plumbing', priceMin: 1200, priceMax: 1800, available: true },
        { id: 'p3', name: 'Circuit Breaker (32A)', category: 'Electrical', priceMin: 3500, priceMax: 5000, available: false },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const quotesSent = shop?.total_quotes || 0;
    const accepted = Math.floor(quotesSent * 0.3);
    const revenue = accepted * 15000;
    const rating = shop?.rating || 0;
    return { quotesSent, accepted, revenue, rating };
  }, [shop]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <Skeleton className="h-96" />
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 p-4 sm:p-6">
        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className="w-9 h-9 gold-gradient rounded-xl flex items-center justify-center">
              <Zap className="text-bg" size={20} fill="currentColor" />
            </div>
            <span className="font-display text-xl font-bold text-text">SkillBridge</span>
          </div>

          {user && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Avatar firstName={user.first_name} lastName={user.last_name} size="md" online />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text truncate">
                    {shop?.name || `${user.first_name}'s Store`}
                  </p>
                  {shop && (
                    <Badge variant={shop.is_verified ? 'green' : 'gray'} className="mt-1">
                      {shop.is_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  )}
                </div>
              </div>
              {shop && (
                <div className="mt-3 flex items-center gap-2 text-xs text-text-2">
                  <MapPin size={12} /> {shop.city || 'Lagos'}
                </div>
              )}
            </Card>
          )}

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'text-text-2 hover:text-text hover:bg-bg-2 border border-transparent'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {tab === 'overview' && <OverviewTab user={user!} jobs={jobs} stats={stats} onSendQuote={(j: Job) => setQuoteModalJob(j)} />}
              {tab === 'quotes' && <QuotesTab jobs={jobs} onSendQuote={(j: Job) => setQuoteModalJob(j)} />}
              {tab === 'products' && <ProductsTab products={products} setProducts={setProducts} />}
              {tab === 'analytics' && <AnalyticsTab jobs={jobs} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Quote Builder Modal */}
      <Modal open={!!quoteModalJob} onClose={() => setQuoteModalJob(null)} title="Send Quote" size="lg">
        {quoteModalJob && (
          <QuoteBuilder
            job={quoteModalJob}
            onSent={() => {
              setQuoteModalJob(null);
              addToast({ type: 'success', title: 'Quote sent!', message: 'The client will review your quote.' });
            }}
          />
        )}
      </Modal>
    </div>
  );
}

// ============ OVERVIEW TAB ============
function OverviewTab({ user, jobs, stats, onSendQuote }: any) {
  const greeting = getGreeting();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">
          {greeting}, {user.first_name} 👋
        </h1>
        <p className="text-text-2 text-sm mt-1">Here's your store overview for today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Quotes Sent" value={String(stats.quotesSent)} color="primary" />
        <StatCard icon={Check} label="Accepted" value={String(stats.accepted)} color="success" />
        <StatCard icon={DollarSign} label="Revenue" value={formatNairaShort(stats.revenue)} color="amber" />
        <StatCard icon={Star} label="Rating" value={stats.rating > 0 ? stats.rating.toFixed(1) : '—'} color="accent" />
      </div>

      {/* Active Quote Requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-bold text-text">Active Quote Requests</h3>
          <Badge variant="gold">{jobs.length} open</Badge>
        </div>
        <div className="space-y-3">
          {jobs.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-text-2 text-sm">No open quote requests right now.</p>
            </Card>
          ) : (
            jobs.slice(0, 4).map((job: Job) => (
              <Card key={job.id} hover className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-text">{job.title}</p>
                      {job.is_urgent && <Badge variant="red">Urgent</Badge>}
                    </div>
                    <p className="text-xs text-text-2 mt-1 flex items-center gap-1">
                      <MapPin size={12} /> {job.location_text || 'Location TBD'}
                    </p>
                    <p className="text-xs text-text-3 mt-1 flex items-center gap-1">
                      <Clock size={12} /> {timeAgo(job.created_at)}
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => onSendQuote(job)}>Send Quote</Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="p-5">
        <h3 className="font-display text-base font-bold text-text mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {jobs.slice(0, 5).map((job: Job) => (
            <div key={job.id} className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-bg-3 flex items-center justify-center">
                <FileText className="text-text-2" size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text truncate">{job.title}</p>
                <p className="text-xs text-text-3">{timeAgo(job.created_at)}</p>
              </div>
              <Badge variant="gray">{job.status}</Badge>
            </div>
          ))}
          {jobs.length === 0 && <p className="text-text-2 text-sm text-center py-4">No recent activity.</p>}
        </div>
      </Card>
    </div>
  );
}

// ============ QUOTES TAB ============
function QuotesTab({ jobs, onSendQuote }: { jobs: Job[]; onSendQuote: (j: Job) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-text">Quote Requests</h2>
      <p className="text-text-2 text-sm">Jobs where your store has been invited to send a quote.</p>

      <div className="space-y-3">
        {jobs.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="text-text-3 mx-auto mb-3" size={32} />
            <p className="text-text-2 text-sm">No quote requests at the moment.</p>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-text">{job.title}</p>
                    {job.is_urgent && <Badge variant="red">Urgent</Badge>}
                  </div>
                  <p className="text-xs text-text-2">{job.description || 'No description provided.'}</p>
                  <div className="flex items-center gap-4 text-xs text-text-3">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {job.location_text || 'TBD'}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(job.created_at)}</span>
                    <span>Budget: {formatNaira(job.budget_min || 0)}</span>
                  </div>
                </div>
                <Button variant="primary" size="sm" onClick={() => onSendQuote(job)}>
                  <Send size={14} /> Send Quote
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ============ PRODUCTS TAB ============
function ProductsTab({ products, setProducts }: { products: Product[]; setProducts: (p: Product[]) => void }) {
  const { addToast } = useUIStore();
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    setProducts(products.filter((p) => p.id !== id));
    addToast({ type: 'success', title: 'Product deleted' });
  }

  function handleSave(p: Product) {
    if (editing) {
      setProducts(products.map((x) => (x.id === p.id ? p : x)));
    } else {
      setProducts([...products, { ...p, id: 'p' + Date.now() }]);
    }
    setModalOpen(false);
    addToast({ type: 'success', title: editing ? 'Product updated' : 'Product added' });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-text">Products</h2>
        <Button variant="primary" size="sm" onClick={openAdd}>
          <Plus size={16} /> Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text truncate">{p.name}</p>
                <Badge variant="gray" className="mt-1">{p.category}</Badge>
                <p className="text-xs text-text-2 mt-2">
                  {formatNaira(p.priceMin)} – {formatNaira(p.priceMax)}
                </p>
                <div className="mt-2">
                  <Badge variant={p.available ? 'green' : 'red'}>
                    {p.available ? 'Available' : 'Out of stock'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-bg-3 text-text-3 hover:text-text">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-bg-3 text-text-3 hover:text-power">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        <ProductForm initial={editing} onSave={handleSave} />
      </Modal>
    </div>
  );
}

function ProductForm({ initial, onSave }: { initial: Product | null; onSave: (p: Product) => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [category, setCategory] = useState(initial?.category || 'Electrical');
  const [priceMin, setPriceMin] = useState(String(initial?.priceMin || ''));
  const [priceMax, setPriceMax] = useState(String(initial?.priceMax || ''));
  const [available, setAvailable] = useState(initial?.available ?? true);

  return (
    <div className="space-y-4">
      <Input label="Product Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Copper Wire" />
      <div>
        <label className="block text-sm font-medium text-text-2 mb-1.5">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-base">
          {['Electrical', 'Plumbing', 'Carpentry', 'Paint', 'Tools', 'Other'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Min Price (₦)" type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
        <Input label="Max Price (₦)" type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
        <span className="text-sm text-text-2">Available</span>
      </label>
      <Button
        variant="primary"
        fullWidth
        onClick={() => onSave({
          id: initial?.id || '',
          name,
          category,
          priceMin: Number(priceMin) || 0,
          priceMax: Number(priceMax) || 0,
          available,
        })}
      >
        {initial ? 'Update' : 'Add'} Product
      </Button>
    </div>
  );
}

// ============ ANALYTICS TAB ============
function AnalyticsTab({ jobs }: { jobs: Job[] }) {
  const revenueData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const total = Math.floor(Math.random() * 50000) + 5000;
      days.push({ day: d.toLocaleDateString('en', { weekday: 'short' }), amount: total });
    }
    return days;
  }, []);

  const tradeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    jobs.forEach((j) => { map[j.trade] = (map[j.trade] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [jobs]);

  const cityCounts = useMemo(() => {
    const map: Record<string, number> = {};
    jobs.forEach((j) => {
      const c = j.location_text?.split(',').pop()?.trim() || 'Unknown';
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [jobs]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-text">Analytics</h2>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-bold text-text">Revenue (7 days)</h3>
          <TrendingUp className="text-success" size={18} />
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
          {revenueData.map((d, i) => {
            const max = Math.max(...revenueData.map((x) => x.amount));
            const h = (d.amount / max) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex-1 flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className="w-full rounded-t-md teal-gradient"
                  />
                </div>
                <span className="text-xs text-text-3">{d.day}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-display text-base font-bold text-text mb-4">Top Requesting Trades</h3>
          <div className="space-y-3">
            {tradeCounts.length === 0 ? (
              <p className="text-text-2 text-sm text-center py-4">No data yet.</p>
            ) : (
              tradeCounts.map(([trade, count], i) => {
                const max = tradeCounts[0][1];
                return (
                  <div key={trade} className="flex items-center gap-3">
                    <span className="text-xs text-text-2 w-6">#{i + 1}</span>
                    <span className="text-sm text-text flex-1">{trade}</span>
                    <div className="w-24 h-2 rounded-full bg-bg-3 overflow-hidden">
                      <div className="h-full gold-gradient rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <span className="text-xs text-text-3 w-6 text-right">{count}</span>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-base font-bold text-text mb-4">City Breakdown</h3>
          <div className="space-y-3">
            {cityCounts.length === 0 ? (
              <p className="text-text-2 text-sm text-center py-4">No data yet.</p>
            ) : (
              cityCounts.map(([city, count]) => {
                const max = cityCounts[0][1];
                return (
                  <div key={city} className="flex items-center gap-3">
                    <MapPin className="text-text-3" size={14} />
                    <span className="text-sm text-text flex-1">{city}</span>
                    <div className="w-24 h-2 rounded-full bg-bg-3 overflow-hidden">
                      <div className="h-full teal-gradient rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <span className="text-xs text-text-3 w-6 text-right">{count}</span>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============ QUOTE BUILDER ============
function QuoteBuilder({ job, onSent }: { job: Job; onSent: () => void }) {
  const { addToast } = useUIStore();
  const [items, setItems] = useState<QuoteItem[]>([
    { id: '1', name: '', unit: 'pcs', qty: 1, unitPrice: 0 },
  ]);
  const [deliveryFee, setDeliveryFee] = useState('');

  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const total = subtotal + (Number(deliveryFee) || 0);

  function addItem() {
    setItems([...items, { id: String(Date.now()), name: '', unit: 'pcs', qty: 1, unitPrice: 0 }]);
  }

  function updateItem(id: string, field: keyof QuoteItem, value: any) {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  function removeItem(id: string) {
    setItems(items.filter((i) => i.id !== id));
  }

  function handleSend() {
    if (items.length === 0 || !items[0].name) {
      addToast({ type: 'warning', title: 'Add at least one item' });
      return;
    }
    onSent();
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-bg-3">
        <p className="text-sm font-semibold text-text">{job.title}</p>
        <p className="text-xs text-text-2 mt-1">{job.location_text || 'Location TBD'} • Budget: {formatNaira(job.budget_min || 0)}</p>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 text-xs text-text-3 font-medium px-1">
          <div className="col-span-4">Item Name</div>
          <div className="col-span-2">Unit</div>
          <div className="col-span-2">Qty</div>
          <div className="col-span-3">Unit Price</div>
          <div className="col-span-1"></div>
        </div>
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
            <input className="col-span-4 input-base !py-1.5 !text-sm" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} placeholder="Item name" />
            <select className="col-span-2 input-base !py-1.5 !text-sm" value={item.unit} onChange={(e) => updateItem(item.id, 'unit', e.target.value)}>
              {['pcs', 'm', 'kg', 'box', 'set', 'roll'].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <input className="col-span-2 input-base !py-1.5 !text-sm" type="number" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))} />
            <input className="col-span-3 input-base !py-1.5 !text-sm" type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))} placeholder="₦" />
            <button onClick={() => removeItem(item.id)} className="col-span-1 p-1.5 rounded-lg hover:bg-bg-3 text-text-3 hover:text-power"><X size={14} /></button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addItem}><Plus size={14} /> Add Item</Button>

      <div className="space-y-2 p-4 rounded-xl bg-bg-3">
        <div className="flex justify-between text-sm"><span className="text-text-2">Subtotal</span><span className="text-text font-medium">{formatNaira(subtotal)}</span></div>
        <div className="flex justify-between items-center text-sm"><span className="text-text-2">Delivery Fee</span><input className="input-base !py-1 !text-sm w-32 text-right" type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} placeholder="₦0" /></div>
        <div className="flex justify-between text-base font-bold pt-2 border-t border-border"><span className="text-text">Total</span><span className="text-primary">{formatNaira(total)}</span></div>
      </div>

      <Button variant="primary" fullWidth onClick={handleSend}><Send size={16} /> Send Quote</Button>
    </div>
  );
}

// ============ STAT CARD ============
function StatCard({ icon: Icon, label, value, color }: any) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    amber: 'text-amber-500 bg-amber-500/10',
    accent: 'text-accent bg-accent/10',
  };
  return (
    <Card className="p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}><Icon size={20} /></div>
      <p className="text-2xl font-bold text-text font-display">{value}</p>
      <p className="text-xs text-text-3 mt-1">{label}</p>
    </Card>
  );
}
