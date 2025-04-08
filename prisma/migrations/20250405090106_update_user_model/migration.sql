/*
  Warnings:

  - You are about to drop the column `ownerId` on the `social_credentials` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,socialId]` on the table `social_credentials` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `social_credentials` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "social_credentials_ownerId_socialId_key";

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "social_credentials" DROP COLUMN "ownerId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "username" TEXT,
    "lastSignInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "telegramId" TEXT,
    "telegramUsername" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "social_credentials_userId_socialId_key" ON "social_credentials"("userId", "socialId");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_credentials" ADD CONSTRAINT "social_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
