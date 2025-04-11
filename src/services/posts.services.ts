import { CreatePostRequestBody } from '~/models/request/posts.request'
import database from './database.services'
import { getFbLikes, uploadImageFb, publishPostFb } from '~/helpers/facebook'
import { ErrorWithStatus } from '~/models/errors'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { Platform } from '~/constants/enum'
import {
  createCarouselThreadsMediaContainer,
  createSingleThreadsMediaContainer,
  publishPostThreads
} from '~/helpers/threads'
import { uploadImageXFromUrl, publishPostX } from '~/helpers/x'
import { omit } from 'lodash'
import {
  createCarouselInstagramMediaContainer,
  createSingleInstagramMediaContainer,
  publishPostInstagram
} from '~/helpers/instagram'
import { platformHandlers } from '~/helpers'

class PostServices {
  async getPosts(userId: string, platform?: string) {
    const posts = await database.post.findMany({
      where: {
        socialCredential: {
          userId
        },
        platform
      },
      include: {
        socialCredential: {
          select: {
            metadata: true
          }
        },
        publishedPost: true
      }
    })

    return posts
  }

  async schedulePost(post: {
    id: string
    status: string
    publicationTime: string
    platform: string
    socialCredentialID: string
    metadata: {
      type: string
      content: string
      assets: { type: string; url: string }[]
    }
  }) {
    const credential = await database.socialCredential.findUnique({
      where: { id: post.socialCredentialID },
      select: { credentials: true }
    })

    if (!credential) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: `No credential found with id: ${post.socialCredentialID}`
      })
    }

    let updatedMetadata: any = post.metadata

    // Facebook
    if (post.platform === Platform.Facebook) {
      const imageFbIds = await Promise.all(
        post.metadata.assets.map((asset) => {
          return uploadImageFb({
            access_token: (credential.credentials as any).access_token,
            page_id: (credential.credentials as any).page_id,
            url: asset.url
          })
        })
      )
      updatedMetadata = {
        ...post.metadata,
        media_fbid: imageFbIds
      }
    }

    // Threads
    if (post.platform === Platform.Threads) {
      let createMediaContainerFunction = null
      let createMediaBody: any = {
        media_type: post.metadata.assets[0].type.toUpperCase() as 'IMAGE' | 'VIDEO',
        text: post.metadata.content
      }
      if (post.metadata.assets.length > 1) {
        createMediaContainerFunction = createCarouselThreadsMediaContainer
        createMediaBody.image_url = post.metadata.assets.map((asset) => asset.url)
      } else {
        createMediaContainerFunction = createSingleThreadsMediaContainer
        createMediaBody.image_url = post.metadata.assets[0].url
      }

      const creation_id = await createMediaContainerFunction(
        (credential.credentials as any).access_token,
        (credential.credentials as any).user_id,
        createMediaBody
      )
      updatedMetadata = {
        ...post.metadata,
        creation_id
      }
    }

    // X (Twitter)
    if (post.platform === Platform.X) {
      const imageXIds = await Promise.all(
        post.metadata.assets.map((asset) =>
          uploadImageXFromUrl(
            asset.url,
            (credential.credentials as any).access_token,
            post.socialCredentialID,
            (credential.credentials as any).refresh_token
          )
        )
      )
      updatedMetadata = {
        ...post.metadata,
        media_ids: imageXIds
      }
    }

    // Instagram
    if (post.platform === Platform.Instagram) {
      let createMediaContainerFunction = null
      let createMediaBody: any = {
        caption: post.metadata.content
      }
      if (post.metadata.assets.length > 1) {
        createMediaContainerFunction = createCarouselInstagramMediaContainer
        createMediaBody.image_urls = post.metadata.assets.map((asset) => asset.url)
      } else {
        createMediaContainerFunction = createSingleInstagramMediaContainer
        createMediaBody.image_url = post.metadata.assets[0].url
      }
      const creation_id = await createMediaContainerFunction(
        (credential.credentials as any).access_token,
        (credential.credentials as any).user_id,
        createMediaBody
      )
      updatedMetadata = {
        ...post.metadata,
        creation_id
      }
    }

    // update post with status SCHEDULED
    const updatedPost = await database.post.update({
      where: { id: post.id },
      data: {
        status: 'scheduled',
        metadata: updatedMetadata
      }
    })

    return updatedPost
  }

  async getPostDetails(postId: string) {
    const post = await database.post.findUnique({
      where: {
        id: postId
      },
      include: {
        socialCredential: {
          select: {
            metadata: true,
            credentials: true
          }
        },
        publishedPost: true
      }
    })

    if (post?.publishedPost) {
      let metadata: any = {}

      if (post?.platform === Platform.Facebook) {
        metadata.likes = await getFbLikes(
          post.publishedPost.postId,
          (post.socialCredential.credentials as any).access_token
        )
      }

      post.publishedPost.metadata = metadata
    }

    return omit(post, ['socialCredential.credentials'])
  }

  async updatePostStatus(postId: string, status: string) {
    const updatedPost = await database.post.update({
      where: { id: postId },
      data: { status }
    })

    // Emit socket event when post status is updated
    // emitPostStatusUpdated({
    //   postId,
    //   status,
    //   timestamp: new Date().toISOString()
    // })

    return updatedPost
  }

  async createPendingPost(body: CreatePostRequestBody) {
    const pendingPosts = body.socialPosts.map((socialPost) => ({
      status: 'pending',
      publicationTime: body.publicationTime,
      platform: socialPost.platform,
      socialCredentialID: socialPost.socialCredentialID,
      metadata: {
        type: socialPost.metadata.type,
        content: socialPost.metadata.content,
        assets: socialPost.metadata.assets.map((asset) => ({
          type: asset.type,
          url: asset.url
        }))
      }
    }))

    const createdPosts = await database.post.createManyAndReturn({
      data: pendingPosts
    })

    return createdPosts
  }

  async publishPost(post: {
    id: string
    status: string
    publicationTime: string
    platform: string
    socialCredentialID: string
    metadata: {
      type: string
      content: string
      assets: { type: string; url: string }[]
      media_fbid?: string[]
      creation_id?: string
      media_ids?: string[]
    }
  }) {
    const credential = await database.socialCredential.findUnique({
      where: { id: post.socialCredentialID },
      select: { credentials: true }
    })

    if (!credential) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS_CODE.BAD_REQUEST,
        message: `No credential found with id: ${post.socialCredentialID}`
      })
    }

    const credentials = credential.credentials as any
    if (post.platform === Platform.X) {
      credentials.socialCredentialID = post.socialCredentialID
    }

    const result = await platformHandlers[post.platform.toLowerCase()](post.metadata, credentials)

    // update post with status PUBLISHED and postId
    const updatedPost = await database.post.update({
      where: { id: post.id },
      data: {
        status: 'published'
      }
    })

    // create publishedPost
    await database.publishedPost.create({
      data: {
        id: post.id,
        postId: result,
        metadata: {}
      }
    })

    return updatedPost
  }

  async getScheduledPosts() {
    const now = new Date()
    const posts = await database.post.findMany({
      where: {
        status: 'scheduled',
        publicationTime: {
          lte: now
        }
      }
    })
    return posts
  }
}

const postServices = new PostServices()

export default postServices
