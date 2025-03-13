import express from 'express'
import postsRouter from './posts.router'
import credentialsRouter from './credentials.router'

const appRouter = express.Router()

appRouter.use('/posts', postsRouter)

appRouter.use('/social-credentials', credentialsRouter)

export default appRouter
