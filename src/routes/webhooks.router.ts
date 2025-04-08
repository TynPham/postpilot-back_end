import { Router } from 'express'
import { handleClerkWebhook } from '~/controllers/webhooks.controller'
import { wrapHandleRequest } from '~/utils/handles'

const webhooksRouter = Router()

webhooksRouter.post('/clerk', wrapHandleRequest(handleClerkWebhook))

export default webhooksRouter
