import { config } from 'dotenv'
const env = process.env.NODE_ENV
export const isProduction = env === 'production'
const envFileName = isProduction ? '.env.production' : '.env'
config({
  path: envFileName,
  override: true
})

export const envConfig = {
  port: process.env.PORT || 4000,
  clerk_public_key: process.env.CLERK_PUBLIC_KEY,
  clerk_secret_key: process.env.CLERK_SECRET_KEY,
  facebook_client_id: process.env.FACEBOOK_CLIENT_ID,
  facebook_client_secret: process.env.FACEBOOK_CLIENT_SECRET,
  threads_client_id: process.env.THREADS_CLIENT_ID,
  threads_client_secret: process.env.THREADS_CLIENT_SECRET,
  aws_region: process.env.AWS_REGION,
  aws_s3_bucket: process.env.AWS_S3_BUCKET
}
