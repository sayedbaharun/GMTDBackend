-- CreateTable
CREATE TABLE "TravelRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT,
    "messageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirementsSummary" TEXT,
    "searchParams" JSONB,
    "adminId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "deadline" TIMESTAMP(3),
    "presentedOptions" JSONB,
    "selectedOptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "relatedBookingId" TEXT,

    CONSTRAINT "TravelRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TravelRequest" ADD CONSTRAINT "TravelRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelRequest" ADD CONSTRAINT "TravelRequest_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelRequest" ADD CONSTRAINT "TravelRequest_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelRequest" ADD CONSTRAINT "TravelRequest_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelRequest" ADD CONSTRAINT "TravelRequest_relatedBookingId_fkey" FOREIGN KEY ("relatedBookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
