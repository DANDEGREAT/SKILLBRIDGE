import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, MapPin, Star, Truck, CheckCircle2, Zap, Droplet, Wind, Hammer,
  Paintbrush, Building2, Package, ChevronRight, Grid3x3, Map as MapIcon, MessageSquare,
} from 'lucide-react';
import { getShops } from '../lib/api';
import type { Shop } from '../lib/types';
import { useUIStore } from '../store/ui';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';

const CATEGORIES = ['All', 'Electrical', 'Plumbing', 'AC & Cooling', 'Hardware', 'Carpentry', 'Paint'];
const CITIES = ['All', 'Lagos', 'Abuja', 'Port Harcourt', 'Kano'];
const DELIVERY_OPTIONS = ['All', 'Delivery available'] as const;
const VERIFIED_OPTIONS = ['All', 'Verified only'] as const;

const categoryIconMap: Record<string, any> = {
  Electrical: Zap, Plumbing: Droplet, 'AC & Cooling': Wind, Hardware: Package,
  Carpentry: Hammer, Paint: Paintbrush,
};

export default function Shops() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [city, setCity] = useState('All');
  const [delivery, setDelivery] = useState<typeof DELIVERY_OPTIONS[number]>('All');
  const [verified, setVerified] = useState<typeof VERIFIED_OPTIONS[number]>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  useEffect(() => {
    let active = true;
    setLoading(true);
    getShops({
      category,
      city,
      deliveryOnly: delivery === 'Delivery available',
      verifiedOnly: verified === 'Verified only',
    }).then((data) => {
      if (active) {
        setShops(data);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [category, city, delivery, verified]);

  // Simulated map pins
  const pins = useMemo(() => {
    return shops.map((s, i) => {
      const seed = s.id.charCodeAt(0) + i;
      return {
        id: s.id,
        x: 10 + ((seed * 37) % 80),
        y: 10 + ((seed * 53) % 70),
        verified: s.is_verified,
      };
    });
  }, [shops]);

  const handleRegisterStore = () => {
    addToast({ type: 'info', title: 'Store registration', message: 'Redirecting to registration...' });
    navigate('/register?role=store_owner');
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* ===== HEADER ===== */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-text flex items-center gap-2">
              <Store size={28} className="text-primary" />
              Material Shops
            </h1>
            <p className="text-sm text-text-2 mt-1">
              Find verified material suppliers near you. Compare prices, request quotes, and get delivery.
            </p>
          </div>
          <Button onClick={handleRegisterStore}>
            <Store size={16} /> Register your store
          </Button>
        </div>

        {/* ===== FILTER BAR ===== */}
        <Card className="p-4 mb-6">
          {/* Category */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">Category</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    category === c
                      ? 'gold-gradient text-bg border-primary'
                      : 'bg-bg-3 text-text-2 border-border hover:border-primary/30'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* City */}
            <div>
              <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">City</p>
              <div className="flex flex-wrap gap-1.5">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      city === c
                        ? 'teal-gradient text-white border-accent'
                        : 'bg-bg-3 text-text-2 border-border hover:border-accent/30'
                    }`}
                  >
                    {c === 'Port Harcourt' ? 'PH' : c}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery */}
            <div>
              <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">Delivery</p>
              <div className="flex gap-1.5">
                {DELIVERY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDelivery(d)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      delivery === d
                        ? 'bg-success/15 text-success border-success/40'
                        : 'bg-bg-3 text-text-2 border-border hover:border-success/30'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Verified */}
            <div>
              <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">Verified</p>
              <div className="flex gap-1.5">
                {VERIFIED_OPTIONS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVerified(v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      verified === v
                        ? 'bg-primary/15 text-primary-mid border-primary/40'
                        : 'bg-bg-3 text-text-2 border-border hover:border-primary/30'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* ===== VIEW TOGGLE + COUNT ===== */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-text-2">
            {loading ? 'Loading...' : `${shops.length} shops found`}
          </p>
          <div className="flex gap-1 p-1 rounded-lg bg-bg-3 border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-bg-2 text-text shadow' : 'text-text-3 hover:text-text'
              }`}
            >
              <Grid3x3 size={14} /> Grid
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'map' ? 'bg-bg-2 text-text shadow' : 'text-text-3 hover:text-text'
              }`}
            >
              <MapIcon size={14} /> Map
            </button>
          </div>
        </div>

        {/* ===== CONTENT ===== */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : shops.length === 0 ? (
          <Card className="p-12 text-center">
            <Store size={40} className="text-text-3 mx-auto mb-3" />
            <p className="text-text-2 font-medium">No shops match your filters</p>
            <p className="text-sm text-text-3 mt-1">Try adjusting category or city</p>
          </Card>
        ) : viewMode === 'grid' ? (
          /* ===== GRID VIEW ===== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {shops.map((shop) => {
                const CatIcon = categoryIconMap[shop.category || ''] || Building2;
                return (
                  <motion.div
                    key={shop.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card hover className="p-4 h-full flex flex-col" onClick={() => navigate(`/shops/${shop.id}`)}>
                      {/* Logo placeholder */}
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <CatIcon size={26} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-text truncate">{shop.name}</h3>
                            {shop.is_verified && (
                              <CheckCircle2 size={14} className="text-success shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-3">
                            <span>{shop.category}</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin size={11} /> {shop.city}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rating + quotes */}
                      <div className="flex items-center gap-3 mt-3">
                        <span className="flex items-center gap-1 text-sm">
                          <Star size={13} className="fill-primary-mid text-primary-mid" />
                          <span className="font-semibold text-text">{shop.rating?.toFixed(1) || '0.0'}</span>
                        </span>
                        <span className="text-xs text-text-3">{shop.total_quotes || 0} quotes</span>
                        {shop.delivery_available && (
                          <Badge variant="green" size="sm" className="ml-auto">
                            <Truck size={10} /> Delivery
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      {shop.description && (
                        <p className="text-sm text-text-2 mt-3 line-clamp-2 flex-1">{shop.description}</p>
                      )}

                      {/* View store link */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <span className="text-xs text-text-3">
                          {shop.delivery_available ? `Delivers within ${shop.delivery_radius_km || 10}km` : 'Pickup only'}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/shops/${shop.id}`); }}
                          className="text-sm text-primary-mid hover:text-primary flex items-center gap-1 font-medium"
                        >
                          View store <ChevronRight size={14} />
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* ===== MAP VIEW (simulated) ===== */
          <Card className="relative h-[600px] overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: `
                  linear-gradient(135deg, #0a0a0a 0%, #111 100%),
                  radial-gradient(circle at 50% 40%, rgba(196,122,0,0.04) 0%, transparent 50%)
                `,
              }}
            >
              {/* Grid lines */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
                  `,
                  backgroundSize: '60px 60px',
                }}
              />
              {/* City labels */}
              <div className="absolute top-[15%] left-[20%] text-xs text-text-3 font-medium opacity-50">Lagos</div>
              <div className="absolute top-[40%] left-[55%] text-xs text-text-3 font-medium opacity-50">Abuja</div>
              <div className="absolute top-[65%] left-[30%] text-xs text-text-3 font-medium opacity-50">Kano</div>

              {/* Shop pins */}
              {pins.map((pin) => {
                const shop = shops.find((s) => s.id === pin.id);
                return (
                  <motion.button
                    key={pin.id}
                    onClick={() => navigate(`/shops/${pin.id}`)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    whileHover={{ scale: 1.3 }}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 border-bg shadow-lg flex items-center justify-center ${
                        pin.verified ? 'bg-success' : 'bg-primary'
                      }`}
                    >
                      <Store size={10} className="text-white" />
                    </div>
                    {pin.verified && (
                      <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-30" />
                    )}
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-bg-2 border border-border shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
                      <p className="text-xs font-semibold text-text">{shop?.name}</p>
                      <p className="text-[10px] text-text-3">{shop?.category} · {shop?.city}</p>
                    </div>
                  </motion.button>
                );
              })}

              {/* Legend */}
              <div className="absolute bottom-4 left-4 px-3 py-2.5 rounded-lg bg-bg-2/90 backdrop-blur border border-border z-30">
                <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">Legend</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-success" />
                    <span className="text-xs text-text-2">Verified shop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="text-xs text-text-2">Unverified</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
