import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import metadataServices from '~/services/metadata.services'

export const getFbMetadataController = async (
  req: Request<ParamsDictionary, any, any, { id: string; postId: string }>,
  res: Response
) => {
  const { id, postId } = req.query

  const result = await metadataServices.getFbMetadata(id, postId)

  res.status(HTTP_STATUS_CODE.OK).json({
    data: result,
    message: 'Get metadata successfully'
  })
}
