import { Router } from 'express'
import { getPostsController, schedulePostController, getPostDetailsController } from '~/controllers/posts.controller'
import { authValidator } from '~/middlewares/auth.middleware'
import { createPostValidator } from '~/middlewares/posts.middleware'
import { wrapHandleRequest } from '~/utils/handles'

const postsRouter = Router()

postsRouter.get('/', authValidator, wrapHandleRequest(getPostsController))

postsRouter.get('/:id', authValidator, wrapHandleRequest(getPostDetailsController))

postsRouter.post('/schedule', authValidator, createPostValidator, wrapHandleRequest(schedulePostController))

export default postsRouter
