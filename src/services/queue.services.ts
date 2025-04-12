import { Queue, Worker } from 'bullmq'
import postServices from './posts.services'
import { emitPostProcessed, emitPostFailed } from './socket.services'
import { schedulePosts } from '~/jobs/schedule-post'
import { envConfig } from '~/configs/env.config'

const redisConnection = {
  host: envConfig.redis_host || 'localhost',
  port: parseInt(envConfig.redis_port || '6379'),
  tls: envConfig.redis_tls === 'true' ? {} : undefined
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

const checkScheduledPostsQueue = new Queue('check-scheduled-posts-queue', {
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

// Create workers
const schedulePostWorker = new Worker(
  'schedule-post-queue',
  async (job) => {
    const { post } = job.data
    try {
      await postServices.schedulePost(post)
      emitPostProcessed({
        postId: post.id,
        status: 'scheduled',
        timestamp: new Date().toISOString()
      })
      return { success: true }
    } catch (error) {
      emitPostFailed({
        postId: post.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
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
      await postServices.publishPost(post)
      emitPostProcessed({
        postId: post.id,
        status: 'published',
        timestamp: new Date().toISOString()
      })
      return { success: true }
    } catch (error) {
      emitPostFailed({
        postId: post.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      throw error
    }
  },
  {
    connection: redisConnection,
    concurrency: 5
  }
)

const checkScheduledPostsWorker = new Worker(
  'check-scheduled-posts-queue',
  async (job) => {
    await schedulePosts()
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

checkScheduledPostsWorker.on('failed', (job, err) => {
  console.error(`Check scheduled posts job ${job?.id} failed with error:`, err)
})

// Add job to queues
export const addPostToProcessQueue = async (post: {
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
  }
}) => {
  await publishPostQueue.add('publish-post', { post })
}

// Add repeat job to check for scheduled posts
checkScheduledPostsQueue.add(
  'check-scheduled-posts',
  {},
  {
    repeat: {
      pattern: '*/15 * * * * *' // run every 15 seconds
    }
  }
)

// Cleanup function to close all workers and queues
export const cleanup = async () => {
  console.log('Closing workers and queues...')

  // Close workers
  await schedulePostWorker.close()
  await publishPostWorker.close()
  await checkScheduledPostsWorker.close()

  // Close queues
  await schedulePostQueue.close()
  await publishPostQueue.close()
  await checkScheduledPostsQueue.close()

  await schedulePostQueue.disconnect()
  await publishPostQueue.disconnect()
  await checkScheduledPostsQueue.disconnect()

  console.log('All workers and queues closed')
}
export { schedulePostQueue, publishPostQueue, checkScheduledPostsQueue }
