/*
  Warnings:

  - Changed the type of `publicationTime` on the `recurring_post_instances` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "recurring_post_instances" DROP COLUMN "publicationTime",
ADD COLUMN     "publicationTime" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "recurring_post_instances_recurringPostId_publicationTime_key" ON "recurring_post_instances"("recurringPostId", "publicationTime");
