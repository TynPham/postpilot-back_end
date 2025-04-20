import { Queue, Worker } from 'bullmq'
import postServices from './posts.services'
import { emitPostProcessed, emitPostFailed } from './socket.services'
import { envConfig, isProduction } from '~/configs/env.config'
import { addPublishPostsToQueue } from '~/jobs/publish-post'
import { scheduleRecurringPosts } from '~/jobs/recurring-post'
import recurringServicer from './recurring.services'

const redisConnection = isProduction
  ? {
      host: envConfig.redis_host,
      port: parseInt(envConfig.redis_port),
      username: envConfig.redis_username,
      password: envConfig.redis_password,
      tls: envConfig.redis_tls === 'true' ? {} : undefined
    }
  : {
      host: 'localhost',
      port: 6379
    }

// Create queues
const schedulePostQueue = new Queue('schedule-post-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: false,
    removeOnFail: false
  }
})

const publishPostQueue = new Queue('publish-post-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: false,
    removeOnFail: false
  }
})

const checkPublishedPostsQueue = new Queue('check-published-posts-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: false,
    removeOnFail: true
  }
})

const checkRecurringPostsQueue = new Queue('check-recurring-posts-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: false,
    removeOnFail: true
  }
})

const recurringPostQueue = new Queue('recurring-post-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: false,
    removeOnFail: false
  }
})

const checkActivePostsQueue = new Queue('check-active-posts-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: false,
    removeOnFail: true
  }
})

// Create workers
const schedulePostWorker = new Worker(
  'schedule-post-queue',
  async (job) => {
    const { post } = job.data
    try {
      const updatedPost = await postServices.schedulePost(post)
      await new Promise((resolve) =>
        setTimeout(() => {
          emitPostProcessed({
            postId: post.id,
            status: 'scheduled',
            timestamp: new Date().toISOString(),
            post: updatedPost,
            virtualId: post.metadata.virtualId
          })
          resolve(true)
        }, 1000)
      )
      return { success: true }
    } catch (error) {
      await new Promise((resolve) =>
        setTimeout(() => {
          emitPostFailed({
            postId: post.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            post: post,
            virtualId: post.metadata.virtualId
          })
          resolve(true)
        }, 1000)
      )
      throw error
    }
  },
  {
    connection: redisConnection,
    concurrency: 5
  }
)

const publishPostWorker = new Worker(
  'publish-post-queue',
  async (job) => {
    const { post } = job.data
    try {
      const updatedPost = await postServices.publishPost(post)
      emitPostProcessed({
        postId: post.id,
        status: 'published',
        timestamp: new Date().toISOString(),
        post: updatedPost,
        virtualId: post.metadata.virtualId
      })
      return { success: true }
    } catch (error) {
      emitPostFailed({
        postId: post.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        post: post,
        virtualId: post.metadata.virtualId
      })
      throw error
    }
  },
  {
    connection: redisConnection,
    concurrency: 5
  }
)

const checkPublishedPostsWorker = new Worker(
  'check-published-posts-queue',
  async (job) => {
    await addPublishPostsToQueue()
    return { success: true }
  },
  {
    connection: redisConnection,
    concurrency: 1
  }
)

const checkRecurringPostsWorker = new Worker(
  'check-recurring-posts-queue',
  async (job) => {
    await scheduleRecurringPosts()
    return { success: true }
  },
  {
    connection: redisConnection,
    concurrency: 1
  }
)

const recurringPostWorker = new Worker(
  'recurring-post-queue',
  async (job) => {
    const { recurringPostId } = job.data
    await recurringServicer.scheduleNextPost(recurringPostId)
    return { success: true }
  },
  {
    connection: redisConnection,
    concurrency: 5
  }
)

// Create worker for checking active posts
const checkActivePostsWorker = new Worker(
  'check-active-posts-queue',
  async (job) => {
    await postServices.checkActivePosts()
    return { success: true }
  },
  {
    connection: redisConnection,
    concurrency: 1
  }
)

// Process worker errors
schedulePostWorker.on('failed', (job, err) => {
  console.error(`Schedule post job ${job?.id} failed with error:`, err)
})

publishPostWorker.on('failed', (job, err) => {
  console.error(`Publish post job ${job?.id} failed with error:`, err)
})

checkPublishedPostsWorker.on('failed', (job, err) => {
  console.error(`Check published posts job ${job?.id} failed with error:`, err)
})

checkRecurringPostsWorker.on('failed', (job, err) => {
  console.error(`Check recurring posts job ${job?.id} failed with error:`, err)
})

recurringPostWorker.on('failed', (job, err) => {
  console.error(`recurring post job ${job?.id} failed with error:`, err)
})

checkActivePostsWorker.on('failed', (job, err) => {
  console.error(`Check active posts job ${job?.id} failed with error:`, err)
})

// Add job to queues
export const addPostToScheduleQueue = async (post: {
  id: string
  status: string
  publicationTime: string
  platform: string
  socialCredentialID: string
  metadata: {
    type: string
    content: string
    assets: { type: string; url: string }[]
    virtualId?: string
  }
  recurringPostId?: string
}) => {
  await schedulePostQueue.add('schedule-post', { post })
}

export const addPostToPublishQueue = async (post: {
  id: string
  status: string
  publicationTime: string
  platform: string
  socialCredentialID: string
  metadata: {
    type: string
    content: string
    assets: { type: string; url: string }[]
    virtualId?: string
  }
}) => {
  await publishPostQueue.add('publish-post', { post })
}

export const addRecurringPostToScheduleQueue = async (recurringPostId: string) => {
  await recurringPostQueue.add('recurring-post', { recurringPostId })
}

// Add repeat job
checkPublishedPostsQueue.add(
  'check-published-posts',
  {},
  {
    repeat: {
      pattern: '*/15 * * * * *' // run every 15 seconds
    }
  }
)

// Add immediate job
checkPublishedPostsQueue.add('check-published-posts', {})

checkRecurringPostsQueue.add(
  'check-recurring-posts',
  {},
  {
    repeat: {
      pattern: '0 */12 * * *' // run every 12 hours
    }
  }
)

// Add immediate job
checkRecurringPostsQueue.add('check-recurring-posts', {})

// Add repeat job to check active posts every 12 hours
checkActivePostsQueue.add(
  'check-active-posts',
  {},
  {
    repeat: {
      pattern: '0 */12 * * *' // run every 12 hours
    }
  }
)

// Add immediate job
checkActivePostsQueue.add('check-active-posts', {})

// Cleanup function to close all workers and queues
export const cleanup = async () => {
  console.log('Closing workers and queues...')

  // Close workers
  await schedulePostWorker.close()
  await publishPostWorker.close()
  await checkPublishedPostsWorker.close()
  await checkRecurringPostsWorker.close()
  await recurringPostWorker.close()
  await checkActivePostsWorker.close()

  // Close queues
  await schedulePostQueue.close()
  await publishPostQueue.close()
  await checkPublishedPostsQueue.close()
  await checkRecurringPostsQueue.close()
  await recurringPostQueue.close()
  await checkActivePostsQueue.close()

  await schedulePostQueue.disconnect()
  await publishPostQueue.disconnect()
  await checkPublishedPostsQueue.disconnect()
  await checkRecurringPostsQueue.disconnect()
  await recurringPostQueue.disconnect()
  await checkActivePostsQueue.disconnect()

  console.log('All workers and queues closed')
}

export {
  schedulePostQueue,
  publishPostQueue,
  checkPublishedPostsQueue,
  checkRecurringPostsQueue,
  recurringPostQueue,
  checkActivePostsQueue
}
