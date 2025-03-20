import { CronJob } from 'cron'
import { publishPostFb } from '~/helpers/facebook'
import { publishPostThreads } from '~/helpers/threads'
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
    })
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
        socialCredential: true
      }
    })

    console.log(`Found ${posts.length} posts to publish`)

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
          console.log(`Publishing post ${post.id} on ${platform}`)

          const postFunction = platformHandlers[platform]

          const credentials = post.socialCredential.credentials as any
          const postMetadata = post.metadata as any

          try {
            const result = await postFunction(postMetadata, credentials)

            if (result) {
              console.log(`Post ${post.id} published successfully on ${platform}`)
              await database.post.update({
                where: {
                  id: post.id
                },
                data: {
                  status: 'published'
                }
              })
            }
          } catch (error) {
            console.log(`Failed to publish post ${post.id} on ${platform}`, error)
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
