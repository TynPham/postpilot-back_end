-- AddForeignKey
ALTER TABLE "recurring_posts" ADD CONSTRAINT "recurring_posts_socialCredentialID_fkey" FOREIGN KEY ("socialCredentialID") REFERENCES "social_credentials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
