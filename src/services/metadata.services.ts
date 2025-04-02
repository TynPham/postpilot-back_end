import { getFbLikes } from '~/helpers/facebook'
import database from './database.services'

class MetadataServices {
  async getFbMetadata(id: string, postId: string) {
    const post = await database.post.findUnique({
      where: {
        id
      },
      include: {
        socialCredential: true
      }
    })

    const { credentials } = post?.socialCredential as any

    const likes = await getFbLikes(postId, credentials.access_token as string)

    return {
      likes: likes?.length
    }
  }
}

const metadataServices = new MetadataServices()

export default metadataServices
