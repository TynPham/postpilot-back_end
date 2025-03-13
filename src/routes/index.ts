import express from 'express'
import postsRouter from './posts.router'
import credentialsRouter from './credentials.router'
import mediaRouter from './media.router'

const appRouter = express.Router()

appRouter.use('/posts', postsRouter)

appRouter.use('/social-credentials', credentialsRouter)

appRouter.use('/media', mediaRouter)

export default appRouter
