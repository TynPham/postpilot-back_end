import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node'
import { Router } from 'express'
import { getPostsController, schedulePostController, getPostDetailsController } from '~/controllers/posts.controller'
import { createPostValidator } from '~/middlewares/posts.middleware'
import { wrapHandleRequest } from '~/utils/handles'

const postsRouter = Router()

postsRouter.get('/', ClerkExpressWithAuth() as any, wrapHandleRequest(getPostsController))

postsRouter.get('/:id', ClerkExpressWithAuth() as any, wrapHandleRequest(getPostDetailsController))

postsRouter.post(
  '/schedule',
  ClerkExpressWithAuth() as any,
  createPostValidator,
  wrapHandleRequest(schedulePostController)
)

export default postsRouter
