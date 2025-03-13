import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node'
import { Router } from 'express'
import { createCredentialController, getCredentialsController } from '~/controllers/credentials.controller'
import { createCredentialValidator, getCredentialValidator } from '~/middlewares/credentials.middleware'
import { wrapHandleRequest } from '~/utils/handles'

const credentialsRouter = Router()

credentialsRouter.post(
  '/',
  ClerkExpressWithAuth() as any,
  createCredentialValidator,
  wrapHandleRequest(createCredentialController)
)
credentialsRouter.get(
  '/',
  ClerkExpressWithAuth() as any,
  getCredentialValidator,
  wrapHandleRequest(getCredentialsController)
)

export default credentialsRouter
