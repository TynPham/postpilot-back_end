import { Router } from 'express'
import { update } from 'lodash'
import {
  getPostsController,
  schedulePostController,
  getPostDetailsController,
  updatePostController,
  deletePostController
} from '~/controllers/posts.controller'
import { authValidator } from '~/middlewares/auth.middleware'
import { createPostValidator } from '~/middlewares/posts.middleware'
import { wrapHandleRequest } from '~/utils/handles'

const postsRouter = Router()

postsRouter.get('/', authValidator, wrapHandleRequest(getPostsController))

postsRouter.get('/:id', authValidator, wrapHandleRequest(getPostDetailsController))

postsRouter.post('/schedule', authValidator, wrapHandleRequest(schedulePostController))

postsRouter.patch('/:id', authValidator, wrapHandleRequest(updatePostController))

postsRouter.delete('/:id', authValidator, wrapHandleRequest(deletePostController))

export default postsRouter
