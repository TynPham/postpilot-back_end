import { Request, Response } from 'express'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import postServices from '~/services/posts.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { CreatePostRequestBody } from '~/models/request/posts.request'

export const getPostsController = async (req: Request, res: Response) => {
  const ownerId = req.auth?.userId
  const result = await postServices.getPosts(ownerId as string)

  res.status(HTTP_STATUS_CODE.OK).json({
    data: result,
    message: 'Get posts successfully'
  })
}

export const schedulePostController = async (
  req: Request<ParamsDictionary, any, CreatePostRequestBody>,
  res: Response
) => {
  const body = req.body
  const ownerId = req.auth?.userId
  await postServices.schedulePost(body, ownerId as string)
  res.status(HTTP_STATUS_CODE.CREATED).json({
    message: 'Create post successfully'
  })
}
