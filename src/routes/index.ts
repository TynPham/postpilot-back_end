import express from 'express'
import postsRouter from './posts.router'

const appRouter = express.Router()

appRouter.use('/posts', postsRouter)

export default appRouter
