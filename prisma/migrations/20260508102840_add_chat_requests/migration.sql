-- AlterTable
ALTER TABLE "rag_users" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "wantsHuman" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "chat_requests" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "userEmail" TEXT,
    "userPhone" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "adminId" TEXT,
    "adminName" TEXT,

    CONSTRAINT "chat_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_requests_status_idx" ON "chat_requests"("status");

-- AddForeignKey
ALTER TABLE "chat_requests" ADD CONSTRAINT "chat_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "rag_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
