import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Store, MapPin, Star, Truck, CheckCircle2, Clock, Phone, Package,
  Zap, Droplet, Wind, Hammer, Paintbrush, Building2, ChevronRight,
  MessageSquare, ArrowLeft, ShoppingBag, Quote,
} from 'lucide-react';
import { getShopById, getJobs } from '../lib/api';
import type { Shop, Job } from '../lib/types';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';

const categoryIconMap: Record<string, any> = {
  Electrical: Zap, Plumbing: Droplet, 'AC & Cooling': Wind, Hardware: Package,
  Carpentry: Hammer, Paint: Paintbrush,
};

// Simulated technician reviews for shops
const SIM_REVIEWS = [
  { initials: 'AO', rating: 5, comment: 'Great prices and fast delivery. Will buy again.', name: 'Ade O.', date: '2 weeks ago' },
  { initials: 'BK', rating: 4, comment: 'Good quality materials. Delivery was a bit late though.', name: 'Bola K.', date: '1 month ago' },
  { initials: 'CN', rating: 5, comment: 'Best electrical supply shop in Lagos. Highly recommended.', name: 'Chidi N.', date: '2 months ago' },
];

export default function ShopDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  const [shop, setShop] = useState<Shop | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    getShopById(id).then((s) => {
      if (!active) return;
      setShop(s);
      setLoading(false);
    });
    // Fetch user's open jobs for invite modal
    if (user?.id) {
      getJobs({ clientId: user.id, status: 'open' }).then((j) => {
        if (active) setJobs(j);
      });
    }
    return () => { active = false; };
  }, [id, user?.id]);

  const handleInvite = () => {
    if (!selectedJob) {
      addToast({ type: 'warning', title: 'Select a job', message: 'Choose a job to invite this shop to.' });
      return;
    }
    addToast({ type: 'success', title: 'Invitation sent', message: 'Shop has been invited to your job chat.' });
    setInviteModalOpen(false);
    setSelectedJob(null);
    navigate('/chat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg p-4 sm:p-6 max-w-5xl mx-auto">
        <Skeleton className="h-48 w-full mb-6" rounded="rounded-2xl" />
        <SkeletonText lines={4} />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <Store size={40} className="text-text-3 mx-auto mb-3" />
          <p className="text-text-2 font-medium">Shop not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/shops')}>
            Browse shops
          </Button>
        </div>
      </div>
    );
  }

  const CatIcon = categoryIconMap[shop.category || ''] || Building2;
  const productCategories = shop.category ? [shop.category, 'Tools', 'Accessories'] : ['Tools', 'Accessories'];

  return (
    <div className="min-h-screen bg-bg pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        {/* Back link */}
        <button
          onClick={() => navigate('/shops')}
          className="flex items-center gap-1.5 text-sm text-text-3 hover:text-text mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back to shops
        </button>

        {/* ===== STORE HEADER ===== */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="overflow-hidden">
            <div
              className="h-24 sm:h-32"
              style={{
                background: 'linear-gradient(135deg, rgba(196,122,0,0.2), rgba(196,122,0,0.05))',
              }}
            />
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-20">
                {/* Logo */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-bg-2 border-2 border-border flex items-center justify-center shrink-0 shadow-xl">
                  <CatIcon size={40} className="text-primary" />
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-2xl font-extrabold text-text">{shop.name}</h1>
                    {shop.is_verified && (
                      <Badge variant="green" size="md">
                        <CheckCircle2 size={12} /> Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-sm text-text-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-text-3" /> {shop.city || 'Lagos'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} className="text-text-3" /> Open · 8am–6pm
                    </span>
                    {shop.delivery_available && (
                      <Badge variant="green" size="sm">
                        <Truck size={10} /> Delivery available
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-border">
                <div>
                  <p className="text-xs text-text-3 uppercase tracking-wider">Rating</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={16} className="fill-primary text-primary" />
                    <span className="font-bold text-text">{shop.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-text-3 uppercase tracking-wider">Quotes sent</p>
                  <p className="font-bold text-text mt-1">{shop.total_quotes || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-text-3 uppercase tracking-wider">Delivery</p>
                  <p className="font-bold text-text mt-1 text-sm">
                    {shop.delivery_available ? `Within ${shop.delivery_radius_km || 10}km` : 'Pickup only'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-3 uppercase tracking-wider">Category</p>
                  <p className="font-bold text-text mt-1 text-sm">{shop.category || 'General'}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left: description + categories + reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {shop.description && (
              <Card className="p-5">
                <h2 className="font-display text-lg font-bold text-text mb-3">About this store</h2>
                <p className="text-sm text-text-2 leading-relaxed">{shop.description}</p>
                {shop.address && (
                  <div className="flex items-center gap-1.5 mt-3 text-sm text-text-3">
                    <MapPin size={14} /> {shop.address}
                  </div>
                )}
                {shop.phone && (
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-text-3">
                    <Phone size={14} /> {shop.phone}
                  </div>
                )}
              </Card>
            )}

            {/* Categories of products stocked */}
            <Card className="p-5">
              <h2 className="font-display text-lg font-bold text-text mb-3">Products Stocked</h2>
              <div className="flex flex-wrap gap-2">
                {productCategories.map((cat, i) => {
                  const Icon = categoryIconMap[cat] || Package;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-3 border border-border"
                    >
                      <Icon size={16} className="text-primary-mid" />
                      <span className="text-sm text-text-2">{cat}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Recent quotes sent */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg font-bold text-text">Recent Quotes</h2>
                <Badge variant="gray" size="md">
                  <Quote size={12} /> {shop.total_quotes || 0} total
                </Badge>
              </div>
              {shop.total_quotes && shop.total_quotes > 0 ? (
                <div className="space-y-2">
                  {Array.from({ length: Math.min(3, shop.total_quotes) }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bg-3 border border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ShoppingBag size={14} className="text-primary-mid" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text">Quote #{i + 1}</p>
                          <p className="text-xs text-text-3">{i + 1} day{i === 0 ? '' : 's'} ago</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-primary-mid">
                        ₦{(15000 + i * 8500).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-3 text-center py-4">No quotes sent yet</p>
              )}
            </Card>

            {/* Reviews from technicians */}
            <div>
              <h2 className="font-display text-lg font-bold text-text mb-3">Reviews from Technicians</h2>
              <div className="space-y-3">
                {SIM_REVIEWS.map((rev, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Card className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-bg-3 flex items-center justify-center text-sm font-semibold text-text-2 shrink-0">
                          {rev.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-text">{rev.name}</p>
                            <span className="text-xs text-text-3">{rev.date}</span>
                          </div>
                          <div className="flex items-center gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                size={13}
                                className={n <= rev.rating ? 'fill-primary text-primary' : 'text-text-3'}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-text-2 mt-2">{rev.comment}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Action sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">
              <Card className="p-5">
                <h3 className="font-display text-base font-bold text-text mb-3">Contact & Actions</h3>
                <div className="space-y-2.5">
                  <Button fullWidth onClick={() => setInviteModalOpen(true)}>
                    <MessageSquare size={16} /> Invite to my job chat
                  </Button>
                  {shop.phone && (
                    <Button variant="outline" fullWidth onClick={() => window.open(`tel:${shop.phone}`)}>
                      <Phone size={16} /> Call store
                    </Button>
                  )}
                  <Button variant="secondary" fullWidth onClick={() => navigate('/chat')}>
                    <MessageSquare size={16} /> Message
                  </Button>
                </div>

                {/* Delivery info */}
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-3 flex items-center gap-2">
                      <Truck size={14} /> Delivery
                    </span>
                    <span className={shop.delivery_available ? 'text-success font-medium' : 'text-text-3'}>
                      {shop.delivery_available ? 'Available' : 'Not available'}
                    </span>
                  </div>
                  {shop.delivery_available && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-3">Radius</span>
                      <span className="text-text-2 font-medium">{shop.delivery_radius_km || 10} km</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-3 flex items-center gap-2">
                      <CheckCircle2 size={14} /> Status
                    </span>
                    <span className={shop.is_verified ? 'text-success font-medium' : 'text-text-3'}>
                      {shop.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ===== INVITE TO JOB MODAL ===== */}
      <Modal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite to job chat" size="md">
        <div className="space-y-4">
          <p className="text-sm text-text-2">
            Select a job to invite <span className="font-semibold text-text">{shop.name}</span> to the chat.
          </p>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag size={32} className="text-text-3 mx-auto mb-2" />
              <p className="text-sm text-text-2">You have no open jobs</p>
              <Button size="sm" className="mt-3" onClick={() => navigate('/jobs/post')}>
                Post a job
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(job.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedJob === job.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-bg-3 hover:border-primary/30'
                    }`}
                  >
                    <p className="text-sm font-medium text-text">{job.title}</p>
                    <p className="text-xs text-text-3 mt-0.5">{job.trade} · {job.location_text || 'No location'}</p>
                  </button>
                ))}
              </div>
              <Button fullWidth onClick={handleInvite} disabled={!selectedJob}>
                Send invitation <ChevronRight size={16} />
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
