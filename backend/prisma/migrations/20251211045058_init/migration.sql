-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "secretQuestion" TEXT NOT NULL,
    "secretAnswerHash" TEXT NOT NULL,
    "roles" TEXT[] DEFAULT ARRAY['user']::TEXT[],
    "defaultCargoId" TEXT,
    "cardBalance" INTEGER NOT NULL DEFAULT 5,
    "cardProgress" INTEGER NOT NULL DEFAULT 0,
    "completedOrdersCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargos" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "siteUrl" TEXT,
    "logoUrl" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supportedCities" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT,
    "cargoId" TEXT,
    "customName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isPackage" BOOLEAN NOT NULL DEFAULT false,
    "userNote" TEXT,
    "agentNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "images" TEXT[],
    "sourceUrl" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "userNotes" TEXT,
    "agentPrice" DOUBLE PRECISION,
    "agentCurrency" TEXT NOT NULL DEFAULT 'CNY',
    "agentTotal" DOUBLE PRECISION,
    "packageIndex" INTEGER,
    "trackingCode" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_locks" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "lockedByAgentId" TEXT,
    "lockedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "extensionCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "order_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_pricings" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productTotalCny" DOUBLE PRECISION,
    "domesticShippingCny" DOUBLE PRECISION,
    "serviceFeeCny" DOUBLE PRECISION,
    "otherFeesCny" DOUBLE PRECISION,
    "grandTotalCny" DOUBLE PRECISION,
    "exchangeRate" DOUBLE PRECISION,
    "grandTotalMnt" DOUBLE PRECISION,

    CONSTRAINT "order_pricings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT,
    "invoiceId" TEXT,
    "paidAt" TIMESTAMP(3),
    "amountMnt" DOUBLE PRECISION,
    "method" TEXT,
    "providerTxnId" TEXT,
    "deadline" TIMESTAMP(3),

    CONSTRAINT "order_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_trackings" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "code" TEXT,
    "carrierName" TEXT,
    "lastStatus" TEXT,
    "lastUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "order_trackings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_reports" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentLink" TEXT,
    "agentComment" TEXT,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "order_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_report_items" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "title" TEXT,
    "imageUrl" TEXT,
    "sourceUrl" TEXT,
    "quantity" INTEGER,
    "agentPrice" DOUBLE PRECISION,
    "agentCurrency" TEXT NOT NULL DEFAULT 'CNY',
    "agentTotal" DOUBLE PRECISION,
    "note" TEXT,
    "images" TEXT[],
    "trackingCode" TEXT,

    CONSTRAINT "order_report_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_report_pricings" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "productTotalCny" DOUBLE PRECISION,
    "domesticShippingCny" DOUBLE PRECISION,
    "serviceFeeCny" DOUBLE PRECISION,
    "otherFeesCny" DOUBLE PRECISION,
    "grandTotalCny" DOUBLE PRECISION,
    "exchangeRate" DOUBLE PRECISION,
    "grandTotalMnt" DOUBLE PRECISION,

    CONSTRAINT "order_report_pricings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_comments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "attachments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_ratings" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "score" INTEGER,
    "comment" TEXT,
    "ratedBy" TEXT NOT NULL,

    CONSTRAINT "order_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'new',
    "claimedBy" TEXT,
    "claimedAt" TIMESTAMP(3),
    "researchUntil" TIMESTAMP(3),
    "rating" INTEGER,
    "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "paymentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_items" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "name" TEXT,
    "mark" TEXT,
    "quantity" INTEGER,
    "app" TEXT,
    "note" TEXT,
    "link" TEXT,
    "images" TEXT[],

    CONSTRAINT "request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_reports" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "priceCny" DOUBLE PRECISION,
    "note" TEXT,
    "link" TEXT,
    "paymentLink" TEXT,
    "image" TEXT,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "request_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "totalEarnedMnt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "languages" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerCard" INTEGER NOT NULL DEFAULT 2000,
    "totalAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "transactionNumber" TEXT,
    "paymentProof" TEXT,
    "rejectedReason" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedByUserId" TEXT,

    CONSTRAINT "card_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_request_payment_infos" (
    "id" TEXT NOT NULL,
    "cardRequestId" TEXT NOT NULL,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankOwner" TEXT,

    CONSTRAINT "card_request_payment_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" TEXT NOT NULL,
    "cardChange" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "roleFrom" TEXT NOT NULL,
    "roleTo" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountMnt" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "method" TEXT,
    "invoiceId" TEXT,
    "providerTxnId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "cnyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankOwner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cargos_name_key" ON "cargos"("name");

-- CreateIndex
CREATE INDEX "orders_userId_status_idx" ON "orders"("userId", "status");

-- CreateIndex
CREATE INDEX "orders_agentId_status_idx" ON "orders"("agentId", "status");

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_locks_orderId_key" ON "order_locks"("orderId");

-- CreateIndex
CREATE INDEX "order_locks_expiresAt_idx" ON "order_locks"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "order_pricings_orderId_key" ON "order_pricings"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_payments_orderId_key" ON "order_payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_trackings_orderId_key" ON "order_trackings"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_reports_orderId_key" ON "order_reports"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_report_pricings_reportId_key" ON "order_report_pricings"("reportId");

-- CreateIndex
CREATE INDEX "order_comments_orderId_createdAt_idx" ON "order_comments"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "order_ratings_orderId_ratedBy_key" ON "order_ratings"("orderId", "ratedBy");

-- CreateIndex
CREATE INDEX "requests_status_createdAt_idx" ON "requests"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "request_reports_requestId_key" ON "request_reports"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_userId_key" ON "agent_profiles"("userId");

-- CreateIndex
CREATE INDEX "card_requests_userId_status_idx" ON "card_requests"("userId", "status");

-- CreateIndex
CREATE INDEX "card_requests_status_createdAt_idx" ON "card_requests"("status", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "card_request_payment_infos_cardRequestId_key" ON "card_request_payment_infos"("cardRequestId");

-- CreateIndex
CREATE INDEX "card_transactions_userId_createdAt_idx" ON "card_transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_messages_orderId_createdAt_idx" ON "chat_messages"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "feedbacks_orderId_idx" ON "feedbacks"("orderId");

-- CreateIndex
CREATE INDEX "feedbacks_toUserId_idx" ON "feedbacks"("toUserId");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_defaultCargoId_fkey" FOREIGN KEY ("defaultCargoId") REFERENCES "cargos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "cargos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_locks" ADD CONSTRAINT "order_locks_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_locks" ADD CONSTRAINT "order_locks_lockedByAgentId_fkey" FOREIGN KEY ("lockedByAgentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_pricings" ADD CONSTRAINT "order_pricings_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_trackings" ADD CONSTRAINT "order_trackings_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_reports" ADD CONSTRAINT "order_reports_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_report_items" ADD CONSTRAINT "order_report_items_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "order_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_report_pricings" ADD CONSTRAINT "order_report_pricings_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "order_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_comments" ADD CONSTRAINT "order_comments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_comments" ADD CONSTRAINT "order_comments_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_ratings" ADD CONSTRAINT "order_ratings_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_items" ADD CONSTRAINT "request_items_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_reports" ADD CONSTRAINT "request_reports_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_requests" ADD CONSTRAINT "card_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_requests" ADD CONSTRAINT "card_requests_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_request_payment_infos" ADD CONSTRAINT "card_request_payment_infos_cardRequestId_fkey" FOREIGN KEY ("cardRequestId") REFERENCES "card_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_transactions" ADD CONSTRAINT "card_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
