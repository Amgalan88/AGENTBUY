-- Enable Row Level Security (RLS) on remaining tables
-- This script addresses the remaining 13 RLS errors in Security Advisor

-- ============================================
-- ENABLE RLS ON REMAINING TABLES
-- ============================================

ALTER TABLE "public"."agent_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."card_request_payment_infos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."card_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."card_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."feedbacks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_ratings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."request_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."request_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE POLICIES FOR SERVICE ROLE ACCESS
-- ============================================
-- These policies allow your backend application (using service_role key) to access all data

-- Drop existing policies if they exist (for idempotency)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "service_role_agent_profiles_all" ON "public"."agent_profiles";
  DROP POLICY IF EXISTS "service_role_card_request_payment_infos_all" ON "public"."card_request_payment_infos";
  DROP POLICY IF EXISTS "service_role_card_requests_all" ON "public"."card_requests";
  DROP POLICY IF EXISTS "service_role_card_transactions_all" ON "public"."card_transactions";
  DROP POLICY IF EXISTS "service_role_chat_messages_all" ON "public"."chat_messages";
  DROP POLICY IF EXISTS "service_role_feedbacks_all" ON "public"."feedbacks";
  DROP POLICY IF EXISTS "service_role_order_comments_all" ON "public"."order_comments";
  DROP POLICY IF EXISTS "service_role_order_ratings_all" ON "public"."order_ratings";
  DROP POLICY IF EXISTS "service_role_payments_all" ON "public"."payments";
  DROP POLICY IF EXISTS "service_role_request_items_all" ON "public"."request_items";
  DROP POLICY IF EXISTS "service_role_request_reports_all" ON "public"."request_reports";
  DROP POLICY IF EXISTS "service_role_requests_all" ON "public"."requests";
  DROP POLICY IF EXISTS "service_role_prisma_migrations_all" ON "public"."_prisma_migrations";
END $$;

-- Agent Profiles: Allow service role full access
CREATE POLICY "service_role_agent_profiles_all" ON "public"."agent_profiles"
  FOR ALL USING (auth.role() = 'service_role');

-- Card Request Payment Infos: Allow service role full access
CREATE POLICY "service_role_card_request_payment_infos_all" ON "public"."card_request_payment_infos"
  FOR ALL USING (auth.role() = 'service_role');

-- Card Requests: Allow service role full access
CREATE POLICY "service_role_card_requests_all" ON "public"."card_requests"
  FOR ALL USING (auth.role() = 'service_role');

-- Card Transactions: Allow service role full access
CREATE POLICY "service_role_card_transactions_all" ON "public"."card_transactions"
  FOR ALL USING (auth.role() = 'service_role');

-- Chat Messages: Allow service role full access
CREATE POLICY "service_role_chat_messages_all" ON "public"."chat_messages"
  FOR ALL USING (auth.role() = 'service_role');

-- Feedbacks: Allow service role full access
CREATE POLICY "service_role_feedbacks_all" ON "public"."feedbacks"
  FOR ALL USING (auth.role() = 'service_role');

-- Order Comments: Allow service role full access
CREATE POLICY "service_role_order_comments_all" ON "public"."order_comments"
  FOR ALL USING (auth.role() = 'service_role');

-- Order Ratings: Allow service role full access
CREATE POLICY "service_role_order_ratings_all" ON "public"."order_ratings"
  FOR ALL USING (auth.role() = 'service_role');

-- Payments: Allow service role full access
CREATE POLICY "service_role_payments_all" ON "public"."payments"
  FOR ALL USING (auth.role() = 'service_role');

-- Request Items: Allow service role full access
CREATE POLICY "service_role_request_items_all" ON "public"."request_items"
  FOR ALL USING (auth.role() = 'service_role');

-- Request Reports: Allow service role full access
CREATE POLICY "service_role_request_reports_all" ON "public"."request_reports"
  FOR ALL USING (auth.role() = 'service_role');

-- Requests: Allow service role full access
CREATE POLICY "service_role_requests_all" ON "public"."requests"
  FOR ALL USING (auth.role() = 'service_role');

-- Prisma Migrations: Allow service role full access
CREATE POLICY "service_role_prisma_migrations_all" ON "public"."_prisma_migrations"
  FOR ALL USING (auth.role() = 'service_role');

