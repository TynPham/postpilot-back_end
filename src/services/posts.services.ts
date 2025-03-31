import { CreatePostRequestBody } from '~/models/request/posts.request'
import database from './database.services'
import { assert } from 'console'
import { uploadImageFb } from '~/helpers/facebook'
import { ErrorWithStatus } from '~/models/errors'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { Platform } from '~/constants/enum'
import {
  createCarouselThreadsMediaContainer,
  createSingleItemsContainer,
  createSingleThreadsMediaContainer
} from '~/helpers/threads'
import { uploadImageXFromUrl } from '~/helpers/x'

class PostServices {
  async getPosts(ownerId: string, platform: string) {
    const posts = await database.post.findMany({
      where: {
        socialCredential: {
          ownerId
        },
        platform
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

  async schedulePost(body: CreatePostRequestBody) {
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

        // facebook
        if (socialPost.platform === Platform.Facebook) {
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
            status: 'scheduled',
            publicationTime: body.publicationTime,
            platform: socialPost.platform,
            socialCredentialID: socialPost.socialCredentialID,
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
        }

        // threads
        if (socialPost.platform === Platform.Threads) {
          // type: carousel
          if (socialPost.metadata.assets.length > 1) {
            const creation_id = await createCarouselThreadsMediaContainer(credential.access_token, credential.user_id, {
              media_type: socialPost.metadata.assets[0].type.toUpperCase() as 'IMAGE' | 'VIDEO',
              image_url: socialPost.metadata.assets.map((asset) => asset.url),
              text: socialPost.metadata.content
            })
            return {
              status: 'scheduled',
              publicationTime: body.publicationTime,
              platform: socialPost.platform,
              socialCredentialID: socialPost.socialCredentialID,
              metadata: {
                type: socialPost.metadata.type,
                content: socialPost.metadata.content,
                assets: socialPost.metadata.assets.map((asset) => ({
                  type: asset.type,
                  url: asset.url
                })),
                creation_id
              }
            }
          }

          // type: single
          const creation_id = await createSingleThreadsMediaContainer(credential.access_token, credential.user_id, {
            media_type: socialPost.metadata.assets[0].type.toUpperCase() as 'IMAGE' | 'VIDEO',
            image_url: socialPost.metadata.assets[0].url,
            text: socialPost.metadata.content
          })

          return {
            status: 'scheduled',
            publicationTime: body.publicationTime,
            platform: socialPost.platform,
            socialCredentialID: socialPost.socialCredentialID,
            metadata: {
              type: socialPost.metadata.type,
              content: socialPost.metadata.content,
              assets: socialPost.metadata.assets.map((asset) => ({
                type: asset.type,
                url: asset.url
              })),
              creation_id
            }
          }
        }

        // x
        // if (socialPost.platform === Platform.X) {
        const imageXIds = await Promise.all(
          socialPost.metadata.assets.map((asset) =>
            uploadImageXFromUrl(
              asset.url,
              credential.access_token,
              socialPost.socialCredentialID,
              credential.refresh_token
            )
          )
        )

        return {
          status: 'scheduled',
          publicationTime: body.publicationTime,
          platform: socialPost.platform,
          socialCredentialID: socialPost.socialCredentialID,
          metadata: {
            type: socialPost.metadata.type,
            content: socialPost.metadata.content,
            assets: socialPost.metadata.assets.map((asset) => ({
              type: asset.type,
              url: asset.url
            })),
            media_ids: imageXIds
          }
        }
        // }
      })
    )

    await database.post.createMany({
      data: schedulePostRequestBody
    })
  }

  async getPostDetails(postId: string) {
    const post = await database.post.findUnique({
      where: {
        id: postId
      },
      include: {
        socialCredential: {
          select: {
            metadata: true
          }
        }
      }
    })

    return post
  }
}

const postServices = new PostServices()

export default postServices
