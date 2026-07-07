import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Star, MapPin, Zap, Droplet, Wind, Hammer, Paintbrush, Building2,
  Cpu, Truck, Wrench, SlidersHorizontal, X, Plus, Minus, Crosshair,
  Clock, Briefcase, CheckCircle2, ChevronRight,
} from 'lucide-react';
import { getTechnicians } from '../lib/api';
import type { TechWithProfile } from '../lib/types';
import { formatNaira, distance } from '../lib/utils';
import { useUIStore } from '../store/ui';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SkeletonCard } from '../components/ui/Skeleton';

const TRADE_PILLS = ['All', 'Electrician', 'Plumber', 'AC & Cooling', 'Carpenter', 'Painter', 'Mason'];
const TIERS = ['All', 'standard', 'certified', 'elite'];

const tradeIconMap: Record<string, any> = {
  Electrician: Zap, Plumber: Droplet, 'AC & Cooling': Wind, Carpenter: Hammer,
  Painter: Paintbrush, Mason: Building2, Electronics: Cpu, Moving: Truck,
};

// Lagos center reference point for distance calc
const LAGOS_CENTER = { lat: 6.5244, lng: 3.3792 };

interface TechPin {
  id: string;
  x: number; // percent
  y: number; // percent
  available: boolean;
  driftX: number;
  driftY: number;
}

