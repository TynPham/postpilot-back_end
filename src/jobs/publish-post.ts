import database from '~/services/database.services'
import { addPostToPublishQueue } from '~/services/queue.services'

export const addPublishPostsToQueue = async () => {
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

    // add to publish queue
    if (posts.length > 0) {
      await Promise.all(
        posts.map((post) =>
          addPostToPublishQueue({
            id: post.id,
            status: post.status,
            publicationTime: post.publicationTime.toISOString(),
            platform: post.platform,
            socialCredentialID: post.socialCredentialID,
            metadata: post.metadata as any,
            telegramId: post.socialCredential.user.telegramId,
            socialCredential: {
              metadata: {
                name: (post.socialCredential.metadata as any).name
              }
            }
          })
        )
      )
    }
  } catch (error) {
    console.log('Error when scheduling posts', error)
  }
}
