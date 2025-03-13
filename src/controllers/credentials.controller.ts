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
  await credentialServices.createCredential(requestBody)

  res.status(HTTP_STATUS_CODE.OK).json({
    message: 'Create credential successfully'
  })
}

export const getCredentialsController = async (
  req: Request<ParamsDictionary, any, any, GetCredentialRequestQuery>,
  res: Response
) => {
  const { platform } = req.query
  const result = await credentialServices.getCredentials(platform)

  res.status(HTTP_STATUS_CODE.OK).json({
    data: result,
    message: 'Get credentials successfully'
  })
}
