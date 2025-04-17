import { Router } from 'express'
import { createRecurringPost } from '~/controllers/recurring.controller'
import { authValidator } from '~/middlewares/auth.middleware'
import { wrapHandleRequest } from '~/utils/handles'

const recurringRouter = Router()

recurringRouter.post('/', authValidator, wrapHandleRequest(createRecurringPost))

export default recurringRouter
