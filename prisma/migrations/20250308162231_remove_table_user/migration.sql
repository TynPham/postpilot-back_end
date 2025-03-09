/*
  Warnings:

  - You are about to drop the column `ownerId` on the `SocialCredential` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "SocialCredential" DROP CONSTRAINT "SocialCredential_ownerId_fkey";

-- AlterTable
ALTER TABLE "SocialCredential" DROP COLUMN "ownerId";

-- DropTable
DROP TABLE "User";
