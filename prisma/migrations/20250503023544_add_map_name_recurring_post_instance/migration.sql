/*
  Warnings:

  - You are about to drop the `RecurringPostInstance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RecurringPostInstance" DROP CONSTRAINT "RecurringPostInstance_recurringPostId_fkey";

-- DropTable
DROP TABLE "RecurringPostInstance";

-- CreateTable
CREATE TABLE "recurring_post_instances" (
    "id" TEXT NOT NULL,
    "recurringPostId" TEXT NOT NULL,
    "publicationTime" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_post_instances_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "recurring_post_instances" ADD CONSTRAINT "recurring_post_instances_recurringPostId_fkey" FOREIGN KEY ("recurringPostId") REFERENCES "recurring_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
