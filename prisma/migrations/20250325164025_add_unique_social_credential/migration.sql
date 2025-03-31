/*
  Warnings:

  - A unique constraint covering the columns `[ownerId,socialId]` on the table `social_credentials` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "social_credentials_ownerId_socialOwnerId_key";

-- CreateIndex
CREATE UNIQUE INDEX "social_credentials_ownerId_socialId_key" ON "social_credentials"("ownerId", "socialId");
