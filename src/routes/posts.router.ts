import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node'
import { Router } from 'express'
import { createPostController, getPostsController } from '~/controllers/posts.controller'
import { createPostValidator } from '~/middlewares/posts.middleware'
import { wrapHandleRequest } from '~/utils/handles'

const postsRouter = Router()

postsRouter.get('/', ClerkExpressWithAuth() as any, wrapHandleRequest(getPostsController))

postsRouter.post('/', ClerkExpressWithAuth() as any, createPostValidator, wrapHandleRequest(createPostController))

export default postsRouter
