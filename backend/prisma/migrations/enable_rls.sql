-- Enable Row Level Security (RLS) on all public tables
-- This migration addresses Supabase Security Advisor warnings

-- Enable RLS on settings table
ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on cargos table
ALTER TABLE "public"."cargos" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on orders table
ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_items table
ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_locks table
ALTER TABLE "public"."order_locks" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_pricings table
ALTER TABLE "public"."order_pricings" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_payments table
ALTER TABLE "public"."order_payments" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_trackings table
ALTER TABLE "public"."order_trackings" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_reports table
ALTER TABLE "public"."order_reports" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_report_items table
ALTER TABLE "public"."order_report_items" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_report_pricings table
ALTER TABLE "public"."order_report_pricings" ENABLE ROW LEVEL SECURITY;

-- Note: _prisma_migrations table is a Prisma system table
-- It's recommended to keep it without RLS or create a service role policy
-- If you want to enable RLS on it, uncomment the line below:
-- ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: After enabling RLS, you need to create policies for each table
-- to allow your application to access the data. Without policies, all queries will be denied.
-- 
-- Example policy for users table (adjust based on your needs):
-- CREATE POLICY "Users can view their own data" ON "public"."users"
--   FOR SELECT USING (auth.uid()::text = id);
--
-- CREATE POLICY "Service role can do everything" ON "public"."users"
--   FOR ALL USING (auth.role() = 'service_role');

