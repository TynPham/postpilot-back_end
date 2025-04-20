import { CreatePostRequestBody } from '~/models/request/posts.request'
import database from './database.services'
import { uploadImageFb, publishPostFb, getFbEngagement } from '~/helpers/facebook'
import { ErrorWithStatus } from '~/models/errors'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { Platform } from '~/constants/enum'
import {
  createCarouselThreadsMediaContainer,
  createSingleThreadsMediaContainer,
  createSingleTextMediaContainer,
  publishPostThreads,
  getThreadsEngagement
} from '~/helpers/threads'
import { uploadImageXFromUrl, publishPostX, getXEngagement } from '~/helpers/x'
import { omit } from 'lodash'
import {
  createCarouselInstagramMediaContainer,
  createSingleInstagramMediaContainer,
  getIgEngagement,
  publishPostInstagram
} from '~/helpers/instagram'
import { platformHandlers } from '~/helpers'
import { addPostToScheduleQueue } from './queue.services'
import moment from 'moment'

class PostServices {
  async getPosts(userId: string, platform?: string) {
    // First, get all social credentials for the user
    const userCredentials = await database.socialCredential.findMany({
      where: { userId, is_disconnected: false },
      select: { id: true }
    })

    const credentialIds = userCredentials.map((c) => c.id)

    const [posts, recurringPosts] = await Promise.all([
      database.post.findMany({
        where: {
          socialCredentialID: {
            in: credentialIds
          },
          platform,
          socialCredential: {
            is_disconnected: false
          }
        },
        include: {
          socialCredential: {
            select: {
              metadata: true
            }
          },
          publishedPost: true,
          recurringPost: true
        }
      }),
      database.recurringPost.findMany({
        where: {
          socialCredentialID: {
            in: credentialIds
          },
          status: 'active',
          platform,
          socialCredential: {
            is_disconnected: false
          }
        },
        include: {
          socialCredential: {
            select: {
              metadata: true
            }
          }
        }
      })
    ])

    // Create a map of recurring post IDs to their scheduled dates
    const recurringPostScheduledDates = new Map<string, Set<string>>()

    // Initialize the map with empty sets
    recurringPosts.forEach((recurringPost) => {
      recurringPostScheduledDates.set(recurringPost.id, new Set())
    })

    // Fill the map with dates that are already scheduled
    posts.forEach((post) => {
      if (post.recurringPostId) {
        const dateStr = new Date(post.publicationTime).toISOString().split('T')[0]
        const existingDates = recurringPostScheduledDates.get(post.recurringPostId) || new Set()
        existingDates.add(dateStr)
        recurringPostScheduledDates.set(post.recurringPostId, existingDates)
      }
    })

    // Process recurring posts to create virtual posts
    const virtualPosts = []

    for (const recurringPost of recurringPosts) {
      // Parse publication time (e.g., "23:00:00")
      const nextScheduledDate = recurringPost.nextScheduledDate
      if (nextScheduledDate === null) {
        continue
      }

      // Calculate end date
      const endDate = new Date(recurringPost.endDate)
      // Generate all dates between start date and end date
      const dates = []
      let currentDate = new Date(nextScheduledDate)

      while (currentDate <= endDate) {
        // Check if it's a day to schedule
        let isScheduleDay = false
        if (recurringPost.frequency === 'daily') {
          isScheduleDay = true
        } else if (recurringPost.frequency === 'weekly') {
          isScheduleDay = recurringPost.daysOfWeek.includes(currentDate.getDay())
        }

        if (isScheduleDay) {
          dates.push(new Date(currentDate))
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Create virtual posts for each date
      for (const date of dates) {
        // Check if this specific date is already scheduled
        const dateStr = date.toISOString().split('T')[0]
        const scheduledDates = recurringPostScheduledDates.get(recurringPost.id) || new Set()

        // Skip if this specific date is already scheduled
        if (scheduledDates.has(dateStr)) {
          continue
        }

        // Create a virtual post object
        const virtualPost = {
          id: `recurring-${recurringPost.id}-${date.toISOString()}`,
          status: recurringPost.status,
          publicationTime: date.toISOString(),
          platform: recurringPost.platform,
          socialCredentialID: recurringPost.socialCredentialID,
          metadata: {
            ...(recurringPost.metadata as any),
            virtualId: `recurring-${recurringPost.id}-${date.toISOString()}`
          },
          recurringPostId: recurringPost.id,
          socialCredential: {
            metadata: recurringPost.socialCredential.metadata
          }
        }

        virtualPosts.push(virtualPost)
      }
    }

    // Combine regular posts with virtual posts
    const allPosts = [...posts, ...virtualPosts]

    // Sort by publication time
    allPosts.sort((a, b) => {
      const dateA = new Date(a.publicationTime)
      const dateB = new Date(b.publicationTime)
      return dateB.getTime() - dateA.getTime()
    })

    return allPosts
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
    recurringPostId?: string
  }) {
    const credential = await database.socialCredential.findUnique({
      where: { id: post.socialCredentialID, is_disconnected: false },
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
      if (post.metadata.assets.length > 0) {
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
    }

    // Threads
    if (post.platform === Platform.Threads) {
      let creation_id = null
      if (post.metadata.assets.length > 0) {
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

        creation_id = await createMediaContainerFunction(
          (credential.credentials as any).access_token,
          (credential.credentials as any).user_id,
          createMediaBody
        )
      } else {
        creation_id = await createSingleTextMediaContainer(
          (credential.credentials as any).access_token,
          (credential.credentials as any).user_id,
          post.metadata.content
        )
      }
      updatedMetadata = {
        ...post.metadata,
        creation_id
      }
    }

    // X (Twitter)
    if (post.platform === Platform.X) {
      if (post.metadata.assets.length > 0) {
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
    }

    // Instagram
    if (post.platform === Platform.Instagram) {
      if (post.metadata.assets.length > 0) {
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
        id: postId,
        socialCredential: {
          is_disconnected: false
        }
      },
      include: {
        socialCredential: {
          select: {
            metadata: true,
            credentials: true
          }
        },
        publishedPost: true,
        recurringPost: true
      }
    })

    if (post?.publishedPost) {
      let metadata: any = {}

      if (post?.platform === Platform.Facebook) {
        const data = await getFbEngagement(
          post.publishedPost.postId,
          (post.socialCredential.credentials as any).access_token
        )
        metadata = {
          ...(post?.publishedPost.metadata as any),
          likes: data?.likes?.data,
          comments: data?.comments?.data,
          shares: data?.shares?.count
        }
      }

      if (post?.platform === Platform.Instagram) {
        const data = await getIgEngagement(
          post.publishedPost.postId,
          (post.socialCredential.credentials as any).access_token
        )
        metadata = {
          ...(post?.publishedPost.metadata as any),
          likes: data?.likes,
          comments: data?.comments,
          shares: data?.shares
        }
      }

      if (post?.platform === Platform.Threads) {
        const data = await getThreadsEngagement(
          post.publishedPost.postId,
          (post.socialCredential.credentials as any).access_token
        )
        metadata = {
          ...(post?.publishedPost.metadata as any),
          likes: data?.likes,
          comments: data?.replies,
          shares: data?.shares
        }
      }

      if (post?.platform === Platform.X) {
        const data = await getXEngagement(
          post.publishedPost.postId,
          (post.socialCredential.credentials as any).access_token,
          (post.socialCredential.credentials as any).refresh_token,
          post.socialCredentialID,
          post.id
        )
        metadata = {
          ...(post?.publishedPost.metadata as any),
          likes: data?.likes,
          comments: data?.replies,
          retweets: data?.retweets
        }
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
    const now = new Date()
    const publicationDate = new Date(body.publicationTime)

    const posts = body.socialPosts.map((socialPost) => {
      // Check if any post has media
      const hasMedia = socialPost.metadata.assets && socialPost.metadata.assets.length > 0
      // If the post has media and the time period > 24 hours then set active
      const isActive = hasMedia && publicationDate.getTime() - now.getTime() > 24 * 60 * 60 * 1000

      const data: any = {
        status: isActive ? 'active' : 'pending',
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
      }

      if (socialPost.recurringPostId) {
        data.recurringPostId = socialPost.recurringPostId
      }

      return data
    })

    const createdPosts = await database.post.createManyAndReturn({
      data: posts
    })

    const pendingPosts = createdPosts.filter((post) => post.status === 'pending')

    return pendingPosts
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
      where: { id: post.socialCredentialID, is_disconnected: false },
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
        },
        socialCredential: {
          is_disconnected: false
        }
      }
    })
    return posts
  }

  async checkActivePosts() {
    const now = new Date()
    const activePosts = await database.post.findMany({
      where: {
        status: 'active',
        socialCredential: {
          is_disconnected: false
        }
      }
    })

    await Promise.all(
      activePosts.map((post) => {
        const publicationDate = new Date(post.publicationTime)
        const timeDiff = publicationDate.getTime() - now.getTime()

        // If time difference is less than or equal to 24 hours, change status to pending
        if (timeDiff <= 24 * 60 * 60 * 1000) {
          // Add to schedule queue
          addPostToScheduleQueue(post as any)
        }
      })
    )

    return activePosts
  }
}

const postServices = new PostServices()

export default postServices
