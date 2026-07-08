/*
# Convert column types from uuid to text - Step 2

## Overview
Alters all id and FK columns from uuid to text to support custom auth without Supabase auth.users dependency.
*/

-- Alter users.id from uuid to text
ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;

-- Alter all FK columns from uuid to text
ALTER TABLE public.technician_profiles ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.kyc_verifications ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.kyc_verifications ALTER COLUMN reviewed_by TYPE text USING reviewed_by::text;
ALTER TABLE public.jobs ALTER COLUMN client_id TYPE text USING client_id::text;
ALTER TABLE public.jobs ALTER COLUMN technician_id TYPE text USING technician_id::text;
ALTER TABLE public.bids ALTER COLUMN technician_id TYPE text USING technician_id::text;
ALTER TABLE public.payments ALTER COLUMN client_id TYPE text USING client_id::text;
ALTER TABLE public.payments ALTER COLUMN technician_id TYPE text USING technician_id::text;
ALTER TABLE public.reviews ALTER COLUMN reviewer_id TYPE text USING reviewer_id::text;
ALTER TABLE public.reviews ALTER COLUMN technician_id TYPE text USING technician_id::text;
ALTER TABLE public.chat_rooms ALTER COLUMN client_id TYPE text USING client_id::text;
ALTER TABLE public.chat_rooms ALTER COLUMN tech_id TYPE text USING tech_id::text;
ALTER TABLE public.messages ALTER COLUMN sender_id TYPE text USING sender_id::text;
ALTER TABLE public.message_reads ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.notifications ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.shops ALTER COLUMN owner_id TYPE text USING owner_id::text;
ALTER TABLE public.sos_alerts ALTER COLUMN triggered_by TYPE text USING triggered_by::text;
ALTER TABLE public.sos_alerts ALTER COLUMN resolved_by TYPE text USING resolved_by::text;
ALTER TABLE public.subscriptions ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.disputes ALTER COLUMN raised_by TYPE text USING raised_by::text;
ALTER TABLE public.disputes ALTER COLUMN against TYPE text USING against::text;
ALTER TABLE public.disputes ALTER COLUMN resolved_by TYPE text USING resolved_by::text;

-- Also change messages.reply_to_id
ALTER TABLE public.messages ALTER COLUMN reply_to_id TYPE text USING reply_to_id::text;

-- Recreate FK constraints with text types
ALTER TABLE public.technician_profiles ADD CONSTRAINT technician_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.kyc_verifications ADD CONSTRAINT kyc_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.bids ADD CONSTRAINT bids_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
ALTER TABLE public.bids ADD CONSTRAINT bids_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD CONSTRAINT payments_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;
ALTER TABLE public.chat_rooms ADD CONSTRAINT chat_rooms_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.shops ADD CONSTRAINT shops_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.disputes ADD CONSTRAINT disputes_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

-- Recreate RLS policies (open access for demo app with custom auth)
CREATE POLICY "users_select_all" ON public.users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "users_insert_all" ON public.users FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "users_update_all" ON public.users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "tech_profiles_select_all" ON public.technician_profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tech_profiles_insert_all" ON public.technician_profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "tech_profiles_update_all" ON public.technician_profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "kyc_select_all" ON public.kyc_verifications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "kyc_insert_all" ON public.kyc_verifications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "kyc_update_all" ON public.kyc_verifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "jobs_select_all" ON public.jobs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "jobs_insert_all" ON public.jobs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "jobs_update_all" ON public.jobs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "bids_select_all" ON public.bids FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "bids_insert_all" ON public.bids FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "bids_update_all" ON public.bids FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "payments_select_all" ON public.payments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "payments_insert_all" ON public.payments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "payments_update_all" ON public.payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "reviews_insert_all" ON public.reviews FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "chat_rooms_select_all" ON public.chat_rooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "chat_rooms_insert_all" ON public.chat_rooms FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "chat_rooms_update_all" ON public.chat_rooms FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "messages_select_all" ON public.messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "messages_insert_all" ON public.messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "messages_update_all" ON public.messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "message_reads_select_all" ON public.message_reads FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "message_reads_insert_all" ON public.message_reads FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "notifications_select_all" ON public.notifications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "notifications_insert_all" ON public.notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "notifications_update_all" ON public.notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "shops_select_all" ON public.shops FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "shops_insert_all" ON public.shops FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "shops_update_all" ON public.shops FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "sos_select_all" ON public.sos_alerts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sos_insert_all" ON public.sos_alerts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "sos_update_all" ON public.sos_alerts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "subscriptions_select_all" ON public.subscriptions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "subscriptions_insert_all" ON public.subscriptions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "subscriptions_update_all" ON public.subscriptions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "disputes_select_all" ON public.disputes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "disputes_insert_all" ON public.disputes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "disputes_update_all" ON public.disputes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
