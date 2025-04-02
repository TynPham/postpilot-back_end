import express from 'express'
import postsRouter from './posts.router'
import credentialsRouter from './credentials.router'
import mediaRouter from './media.router'
import metadataRouter from './metadata.route'
import statisticalRouter from './statistical.router'

const appRouter = express.Router()

appRouter.use('/posts', postsRouter)

appRouter.use('/social-credentials', credentialsRouter)

appRouter.use('/media', mediaRouter)

appRouter.use('/metadata', metadataRouter)

appRouter.use('/statistical', statisticalRouter)

export default appRouter
