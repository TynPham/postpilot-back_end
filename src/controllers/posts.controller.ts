/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import postServices from '~/services/posts.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { CreatePostRequestBody } from '~/models/request/posts.request'

export const getPostsController = async (req: Request, res: Response) => {
  const result = await postServices.getPosts()

  res.status(HTTP_STATUS_CODE.OK).json({
    result,
    message: 'Get posts successfully'
  })
}

export const createPostController = async (
  req: Request<ParamsDictionary, any, CreatePostRequestBody>,
  res: Response
) => {
  res.status(HTTP_STATUS_CODE.CREATED).json({
    message: 'Create post successfully'
  })
}
