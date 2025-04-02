/*
  Warnings:

  - A unique constraint covering the columns `[ownerId,socialId]` on the table `social_credentials` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "published_posts" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "published_posts_pkey" PRIMARY KEY ("id","postId")
);

-- CreateIndex
CREATE UNIQUE INDEX "published_posts_id_key" ON "published_posts"("id");

-- CreateIndex
CREATE UNIQUE INDEX "social_credentials_ownerId_socialId_key" ON "social_credentials"("ownerId", "socialId");

-- AddForeignKey
ALTER TABLE "published_posts" ADD CONSTRAINT "published_posts_id_fkey" FOREIGN KEY ("id") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
