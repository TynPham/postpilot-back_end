/*
  Warnings:

  - You are about to drop the column `postId` on the `recurring_posts` table. All the data in the column will be lost.
  - Added the required column `metadata` to the `recurring_posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform` to the `recurring_posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicationTime` to the `recurring_posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `socialCredentialID` to the `recurring_posts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "recurring_posts" DROP CONSTRAINT "recurring_posts_postId_fkey";

-- DropIndex
DROP INDEX "recurring_posts_postId_key";

-- AlterTable
ALTER TABLE "recurring_posts" DROP COLUMN "postId",
ADD COLUMN     "lastScheduledDate" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB NOT NULL,
ADD COLUMN     "platform" TEXT NOT NULL,
ADD COLUMN     "publicationTime" TEXT NOT NULL,
ADD COLUMN     "socialCredentialID" TEXT NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_recurringPostId_fkey" FOREIGN KEY ("recurringPostId") REFERENCES "recurring_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
