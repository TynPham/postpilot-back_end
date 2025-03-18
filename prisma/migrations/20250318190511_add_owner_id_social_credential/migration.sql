/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SocialCredential` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_socialCredentialId_fkey";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "SocialCredential";

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "publicationTime" TIMESTAMP(3) NOT NULL,
    "socialCredentialID" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_credentials" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "socialOwnerId" TEXT NOT NULL,
    "socialId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "credentials" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "social_credentials_socialId_key" ON "social_credentials"("socialId");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_socialCredentialID_fkey" FOREIGN KEY ("socialCredentialID") REFERENCES "social_credentials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
