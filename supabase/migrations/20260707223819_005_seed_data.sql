/*
# SkillBridge Seed Data

## Overview
Seeds demo users, technician profiles, KYC records, jobs, bids, chat rooms, messages, reviews, payments, shops, subscriptions, and notifications.
*/

-- Add password_hash column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash text NOT NULL DEFAULT '';

-- Users
INSERT INTO public.users (id, phone, email, password_hash, first_name, last_name, role, is_phone_verified, is_active, created_at)
VALUES
  ('u-admin-001', '08000000000', 'admin@skillbridge.ng', 'admin123', 'Admin', 'User', 'admin', true, true, now() - interval '90 days'),
  ('u-client-001', '08011111111', 'bola@skillbridge.ng', 'client123', 'Bola', 'Adeyemi', 'client', true, true, now() - interval '30 days'),
  ('u-tech-001', '08022222222', 'ade@skillbridge.ng', 'tech123', 'Ade', 'Kosoko', 'technician', true, true, now() - interval '60 days'),
  ('u-tech-002', '08033333333', 'bisi@skillbridge.ng', 'tech123', 'Bisi', 'Okafor', 'technician', true, true, now() - interval '55 days'),
  ('u-tech-003', '08044444444', 'funke@skillbridge.ng', 'tech123', 'Funke', 'Adebayo', 'technician', true, true, now() - interval '45 days'),
  ('u-tech-004', '08055555555', 'tunde@skillbridge.ng', 'tech123', 'Tunde', 'Bakare', 'technician', true, true, now() - interval '40 days'),
  ('u-tech-005', '08077777777', 'emeka@skillbridge.ng', 'tech123', 'Emeka', 'Nwosu', 'technician', true, true, now() - interval '35 days'),
  ('u-store-001', '08066666666', 'volta@skillbridge.ng', 'store123', 'Volta', 'Admin', 'store_owner', true, true, now() - interval '50 days')
ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, role = EXCLUDED.role;

-- Technician profiles
INSERT INTO public.technician_profiles (id, user_id, trade, bio, hourly_rate, tier, rating, total_reviews, total_jobs, completion_rate, response_time_minutes, is_available, city, lat, lng, skills, years_experience, is_premium)
VALUES
  ('tp-001', 'u-tech-001', 'Electrician', 'Certified electrician with 12 years experience in residential and commercial wiring. Specialist in solar installations and fault diagnosis.', 5000, 'certified', 4.9, 83, 83, 100, 15, true, 'Lagos', 6.5075, 3.3725, 'Wiring,Solar,Inverter,Fault Finding,Circuit Breaker', 12, true),
  ('tp-002', 'u-tech-002', 'Plumber', 'Professional plumber with expertise in pipe fitting, water heater installation, and drainage systems. 10 years serving Lagos mainland.', 4000, 'certified', 4.7, 61, 61, 98, 20, true, 'Lagos', 6.5244, 3.3792, 'Pipe Fitting,Water Heater,Drainage,Bathroom Fitting', 10, false),
  ('tp-003', 'u-tech-003', 'AC & Cooling', 'AC technician specialising in installation, servicing, and gas refilling for split and window units. Fast response across Lagos Island.', 4500, 'standard', 4.8, 47, 47, 97, 25, true, 'Lagos', 6.4281, 3.4219, 'AC Install,Gas Refill,Servicing,Split Unit,Window Unit', 8, false),
  ('tp-004', 'u-tech-004', 'Carpenter', 'Master carpenter crafting custom furniture, doors, and cabinetry. 15 years of fine woodworking experience.', 3500, 'standard', 4.6, 39, 39, 96, 30, false, 'Lagos', 6.6018, 3.3515, 'Furniture,Doors,Cabinetry,Roofing,Wood Flooring', 15, false),
  ('tp-005', 'u-tech-005', 'Mason', 'Experienced mason for block work, plastering, tiling, and concrete structures. Reliable and detail-oriented.', 3000, 'certified', 4.5, 28, 28, 95, 35, true, 'Lagos', 6.4541, 3.3947, 'Block Work,Plastering,Tiling,Concrete,Foundation', 7, false)
ON CONFLICT (user_id) DO UPDATE SET trade = EXCLUDED.trade, bio = EXCLUDED.bio, hourly_rate = EXCLUDED.hourly_rate, tier = EXCLUDED.tier, rating = EXCLUDED.rating, total_reviews = EXCLUDED.total_reviews, total_jobs = EXCLUDED.total_jobs;

