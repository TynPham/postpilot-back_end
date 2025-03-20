import { Router } from 'express'
import { uploadImageController } from '~/controllers/media.controller'
import { authValidator } from '~/middlewares/auth.middleware'
import { wrapHandleRequest } from '~/utils/handles'

const mediaRouter = Router()

mediaRouter.post('/upload-image', authValidator, wrapHandleRequest(uploadImageController))

export default mediaRouter
