import { CronJob } from 'cron'
import { Platform } from '~/constants/enum'
import { publishPostFb } from '~/helpers/facebook'
import { publishPostInstagram } from '~/helpers/instagram'
import { sendPostNotification } from '~/helpers/telegram'
import { publishPostThreads } from '~/helpers/threads'
import { publishPostX } from '~/helpers/x'
import database from '~/services/database.services'

const platformHandlers: { [key: string]: any } = {
  facebook: (metadata: any, credentials: any) =>
    publishPostFb({
      access_token: credentials.access_token,
      page_id: credentials.page_id,
      metadata: {
        message: metadata.content,
        attached_media: metadata.media_fbid
      }
    }),
  threads: (metadata: any, credentials: any) =>
    publishPostThreads({
      access_token: credentials.access_token,
      threads_user_id: credentials.user_id,
      metadata: {
        creation_id: metadata.creation_id
      }
    }),
  x: (metadata: any, credentials: any) =>
    publishPostX(credentials.access_token, {
      text: metadata.content,
      media_ids: metadata.media_ids,
      socialCredentialID: credentials.socialCredentialID,
      refresh_token: credentials.refresh_token
    }),
  instagram: (metadata: any, credentials: any) =>
    publishPostInstagram(credentials.access_token, credentials.user_id, metadata.creation_id)
}

const schedulePostsJob = new CronJob('*/15 * * * * *', async () => {
  try {
    const now = new Date()
    const posts = await database.post.findMany({
      where: {
        status: 'scheduled',
        publicationTime: {
          lte: now
        }
      },
      include: {
        socialCredential: {
          include: {
            user: true
          }
        }
      }
    })

    // Group posts by platform
    const postsByPlatform = posts.reduce((acc: { [key: string]: any }, post) => {
      if (!acc[post.platform]) acc[post.platform] = []
      acc[post.platform].push(post)
      return acc
    }, {})

    // Publish posts concurrently per platform
    await Promise.all(
      Object.entries(postsByPlatform).map(async ([platform, platformPosts]) => {
        for (const post of platformPosts) {
          const userTelegramId = post.socialCredential.user.telegramId

          if (userTelegramId) {
            await sendPostNotification({
              telegramId: userTelegramId,
              status: 'start',
              postId: post.id,
              platform,
              author: post.socialCredential.metadata.name,
              message: 'Starting to publish post'
            })
          }

          const postFunction = platformHandlers[platform]

          const credentials = post.socialCredential.credentials as any
          if (platform === Platform.X) {
            credentials.socialCredentialID = post.socialCredentialID
          }
          const postMetadata = post.metadata as any

          try {
            const result = await postFunction(postMetadata, credentials)

            if (result) {
              if (userTelegramId) {
                await sendPostNotification({
                  telegramId: userTelegramId,
                  status: 'success',
                  postId: post.id,
                  platform,
                  author: post.socialCredential.metadata.name,
                  message: `Published with ID: ${result}`
                })
              }
              await Promise.all([
                database.post.update({
                  where: {
                    id: post.id
                  },
                  data: {
                    status: 'published'
                  }
                }),
                database.publishedPost.create({
                  data: {
                    id: post.id,
                    postId: result,
                    metadata: {}
                  }
                })
              ])
            }
          } catch (error) {
            if (userTelegramId) {
              await sendPostNotification({
                telegramId: userTelegramId,
                status: 'error',
                postId: post.id,
                platform,
                author: post.socialCredential.metadata.name,
                error
              })
            }
            await database.post.update({
              where: {
                id: post.id
              },
              data: {
                status: 'failed'
              }
            })
            throw error
          }
        }
      })
    )
  } catch (error) {
    console.log('Error when publishing posts', error)
  }
})

export default schedulePostsJob