-- KYC records
INSERT INTO public.kyc_verifications (id, user_id, status, id_type, nin_hash, submitted_at, reviewed_at, reviewed_by)
VALUES
  ('kyc-001', 'u-tech-001', 'approved', 'NIN', 'hash_ade_12345678901', now() - interval '58 days', now() - interval '55 days', 'u-admin-001'),
  ('kyc-002', 'u-tech-002', 'approved', 'NIN', 'hash_bisi_12345678901', now() - interval '53 days', now() - interval '50 days', 'u-admin-001'),
  ('kyc-003', 'u-tech-003', 'pending', 'NIN', 'hash_funke_12345678901', now() - interval '2 days', null, null),
  ('kyc-004', 'u-tech-004', 'pending', 'Driver License', 'hash_tunde_12345678901', now() - interval '1 day', null, null),
  ('kyc-005', 'u-tech-005', 'approved', 'NIN', 'hash_emeka_12345678901', now() - interval '33 days', now() - interval '30 days', 'u-admin-001')
ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status, id_type = EXCLUDED.id_type;

-- Jobs
INSERT INTO public.jobs (id, client_id, technician_id, title, trade, description, location_text, lat, lng, budget_min, agreed_amount, status, is_urgent, created_at, started_at, completed_at)
VALUES
  ('job-001', 'u-client-001', 'u-tech-001', 'Complete house rewiring - 3 bedroom bungalow', 'Electrician', 'Need full rewiring of a 3 bedroom bungalow in Lekki. Includes new distribution board, all room wiring, socket installation, and solar inverter connection. Materials will be provided by client.', 'Lekki Phase 1, Lagos', 6.4541, 3.4747, 150000, 175000, 'in_progress', false, now() - interval '5 days', now() - interval '3 days', null),
  ('job-002', 'u-client-001', null, 'Bathroom pipe leakage repair', 'Plumber', 'Water leaking from bathroom pipe under the sink. Need urgent repair before it damages the cabinet. Pipe is PVC.', 'Surulere, Lagos', 6.5075, 3.3610, 15000, null, 'open', true, now() - interval '2 hours', null, null),
  ('job-003', null, null, 'AC servicing for 4 split units', 'AC & Cooling', 'Need servicing and gas refill for 4 split unit ACs in an office in Victoria Island. All units are 1.5HP.', 'Victoria Island, Lagos', 6.4281, 3.4219, 40000, null, 'bidding', false, now() - interval '1 day', null, null),
  ('job-004', null, null, 'Custom wardrobe and door installation', 'Carpenter', 'Need a 3-door wardrobe built and installed in master bedroom, plus 2 internal doors hung. Measurements already taken.', 'Yaba, Lagos', 6.5075, 3.3725, 80000, null, 'open', false, now() - interval '6 hours', null, null),
  ('job-005', 'u-client-001', 'u-tech-001', 'Solar inverter installation', 'Electrician', 'Installed 3.5KVA solar inverter system with 4 batteries. Job completed successfully and client was very satisfied.', 'Ikoyi, Lagos', 6.4541, 3.4470, 200000, 220000, 'completed', false, now() - interval '20 days', now() - interval '18 days', now() - interval '15 days'),
  ('job-006', 'u-client-001', 'u-tech-001', 'Socket and switch replacement', 'Electrician', 'Replaced all old sockets and switches in a 2 bedroom flat. 15 sockets and 10 switches replaced with new ones.', 'Lekki Phase 1, Lagos', 6.4541, 3.4747, 35000, 38000, 'completed', false, now() - interval '40 days', now() - interval '38 days', now() - interval '35 days')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status;

-- Bids
INSERT INTO public.bids (id, job_id, technician_id, amount, estimated_hours, message, status, created_at)
VALUES
  ('bid-001', 'job-001', 'u-tech-001', 175000, 24, 'I have extensive experience with full house rewiring. I can complete this in 3 days with a clean installation. Solar inverter connection included.', 'accepted', now() - interval '4 days'),
  ('bid-002', 'job-002', 'u-tech-002', 15000, 2, 'Quick fix. I can come today and sort the leakage. PVC pipe repair is straightforward.', 'pending', now() - interval '1 hour'),
  ('bid-003', 'job-003', 'u-tech-003', 40000, 4, 'I can service all 4 units and refill gas. Each unit will take about 1 hour.', 'pending', now() - interval '20 hours'),
  ('bid-004', 'job-004', 'u-tech-004', 80000, 16, 'I can build the wardrobe and install the doors. I will need 2 days for the wardrobe and half a day for the doors.', 'pending', now() - interval '5 hours'),
  ('bid-005', 'job-001', 'u-tech-005', 165000, 20, 'I can do the rewiring at a competitive rate. I have all the tools needed.', 'rejected', now() - interval '4 days')
ON CONFLICT (id) DO UPDATE SET amount = EXCLUDED.amount, status = EXCLUDED.status;

-- Chat room
INSERT INTO public.chat_rooms (id, job_id, client_id, tech_id, last_message_at, created_at)
VALUES ('room-001', 'job-001', 'u-client-001', 'u-tech-001', now() - interval '1 hour', now() - interval '4 days')
ON CONFLICT (job_id) DO UPDATE SET last_message_at = EXCLUDED.last_message_at;

