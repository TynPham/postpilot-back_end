/*
  Warnings:

  - A unique constraint covering the columns `[socialOwnerId]` on the table `SocialCredential` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `socialOwnerId` to the `SocialCredential` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_socialCredentialId_fkey";

-- AlterTable
ALTER TABLE "SocialCredential" ADD COLUMN     "socialOwnerId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SocialCredential_socialOwnerId_key" ON "SocialCredential"("socialOwnerId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_socialCredentialId_fkey" FOREIGN KEY ("socialCredentialId") REFERENCES "SocialCredential"("socialId") ON DELETE RESTRICT ON UPDATE CASCADE;
