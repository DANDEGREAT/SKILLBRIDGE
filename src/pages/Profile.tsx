import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MapPin, Zap, Droplet, Wind, Hammer, Paintbrush, Building2,
  Cpu, Truck, Wrench, CheckCircle2, Clock, Briefcase, Repeat, TrendingUp,
  Calendar, Share2, MessageSquare, ChevronRight, ChevronDown, Image as ImageIcon,
  Wallet, Award, Sparkles,
} from 'lucide-react';
import { getTechnicianById, getTechnicianReviews, getTechnicians } from '../lib/api';
import type { TechWithProfile, Review } from '../lib/types';
import { formatNaira, formatDate, getInitials } from '../lib/utils';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';

const tradeIconMap: Record<string, any> = {
  Electrician: Zap, Plumber: Droplet, 'AC & Cooling': Wind, Carpenter: Hammer,
  Painter: Paintbrush, Mason: Building2, Electronics: Cpu, Moving: Truck,
};

const REVIEW_FILTERS = ['All', '5 star', '4 star', 'Recent', 'Oldest'] as const;
const PAGE_SIZE = 5;

// Simulated portfolio captions
const PORTFOLIO_CAPTIONS = [
  'Complete rewiring — 3-bedroom flat',
  'Bathroom plumbing retrofit',
  'Inverter installation & testing',
];

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const [tech, setTech] = useState<TechWithProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similar, setSimilar] = useState<TechWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<typeof REVIEW_FILTERS[number]>('All');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    Promise.all([
      getTechnicianById(id),
      getTechnicianReviews(id),
    ]).then(([t, r]) => {
      if (!active) return;
      setTech(t);
      setReviews(r);
      setLoading(false);
      // Fetch similar technicians (same trade, nearby city)
      if (t?.profile) {
        getTechnicians({ trade: t.profile.trade, city: t.profile.city }).then((list) => {
          if (!active) return;
          setSimilar(list.filter((x) => x.id !== id).slice(0, 4));
        });
      }
    });
    return () => { active = false; };
  }, [id]);

  const filteredReviews = useMemo(() => {
    let list = [...reviews];
    switch (reviewFilter) {
      case '5 star':
        list = list.filter((r) => r.rating === 5);
        break;
      case '4 star':
        list = list.filter((r) => r.rating === 4);
        break;
      case 'Recent':
        list = list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'Oldest':
        list = list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      default:
        list = list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [reviews, reviewFilter]);

  const visibleReviews = filteredReviews.slice(0, visibleCount);
  const hasMore = visibleCount < filteredReviews.length;

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      setShared(true);
      addToast({ type: 'success', title: 'Profile link copied', message: 'Share it with anyone.' });
      setTimeout(() => setShared(false), 2000);
    }).catch(() => {
      addToast({ type: 'error', title: 'Could not copy', message: 'Copy the URL manually.' });
    });
  };

  const isOwnOrAdmin = user?.id === id || user?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-bg p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" rounded="rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <SkeletonText lines={4} />
        </div>
      </div>
    );
  }

  if (!tech) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-bg-3 flex items-center justify-center mx-auto mb-3">
            <Wrench size={28} className="text-text-3" />
          </div>
          <p className="text-text-2 font-medium">Technician not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/find')}>
            Browse technicians
          </Button>
        </div>
      </div>
    );
  }

  const profile = tech.profile;
  const TradeIcon = tradeIconMap[profile?.trade || ''] || Wrench;
  const fullName = `${tech.first_name} ${tech.last_name}`;
  const skills = profile?.skills ? profile.skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const memberSince = formatDate(tech.created_at, 'MMM yyyy');
  const kycApproved = tech.kyc?.status === 'approved';

  return (
    <div className="min-h-screen bg-bg pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* ===== HERO ===== */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="relative overflow-hidden p-6 sm:p-8">
            {/* Decorative gradient */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 80% 0%, rgba(196,122,0,0.12), transparent 60%)',
              }}
            />
            <div className="relative flex flex-col md:flex-row md:items-start gap-6">
              {/* Avatar with online ring */}
              <div className="relative shrink-0 mx-auto md:mx-0">
                <div
                  className={`w-[84px] h-[84px] rounded-full flex items-center justify-center text-3xl font-bold text-white ${
                    profile?.is_available ? 'bg-success' : 'bg-primary'
                  } ring-4 ${profile?.is_available ? 'ring-success/30' : 'ring-primary/20'}`}
                >
                  {getInitials(tech.first_name, tech.last_name)}
                </div>
                {profile?.is_available && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-bg-2 online-pulse" />
                )}
              </div>

              {/* Name + badges */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-text">{fullName}</h1>
                  {profile?.tier && profile.tier !== 'standard' && (
                    <Badge variant={profile.tier === 'elite' ? 'gold' : 'teal'} size="md">
                      <Sparkles size={12} /> {profile.tier}
                    </Badge>
                  )}
                  {kycApproved && (
                    <Badge variant="green" size="md">
                      <CheckCircle2 size={12} /> KYC Verified
                    </Badge>
                  )}
                </div>

                {/* Trade + city + member since */}
                <div className="flex items-center justify-center md:justify-start gap-3 mt-2 text-sm text-text-2 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <TradeIcon size={14} className="text-primary-mid" />
                    {profile?.trade}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-text-3" />
                    {profile?.city || 'Lagos'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-text-3" />
                    Member since {memberSince}
                  </span>
                </div>

                {/* Star rating */}
                <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={22}
                        className={n <= Math.round(profile?.rating || 0) ? 'fill-primary text-primary' : 'text-text-3'}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-bold text-text">{profile?.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-sm text-text-3">({profile?.total_reviews || 0} reviews)</span>
                </div>

                {/* Quick stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  <div className="text-center md:text-left">
                    <p className="text-xs text-text-3 uppercase tracking-wider">Total jobs</p>
                    <p className="text-lg font-bold text-text mt-0.5">{profile?.total_jobs || 0}</p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-xs text-text-3 uppercase tracking-wider">Completion</p>
                    <p className="text-lg font-bold text-text mt-0.5">{profile?.completion_rate || 100}%</p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-xs text-text-3 uppercase tracking-wider">Response</p>
                    <p className="text-lg font-bold text-text mt-0.5">~{profile?.response_time_minutes || 30}m</p>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-xs text-text-3 uppercase tracking-wider">Repeat rate</p>
                    <p className="text-lg font-bold text-text mt-0.5">
                      {profile && profile.total_jobs > 0
                        ? Math.min(100, Math.round((profile.total_reviews / profile.total_jobs) * 100))
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ===== MAIN GRID: content + sidebar ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left: stats + bio + portfolio + reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats grid (4 cards) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {isOwnOrAdmin && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-text-3 mb-1">
                    <Wallet size={14} />
                    <span className="text-xs uppercase tracking-wider">This month</span>
                  </div>
                  <p className="text-xl font-bold text-primary-mid">
                    {formatNaira((profile?.total_jobs || 0) * (profile?.hourly_rate || 0))}
                  </p>
                </Card>
              )}
              <Card className="p-4">
                <div className="flex items-center gap-2 text-text-3 mb-1">
                  <Briefcase size={14} />
                  <span className="text-xs uppercase tracking-wider">Jobs done</span>
                </div>
                <p className="text-xl font-bold text-text">{profile?.total_jobs || 0}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-text-3 mb-1">
                  <Star size={14} />
                  <span className="text-xs uppercase tracking-wider">Avg rating</span>
                </div>
                <p className="text-xl font-bold text-text">{profile?.rating?.toFixed(1) || '0.0'}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-text-3 mb-1">
                  <Award size={14} />
                  <span className="text-xs uppercase tracking-wider">Experience</span>
                </div>
                <p className="text-xl font-bold text-text">{profile?.years_experience || 0} yrs</p>
              </Card>
            </div>

            {/* Bio section */}
            {profile?.bio && (
              <Card className="p-5">
                <h2 className="font-display text-lg font-bold text-text mb-3">About</h2>
                <p className={`text-sm text-text-2 leading-relaxed ${bioExpanded ? '' : 'line-clamp-4'}`}>
                  {profile.bio}
                </p>
                {profile.bio.length > 200 && (
                  <button
                    onClick={() => setBioExpanded(!bioExpanded)}
                    className="flex items-center gap-1 text-sm text-primary-mid mt-2 hover:text-primary"
                  >
                    {bioExpanded ? 'Show less' : 'Read more'}
                    <ChevronDown size={14} className={`transition-transform ${bioExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
                {skills.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-text-3 uppercase tracking-wider mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary-mid border border-primary/20"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Portfolio / Recent work */}
            <div>
              <h2 className="font-display text-lg font-bold text-text mb-3">Recent Work</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PORTFOLIO_CAPTIONS.map((caption, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Card hover className="overflow-hidden group">
                      {/* Gradient placeholder with trade icon */}
                      <div
                        className="h-40 flex items-center justify-center relative"
                        style={{
                          background: `linear-gradient(135deg, ${
                            i === 0 ? 'rgba(196,122,0,0.25), rgba(196,122,0,0.05)' :
                            i === 1 ? 'rgba(14,142,166,0.25), rgba(14,142,166,0.05)' :
                            'rgba(26,107,60,0.25), rgba(26,107,60,0.05)'
                          })`,
                        }}
                      >
                        <TradeIcon size={40} className="text-text-2 opacity-60 group-hover:scale-110 transition-transform" />
                        <div className="absolute top-2 right-2">
                          <ImageIcon size={14} className="text-text-3" />
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-text line-clamp-1">{caption}</p>
                        <p className="text-xs text-text-3 mt-0.5">{profile?.trade}</p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Reviews section */}
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="font-display text-lg font-bold text-text">
                  Reviews ({reviews.length})
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {REVIEW_FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => { setReviewFilter(f); setVisibleCount(PAGE_SIZE); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        reviewFilter === f
                          ? 'gold-gradient text-bg border-primary'
                          : 'bg-bg-3 text-text-2 border-border hover:border-primary/30'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {visibleReviews.length === 0 ? (
                <Card className="p-8 text-center">
                  <Star size={32} className="text-text-3 mx-auto mb-2" />
                  <p className="text-text-2 text-sm">No reviews yet</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {visibleReviews.map((rev, i) => {
                      const reviewerInitials = rev.reviewer_id ? rev.reviewer_id.slice(0, 2).toUpperCase() : '??';
                      return (
                        <motion.div
                          key={rev.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-bg-3 flex items-center justify-center text-sm font-semibold text-text-2 shrink-0">
                                {reviewerInitials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                      <Star
                                        key={n}
                                        size={13}
                                        className={n <= rev.rating ? 'fill-primary text-primary' : 'text-text-3'}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-text-3">{formatDate(rev.created_at)}</span>
                                </div>
                                <p className="text-sm text-text-2 mt-2 leading-relaxed">{rev.comment || 'No comment'}</p>
                                <div className="flex items-center gap-1.5 mt-2">
                                  <Badge variant="gray" size="sm">
                                    <Briefcase size={10} /> {profile?.trade}
                                  </Badge>
                                  {rev.is_verified && (
                                    <Badge variant="green" size="sm">
                                      <CheckCircle2 size={10} /> Verified
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {hasMore && (
                    <div className="text-center pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      >
                        Load more ({filteredReviews.length - visibleCount} remaining)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Action sidebar (sticky) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">
              <Card className="p-5">
                {/* Hourly rate */}
                <div className="text-center pb-4 border-b border-border">
                  <p className="text-xs text-text-3 uppercase tracking-wider">Hourly rate</p>
                  <p className="font-display text-4xl font-extrabold text-primary-mid mt-1">
                    {formatNaira(profile?.hourly_rate || 0)}
                  </p>
                  <p className="text-xs text-text-3">per hour</p>
                </div>

                {/* Availability */}
                <div className="flex items-center justify-center gap-2 py-4 border-b border-border">
                  <span className={`w-2.5 h-2.5 rounded-full ${profile?.is_available ? 'bg-success online-pulse' : 'bg-text-3'}`} />
                  <span className={`text-sm font-medium ${profile?.is_available ? 'text-success' : 'text-text-3'}`}>
                    {profile?.is_available ? 'Available now' : 'Currently busy'}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="space-y-2.5 pt-4">
                  <Button fullWidth size="lg" onClick={() => navigate(`/jobs/post?tech=${tech.id}`)}>
                    Hire {tech.first_name} <ChevronRight size={18} />
                  </Button>
                  <Button variant="secondary" fullWidth onClick={() => navigate('/chat')}>
                    <MessageSquare size={16} /> Message
                  </Button>
                  <Button variant="outline" fullWidth onClick={handleShare}>
                    {shared ? <CheckCircle2 size={16} /> : <Share2 size={16} />}
                    {shared ? 'Link copied!' : 'Share profile'}
                  </Button>
                </div>
              </Card>

              {/* Quick info card */}
              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-3 flex items-center gap-2"><Clock size={14} /> Response time</span>
                  <span className="text-text-2 font-medium">~{profile?.response_time_minutes || 30} min</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-3 flex items-center gap-2"><TrendingUp size={14} /> Completion rate</span>
                  <span className="text-text-2 font-medium">{profile?.completion_rate || 100}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-3 flex items-center gap-2"><Repeat size={14} /> Repeat clients</span>
                  <span className="text-text-2 font-medium">{profile?.total_reviews || 0}</span>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* ===== SIMILAR TECHNICIANS ===== */}
        {similar.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-text">Similar Technicians</h2>
              <button
                onClick={() => navigate('/find')}
                className="text-sm text-primary-mid hover:text-primary flex items-center gap-1"
              >
                View all <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {similar.map((s) => {
                const SIcon = tradeIconMap[s.profile?.trade || ''] || Wrench;
                return (
                  <Card
                    key={s.id}
                    hover
                    onClick={() => navigate(`/profile/${s.id}`)}
                    className="min-w-[240px] p-4 shrink-0"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        firstName={s.first_name}
                        lastName={s.last_name}
                        size="md"
                        online={s.profile?.is_available}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-text truncate">
                          {s.first_name} {s.last_name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <SIcon size={12} className="text-text-3" />
                          <span className="text-xs text-text-2">{s.profile?.trade}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="flex items-center gap-1 text-xs">
                        <Star size={12} className="fill-primary-mid text-primary-mid" />
                        {s.profile?.rating?.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-sm font-bold text-primary-mid">
                        {formatNaira(s.profile?.hourly_rate || 0)}
                        <span className="text-xs font-normal text-text-3">/hr</span>
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
