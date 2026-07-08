/*
# SkillBridge Core Schema — Users, Profiles, KYC, Jobs, Bids

## Overview
Creates the foundational tables for the SkillBridge technician marketplace platform.

## New Tables
1. **users** — Platform users (clients, technicians, store owners, admins). Uses Supabase auth.users via a profile table pattern.
2. **technician_profiles** — Extended profile data for technicians (trade, rate, tier, rating, location, skills).
3. **kyc_verifications** — KYC verification records for technicians (NIN, ID document, selfie, approval status).
4. **jobs** — Job postings by clients (title, trade, budget, status, location, assigned technician).
5. **bids** — Bids placed by technicians on open jobs.

## Security
- RLS enabled on all tables.
- Users can read all public profile data (technician profiles, jobs, bids).
- Users can only modify their own data.
- KYC data is private to the owning user + admins.
*/

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE NOT NULL,
  email text UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL CHECK(role IN ('client','technician','store_owner','admin')),
  avatar_url text,
  is_phone_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_all" ON public.users;
CREATE POLICY "users_select_all" ON public.users FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own" ON public.users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Technician profiles
CREATE TABLE IF NOT EXISTS public.technician_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  trade text NOT NULL,
  bio text,
  hourly_rate integer DEFAULT 0,
  tier text DEFAULT 'standard' CHECK(tier IN ('standard','certified','elite')),
  rating real DEFAULT 0,
  total_reviews integer DEFAULT 0,
  total_jobs integer DEFAULT 0,
  completion_rate real DEFAULT 100,
  response_time_minutes integer DEFAULT 30,
  is_available boolean DEFAULT true,
  city text DEFAULT 'Lagos',
  lat real,
  lng real,
  skills text,
  years_experience integer DEFAULT 1,
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.technician_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tech_profiles_select_all" ON public.technician_profiles;
CREATE POLICY "tech_profiles_select_all" ON public.technician_profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "tech_profiles_insert_own" ON public.technician_profiles;
CREATE POLICY "tech_profiles_insert_own" ON public.technician_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tech_profiles_update_own" ON public.technician_profiles;
CREATE POLICY "tech_profiles_update_own" ON public.technician_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- KYC verifications
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  status text DEFAULT 'not_submitted' CHECK(status IN ('not_submitted','pending','approved','rejected')),
  id_type text,
  nin_hash text,
  id_document_url text,
  selfie_url text,
  rejection_reason text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id)
);

ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kyc_select_own" ON public.kyc_verifications;
CREATE POLICY "kyc_select_own" ON public.kyc_verifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

DROP POLICY IF EXISTS "kyc_insert_own" ON public.kyc_verifications;
CREATE POLICY "kyc_insert_own" ON public.kyc_verifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "kyc_update_own_or_admin" ON public.kyc_verifications;
CREATE POLICY "kyc_update_own_or_admin" ON public.kyc_verifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- Jobs
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  technician_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  trade text NOT NULL,
  description text,
  location_text text,
  lat real,
  lng real,
  budget_min integer,
  agreed_amount integer,
  status text DEFAULT 'open' CHECK(status IN ('open','bidding','in_progress','client_confirmed','tech_confirmed','completed','disputed','cancelled')),
  is_urgent boolean DEFAULT false,
  scheduled_date text,
  started_at timestamptz,
  completed_at timestamptz,
  photos text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jobs_select_all" ON public.jobs;
CREATE POLICY "jobs_select_all" ON public.jobs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "jobs_insert_own" ON public.jobs;
CREATE POLICY "jobs_insert_own" ON public.jobs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "jobs_update_own_or_assigned" ON public.jobs;
CREATE POLICY "jobs_update_own_or_assigned" ON public.jobs FOR UPDATE
  TO authenticated USING (auth.uid() = client_id OR auth.uid() = technician_id) WITH CHECK (auth.uid() = client_id OR auth.uid() = technician_id);

-- Bids
CREATE TABLE IF NOT EXISTS public.bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  technician_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  estimated_hours real,
  message text,
  status text DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','withdrawn')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bids_select_all" ON public.bids;
CREATE POLICY "bids_select_all" ON public.bids FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "bids_insert_own" ON public.bids;
CREATE POLICY "bids_insert_own" ON public.bids FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = technician_id);

DROP POLICY IF EXISTS "bids_update_own" ON public.bids;
CREATE POLICY "bids_update_own" ON public.bids FOR UPDATE
  TO authenticated USING (auth.uid() = technician_id OR EXISTS (
    SELECT 1 FROM public.jobs j WHERE j.id = bids.job_id AND j.client_id = auth.uid()
  )) WITH CHECK (auth.uid() = technician_id OR EXISTS (
    SELECT 1 FROM public.jobs j WHERE j.id = bids.job_id AND j.client_id = auth.uid()
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_trade ON public.jobs(trade);
CREATE INDEX IF NOT EXISTS idx_jobs_client ON public.jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_bids_job ON public.bids(job_id);
CREATE INDEX IF NOT EXISTS idx_bids_tech ON public.bids(technician_id);
CREATE INDEX IF NOT EXISTS idx_tech_profiles_trade ON public.technician_profiles(trade);
CREATE INDEX IF NOT EXISTS idx_tech_profiles_city ON public.technician_profiles(city);
