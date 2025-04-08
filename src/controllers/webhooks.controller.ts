import { WebhookEvent } from '@clerk/clerk-sdk-node'
import { Request, Response, NextFunction } from 'express'
import { Webhook } from 'svix'
import { envConfig } from '~/configs/env.config'
import database from '~/services/database.services'

export const handleClerkWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Xác thực webhook từ Clerk
    const payload = req.body
    const svix_id = req.headers['svix-id'] as string
    const svix_timestamp = req.headers['svix-timestamp'] as string
    const svix_signature = req.headers['svix-signature'] as string

    if (!svix_id || !svix_timestamp || !svix_signature) {
      res.status(400).json({ error: 'Missing svix headers' })
      return
    }

    const wh = new Webhook(envConfig.clerk_webhook_secret)
    const evt = wh.verify(JSON.stringify(payload), {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature
    }) as WebhookEvent

    if (!['user.created', 'user.updated', 'user.deleted'].includes(evt.type)) {
      res.status(200).json({
        success: true,
        message: `Event ${evt.type} ignored`
      })
      return
    }

    const { id } = evt.data
    const eventType = evt.type

    // Xử lý các events khác nhau
    switch (eventType) {
      case 'user.created': {
        const { email_addresses, first_name, last_name, image_url, username, created_at } = evt.data
        const primaryEmail = email_addresses[0]?.email_address

        if (!primaryEmail) {
          throw new Error('No primary email found')
        }

        await database.user.create({
          data: {
            id: id as string,
            email: primaryEmail,
            firstName: first_name || null,
            lastName: last_name || null,
            imageUrl: image_url || null,
            username: username || null,
            lastSignInAt: new Date(created_at)
          }
        })
        break
      }

      case 'user.updated': {
        const { email_addresses, first_name, last_name, image_url, username, last_sign_in_at } = evt.data
        const primaryEmail = email_addresses[0]?.email_address

        if (!primaryEmail) {
          throw new Error('No primary email found')
        }

        await database.user.update({
          where: { id },
          data: {
            email: primaryEmail,
            firstName: first_name || null,
            lastName: last_name || null,
            imageUrl: image_url || null,
            username: username || null,
            lastSignInAt: last_sign_in_at ? new Date(last_sign_in_at) : null
          }
        })
        break
      }

      case 'user.deleted': {
        await database.user.delete({
          where: { id }
        })
        break
      }
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    next(error)
  }
}
