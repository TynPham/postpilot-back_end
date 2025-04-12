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
  x_callback_url: process.env.X_CALLBACK_URL as string,
  instagram_client_id: process.env.INSTAGRAM_CLIENT_ID as string,
  instagram_client_secret: process.env.INSTAGRAM_CLIENT_SECRET as string,
  clerk_webhook_secret: process.env.CLERK_WEBHOOK_SECRET as string,
  telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN as string,
  client_url: process.env.CLIENT_URL as string,
  redis_host: process.env.REDIS_HOST as string,
  redis_port: process.env.REDIS_PORT as string,
  redis_tls: process.env.REDIS_TLS as string,
  redis_admin_username: process.env.REDIS_ADMIN_USERNAME as string,
  redis_admin_password: process.env.REDIS_ADMIN_PASSWORD as string,
  redis_worker_username: process.env.REDIS_WORKER_USERNAME as string,
  redis_worker_password: process.env.REDIS_WORKER_PASSWORD as string
}
