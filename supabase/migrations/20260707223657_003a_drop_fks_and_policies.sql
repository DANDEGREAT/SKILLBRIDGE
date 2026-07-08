/*
# Convert users table to custom auth (no Supabase auth dependency) - Step 1: Drop FKs and policies

## Overview
Drops all FK constraints and RLS policies so we can alter column types from uuid to text.
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "tech_profiles_select_all" ON public.technician_profiles;
DROP POLICY IF EXISTS "tech_profiles_insert_own" ON public.technician_profiles;
DROP POLICY IF EXISTS "tech_profiles_update_own" ON public.technician_profiles;
DROP POLICY IF EXISTS "kyc_select_own" ON public.kyc_verifications;
DROP POLICY IF EXISTS "kyc_insert_own" ON public.kyc_verifications;
DROP POLICY IF EXISTS "kyc_update_own_or_admin" ON public.kyc_verifications;
DROP POLICY IF EXISTS "jobs_select_all" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert_own" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update_own_or_assigned" ON public.jobs;
DROP POLICY IF EXISTS "bids_select_all" ON public.bids;
DROP POLICY IF EXISTS "bids_insert_own" ON public.bids;
DROP POLICY IF EXISTS "bids_update_own" ON public.bids;
DROP POLICY IF EXISTS "payments_select_parties" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
DROP POLICY IF EXISTS "payments_update_parties" ON public.payments;
DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
DROP POLICY IF EXISTS "chat_rooms_select_parties" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_insert_parties" ON public.chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_update_parties" ON public.chat_rooms;
DROP POLICY IF EXISTS "messages_select_parties" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_parties" ON public.messages;
DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
DROP POLICY IF EXISTS "message_reads_select_parties" ON public.message_reads;
DROP POLICY IF EXISTS "message_reads_insert_parties" ON public.message_reads;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "shops_select_all" ON public.shops;
DROP POLICY IF EXISTS "shops_insert_own" ON public.shops;
DROP POLICY IF EXISTS "shops_update_own" ON public.shops;
DROP POLICY IF EXISTS "sos_select_all" ON public.sos_alerts;
DROP POLICY IF EXISTS "sos_insert_own" ON public.sos_alerts;
DROP POLICY IF EXISTS "sos_update_admin" ON public.sos_alerts;
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_own" ON public.subscriptions;
DROP POLICY IF EXISTS "disputes_select_parties" ON public.disputes;
DROP POLICY IF EXISTS "disputes_insert_own" ON public.disputes;
DROP POLICY IF EXISTS "disputes_update_admin" ON public.disputes;

-- Drop ALL FK constraints
ALTER TABLE public.technician_profiles DROP CONSTRAINT IF EXISTS technician_profiles_user_id_fkey;
ALTER TABLE public.kyc_verifications DROP CONSTRAINT IF EXISTS kyc_verifications_user_id_fkey;
ALTER TABLE public.kyc_verifications DROP CONSTRAINT IF EXISTS kyc_verifications_reviewed_by_fkey;
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_client_id_fkey;
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_technician_id_fkey;
ALTER TABLE public.bids DROP CONSTRAINT IF EXISTS bids_job_id_fkey;
ALTER TABLE public.bids DROP CONSTRAINT IF EXISTS bids_technician_id_fkey;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_job_id_fkey;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_client_id_fkey;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_technician_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_job_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_technician_id_fkey;
ALTER TABLE public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_job_id_fkey;
ALTER TABLE public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_client_id_fkey;
ALTER TABLE public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_tech_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_room_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_reply_to_id_fkey;
ALTER TABLE public.message_reads DROP CONSTRAINT IF EXISTS message_reads_message_id_fkey;
ALTER TABLE public.message_reads DROP CONSTRAINT IF EXISTS message_reads_user_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.shops DROP CONSTRAINT IF EXISTS shops_owner_id_fkey;
ALTER TABLE public.sos_alerts DROP CONSTRAINT IF EXISTS sos_alerts_job_id_fkey;
ALTER TABLE public.sos_alerts DROP CONSTRAINT IF EXISTS sos_alerts_triggered_by_fkey;
ALTER TABLE public.sos_alerts DROP CONSTRAINT IF EXISTS sos_alerts_resolved_by_fkey;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS disputes_job_id_fkey;
ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS disputes_raised_by_fkey;
ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS disputes_against_fkey;
ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS disputes_resolved_by_fkey;

-- Drop the users FK to auth.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
