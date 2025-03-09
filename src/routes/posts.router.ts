import { Router } from 'express'
import { createPostController, getPostsController } from '~/controllers/posts.controller'
import { createPostValidator } from '~/middlewares/posts.middleware'
import { wrapHandleRequest } from '~/utils/handles'

const postsRouter = Router()

postsRouter.get('/', wrapHandleRequest(getPostsController))

postsRouter.post('/', createPostValidator, wrapHandleRequest(createPostController))

export default postsRouter
