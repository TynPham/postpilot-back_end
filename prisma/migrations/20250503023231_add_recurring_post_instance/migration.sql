-- CreateTable
CREATE TABLE "RecurringPostInstance" (
    "id" TEXT NOT NULL,
    "recurringPostId" TEXT NOT NULL,
    "publicationTime" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringPostInstance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RecurringPostInstance" ADD CONSTRAINT "RecurringPostInstance_recurringPostId_fkey" FOREIGN KEY ("recurringPostId") REFERENCES "recurring_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
