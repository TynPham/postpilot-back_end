import axios from 'axios'
import { envConfig } from '~/configs/env.config'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { ErrorWithStatus } from '~/models/errors'
import { PublishPostFbType } from '~/models/facebook'
import { UploadImageFbType } from '~/models/utils'
import { LongLivedTokenFbResponse } from '~/types/token'

const FACEBOOK_API_VERSION = 'v22.0'
const FACEBOOK_GRAPH_API_URI = 'https://graph.facebook.com'

export const uploadImageFb = async ({ access_token, page_id, url }: UploadImageFbType) => {
  try {
    const response = await axios.post(`${FACEBOOK_GRAPH_API_URI}/${FACEBOOK_API_VERSION}/${page_id}/photos`, {
      url,
      access_token,
      published: false
    })

    return response?.data?.id
  } catch (error) {
    console.log(error)
    throw new ErrorWithStatus({
      status: HTTP_STATUS_CODE.BAD_REQUEST,
      message: 'Bad request'
    })
  }
}

export const publishPostFb = async ({ access_token, page_id, metadata }: PublishPostFbType) => {
  try {
    const response = await axios.post<{ id: string }>(
      `${FACEBOOK_GRAPH_API_URI}/${FACEBOOK_API_VERSION}/${page_id}/feed`,
      {
        message: metadata.message,
        attached_media: metadata.attached_media.map((mediaId) => ({
          media_fbid: mediaId
        })),
        access_token,
        published: true
      }
    )

    return response?.data?.id
  } catch (error) {
    console.log(error)
    throw new ErrorWithStatus({
      status: HTTP_STATUS_CODE.BAD_REQUEST,
      message: 'Bad request'
    })
  }
}

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
