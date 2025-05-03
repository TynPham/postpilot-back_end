/*
  Warnings:

  - A unique constraint covering the columns `[recurringPostId,publicationTime]` on the table `recurring_post_instances` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "recurring_post_instances_recurringPostId_publicationTime_key" ON "recurring_post_instances"("recurringPostId", "publicationTime");
