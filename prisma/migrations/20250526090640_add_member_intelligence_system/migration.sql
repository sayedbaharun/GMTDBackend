-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredAirlines" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredClass" TEXT,
    "preferredSeat" TEXT,
    "frequentDestinations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "homeAirport" TEXT,
    "preferredHotelChains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredRoomType" TEXT,
    "preferredAmenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "budgetRange" JSONB,
    "cuisinePreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dietaryRestrictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredPriceRange" TEXT,
    "communicationStyle" TEXT,
    "timeZone" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "averageResponseTime" INTEGER,
    "preferredBookingTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "detectedIntent" TEXT NOT NULL,
    "extractedEntities" JSONB NOT NULL,
    "userMood" TEXT,
    "previousRequests" JSONB NOT NULL,
    "lastBookingType" TEXT,
    "lastDestination" TEXT,
    "lastTravelDates" JSONB,
    "suggestedUpgrades" JSONB,
    "personalizedOffers" JSONB,
    "satisfactionScore" DOUBLE PRECISION,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "handoffToHuman" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used" TIMESTAMP(3),
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "api_call_needed" BOOLEAN NOT NULL DEFAULT false,
    "cache_duration" INTEGER,
    "expires_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBehaviorAnalytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "total_conversations" INTEGER NOT NULL DEFAULT 0,
    "total_bookings" INTEGER NOT NULL DEFAULT 0,
    "favorite_destinations" JSONB NOT NULL,
    "peak_usage_hours" JSONB NOT NULL,
    "preference_changes" JSONB NOT NULL,
    "booking_patterns" JSONB NOT NULL,
    "questions_answered_without_api" INTEGER NOT NULL DEFAULT 0,
    "api_calls_saved" INTEGER NOT NULL DEFAULT 0,
    "average_resolution_time" DOUBLE PRECISION,
    "personalization_level" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "prediction_accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "last_calculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBehaviorAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "KnowledgeBase_category_keywords_idx" ON "KnowledgeBase"("category", "keywords");

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMemory" ADD CONSTRAINT "ConversationMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMemory" ADD CONSTRAINT "ConversationMemory_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBehaviorAnalytics" ADD CONSTRAINT "UserBehaviorAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
