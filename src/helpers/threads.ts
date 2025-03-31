import axios from 'axios'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { ErrorWithStatus } from '~/models/errors'
import { CarouselThreadsPostParams, PublishPostThreadsType, SingleThreadsPostParams } from '~/models/threads'
import { GetProfileThreadsResponse } from '~/types'
import { ExchangeCodeForTokenThreadsResponse, LongLivedTokenThreadsResponse } from '~/types/token'

export const THREADS_API_URI = 'https://graph.threads.net'
export const THREADS_API_VERSION = 'v1.0'

export const exchangeCodeForToken = async (code: string, redirectUri: string) => {
  try {
    const response = await axios.post<ExchangeCodeForTokenThreadsResponse>(`${THREADS_API_URI}/oauth/access_token`, {
      client_id: process.env.THREADS_CLIENT_ID,
      client_secret: process.env.THREADS_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })
    return response.data
  } catch (error) {
    console.log(error)
    throw new ErrorWithStatus({
      status: HTTP_STATUS_CODE.BAD_REQUEST,
      message: 'Bad request'
    })
  }
}

export const getLongLivedTokenThreads = async (code: string, redirectUri: string) => {
  try {
    const exchangeCode = await exchangeCodeForToken(code, redirectUri)
    const access_token = exchangeCode.access_token
    const response = await axios.get<LongLivedTokenThreadsResponse>(
      `${THREADS_API_URI}/access_token?grant_type=th_exchange_token&client_secret=${process.env.THREADS_CLIENT_SECRET}&access_token=${access_token}`
    )
    return response.data
  } catch (error) {
    console.log(error)
    throw new ErrorWithStatus({
      status: HTTP_STATUS_CODE.BAD_REQUEST,
      message: 'Bad request'
    })
  }
}

export const getProfileThreads = async (access_token: string) => {
  try {
    const response = await axios.get<GetProfileThreadsResponse>(
      `${THREADS_API_URI}/${THREADS_API_VERSION}/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${access_token}`
    )
    return response.data
  } catch (error) {
    console.log(error)
    throw new ErrorWithStatus({
      status: HTTP_STATUS_CODE.BAD_REQUEST,
      message: 'Bad request'
    })
  }
}

export const createSingleThreadsMediaContainer = async (
  access_token: string,
  threads_user_id: string,
  params: SingleThreadsPostParams
) => {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append('access_token', access_token)
    queryParams.append('media_type', params.media_type)
    if (params.image_url) {
      queryParams.append('image_url', params.image_url)
    }
    if (params.video_url) {
      queryParams.append('video_url', params.video_url)
    }
    if (params.text) {
      queryParams.append('text', params.text)
    }
    const response = await axios.post<{ id: string }>(
      `${THREADS_API_URI}/${THREADS_API_VERSION}/${threads_user_id}/threads?${queryParams.toString()}`
    )
    return response.data.id
  } catch (error) {
    console.log(error)
    throw new ErrorWithStatus({
      status: HTTP_STATUS_CODE.BAD_REQUEST,
      message: 'Bad request'
    })
  }
}

export const createSingleItemsContainer = async (
  access_token: string,
  threads_user_id: string,
  params: Omit<CarouselThreadsPostParams, 'text'>
) => {
  try {
    const mediaUrls = params.media_type === 'IMAGE' ? params.image_url : params.video_url
    const allResponse = await Promise.all(
      (mediaUrls as string[]).map(async (mediaUrl) => {
        const response = await createSingleThreadsMediaContainer(access_token, threads_user_id, {
          media_type: params.media_type,
          image_url: params.media_type === 'IMAGE' ? mediaUrl : undefined,
          video_url: params.media_type === 'VIDEO' ? mediaUrl : undefined
        })
        return response
      })
    )

    return allResponse
  } catch (error) {
    console.log(error)
    throw new ErrorWithStatus({
      status: HTTP_STATUS_CODE.BAD_REQUEST,
      message: 'Bad request'
    })
  }
}

export const createCarouselThreadsMediaContainer = async (
  access_token: string,
  threads_user_id: string,
  params: CarouselThreadsPostParams
) => {
  try {
    const children = await createSingleItemsContainer(access_token, threads_user_id, params)
    const queryParams = new URLSearchParams()
    queryParams.append('access_token', access_token)
    queryParams.append('media_type', 'CAROUSEL')
    if (params.text) {
      queryParams.append('text', params.text)
    }
    const childrenString = children.join(',')
    queryParams.append('children', childrenString)
    const response = await axios.post<{ id: string }>(
      `${THREADS_API_URI}/${THREADS_API_VERSION}/${threads_user_id}/threads?${queryParams.toString()}`
    )
    return response.data.id
  } catch (error) {
    console.log(error)
    throw new ErrorWithStatus({
      status: HTTP_STATUS_CODE.BAD_REQUEST,
      message: 'Bad request'
    })
  }
}

export const publishPostThreads = async ({
  access_token,
  threads_user_id,
  metadata: { creation_id }
}: PublishPostThreadsType) => {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append('access_token', access_token)
    queryParams.append('creation_id', creation_id)
    const response = await axios.post(
      `${THREADS_API_URI}/${THREADS_API_VERSION}/${threads_user_id}/threads_publish?${queryParams.toString()}`
    )
    return response.data
  } catch (error) {
    console.log(error)
    throw new ErrorWithStatus({
      status: HTTP_STATUS_CODE.BAD_REQUEST,
      message: 'Bad request'
    })
  }
}
