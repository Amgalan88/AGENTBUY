# 🔒 Supabase RLS Алдааг Засах - Одоо Хийх

## 🚨 Олдсон Асуудал:

Supabase Dashboard дээр **"25 issues need attention"** гэж харагдаж байна:
- Row Level Security (RLS) тохируулаагүй байна
- Олон table-ууд дээр RLS идэвхгүй байна

## ✅ Засах Алхмууд (5 минут):

### Алхам 1: Supabase SQL Editor руу орох

1. **Supabase Dashboard** → **AGENTBUY** project
2. Зүүн талын цэснээс **SQL Editor** сонгох
3. **New Query** дарна

### Алхам 2: SQL Script ажиллуулах

1. Доорх SQL script-ийг бүхэлд нь хуулах:

```sql
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
ALTER TABLE "public"."requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."request_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."request_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."agent_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."card_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."card_request_payment_infos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."card_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."feedbacks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."order_ratings" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE POLICIES FOR SERVICE ROLE ACCESS
-- ============================================
-- These policies allow your backend application (using service_role key) to access all data
-- This is necessary because your Node.js backend uses Prisma with service_role credentials

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
  DROP POLICY IF EXISTS "service_role_requests_all" ON "public"."requests";
  DROP POLICY IF EXISTS "service_role_request_items_all" ON "public"."request_items";
  DROP POLICY IF EXISTS "service_role_request_reports_all" ON "public"."request_reports";
  DROP POLICY IF EXISTS "service_role_agent_profiles_all" ON "public"."agent_profiles";
  DROP POLICY IF EXISTS "service_role_card_requests_all" ON "public"."card_requests";
  DROP POLICY IF EXISTS "service_role_card_request_payment_infos_all" ON "public"."card_request_payment_infos";
  DROP POLICY IF EXISTS "service_role_card_transactions_all" ON "public"."card_transactions";
  DROP POLICY IF EXISTS "service_role_chat_messages_all" ON "public"."chat_messages";
  DROP POLICY IF EXISTS "service_role_feedbacks_all" ON "public"."feedbacks";
  DROP POLICY IF EXISTS "service_role_payments_all" ON "public"."payments";
  DROP POLICY IF EXISTS "service_role_order_comments_all" ON "public"."order_comments";
  DROP POLICY IF EXISTS "service_role_order_ratings_all" ON "public"."order_ratings";
END $$;

-- Create policies for all tables
CREATE POLICY "service_role_settings_all" ON "public"."settings"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_cargos_all" ON "public"."cargos"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_users_all" ON "public"."users"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_orders_all" ON "public"."orders"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_order_items_all" ON "public"."order_items"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_order_locks_all" ON "public"."order_locks"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_order_pricings_all" ON "public"."order_pricings"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_order_payments_all" ON "public"."order_payments"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_order_trackings_all" ON "public"."order_trackings"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_order_reports_all" ON "public"."order_reports"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_order_report_items_all" ON "public"."order_report_items"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_order_report_pricings_all" ON "public"."order_report_pricings"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_requests_all" ON "public"."requests"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_request_items_all" ON "public"."request_items"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_request_reports_all" ON "public"."request_reports"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_agent_profiles_all" ON "public"."agent_profiles"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_card_requests_all" ON "public"."card_requests"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_card_request_payment_infos_all" ON "public"."card_request_payment_infos"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_card_transactions_all" ON "public"."card_transactions"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_chat_messages_all" ON "public"."chat_messages"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_feedbacks_all" ON "public"."feedbacks"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_payments_all" ON "public"."payments"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_order_comments_all" ON "public"."order_comments"
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_order_ratings_all" ON "public"."order_ratings"
  FOR ALL USING (auth.role() = 'service_role');
```

2. SQL Editor дээр paste хийх
3. **RUN** товч дарна (эсвэл Ctrl+Enter)

### Алхам 3: Шалгах

1. SQL ажиллуулсны дараа **"Success"** гэсэн мессеж харагдах ёстой
2. Supabase Dashboard → **Security Advisor** (эсвэл **Database** → **Advisors**) руу буцах
3. **"Rerun linter"** эсвэл **"Refresh"** товч дарна
4. Алдаанууд арилсан эсэхийг шалгана

## ✅ Хийгдэх зүйлс:

- ✅ Бүх table-ууд дээр RLS идэвхжүүлнэ
- ✅ Service role-д бүх эрх өгөх policy үүсгэнэ
- ✅ Таны Node.js backend (Prisma) ажиллахад шаардлагатай
- ✅ Supabase Security Advisor-ийн алдааг арилгана

## ⚠️ Анхаарах зүйлс:

1. **Backend ажиллах**: Энэ policy-ууд нь service_role-д бүх эрх өгдөг тул таны Prisma backend зөв ажиллах болно
2. **Client-side access**: Хэрэв та Supabase client-side authentication ашиглахыг хүсвэл нэмэлт policy үүсгэх хэрэгтэй
3. **`_prisma_migrations` table**: Энэ нь Prisma system table тул RLS идэвхжүүлэх шаардлагагүй

## 🔍 Хэрэв Алдаа Гарвал:

1. SQL Editor дээрх алдааны мэдээллийг шалгах
2. Table нэр зөв эсэх шалгах
3. Policy-ууд зөв үүсгэгдсэн эсэхийг шалгах:
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

---

**✅ Бэлэн!** Дээрх SQL script-ийг ажиллуулснаар 25 асуудал арилах болно.

