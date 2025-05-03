import { Router } from 'express'
import {
  createRecurringPost,
  deleteRecurringPostController,
  deleteRecurringPostInstanceController,
  updateRecurringPostController,
  updateRecurringPostInstancesController
} from '~/controllers/recurring.controller'
import { authValidator } from '~/middlewares/auth.middleware'
import { wrapHandleRequest } from '~/utils/handles'

const recurringRouter = Router()

recurringRouter.post('/', authValidator, wrapHandleRequest(createRecurringPost))

recurringRouter.patch('/:recurringId', authValidator, wrapHandleRequest(updateRecurringPostController))

recurringRouter.patch(
  '/:recurringId/instance',
  authValidator,
  wrapHandleRequest(updateRecurringPostInstancesController)
)

recurringRouter.delete('/:recurringId', authValidator, wrapHandleRequest(deleteRecurringPostController))

recurringRouter.delete(
  '/:recurringId/instance',
  authValidator,
  wrapHandleRequest(deleteRecurringPostInstanceController)
)

export default recurringRouter
