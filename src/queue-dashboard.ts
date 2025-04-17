import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import {
  schedulePostQueue,
  publishPostQueue,
  checkPublishedPostsQueue,
  checkRecurringPostsQueue,
  recurringPostQueue,
  checkActivePostsQueue
} from './services/queue.services'

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [
    new BullMQAdapter(schedulePostQueue),
    new BullMQAdapter(publishPostQueue),
    new BullMQAdapter(checkPublishedPostsQueue),
    new BullMQAdapter(checkRecurringPostsQueue),
    new BullMQAdapter(recurringPostQueue),
    new BullMQAdapter(checkActivePostsQueue)
  ],
  serverAdapter: serverAdapter
})

export { serverAdapter }
