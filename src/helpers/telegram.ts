import TelegramBot from 'node-telegram-bot-api'
import { envConfig } from '~/configs/env.config'
import crypto from 'crypto'

const bot = new TelegramBot(envConfig.telegram_bot_token, { polling: false })

// send message to user
export const sendUserNotification = async (telegramId: string, message: string) => {
  try {
    await bot.sendMessage(telegramId, message, {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  } catch (error) {
    console.error(`Failed to send notification to user ${telegramId}:`, error)
  }
}

// Format and send post notification
export const sendPostNotification = async ({
  telegramId,
  status,
  postId,
  platform,
  author,
  message,
  error
}: {
  telegramId: string
  status: 'start' | 'success' | 'error'
  postId: string
  platform: string
  author: string
  message?: string
  error?: any
}) => {
  const icons = {
    start: '🚀',
    success: '✅',
    error: '❌'
  }

  let text = `${icons[status]} <b>${status.toUpperCase()}</b>\n`
  text += `📝 Post ID: ${postId}\n`
  text += `📱 Platform: ${platform}\n`
  text += `👤 Author: ${author}\n`
  text += `⏰ Time: ${new Date().toLocaleString()}\n`

  if (message) {
    text += `📄 Details: ${message}\n`
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    text += `⚠️ Error: ${errorMessage}\n`
  }

  await sendUserNotification(telegramId, text)
}

// Verify Telegram login data
export const verifyTelegramLogin = (loginData: {
  id: number
  first_name: string
  username: string
  photo_url: string
  auth_date: number
  hash: string
}) => {
  const { hash, ...data } = loginData

  const dataCheckString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key as keyof typeof data]}`)
    .join('\n')

  const secretKey = crypto.createHash('sha256').update(envConfig.telegram_bot_token).digest()

  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  return computedHash === hash
}