export default function Find() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useUIStore();

  const tradeFromUrl = searchParams.get('trade') || 'All';

  const [techs, setTechs] = useState<TechWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [trade, setTrade] = useState(tradeFromUrl);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [tier, setTier] = useState('All');
  const [maxRate, setMaxRate] = useState(10000);
  const [minRating, setMinRating] = useState(0);
  const [selectedTech, setSelectedTech] = useState<TechWithProfile | null>(null);
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Sync trade from URL
  useEffect(() => {
    setTrade(tradeFromUrl);
  }, [tradeFromUrl]);

  // Fetch technicians
  useEffect(() => {
    let active = true;
    setLoading(true);
    getTechnicians({
      trade: trade === 'All' ? undefined : trade,
      availableOnly,
      tier: tier === 'All' ? undefined : tier,
      minRating,
      maxRate,
    }).then((data) => {
      if (active) {
        setTechs(data);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [trade, availableOnly, tier, minRating, maxRate]);

  // Update URL when trade changes
  const handleTradeChange = (newTrade: string) => {
    setTrade(newTrade);
    if (newTrade === 'All') {
      searchParams.delete('trade');
    } else {
      searchParams.set('trade', newTrade);
    }
    setSearchParams(searchParams);
  };

  // Generate simulated map pins from technicians
  const pins: TechPin[] = useMemo(() => {
    return techs.map((t, i) => {
      const profile = t.profile;
      const seed = t.id.charCodeAt(0) + i;
      const baseX = 15 + ((seed * 37) % 70);
      const baseY = 15 + ((seed * 53) % 60);
      return {
        id: t.id,
        x: baseX,
        y: baseY,
        available: profile?.is_available ?? false,
        driftX: 0,
        driftY: 0,
      };
    });
  }, [techs]);

  // Animate pin drift every 3s
  const [pinDrifts, setPinDrifts] = useState<Record<string, { x: number; y: number }>>({});
  useEffect(() => {
    const interval = setInterval(() => {
      const newDrifts: Record<string, { x: number; y: number }> = {};
      pins.forEach((p) => {
        newDrifts[p.id] = {
          x: (Math.random() - 0.5) * 6, // -3 to 3 px
          y: (Math.random() - 0.5) * 6,
        };
      });
      setPinDrifts(newDrifts);
    }, 3000);
    return () => clearInterval(interval);
  }, [pins]);

  // Filter by search
  const filteredTechs = useMemo(() => {
    if (!search) return techs;
    const q = search.toLowerCase();
    return techs.filter((t) => {
      const name = `${t.first_name} ${t.last_name}`.toLowerCase();
      const tradeName = (t.profile?.trade || '').toLowerCase();
      const city = (t.profile?.city || '').toLowerCase();
      return name.includes(q) || tradeName.includes(q) || city.includes(q);
    });
  }, [techs, search]);

  const clearAll = () => {
    setSearch('');
    setTrade('All');
    setAvailableOnly(false);
    setTier('All');
    setMaxRate(10000);
    setMinRating(0);
    searchParams.delete('trade');
    setSearchParams(searchParams);
  };

  const handleQuickHire = (tech: TechWithProfile) => {
    setSelectedTech(tech);
    addToast({
      type: 'success',
      title: `${tech.first_name} ${tech.last_name} selected`,
      message: 'Review their profile and confirm to hire.',
    });
  };

  const getDistance = (tech: TechWithProfile): string => {
    if (tech.profile?.lat && tech.profile?.lng) {
      const km = distance(LAGOS_CENTER.lat, LAGOS_CENTER.lng, tech.profile.lat, tech.profile.lng);
      return `${km.toFixed(1)} km`;
    }
    return '—';
  };

  const activeFilterCount = [
    trade !== 'All', availableOnly, tier !== 'All', maxRate < 10000, minRating > 0,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-bg flex flex-col lg:flex-row">
      {/* ===== SIDEBAR ===== */}
      <aside className="w-full lg:w-[300px] lg:h-screen lg:overflow-y-auto no-scrollbar border-r border-border bg-bg-2 flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-border sticky top-0 bg-bg-2 z-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-xl font-extrabold">Find a Technician</h1>
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="lg:hidden p-2 rounded-lg hover:bg-bg-3 text-text-2"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {/* Search */}
          <Input
            placeholder="Search name, trade, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
            className="text-sm"
          />
        </div>

        {/* Filters */}
        <div className={`px-4 py-4 space-y-5 ${showFiltersMobile ? 'block' : 'hidden lg:block'}`}>
          {/* Trade pills */}
          <div>
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">Trade</p>
            <div className="flex flex-wrap gap-1.5">
              {TRADE_PILLS.map((t) => (
                <button
                  key={t}
                  onClick={() => handleTradeChange(t)}
                  className={`btn-press px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    trade === t
                      ? 'gold-gradient text-bg border-primary'
                      : 'bg-bg-3 text-text-2 border-border hover:border-primary/40'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Availability toggle */}
          <div>
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">Availability</p>
            <button
              onClick={() => setAvailableOnly(!availableOnly)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-3 border border-border hover:border-primary/30 transition-colors"
            >
              <span className="text-sm text-text-2 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${availableOnly ? 'bg-success online-pulse' : 'bg-text-3'}`} />
                Available now only
              </span>
              <div className={`w-9 h-5 rounded-full transition-colors ${availableOnly ? 'bg-primary' : 'bg-bg'}`}>
                <motion.div
                  animate={{ x: availableOnly ? 18 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-4 h-4 rounded-full bg-white mt-0.5"
                />
              </div>
            </button>
          </div>

          {/* Tier filter */}
          <div>
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">Tier</p>
            <div className="flex gap-1.5">
              {TIERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`btn-press flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border capitalize transition-all ${
                    tier === t
                      ? 'teal-gradient text-white border-accent'
                      : 'bg-bg-3 text-text-2 border-border hover:border-accent/40'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Max rate slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">Max Rate</p>
              <span className="text-sm font-semibold text-primary-mid">{formatNaira(maxRate)}/hr</span>
            </div>
            <input
              type="range"
              min={1000}
              max={10000}
              step={500}
              value={maxRate}
              onChange={(e) => setMaxRate(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-text-3 mt-1">
              <span>₦1K</span>
              <span>₦10K</span>
            </div>
          </div>

          {/* Rating filter */}
          <div>
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">Min Rating</p>
            <div className="flex gap-1">
              {[0, 3, 4, 4.5].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`btn-press flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1 ${
                    minRating === r
                      ? 'bg-primary/15 text-primary-mid border-primary/40'
                      : 'bg-bg-3 text-text-2 border-border hover:border-primary/20'
                  }`}
                >
                  {r === 0 ? 'Any' : (
                    <>
                      <Star size={12} className="fill-primary-mid text-primary-mid" />
                      {r}+
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-power hover:bg-power/10 transition-colors"
            >
              <X size={14} />
              Clear all filters ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Technician cards list */}
        <div className="flex-1 px-4 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">
              {loading ? 'Loading...' : `${filteredTechs.length} technicians`}
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredTechs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-bg-3 flex items-center justify-center mx-auto mb-3">
                <Search size={28} className="text-text-3" />
              </div>
              <p className="text-sm text-text-2 font-medium">No technicians found</p>
              <p className="text-xs text-text-3 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredTechs.map((tech) => {
                const profile = tech.profile;
                const TradeIcon = tradeIconMap[profile?.trade || ''] || Wrench;
                const isSelected = selectedTech?.id === tech.id;
                return (
                  <motion.div
                    key={tech.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      hover
                      onClick={() => setSelectedTech(tech)}
                      className={`p-3 cursor-pointer ${isSelected ? 'border-primary ring-1 ring-primary/30' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          firstName={tech.first_name}
                          lastName={tech.last_name}
                          size="md"
                          online={profile?.is_available}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm text-text truncate">
                              {tech.first_name} {tech.last_name}
                            </p>
                            {profile?.tier && profile.tier !== 'standard' && (
                              <Badge variant={profile.tier === 'elite' ? 'gold' : 'teal'} size="sm">
                                {profile.tier}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <TradeIcon size={12} className="text-text-3" />
                            <span className="text-xs text-text-2">{profile?.trade}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-text-3">
                            <span className="flex items-center gap-0.5">
                              <Star size={11} className="fill-primary-mid text-primary-mid" />
                              {profile?.rating?.toFixed(1) || '0.0'}
                              <span className="text-text-3">({profile?.total_reviews || 0})</span>
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Briefcase size={11} />
                              {profile?.total_jobs || 0} jobs
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-text-3">
                            <MapPin size={11} />
                            <span>{profile?.city || 'Lagos'}</span>
                            <span className="text-text-3">· {getDistance(tech)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <span className="text-sm font-bold text-primary-mid">
                          {formatNaira(profile?.hourly_rate || 0)}
                          <span className="text-xs font-normal text-text-3">/hr</span>
                        </span>
                        <Button
                          size="sm"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            handleQuickHire(tech);
                          }}
                        >
                          Quick Hire
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </aside>

      {/* ===== MAP PANEL ===== */}
      <div className="flex-1 relative lg:h-screen overflow-hidden bg-bg">
        {/* Simulated Lagos Map */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            background: `
              linear-gradient(135deg, #0a0a0a 0%, #111 100%),
              radial-gradient(circle at 50% 40%, rgba(196,122,0,0.04) 0%, transparent 50%)
            `,
          }}
        >
          <motion.div
            className="absolute inset-0 origin-center"
            animate={{ scale: zoom }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
          {/* CSS Grid road lines */}
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
          {/* Diagonal "highway" lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
            <line x1="0%" y1="30%" x2="100%" y2="50%" stroke="rgba(196,122,0,0.3)" strokeWidth="2" />
            <line x1="10%" y1="100%" x2="90%" y2="0%" stroke="rgba(14,142,166,0.2)" strokeWidth="2" />
            <line x1="0%" y1="70%" x2="100%" y2="20%" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
          </svg>

          {/* Water body (Lagoon) */}
          <div
            className="absolute rounded-3xl opacity-30"
            style={{
              bottom: '5%', right: '5%', width: '30%', height: '25%',
              background: 'linear-gradient(135deg, rgba(14,142,166,0.15), rgba(14,142,166,0.05))',
              filter: 'blur(8px)',
            }}
          />

          {/* City labels */}
          <div className="absolute top-[15%] left-[20%] text-xs text-text-3 font-medium opacity-50">Lekki</div>
          <div className="absolute top-[40%] left-[45%] text-xs text-text-3 font-medium opacity-50">Yaba</div>
          <div className="absolute top-[60%] left-[25%] text-xs text-text-3 font-medium opacity-50">Ikeja</div>
          <div className="absolute top-[30%] right-[25%] text-xs text-text-3 font-medium opacity-50">Victoria Island</div>

          {/* Tech Pins */}
          {pins.map((pin) => {
            const drift = pinDrifts[pin.id] || { x: 0, y: 0 };
            const isSelected = selectedTech?.id === pin.id;
            const isHovered = hoveredPin === pin.id;
            return (
              <motion.button
                key={pin.id}
                onClick={() => {
                  const tech = techs.find((t) => t.id === pin.id);
                  if (tech) setSelectedTech(tech);
                }}
                onMouseEnter={() => setHoveredPin(pin.id)}
                onMouseLeave={() => setHoveredPin(null)}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                animate={{
                  x: drift.x,
                  y: drift.y,
                  scale: isSelected ? 1.4 : isHovered ? 1.2 : 1,
                }}
                transition={{ duration: 2.5, ease: 'easeInOut' }}
              >
                <div className="relative">
                  {/* Pin */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 border-bg shadow-lg ${
                      pin.available ? 'bg-success' : 'bg-primary-mid'
                    } ${isSelected ? 'ring-4 ring-primary/40 ring-offset-2 ring-offset-bg' : ''}`}
                    style={isSelected ? { boxShadow: '0 0 20px rgba(196,122,0,0.6)' } : {}}
                  />
                  {/* Pulse ring for available */}
                  {pin.available && (
                    <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-40" />
                  )}
                  {/* Tooltip on hover */}
                  <AnimatePresence>
                    {isHovered && !isSelected && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-bg-2 border border-border shadow-xl whitespace-nowrap z-30"
                      >
                        {(() => {
                          const t = techs.find((x) => x.id === pin.id);
                          return t ? (
                            <>
                              <p className="text-xs font-semibold text-text">
                                {t.first_name} {t.last_name}
                              </p>
                              <p className="text-[10px] text-text-3">
                                {t.profile?.trade} · {formatNaira(t.profile?.hourly_rate || 0)}/hr
                              </p>
                            </>
                          ) : null;
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
          </motion.div>

          {/* Map controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-30">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
              className="w-9 h-9 rounded-lg bg-bg-2 border border-border flex items-center justify-center text-text-2 hover:text-text hover:border-primary/40 transition-colors shadow-lg"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
              className="w-9 h-9 rounded-lg bg-bg-2 border border-border flex items-center justify-center text-text-2 hover:text-text hover:border-primary/40 transition-colors shadow-lg"
            >
              <Minus size={18} />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="w-9 h-9 rounded-lg bg-bg-2 border border-border flex items-center justify-center text-text-2 hover:text-text hover:border-primary/40 transition-colors shadow-lg"
            >
              <Crosshair size={16} />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 px-3 py-2.5 rounded-lg bg-bg-2/90 backdrop-blur border border-border z-30">
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">Legend</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-success" />
                <span className="text-xs text-text-2">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-mid" />
                <span className="text-xs text-text-2">Busy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-success ring-2 ring-primary/40" />
                <span className="text-xs text-text-2">Selected</span>
              </div>
            </div>
          </div>

          {/* Empty map state */}
          {!loading && pins.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <MapPin size={48} className="text-text-3 mx-auto mb-3 opacity-50" />
                <p className="text-text-3 text-sm">No technicians in this area</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== SELECTED TECH BOTTOM PANEL ===== */}
      <AnimatePresence>
        {selectedTech && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 lg:left-[300px] z-40 bg-bg-2 border-t border-border shadow-2xl"
          >
            <div className="max-w-4xl mx-auto p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <Avatar
                  firstName={selectedTech.first_name}
                  lastName={selectedTech.last_name}
                  size="lg"
                  online={selectedTech.profile?.is_available}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-lg font-bold">
                      {selectedTech.first_name} {selectedTech.last_name}
                    </h3>
                    {selectedTech.profile?.tier && selectedTech.profile.tier !== 'standard' && (
                      <Badge variant={selectedTech.profile.tier === 'elite' ? 'gold' : 'teal'}>
                        {selectedTech.profile.tier}
                      </Badge>
                    )}
                    {selectedTech.kyc?.status === 'approved' && (
                      <Badge variant="green">
                        <CheckCircle2 size={12} /> KYC Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-text-2 mt-0.5">
                    {selectedTech.profile?.trade} · {selectedTech.profile?.years_experience || 0} yrs exp
                  </p>
                  {selectedTech.profile?.bio && (
                    <p className="text-sm text-text-3 mt-2 line-clamp-2">{selectedTech.profile.bio}</p>
                  )}
                  {/* Quick stats */}
                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Star size={14} className="fill-primary-mid text-primary-mid" />
                      <span className="font-semibold">{selectedTech.profile?.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-text-3 text-xs">({selectedTech.profile?.total_reviews || 0})</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-text-2">
                      <Briefcase size={14} className="text-text-3" />
                      {selectedTech.profile?.total_jobs || 0} jobs
                    </div>
                    <div className="flex items-center gap-1 text-sm text-text-2">
                      <Clock size={14} className="text-text-3" />
                      ~{selectedTech.profile?.response_time_minutes || 30}min response
                    </div>
                    <div className="flex items-center gap-1 text-sm text-text-2">
                      <MapPin size={14} className="text-text-3" />
                      {selectedTech.profile?.city || 'Lagos'} · {getDistance(selectedTech)}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-2xl font-extrabold text-primary-mid">
                    {formatNaira(selectedTech.profile?.hourly_rate || 0)}
                  </p>
                  <p className="text-xs text-text-3">per hour</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => navigate(`/technician/${selectedTech.id}`)}
                >
                  View Profile
                </Button>
                <Button fullWidth onClick={() => navigate(`/jobs/post?tech=${selectedTech.id}`)}>
                  Hire Now <ChevronRight size={16} />
                </Button>
                <button
                  onClick={() => setSelectedTech(null)}
                  className="px-3 rounded-xl bg-bg-3 border border-border text-text-3 hover:text-text"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
