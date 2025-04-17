import database from '~/services/database.services'
import { addRecurringPostToScheduleQueue } from '~/services/queue.services'

export const scheduleRecurringPosts = async () => {
  const recurringPosts = await database.recurringPost.findMany({
    where: {
      status: 'active'
    }
  })

  await Promise.all(recurringPosts.map((recurringPost) => addRecurringPostToScheduleQueue(recurringPost.id)))
}
