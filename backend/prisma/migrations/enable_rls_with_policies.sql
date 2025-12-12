-- Enable Row Level Security (RLS) and create basic policies
-- This is a more complete solution that includes policies for your application

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."cargos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_locks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_pricings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_trackings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_report_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_report_pricings" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE POLICIES FOR SERVICE ROLE ACCESS
-- ============================================
-- These policies allow your backend application (using service_role key) to access all data
-- This is necessary because your Node.js backend uses Prisma with service_role credentials
--
-- IMPORTANT: If your DATABASE_URL uses service_role key, Prisma will bypass RLS automatically.
-- These policies are for PostgREST API access and to satisfy Security Advisor.

-- Drop existing policies if they exist (for idempotency)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "service_role_settings_all" ON "public"."settings";
  DROP POLICY IF EXISTS "service_role_cargos_all" ON "public"."cargos";
  DROP POLICY IF EXISTS "service_role_users_all" ON "public"."users";
  DROP POLICY IF EXISTS "service_role_orders_all" ON "public"."orders";
  DROP POLICY IF EXISTS "service_role_order_items_all" ON "public"."order_items";
  DROP POLICY IF EXISTS "service_role_order_locks_all" ON "public"."order_locks";
  DROP POLICY IF EXISTS "service_role_order_pricings_all" ON "public"."order_pricings";
  DROP POLICY IF EXISTS "service_role_order_payments_all" ON "public"."order_payments";
  DROP POLICY IF EXISTS "service_role_order_trackings_all" ON "public"."order_trackings";
  DROP POLICY IF EXISTS "service_role_order_reports_all" ON "public"."order_reports";
  DROP POLICY IF EXISTS "service_role_order_report_items_all" ON "public"."order_report_items";
  DROP POLICY IF EXISTS "service_role_order_report_pricings_all" ON "public"."order_report_pricings";
END $$;

-- Settings: Allow service role full access
CREATE POLICY "service_role_settings_all" ON "public"."settings"
  FOR ALL USING (auth.role() = 'service_role');

-- Cargos: Allow service role full access
CREATE POLICY "service_role_cargos_all" ON "public"."cargos"
  FOR ALL USING (auth.role() = 'service_role');

-- Users: Allow service role full access
CREATE POLICY "service_role_users_all" ON "public"."users"
  FOR ALL USING (auth.role() = 'service_role');

-- Orders: Allow service role full access
CREATE POLICY "service_role_orders_all" ON "public"."orders"
  FOR ALL USING (auth.role() = 'service_role');

-- Order Items: Allow service role full access
CREATE POLICY "service_role_order_items_all" ON "public"."order_items"
  FOR ALL USING (auth.role() = 'service_role');

-- Order Locks: Allow service role full access
CREATE POLICY "service_role_order_locks_all" ON "public"."order_locks"
  FOR ALL USING (auth.role() = 'service_role');

-- Order Pricings: Allow service role full access
CREATE POLICY "service_role_order_pricings_all" ON "public"."order_pricings"
  FOR ALL USING (auth.role() = 'service_role');

-- Order Payments: Allow service role full access
CREATE POLICY "service_role_order_payments_all" ON "public"."order_payments"
  FOR ALL USING (auth.role() = 'service_role');

-- Order Trackings: Allow service role full access
CREATE POLICY "service_role_order_trackings_all" ON "public"."order_trackings"
  FOR ALL USING (auth.role() = 'service_role');

-- Order Reports: Allow service role full access
CREATE POLICY "service_role_order_reports_all" ON "public"."order_reports"
  FOR ALL USING (auth.role() = 'service_role');

-- Order Report Items: Allow service role full access
CREATE POLICY "service_role_order_report_items_all" ON "public"."order_report_items"
  FOR ALL USING (auth.role() = 'service_role');

-- Order Report Pricings: Allow service role full access
CREATE POLICY "service_role_order_report_pricings_all" ON "public"."order_report_pricings"
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- OPTIONAL: _prisma_migrations table
-- ============================================
-- The _prisma_migrations table is a Prisma system table.
-- Security Advisor might flag it, but it's generally safe to leave without RLS.
-- If you want to enable RLS on it, uncomment the lines below:

-- ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "service_role_prisma_migrations_all" ON "public"."_prisma_migrations";
-- CREATE POLICY "service_role_prisma_migrations_all" ON "public"."_prisma_migrations"
--   FOR ALL USING (auth.role() = 'service_role');

