import { Router } from 'express'
import {
  createCredentialController,
  getCredentialsController,
  disconnectCredentialController
} from '~/controllers/credentials.controller'
import { authValidator } from '~/middlewares/auth.middleware'
import { createCredentialValidator, getCredentialValidator } from '~/middlewares/credentials.middleware'
import { wrapHandleRequest } from '~/utils/handles'

const credentialsRouter = Router()

credentialsRouter.post('/', authValidator, createCredentialValidator, wrapHandleRequest(createCredentialController))
credentialsRouter.get('/', authValidator, getCredentialValidator, wrapHandleRequest(getCredentialsController))
credentialsRouter.patch('/:id/disconnect', authValidator, wrapHandleRequest(disconnectCredentialController))

export default credentialsRouter
