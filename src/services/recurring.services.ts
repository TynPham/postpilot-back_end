import { CreateRecurringPostRequestBody } from '~/models/request/recurring.request'
import database from './database.services'
import { InputJsonValue, JsonValue } from '@prisma/client/runtime/library'
import { addPostToScheduleQueue } from './queue.services'
import postServices from './posts.services'
import { omit } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { UpdateRecurringPostRequestBody } from '~/models/request/posts.request'

class RecurringPostService {
  async createRecurringPost(body: CreateRecurringPostRequestBody) {
    if (body.socialPosts[0].metadata && body.socialPosts[0].metadata.assets.length === 0) {
      const tempRecurringPostIds = body.socialPosts.map(() => uuidv4())

      // create recurring post first
      const recurringPost = await database.recurringPost.createManyAndReturn({
        data: body.socialPosts.map((post, index) => ({
          id: tempRecurringPostIds[index],
          platform: post.platform,
          socialCredentialID: post.socialCredentialID,
          metadata: post.metadata as InputJsonValue,
          publicationTime: body.publicationTime,
          frequency: body.recurring.frequency,
          daysOfWeek: body.recurring.daysOfWeek,
          startDate: body.recurring.startDate,
          endDate: body.recurring.endDate,
          status: 'completed'
        }))
      })

      const startDate = new Date(body.recurring.startDate)
      const endDate = new Date(body.recurring.endDate)

      // create array of dates to post
      const dates = []
      let currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        if (
          body.recurring.frequency === 'daily' ||
          (body.recurring.frequency === 'weekly' && body.recurring.daysOfWeek?.includes(currentDate.getDay()))
        ) {
          dates.push(new Date(currentDate))
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // create post for each date
      const pendingPosts = await Promise.all(
        dates.map((date) =>
          postServices.createPendingPost(
            omit(
              {
                ...body,
                publicationTime: date.toISOString(),
                socialPosts: body.socialPosts.map((post, index) => ({
                  ...post,
                  recurringPostId: tempRecurringPostIds[index]
                }))
              },
              ['recurring']
            )
          )
        )
      )

      // Flatten array
      const allPosts = pendingPosts.flat()
      await Promise.all(allPosts.map((post) => addPostToScheduleQueue(post as any)))

      return recurringPost
    }

    const recurringBody = body.socialPosts.map((post) => ({
      ...post,
      publicationTime: body.publicationTime,
      frequency: body.recurring.frequency,
      daysOfWeek: body.recurring.daysOfWeek,
      startDate: body.recurring.startDate,
      endDate: body.recurring.endDate,
      status: 'active',
      nextScheduledDate: body.recurring.startDate
    }))

    const recurringPost = await database.recurringPost.createManyAndReturn({
      data: recurringBody
    })

    await Promise.all(recurringPost.map((post) => this.scheduleNextPost(post.id)))

    return recurringPost
  }

  async scheduleNextPost(recurringPostId: string) {
    const recurringPost = await database.recurringPost.findUnique({
      where: { id: recurringPostId, socialCredential: { is_disconnected: false } }
    })

    if (!recurringPost) {
      throw new Error('Recurring post not found')
    }

    // Calculate next date
    let nextDate = recurringPost.nextScheduledDate !== null ? new Date(recurringPost.nextScheduledDate) : null
    if (nextDate === null) {
      return
    }

    if (recurringPost.skipDates && recurringPost.skipDates.some((d) => new Date(d).getTime() === nextDate.getTime())) {
      const nextScheduledDate = new Date(nextDate)
      nextScheduledDate.setDate(nextScheduledDate.getDate() + 1)
      if (recurringPost.frequency === 'weekly') {
        while (!recurringPost.daysOfWeek.includes(nextScheduledDate.getDay())) {
          nextScheduledDate.setDate(nextScheduledDate.getDate() + 1)
        }
      }
      if (nextScheduledDate > recurringPost.endDate) {
        await database.recurringPost.update({
          where: { id: recurringPost.id },
          data: {
            status: 'completed',
            nextScheduledDate: null
          }
        })
      } else {
        await database.recurringPost.update({
          where: { id: recurringPost.id },
          data: {
            nextScheduledDate
          }
        })
      }
      return
    }

    const now = new Date()
    // Only schedule if:
    // 1. It's a schedule day (daily or correct day of the week)
    // 2. Within 24 hours
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    if (nextDate <= twentyFourHoursFromNow) {
      const instance = await database.recurringPostInstance.findFirst({
        where: {
          recurringPostId: recurringPost.id,
          publicationTime: nextDate.toISOString()
        }
      })

      let metadata = {
        ...(recurringPost.metadata as any),
        virtualId: `recurring-${recurringPost.id}-${nextDate.toISOString()}`
      }

      if (instance) {
        metadata = {
          ...metadata,
          ...(instance.metadata as any)
        }
      }

      // Create post from recurring post info
      const scheduledPost = await database.post.create({
        data: {
          status: 'pending',
          publicationTime: nextDate.toISOString(),
          platform: recurringPost.platform,
          socialCredentialID: recurringPost.socialCredentialID,
          metadata,
          recurringPostId: recurringPost.id
        }
      })

      if (instance) {
        await database.recurringPostInstance.delete({
          where: {
            id: instance.id
          }
        })
      }

      // Add to schedule queue
      await addPostToScheduleQueue({
        id: scheduledPost.id,
        status: scheduledPost.status,
        publicationTime: scheduledPost.publicationTime.toISOString(),
        platform: scheduledPost.platform,
        socialCredentialID: scheduledPost.socialCredentialID,
        metadata
      })

      // Update nextScheduledDate
      const nextScheduledDate = nextDate
      nextScheduledDate.setDate(nextScheduledDate.getDate() + 1)
      if (recurringPost.frequency === 'weekly') {
        while (!recurringPost.daysOfWeek.includes(nextScheduledDate.getDay())) {
          nextScheduledDate.setDate(nextScheduledDate.getDate() + 1)
        }
      }

      if (nextScheduledDate > recurringPost.endDate) {
        await database.recurringPost.update({
          where: { id: recurringPost.id },
          data: {
            status: 'completed',
            nextScheduledDate: null
          }
        })
      } else {
        await database.recurringPost.update({
          where: { id: recurringPost.id },
          data: {
            nextScheduledDate
          }
        })
      }
    }
  }

  async updateRecurringPost(recurringId: string, body: UpdateRecurringPostRequestBody) {
    await database.recurringPostInstance.deleteMany({
      where: { recurringPostId: recurringId }
    })

    const data = {
      publicationTime: body.publicationTime,
      updatedAt: new Date(),
      startDate: new Date(body.recurring.startDate),
      endDate: new Date(body.recurring.endDate),
      daysOfWeek: body.recurring.daysOfWeek,
      frequency: body.recurring.frequency,
      nextScheduledDate: new Date(body.recurring.startDate)
    }

    const updatedRecurringPost = await database.recurringPost.update({
      where: { id: recurringId },
      data
    })

    const scheduledPosts = await database.post.findMany({
      where: {
        recurringPostId: recurringId,
        status: 'scheduled'
      }
    })

    for (const post of scheduledPosts) {
      const oldDate = new Date(post.publicationTime)
      const [hours, minutes] = body.publicationTime.split(':').map(Number)
      oldDate.setUTCHours(hours, minutes)
      const updatedPost = await database.post.update({
        where: { id: post.id },
        data: {
          publicationTime: oldDate,
          metadata: {
            ...(post.metadata as any),
            ...(body.metadata as any)
          }
        }
      })

      await addPostToScheduleQueue({
        id: updatedPost.id,
        status: updatedPost.status,
        publicationTime: updatedPost.publicationTime.toISOString(),
        platform: updatedPost.platform,
        socialCredentialID: updatedPost.socialCredentialID,
        metadata: updatedPost.metadata as any
      })
    }
    return updatedRecurringPost
  }

  async updateRecurringPostInstances(recurringId: string, body: UpdateRecurringPostRequestBody) {
    const { postId, ...validData } = body
    const updatedRecurringPostInstance = await database.recurringPostInstance.upsert({
      where: {
        recurringPostId_publicationTime: { recurringPostId: recurringId, publicationTime: body.publicationTime }
      },
      update: { ...validData, updatedAt: new Date() },
      create: { ...validData, status: 'active', recurringPost: { connect: { id: recurringId } } }
    })

    // check if postId is provided
    if (postId) {
      const existingPost = await database.post.findUnique({
        where: { id: postId }
      })
      if (!existingPost) {
        throw new Error('Post not found')
      }
      // update post
      const updatedPost = await database.post.update({
        where: { id: postId },
        data: {
          metadata: {
            ...(existingPost.metadata as any),
            ...(body.metadata as any)
          }
        }
      })
      // Reschedule the post
      await addPostToScheduleQueue({
        id: updatedPost.id,
        status: updatedPost.status,
        publicationTime: updatedPost.publicationTime.toISOString(),
        platform: updatedPost.platform,
        socialCredentialID: updatedPost.socialCredentialID,
        metadata: updatedPost.metadata as any
      })
    }
    return updatedRecurringPostInstance
  }

  async deleteRecurringPost(recurringId: string) {
    await database.recurringPostInstance.deleteMany({
      where: { recurringPostId: recurringId }
    })
    await database.recurringPost.delete({
      where: { id: recurringId }
    })
  }

  async deleteRecurringPostInstance(recurringId: string, publicationTime: string) {
    const dateObj = new Date(publicationTime)
    // remove instance
    await database.recurringPostInstance.deleteMany({
      where: {
        recurringPostId: recurringId,
        publicationTime: dateObj
      }
    })
    // add to skipDates
    await database.recurringPost.update({
      where: { id: recurringId },
      data: {
        skipDates: { push: [dateObj] }
      }
    })
  }
}

const recurringServicer = new RecurringPostService()

export default recurringServicer
