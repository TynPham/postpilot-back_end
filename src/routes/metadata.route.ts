import { Router } from 'express'
import { getFbMetadataController } from '~/controllers/metadata.controller'
import { authValidator } from '~/middlewares/auth.middleware'
import { wrapHandleRequest } from '~/utils/handles'

const metadataRouter = Router()

metadataRouter.get('/facebook', authValidator, wrapHandleRequest(getFbMetadataController))

export default metadataRouter
