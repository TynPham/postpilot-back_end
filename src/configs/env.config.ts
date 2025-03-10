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
  clerk_secret_key: process.env.CLERK_SECRET_KEY
}
