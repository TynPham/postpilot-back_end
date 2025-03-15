import { CreatePostRequestBody } from '~/models/request/posts.request'
import database from './database.services'
import { assert } from 'console'
import { uploadImageFb } from '~/helpers/facebook'
import { ErrorWithStatus } from '~/models/errors'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'

class PostServices {
  async getPosts(ownerId: string) {
    const posts = await database.post.findMany({
      where: {
        ownerId
      },
      include: {
        socialCredential: {
          select: {
            metadata: true
          }
        }
      }
    })
    return posts
  }

  async schedulePost(body: CreatePostRequestBody, ownerId: string) {
    const socialCredentialIDs = body.socialPosts.map((socialPost) => socialPost.socialCredentialID)
    const socialCredentials = await database.socialCredential.findMany({
      where: {
        id: {
          in: socialCredentialIDs
        }
      },
      select: { id: true, credentials: true }
    })

    const schedulePostRequestBody = await Promise.all(
      body.socialPosts.map(async (socialPost) => {
        const credential = socialCredentials.find((c) => c.id === socialPost.socialCredentialID)?.credentials as any

        if (!credential) {
          throw new ErrorWithStatus({
            status: HTTP_STATUS_CODE.BAD_REQUEST,
            message: `No credential found with id: ${socialPost.socialCredentialID}`
          })
        }

        const imageFbIds = await Promise.all(
          socialPost.metadata.assets.map((asset) => {
            return uploadImageFb({
              access_token: credential.access_token,
              page_id: credential.page_id,
              url: asset.url
            })
          })
        )

        return {
          ownerId,
          status: 'scheduled',
          publicationTime: body.publicationTime,
          platform: socialPost.platform,
          socialCredentialId: socialPost.socialCredentialID,
          metadata: {
            type: socialPost.metadata.type,
            content: socialPost.metadata.content,
            assets: socialPost.metadata.assets.map((asset) => ({
              type: asset.type,
              url: asset.url
            })),
            media_fbid: imageFbIds
          }
        }
      })
    )

    await database.post.createMany({
      data: schedulePostRequestBody
    })
  }
}

const postServices = new PostServices()

export default postServices
