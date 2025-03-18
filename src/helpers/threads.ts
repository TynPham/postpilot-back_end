import axios from 'axios'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { ErrorWithStatus } from '~/models/errors'
import { GetProfileThreadsResponse } from '~/types'
import { ExchangeCodeForTokenThreadsResponse, LongLivedTokenThreadsResponse } from '~/types/token'

export const THREADS_API = 'https://graph.threads.net'
export const THREADS_API_VERSION = 'v1.0'

export const exchangeCodeForToken = async (code: string, redirectUri: string) => {
  try {
    const response = await axios.post<ExchangeCodeForTokenThreadsResponse>(`${THREADS_API}/oauth/access_token`, {
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
      `${THREADS_API}/access_token?grant_type=th_exchange_token&client_secret=${process.env.THREADS_CLIENT_SECRET}&access_token=${access_token}`
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
      `${THREADS_API}/${THREADS_API_VERSION}/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${access_token}`
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
