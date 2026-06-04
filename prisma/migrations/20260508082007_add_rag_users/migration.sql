-- AlterTable
ALTER TABLE "rag_conversations" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "rag_users" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rag_users_sessionId_key" ON "rag_users"("sessionId");

-- CreateIndex
CREATE INDEX "rag_conversations_userId_idx" ON "rag_conversations"("userId");

-- AddForeignKey
ALTER TABLE "rag_conversations" ADD CONSTRAINT "rag_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "rag_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
