import { Request, Response } from 'express'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { ParamsDictionary } from 'express-serve-static-core'
import { CreateCredentialRequestBody, GetCredentialRequestQuery } from '~/models/request/credential.request'
import credentialServices from '~/services/credentials.services'

export const createCredentialController = async (
  req: Request<ParamsDictionary, any, CreateCredentialRequestBody[]>,
  res: Response
) => {
  const requestBody = req.body
  const userId = req.auth?.userId as string
  await credentialServices.createCredential(userId, requestBody)

  res.status(HTTP_STATUS_CODE.OK).json({
    message: 'Create credential successfully'
  })
}

export const getCredentialsController = async (
  req: Request<ParamsDictionary, any, any, GetCredentialRequestQuery>,
  res: Response
) => {
  const { platform } = req.query
  const userId = req.auth?.userId as string
  const result = await credentialServices.getCredentials(userId, platform)

  res.status(HTTP_STATUS_CODE.OK).json({
    data: result,
    message: 'Get credentials successfully'
  })
}
