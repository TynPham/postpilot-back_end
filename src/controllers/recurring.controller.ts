import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import recurringPostService from '~/services/recurring.services'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { CreateRecurringPostRequestBody } from '~/models/request/recurring.request'

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