-- Messages
INSERT INTO public.messages (id, room_id, sender_id, content, type, created_at)
VALUES
  ('msg-001', 'room-001', 'u-client-001', 'Hello Ade, I have accepted your bid for the rewiring job. When can you start?', 'text', now() - interval '4 days'),
  ('msg-002', 'room-001', 'u-tech-001', 'Thank you Bola. I can start tomorrow morning at 8 AM. I will bring my team and all the tools.', 'text', now() - interval '4 days'),
  ('msg-003', 'room-001', 'u-client-001', 'Perfect. The gate code is 1234. Please let yourself in when you arrive.', 'text', now() - interval '3 days'),
  ('msg-004', 'room-001', 'u-tech-001', 'I have started the work. The old wiring is being removed. Should take about 3 days as estimated.', 'job_update', now() - interval '3 days'),
  ('msg-005', 'room-001', 'u-client-001', 'Great, thank you for the update. Let me know if you need anything.', 'text', now() - interval '2 days'),
  ('msg-006', 'room-001', 'u-tech-001', 'The new distribution board is installed and all room wiring is 70% complete. We are on track to finish by Friday.', 'text', now() - interval '1 hour')
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;

-- Reviews
INSERT INTO public.reviews (id, job_id, reviewer_id, technician_id, rating, comment, is_verified, created_at)
VALUES
  ('rev-001', 'job-005', 'u-client-001', 'u-tech-001', 5, 'Excellent work on the solar inverter installation. Ade was professional, punctual, and the quality of work is outstanding. Highly recommended!', true, now() - interval '14 days'),
  ('rev-002', 'job-006', 'u-client-001', 'u-tech-001', 5, 'Ade replaced all sockets and switches in my flat. Clean work, no mess left behind. Will definitely hire again.', true, now() - interval '34 days'),
  ('rev-003', 'job-001', 'u-client-001', 'u-tech-001', 5, 'The rewiring job is going very well so far. Ade is thorough and keeps me updated on progress.', true, now() - interval '1 hour')
ON CONFLICT (job_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment;

-- Payment
INSERT INTO public.payments (id, job_id, client_id, technician_id, amount, platform_fee, technician_payout, reference, paystack_ref, status, payment_method, held_at, created_at)
VALUES ('pay-001', 'job-001', 'u-client-001', 'u-tech-001', 175000, 8750, 166250, 'SB-175000-001', 'psk_001', 'held', 'card', now() - interval '3 days', now() - interval '3 days')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- Shop
INSERT INTO public.shops (id, owner_id, name, category, city, address, description, phone, rating, total_quotes, delivery_available, delivery_radius_km, is_verified, is_active, created_at)
VALUES ('shop-001', 'u-store-001', 'Volta Electrical Supplies', 'Electrical', 'Lagos', '12 Adeola Odeku Street, Victoria Island, Lagos', 'Your one-stop shop for all electrical materials. Cables, switches, distribution boards, solar panels, inverters, and more. Quality guaranteed with competitive prices.', '08066666666', 4.8, 45, true, 15, true, true, now() - interval '50 days')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Subscriptions
INSERT INTO public.subscriptions (id, user_id, plan, price, started_at, expires_at, is_active)
VALUES
  ('sub-001', 'u-tech-001', 'premium', 3500, now() - interval '30 days', now() + interval '335 days', true),
  ('sub-002', 'u-tech-002', 'basic', 0, now() - interval '55 days', null, true),
  ('sub-003', 'u-tech-003', 'basic', 0, now() - interval '45 days', null, true),
  ('sub-004', 'u-tech-004', 'basic', 0, now() - interval '40 days', null, true),
  ('sub-005', 'u-tech-005', 'basic', 0, now() - interval '35 days', null, true)
ON CONFLICT (user_id) DO UPDATE SET plan = EXCLUDED.plan;

-- Notifications
INSERT INTO public.notifications (id, user_id, title, body, type, reference_id, reference_type, is_read, created_at)
VALUES
  ('not-001', 'u-client-001', 'New message from Ade', 'Ade sent you a message about the rewiring job', 'message', 'job-001', 'job', false, now() - interval '1 hour'),
  ('not-002', 'u-client-001', 'Bid accepted', 'You accepted Ade bid for the rewiring job', 'job', 'job-001', 'job', true, now() - interval '4 days'),
  ('not-003', 'u-client-001', 'Payment held in escrow', 'Your payment of N175,000 is held securely in escrow', 'payment', 'pay-001', 'payment', true, now() - interval '3 days'),
  ('not-004', 'u-tech-001', 'Bid accepted', 'Bola accepted your bid for the rewiring job', 'job', 'job-001', 'job', true, now() - interval '4 days'),
  ('not-005', 'u-tech-001', 'Payment received', 'N175,000 is held in escrow for your job', 'payment', 'pay-001', 'payment', true, now() - interval '3 days'),
  ('not-006', 'u-tech-001', 'New job available', 'A new Plumbing job has been posted in your area', 'job', 'job-002', 'job', false, now() - interval '2 hours')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;
