import express from 'express'
import postsRouter from './posts.router'
import credentialsRouter from './credentials.router'
import mediaRouter from './media.router'
import statisticalRouter from './statistical.router'
import webhooksRouter from './webhooks.router'
import authRouter from './auth.router'
import recurringRouter from './recurring.router'

const appRouter = express.Router()

appRouter.use('/posts', postsRouter)

appRouter.use('/social-credentials', credentialsRouter)

appRouter.use('/media', mediaRouter)

appRouter.use('/statistical', statisticalRouter)

appRouter.use('/webhooks', webhooksRouter)

appRouter.use('/auth', authRouter)

appRouter.use('/recurring', recurringRouter)

export default appRouter
