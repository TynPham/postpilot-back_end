import { AuthObject } from '@clerk/clerk-sdk-node'
import { Request } from 'express'

declare module 'express' {
  interface Request {
    auth?: AuthObject
  }
}
