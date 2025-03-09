import express, { ErrorRequestHandler, Request, Response } from 'express'
import database from '~/services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middleware'
import postsRouter from './routes/posts.router'

const app = express()
const port = 4000

app.use(express.json())

async function connectToDatabase() {
  try {
    await database.$connect()
    console.log('Connected to the database successfully')
  } catch (error) {
    console.error('Failed to connect to the database:', error)
    process.exit(1)
  }
}

app.get('/', async (req: Request, res: Response) => {
  res.json({
    message: 'Hello world'
  })
})

app.use('/posts', postsRouter)

app.use(defaultErrorHandler as ErrorRequestHandler)

const server = app.listen(port, async () => {
  await connectToDatabase()
  console.log(`Example app listening on port ${port}`)
})

process.on('SIGINT', () => {
  server.close(async () => {
    await database.$disconnect()
    console.log('Server closed')
  })
})
