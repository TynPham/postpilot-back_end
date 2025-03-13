/*
  Warnings:

  - Added the required column `metadata` to the `SocialCredential` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SocialCredential" ADD COLUMN     "metadata" JSONB NOT NULL;
