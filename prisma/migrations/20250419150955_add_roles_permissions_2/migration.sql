/*
  Warnings:

  - You are about to drop the column `permissions` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `roles` on the `posts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "posts" DROP COLUMN "permissions",
DROP COLUMN "roles";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "permissions" TEXT[],
ADD COLUMN     "roles" TEXT[];
