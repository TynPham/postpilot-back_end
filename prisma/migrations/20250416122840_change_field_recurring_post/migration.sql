/*
  Warnings:

  - You are about to drop the column `lastScheduledDate` on the `recurring_posts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "recurring_posts" DROP COLUMN "lastScheduledDate",
ADD COLUMN     "nextScheduledDate" TIMESTAMP(3);
