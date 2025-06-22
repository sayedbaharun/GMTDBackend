-- CreateTable
CREATE TABLE "BookingConfirmation" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "confirmationNumber" TEXT NOT NULL,
    "amadeusBookingId" TEXT,
    "supplierConfirmationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "confirmationEmail" TEXT,
    "confirmationSentAt" TIMESTAMP(3),
    "vouchers" JSONB,
    "cancellationPolicy" TEXT,
    "modificationPolicy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "confirmationId" TEXT,
    "stripePaymentIntentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "paymentMethodDetails" JSONB,
    "processingFee" DOUBLE PRECISION,
    "vatAmount" DOUBLE PRECISION,
    "vatIncluded" BOOLEAN NOT NULL DEFAULT true,
    "refundAmount" DOUBLE PRECISION,
    "refundReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundReference" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "riskScore" DOUBLE PRECISION,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAuditLog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "confirmationId" TEXT,
    "transactionId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "changes" JSONB,
    "changedBy" TEXT NOT NULL,
    "changedByType" TEXT NOT NULL DEFAULT 'USER',
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "apiEndpoint" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "department" TEXT,
    "accessLevel" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRecord" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "transactionId" TEXT,
    "passportNumber" TEXT,
    "passportCountry" TEXT,
    "visaStatus" TEXT,
    "nationality" TEXT,
    "emiratesId" TEXT,
    "travelPurpose" TEXT,
    "accommodation" TEXT,
    "localSponsor" TEXT,
    "transactionCategory" TEXT,
    "sourceOfFunds" TEXT,
    "declarationRequired" BOOLEAN NOT NULL DEFAULT false,
    "declarationAmount" DOUBLE PRECISION,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationMethod" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewNotes" TEXT,
    "dataRetentionPeriod" INTEGER NOT NULL DEFAULT 2555,
    "scheduleForDeletion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingConfirmation_bookingId_key" ON "BookingConfirmation"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingConfirmation_confirmationNumber_key" ON "BookingConfirmation"("confirmationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_stripePaymentIntentId_key" ON "PaymentTransaction"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "BookingAuditLog_bookingId_action_idx" ON "BookingAuditLog"("bookingId", "action");

-- CreateIndex
CREATE INDEX "BookingAuditLog_changedBy_createdAt_idx" ON "BookingAuditLog"("changedBy", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_userId_key" ON "AdminUser"("userId");

-- CreateIndex
CREATE INDEX "ComplianceRecord_bookingId_verified_idx" ON "ComplianceRecord"("bookingId", "verified");

-- CreateIndex
CREATE INDEX "ComplianceRecord_riskLevel_flaggedForReview_idx" ON "ComplianceRecord"("riskLevel", "flaggedForReview");

-- AddForeignKey
ALTER TABLE "BookingConfirmation" ADD CONSTRAINT "BookingConfirmation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_confirmationId_fkey" FOREIGN KEY ("confirmationId") REFERENCES "BookingConfirmation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAuditLog" ADD CONSTRAINT "BookingAuditLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAuditLog" ADD CONSTRAINT "BookingAuditLog_confirmationId_fkey" FOREIGN KEY ("confirmationId") REFERENCES "BookingConfirmation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAuditLog" ADD CONSTRAINT "BookingAuditLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "PaymentTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAuditLog" ADD CONSTRAINT "BookingAuditLog_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "PaymentTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRecord" ADD CONSTRAINT "ComplianceRecord_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
