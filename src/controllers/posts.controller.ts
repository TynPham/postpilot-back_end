import { Request, Response } from 'express'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import postServices from '~/services/posts.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { CreatePostRequestBody, GetPostDetailsParams, GetPostQuery } from '~/models/request/posts.request'

export const getPostsController = async (req: Request<ParamsDictionary, any, any, GetPostQuery>, res: Response) => {
  const userId = req.auth?.userId
  const platform = req.query.platform
  const result = await postServices.getPosts(userId as string, platform)

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
  await postServices.schedulePost(body)
  res.status(HTTP_STATUS_CODE.CREATED).json({
    message: 'Create post successfully'
  })
}

export const getPostDetailsController = async (req: Request<GetPostDetailsParams>, res: Response) => {
  const postId = req.params.id
  const result = await postServices.getPostDetails(postId)

  res.status(HTTP_STATUS_CODE.OK).json({
    data: result,
    message: 'Get post details successfully'
  })
}
