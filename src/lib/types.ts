export type UserRole = 'client' | 'technician' | 'store_owner' | 'admin';

export type JobStatus =
  | 'open'
  | 'bidding'
  | 'in_progress'
  | 'client_confirmed'
  | 'tech_confirmed'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type PaymentStatus = 'pending' | 'held' | 'released' | 'refunded' | 'disputed';
export type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';
export type TechTier = 'standard' | 'certified' | 'elite';
export type MessageType = 'text' | 'image' | 'file' | 'system' | 'quote' | 'location' | 'payment_update' | 'job_update';
export type SubPlan = 'basic' | 'premium' | 'elite';
export type DisputeStatus = 'open' | 'under_review' | 'resolved_client' | 'resolved_tech' | 'dismissed';
export type SosStatus = 'active' | 'resolved' | 'false_alarm';

export interface User {
  id: string;
  phone: string;
  email: string | null;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar_url: string | null;
  is_phone_verified: boolean;
  is_active: boolean;
  last_seen: string | null;
  created_at: string;
}

export interface TechnicianProfile {
  id: string;
  user_id: string;
  trade: string;
  bio: string | null;
  hourly_rate: number;
  tier: TechTier;
  rating: number;
  total_reviews: number;
  total_jobs: number;
  completion_rate: number;
  response_time_minutes: number;
  is_available: boolean;
  city: string;
  lat: number | null;
  lng: number | null;
  skills: string | null;
  years_experience: number;
  is_premium: boolean;
  created_at: string;
}

export interface KycVerification {
  id: string;
  user_id: string;
  status: KycStatus;
  id_type: string | null;
  nin_hash: string | null;
  id_document_url: string | null;
  selfie_url: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface Job {
  id: string;
  client_id: string | null;
  technician_id: string | null;
  title: string;
  trade: string;
  description: string | null;
  location_text: string | null;
  lat: number | null;
  lng: number | null;
  budget_min: number | null;
  agreed_amount: number | null;
  status: JobStatus;
  is_urgent: boolean;
  scheduled_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  photos: string | null;
  created_at: string;
}

export interface Bid {
  id: string;
  job_id: string;
  technician_id: string;
  amount: number;
  estimated_hours: number | null;
  message: string | null;
  status: BidStatus;
  created_at: string;
}

export interface Payment {
  id: string;
  job_id: string | null;
  client_id: string | null;
  technician_id: string | null;
  amount: number;
  platform_fee: number | null;
  technician_payout: number | null;
  reference: string | null;
  paystack_ref: string | null;
  status: PaymentStatus;
  payment_method: string;
  held_at: string | null;
  released_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  job_id: string;
  reviewer_id: string | null;
  technician_id: string | null;
  rating: number;
  comment: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  job_id: string;
  client_id: string;
  tech_id: string;
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  type: MessageType;
  metadata: string | null;
  is_read: boolean;
  read_at: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  reply_to_id: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string | null;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Shop {
  id: string;
  owner_id: string | null;
  name: string;
  category: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  phone: string | null;
  rating: number;
  total_quotes: number;
  delivery_available: boolean;
  delivery_radius_km: number | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface SosAlert {
  id: string;
  job_id: string | null;
  triggered_by: string | null;
  alert_type: string | null;
  lat: number | null;
  lng: number | null;
  status: SosStatus;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubPlan;
  price: number | null;
  started_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export interface Dispute {
  id: string;
  job_id: string;
  raised_by: string | null;
  against: string | null;
  reason: string;
  evidence_urls: string | null;
  status: DisputeStatus;
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface TechWithProfile extends User {
  profile: TechnicianProfile | null;
  kyc: KycVerification | null;
}

export interface JobWithDetails extends Job {
  client: User | null;
  technician: User | null;
  technician_profile: TechnicianProfile | null;
  bids: Bid[];
  payment: Payment | null;
  review: Review | null;
}

export interface ChatRoomWithDetails extends ChatRoom {
  job: Job | null;
  client: User | null;
  tech: User | null;
  tech_profile: TechnicianProfile | null;
  last_message: Message | null;
  unread_count: number;
}
