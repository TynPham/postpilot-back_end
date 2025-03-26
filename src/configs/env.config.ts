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
  clerk_public_key: process.env.CLERK_PUBLIC_KEY as string,
  clerk_secret_key: process.env.CLERK_SECRET_KEY as string,
  facebook_client_id: process.env.FACEBOOK_CLIENT_ID as string,
  facebook_client_secret: process.env.FACEBOOK_CLIENT_SECRET as string,
  threads_client_id: process.env.THREADS_CLIENT_ID as string,
  threads_client_secret: process.env.THREADS_CLIENT_SECRET as string,
  aws_region: process.env.AWS_REGION as string,
  aws_s3_bucket: process.env.AWS_S3_BUCKET as string,
  x_client_id: process.env.X_CLIENT_ID as string,
  x_client_secret: process.env.X_CLIENT_SECRET as string,
  x_callback_url: process.env.X_CALLBACK_URL as string
}
