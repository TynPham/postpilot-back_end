import axios from 'axios'
import { envConfig } from '~/configs/env.config'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { ErrorWithStatus } from '~/models/errors'
import { LongLivedTokenFbResponse } from '~/types/token'

export const getLongLivedTokenFacebook = async (accessToken: string) => {
  try {
    const response = await axios.get<LongLivedTokenFbResponse>(
      `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${envConfig.facebook_client_id}&client_secret=${envConfig.facebook_client_secret}&fb_exchange_token=${accessToken}`
    )
    const token = response?.data?.access_token
    return token
  } catch (error) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS_CODE.BAD_REQUEST,
      message: 'Bad request'
    })
  }
}
