/*
# SkillBridge Extended Schema — Payments, Reviews, Chat, Notifications, Shops, SOS, Subscriptions, Disputes

## Overview
Creates the remaining tables for the SkillBridge platform: payments/escrow, reviews, chat system, notifications, shops, SOS alerts, subscriptions, and disputes.

## New Tables
1. **payments** — Escrow payment records for jobs.
2. **reviews** — Client reviews of technicians.
3. **chat_rooms** — Chat rooms linked to jobs.
4. **messages** — Chat messages with multiple types.
5. **message_reads** — Read receipts.
6. **notifications** — User notifications.
7. **shops** — Material shop directory.
8. **sos_alerts** — Emergency SOS alerts.
9. **subscriptions** — Premium subscription plans.
10. **disputes** — Dispute records for jobs.

## Security
- RLS enabled on all tables with appropriate ownership/party-based policies.
*/

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  technician_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  platform_fee integer,
  technician_payout integer,
  reference text UNIQUE,
  paystack_ref text,
  status text DEFAULT 'pending' CHECK(status IN ('pending','held','released','refunded','disputed')),
  payment_method text DEFAULT 'card',
  held_at timestamptz,
  released_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_parties" ON public.payments;
CREATE POLICY "payments_select_parties" ON public.payments FOR SELECT
  TO authenticated USING (auth.uid() = client_id OR auth.uid() = technician_id OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = client_id OR auth.uid() = technician_id);

DROP POLICY IF EXISTS "payments_update_parties" ON public.payments;
CREATE POLICY "payments_update_parties" ON public.payments FOR UPDATE
  TO authenticated USING (auth.uid() = client_id OR auth.uid() = technician_id OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (auth.uid() = client_id OR auth.uid() = technician_id OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid UNIQUE REFERENCES public.jobs(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  technician_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  rating integer CHECK(rating BETWEEN 1 AND 5),
  comment text,
  is_verified boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reviewer_id);

-- Chat rooms
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid UNIQUE REFERENCES public.jobs(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  tech_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_rooms_select_parties" ON public.chat_rooms;
CREATE POLICY "chat_rooms_select_parties" ON public.chat_rooms FOR SELECT
  TO authenticated USING (auth.uid() = client_id OR auth.uid() = tech_id OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

DROP POLICY IF EXISTS "chat_rooms_insert_parties" ON public.chat_rooms;
CREATE POLICY "chat_rooms_insert_parties" ON public.chat_rooms FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = client_id OR auth.uid() = tech_id);

DROP POLICY IF EXISTS "chat_rooms_update_parties" ON public.chat_rooms;
CREATE POLICY "chat_rooms_update_parties" ON public.chat_rooms FOR UPDATE
  TO authenticated USING (auth.uid() = client_id OR auth.uid() = tech_id) WITH CHECK (auth.uid() = client_id OR auth.uid() = tech_id);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  type text DEFAULT 'text' CHECK(type IN ('text','image','file','system','quote','location','payment_update','job_update')),
  metadata text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  edited_at timestamptz,
  deleted_at timestamptz,
  reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_parties" ON public.messages;
CREATE POLICY "messages_select_parties" ON public.messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = messages.room_id
      AND (cr.client_id = auth.uid() OR cr.tech_id = auth.uid())
    ) OR EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "messages_insert_parties" ON public.messages;
CREATE POLICY "messages_insert_parties" ON public.messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = messages.room_id
      AND (cr.client_id = auth.uid() OR cr.tech_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
CREATE POLICY "messages_update_own" ON public.messages FOR UPDATE
  TO authenticated USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

-- Message reads
CREATE TABLE IF NOT EXISTS public.message_reads (
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "message_reads_select_parties" ON public.message_reads;
CREATE POLICY "message_reads_select_parties" ON public.message_reads FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.chat_rooms cr ON cr.id = m.room_id
      WHERE m.id = message_reads.message_id
      AND (cr.client_id = auth.uid() OR cr.tech_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "message_reads_insert_parties" ON public.message_reads;
CREATE POLICY "message_reads_insert_parties" ON public.message_reads FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.chat_rooms cr ON cr.id = m.room_id
      WHERE m.id = message_reads.message_id
      AND (cr.client_id = auth.uid() OR cr.tech_id = auth.uid())
    )
  );

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  type text,
  reference_id text,
  reference_type text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shops
CREATE TABLE IF NOT EXISTS public.shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text,
  city text,
  address text,
  description text,
  phone text,
  rating real DEFAULT 0,
  total_quotes integer DEFAULT 0,
  delivery_available boolean DEFAULT false,
  delivery_radius_km integer,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shops_select_all" ON public.shops;
CREATE POLICY "shops_select_all" ON public.shops FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "shops_insert_own" ON public.shops;
CREATE POLICY "shops_insert_own" ON public.shops FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "shops_update_own" ON public.shops;
CREATE POLICY "shops_update_own" ON public.shops FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- SOS alerts
CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  triggered_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  alert_type text,
  lat real,
  lng real,
  status text DEFAULT 'active' CHECK(status IN ('active','resolved','false_alarm')),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sos_select_all" ON public.sos_alerts;
CREATE POLICY "sos_select_all" ON public.sos_alerts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "sos_insert_own" ON public.sos_alerts;
CREATE POLICY "sos_insert_own" ON public.sos_alerts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = triggered_by);

DROP POLICY IF EXISTS "sos_update_admin" ON public.sos_alerts;
CREATE POLICY "sos_update_admin" ON public.sos_alerts FOR UPDATE
  TO authenticated USING (auth.uid() = triggered_by OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (auth.uid() = triggered_by OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  plan text DEFAULT 'basic' CHECK(plan IN ('basic','premium','elite')),
  price integer,
  started_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_insert_own" ON public.subscriptions;
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_update_own" ON public.subscriptions;
CREATE POLICY "subscriptions_update_own" ON public.subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Disputes
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid UNIQUE REFERENCES public.jobs(id) ON DELETE CASCADE,
  raised_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  against uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  evidence_urls text,
  status text DEFAULT 'open' CHECK(status IN ('open','under_review','resolved_client','resolved_tech','dismissed')),
  admin_notes text,
  resolved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "disputes_select_parties" ON public.disputes;
CREATE POLICY "disputes_select_parties" ON public.disputes FOR SELECT
  TO authenticated USING (auth.uid() = raised_by OR auth.uid() = against OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

DROP POLICY IF EXISTS "disputes_insert_own" ON public.disputes;
CREATE POLICY "disputes_insert_own" ON public.disputes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = raised_by);

DROP POLICY IF EXISTS "disputes_update_admin" ON public.disputes;
CREATE POLICY "disputes_update_admin" ON public.disputes FOR UPDATE
  TO authenticated USING (auth.uid() = raised_by OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (auth.uid() = raised_by OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_job ON public.payments(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tech ON public.reviews(technician_id);
CREATE INDEX IF NOT EXISTS idx_messages_room ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_shops_category ON public.shops(category);
CREATE INDEX IF NOT EXISTS idx_shops_city ON public.shops(city);
CREATE INDEX IF NOT EXISTS idx_sos_status ON public.sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
