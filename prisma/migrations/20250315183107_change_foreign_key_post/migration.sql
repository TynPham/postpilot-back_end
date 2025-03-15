-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_socialCredentialId_fkey";

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_socialCredentialId_fkey" FOREIGN KEY ("socialCredentialId") REFERENCES "SocialCredential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
