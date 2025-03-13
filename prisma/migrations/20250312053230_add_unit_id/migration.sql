/*
  Warnings:

  - A unique constraint covering the columns `[ownerId]` on the table `Post` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[socialId]` on the table `SocialCredential` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `socialId` to the `SocialCredential` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SocialCredential" ADD COLUMN     "socialId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Post_ownerId_key" ON "Post"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialCredential_socialId_key" ON "SocialCredential"("socialId");
