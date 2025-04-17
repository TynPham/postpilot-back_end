import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import { envConfig } from '~/configs/env.config'
import { Post } from '@prisma/client'

let io: Server

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: envConfig.client_url,
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}

// Các hàm emit event
export const emitPostCreated = (data: { postId: string; status: string; timestamp: string }) => {
  getIO().emit('post:created', data)
}

export const emitPostStatusUpdated = (data: { postId: string; status: string; timestamp: string }) => {
  getIO().emit('post:status_updated', data)
}

export const emitPostProcessed = (data: {
  postId?: string
  status: string
  timestamp: string
  post?: Post
  virtualId?: string
}) => {
  getIO().emit('post:processed', data)
}

export const emitPostFailed = (data: {
  postId?: string
  status: string
  error: string
  timestamp: string
  post?: Post
  virtualId?: string
}) => {
  getIO().emit('post:failed', data)
}
