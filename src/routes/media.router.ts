import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node'
import { Router } from 'express'
import { uploadImageController } from '~/controllers/media.controller'
import { wrapHandleRequest } from '~/utils/handles'

const mediaRouter = Router()

mediaRouter.post('/upload-image', ClerkExpressWithAuth() as any, wrapHandleRequest(uploadImageController))

export default mediaRouter
