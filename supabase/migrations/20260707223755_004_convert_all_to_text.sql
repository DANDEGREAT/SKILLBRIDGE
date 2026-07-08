/*
# Convert all PK/FK columns from uuid to text - Complete

## Overview
Drops all FK and PK constraints, alters all uuid columns to text, then recreates all constraints.
*/

-- Step 1: Drop ALL FK constraints
ALTER TABLE public.technician_profiles DROP CONSTRAINT IF EXISTS technician_profiles_user_id_fkey;
ALTER TABLE public.kyc_verifications DROP CONSTRAINT IF EXISTS kyc_verifications_user_id_fkey;
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

-- Step 2: Drop PK constraints
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE public.technician_profiles DROP CONSTRAINT IF EXISTS technician_profiles_pkey;
ALTER TABLE public.kyc_verifications DROP CONSTRAINT IF EXISTS kyc_verifications_pkey;
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_pkey;
ALTER TABLE public.bids DROP CONSTRAINT IF EXISTS bids_pkey;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_pkey;
ALTER TABLE public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_pkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE public.message_reads DROP CONSTRAINT IF EXISTS message_reads_pkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE public.shops DROP CONSTRAINT IF EXISTS shops_pkey;
ALTER TABLE public.sos_alerts DROP CONSTRAINT IF EXISTS sos_alerts_pkey;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pkey;
ALTER TABLE public.disputes DROP CONSTRAINT IF EXISTS disputes_pkey;

-- Step 3: Alter all columns from uuid to text
ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.technician_profiles ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.technician_profiles ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.kyc_verifications ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.kyc_verifications ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.kyc_verifications ALTER COLUMN reviewed_by TYPE text USING reviewed_by::text;
ALTER TABLE public.jobs ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.jobs ALTER COLUMN client_id TYPE text USING client_id::text;
ALTER TABLE public.jobs ALTER COLUMN technician_id TYPE text USING technician_id::text;
ALTER TABLE public.bids ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.bids ALTER COLUMN job_id TYPE text USING job_id::text;
ALTER TABLE public.bids ALTER COLUMN technician_id TYPE text USING technician_id::text;
ALTER TABLE public.payments ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.payments ALTER COLUMN job_id TYPE text USING job_id::text;
ALTER TABLE public.payments ALTER COLUMN client_id TYPE text USING client_id::text;
ALTER TABLE public.payments ALTER COLUMN technician_id TYPE text USING technician_id::text;
ALTER TABLE public.reviews ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.reviews ALTER COLUMN job_id TYPE text USING job_id::text;
ALTER TABLE public.reviews ALTER COLUMN reviewer_id TYPE text USING reviewer_id::text;
ALTER TABLE public.reviews ALTER COLUMN technician_id TYPE text USING technician_id::text;
ALTER TABLE public.chat_rooms ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.chat_rooms ALTER COLUMN job_id TYPE text USING job_id::text;
ALTER TABLE public.chat_rooms ALTER COLUMN client_id TYPE text USING client_id::text;
ALTER TABLE public.chat_rooms ALTER COLUMN tech_id TYPE text USING tech_id::text;
ALTER TABLE public.messages ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.messages ALTER COLUMN room_id TYPE text USING room_id::text;
ALTER TABLE public.messages ALTER COLUMN sender_id TYPE text USING sender_id::text;
ALTER TABLE public.messages ALTER COLUMN reply_to_id TYPE text USING reply_to_id::text;
ALTER TABLE public.message_reads ALTER COLUMN message_id TYPE text USING message_id::text;
ALTER TABLE public.message_reads ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.notifications ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.notifications ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.shops ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.shops ALTER COLUMN owner_id TYPE text USING owner_id::text;
ALTER TABLE public.sos_alerts ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.sos_alerts ALTER COLUMN job_id TYPE text USING job_id::text;
ALTER TABLE public.sos_alerts ALTER COLUMN triggered_by TYPE text USING triggered_by::text;
ALTER TABLE public.sos_alerts ALTER COLUMN resolved_by TYPE text USING resolved_by::text;
ALTER TABLE public.subscriptions ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.subscriptions ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.disputes ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.disputes ALTER COLUMN job_id TYPE text USING job_id::text;
ALTER TABLE public.disputes ALTER COLUMN raised_by TYPE text USING raised_by::text;
ALTER TABLE public.disputes ALTER COLUMN against TYPE text USING against::text;
ALTER TABLE public.disputes ALTER COLUMN resolved_by TYPE text USING resolved_by::text;

-- Step 4: Recreate PKs
ALTER TABLE public.users ADD PRIMARY KEY (id);
ALTER TABLE public.technician_profiles ADD PRIMARY KEY (id);
ALTER TABLE public.kyc_verifications ADD PRIMARY KEY (id);
ALTER TABLE public.jobs ADD PRIMARY KEY (id);
ALTER TABLE public.bids ADD PRIMARY KEY (id);
ALTER TABLE public.payments ADD PRIMARY KEY (id);
ALTER TABLE public.reviews ADD PRIMARY KEY (id);
ALTER TABLE public.chat_rooms ADD PRIMARY KEY (id);
ALTER TABLE public.messages ADD PRIMARY KEY (id);
ALTER TABLE public.message_reads ADD PRIMARY KEY (message_id, user_id);
ALTER TABLE public.notifications ADD PRIMARY KEY (id);
ALTER TABLE public.shops ADD PRIMARY KEY (id);
ALTER TABLE public.sos_alerts ADD PRIMARY KEY (id);
ALTER TABLE public.subscriptions ADD PRIMARY KEY (id);
ALTER TABLE public.disputes ADD PRIMARY KEY (id);

-- Step 5: Recreate FKs
ALTER TABLE public.technician_profiles ADD CONSTRAINT technician_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.kyc_verifications ADD CONSTRAINT kyc_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.bids ADD CONSTRAINT bids_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
ALTER TABLE public.bids ADD CONSTRAINT bids_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD CONSTRAINT payments_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD CONSTRAINT payments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD CONSTRAINT payments_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.chat_rooms ADD CONSTRAINT chat_rooms_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
ALTER TABLE public.chat_rooms ADD CONSTRAINT chat_rooms_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.chat_rooms ADD CONSTRAINT chat_rooms_tech_id_fkey FOREIGN KEY (tech_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.messages(id) ON DELETE SET NULL;
ALTER TABLE public.message_reads ADD CONSTRAINT message_reads_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;
ALTER TABLE public.message_reads ADD CONSTRAINT message_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.shops ADD CONSTRAINT shops_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.sos_alerts ADD CONSTRAINT sos_alerts_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;
ALTER TABLE public.sos_alerts ADD CONSTRAINT sos_alerts_triggered_by_fkey FOREIGN KEY (triggered_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.disputes ADD CONSTRAINT disputes_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
ALTER TABLE public.disputes ADD CONSTRAINT disputes_raised_by_fkey FOREIGN KEY (raised_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.disputes ADD CONSTRAINT disputes_against_fkey FOREIGN KEY (against) REFERENCES public.users(id) ON DELETE SET NULL;
