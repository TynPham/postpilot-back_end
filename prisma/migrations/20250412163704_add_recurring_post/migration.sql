-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "parentPostId" TEXT,
ADD COLUMN     "recurringPostId" TEXT;

-- CreateTable
CREATE TABLE "recurring_posts" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "daysOfWeek" INTEGER[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recurring_posts_postId_key" ON "recurring_posts"("postId");

-- AddForeignKey
ALTER TABLE "recurring_posts" ADD CONSTRAINT "recurring_posts_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
