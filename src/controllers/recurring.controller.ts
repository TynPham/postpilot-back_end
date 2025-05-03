import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import recurringPostService from '~/services/recurring.services'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { CreateRecurringPostRequestBody } from '~/models/request/recurring.request'
import {
  DeleteRecurringPostParams,
  DeleteRecurringPostQuery,
  UpdateRecurringPostParams,
  UpdateRecurringPostRequestBody
} from '~/models/request/posts.request'

export const createRecurringPost = async (
  req: Request<ParamsDictionary, any, CreateRecurringPostRequestBody>,
  res: Response
) => {
  const body = req.body
  const recurringPost = await recurringPostService.createRecurringPost(body)
  res.status(HTTP_STATUS_CODE.OK).json({
    data: recurringPost,
    message: 'Recurring post created successfully'
  })
}

export const updateRecurringPostController = async (
  req: Request<UpdateRecurringPostParams, any, UpdateRecurringPostRequestBody>,
  res: Response
) => {
  const recurringId = req.params.recurringId
  const body = req.body

  // update recurring post
  await recurringPostService.updateRecurringPost(recurringId, body)

  res.status(HTTP_STATUS_CODE.OK).json({
    message: 'Update recurring post successfully'
  })
}

export const updateRecurringPostInstancesController = async (
  req: Request<UpdateRecurringPostParams, any, UpdateRecurringPostRequestBody>,
  res: Response
) => {
  const recurringId = req.params.recurringId
  const body = req.body

  // update recurring post instance
  await recurringPostService.updateRecurringPostInstances(recurringId, body)

  res.status(HTTP_STATUS_CODE.OK).json({
    message: 'Update recurring post instances successfully'
  })
}

export const deleteRecurringPostController = async (req: Request<DeleteRecurringPostParams>, res: Response) => {
  const recurringId = req.params.recurringId

  // delete recurring post
  await recurringPostService.deleteRecurringPost(recurringId)

  res.status(HTTP_STATUS_CODE.OK).json({
    message: 'Delete recurring post successfully'
  })
}

export const deleteRecurringPostInstanceController = async (
  req: Request<DeleteRecurringPostParams, any, any, DeleteRecurringPostQuery>,
  res: Response
) => {
  const recurringId = req.params.recurringId
  const publicationTime = req.query.publicationTime

  await recurringPostService.deleteRecurringPostInstance(recurringId, publicationTime)

  res.status(HTTP_STATUS_CODE.OK).json({
    message: 'Delete recurring post instance successfully'
  })
}
