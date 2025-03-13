import express, { ErrorRequestHandler, Request, Response } from 'express'
import database from '~/services/database.services'
import { defaultErrorHandler } from './middlewares/errors.middleware'
import 'dotenv/config'
import cors from 'cors'
import { envConfig } from './configs/env.config'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import appRouter from './routes'
import { initFolder } from './utils/file'

const app = express()
const port = envConfig.port

// middlewares
app.use(cors())
app.use(express.json())

initFolder('uploads/images/temp')

// connect to the database
async function connectToDatabase() {
  try {
    await database.$connect()
    console.log('Connected to the database successfully')
  } catch (error) {
    console.error('Failed to connect to the database:', error)
    process.exit(1)
  }
}

// routes
app.get('/', async (req: Request, res: Response) => {
  res.json({
    message: 'Hello world'
  })
})

app.use('/api/v1', appRouter)

// swagger
const swaggerPath = path.join(__dirname, '../docs/docs.yaml')
const file = fs.readFileSync(swaggerPath, 'utf8')
const swaggerDocument = yaml.parse(file)
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// error handler
app.use(defaultErrorHandler as ErrorRequestHandler)

const server = app.listen(port, async () => {
  await connectToDatabase()
  console.log(`Example app listening on port ${port}`)
})

process.on('SIGINT', () => {
  server.close(async () => {
    await database.$disconnect()
    console.log('Disconnected')
    console.log('Server closed')
  })
})
