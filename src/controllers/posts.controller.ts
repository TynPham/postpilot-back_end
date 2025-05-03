import { Request, Response } from 'express'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import postServices from '~/services/posts.services'
import { ParamsDictionary } from 'express-serve-static-core'
import {
  CreatePostRequestBody,
  DeletePostParams,
  DeleteRecurringPostParams,
  GetPostDetailsParams,
  GetPostQuery,
  UpdatePostParams,
  UpdatePostRequestBody,
  UpdateRecurringPostInstancesParams,
  UpdateRecurringPostParams,
  UpdateRecurringPostRequestBody
} from '~/models/request/posts.request'
import { addPostToScheduleQueue } from '~/services/queue.services'

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

  // create posts with status PENDING
  const pendingPosts = await postServices.createPendingPost(body)

  // add to queue to process
  await Promise.all(pendingPosts.map((post) => addPostToScheduleQueue(post as any)))

  res.status(HTTP_STATUS_CODE.CREATED).json({
    message: 'Posts have been added to queue for processing'
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

export const updatePostController = async (
  req: Request<UpdatePostParams, any, UpdatePostRequestBody>,
  res: Response
) => {
  const postId = req.params.id
  const body = req.body

  // update post
  await postServices.updatePost(postId, body)

  res.status(HTTP_STATUS_CODE.OK).json({
    message: 'Update post successfully'
  })
}

export const deletePostController = async (req: Request<DeletePostParams>, res: Response) => {
  const postId = req.params.id

  // delete post
  await postServices.deletePost(postId)

  res.status(HTTP_STATUS_CODE.OK).json({
    message: 'Delete post successfully'
  })
}
