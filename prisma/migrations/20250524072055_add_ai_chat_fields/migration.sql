-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "agent_type" TEXT,
ADD COLUMN     "collected_info" JSONB DEFAULT '{}',
ADD COLUMN     "current_state" TEXT DEFAULT 'welcome',
ADD COLUMN     "escalated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "retry_count" INTEGER NOT NULL DEFAULT 0;
