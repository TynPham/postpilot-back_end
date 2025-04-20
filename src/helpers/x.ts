import axios from 'axios'
import { AxiosError } from 'axios'
import qs from 'qs'
import { envConfig } from '~/configs/env.config'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { ErrorWithStatus } from '~/models/errors'
import database from '~/services/database.services'
import { Platform } from '~/constants/enum'

const X_API_URI = 'https://api.x.com/2'

export const getXToken = async (code: string, redirect_uri: string, code_verifier: string) => {
  try {
    const data = qs.stringify({
      code,
      grant_type: 'authorization_code',
      client_id: envConfig.x_client_id,
      redirect_uri,
      code_verifier
    })
    const BasicAuthToken = Buffer.from(`${envConfig.x_client_id}:${envConfig.x_client_secret}`, 'utf8').toString(
      'base64'
    )
    const response = await axios.post(`${X_API_URI}/oauth2/token`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${BasicAuthToken}`
      }
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

export const getXProfile = async (access_token: string) => {
  try {
    const queryParams = new URLSearchParams({
      'user.fields': 'profile_image_url,public_metrics'
    })
    const response = await axios.get(`${X_API_URI}/users/me?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    })
    return response.data
  } catch (error) {
    console.log('Profile Error: ', error)
    throw new ErrorWithStatus({
      status: HTTP_STATUS_CODE.BAD_REQUEST,
      message: 'Bad request'
    })
  }
}

export const uploadImageXFromUrl = async (
  imageUrl: string,
  accessToken: string,
  socialCredentialId: string,
  refreshToken: string
): Promise<string> => {
  try {
    // Fetch image data from URL first
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' })
    const imageBuffer = Buffer.from(imageResponse.data)
    const total_bytes = imageBuffer.length

    // Step 1: INIT
    const initFormData = new FormData()
    initFormData.append('command', 'INIT')
    initFormData.append('media_type', 'image/jpeg')
    initFormData.append('media_category', 'tweet_image')
    initFormData.append('total_bytes', total_bytes.toString())

    const initResponse = await axios.post(`${X_API_URI}/media/upload`, initFormData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    const mediaId = initResponse.data.data.id

    // Step 2: APPEND
    const appendFormData = new FormData()
    appendFormData.append('command', 'APPEND')
    appendFormData.append('media_id', mediaId)
    appendFormData.append('segment_index', '0')
    appendFormData.append('media', new Blob([imageBuffer]))

    await axios.post(`${X_API_URI}/media/upload`, appendFormData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    // Step 3: FINALIZE
    const finalizeFormData = new FormData()
    finalizeFormData.append('command', 'FINALIZE')
    finalizeFormData.append('media_id', mediaId)

    const finalizeResponse = await axios.post(`${X_API_URI}/media/upload`, finalizeFormData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    if (finalizeResponse.data.data.processing_info) {
      console.log('Processing... : ', finalizeResponse.data.data.processing_info)
    }

    return mediaId
  } catch (error: any) {
    console.error('Upload Image Error: ', error)
    if (error.response.status === 401) {
      const xToken = await refreshXToken(refreshToken, socialCredentialId)
      return uploadImageXFromUrl(imageUrl, xToken.access_token, socialCredentialId, xToken.refresh_token)
    }
    throw new ErrorWithStatus({
      status: HTTP_STATUS_CODE.BAD_REQUEST,
      message: 'Error uploading image'
    })
  }
}

export const publishPostX = async (
  accessToken: string,
  metadata: { text: string; media_ids?: string[]; socialCredentialID: string; refresh_token: string }
): Promise<any> => {
  try {
    const body: any = {
      text: metadata.text
    }
    if (metadata.media_ids && metadata.media_ids.length > 0) {
      body.media = {
        media_ids: metadata.media_ids
      }
    }
    const response = await axios.post(`${X_API_URI}/tweets`, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    return response.data.data.id
  } catch (error: any) {
    console.log(error)
    if (error.response.status === 401) {
      console.log('401 error')
      const xToken = await refreshXToken(metadata.refresh_token, metadata.socialCredentialID)
      return publishPostX(xToken.access_token, metadata)
    }
    throw new ErrorWithStatus({
      status: HTTP_STATUS_CODE.BAD_REQUEST,
      message: 'Bad request'
    })
  }
}

export const refreshXToken = async (refresh_token: string, socialCredentialId: string) => {
  try {
    const data = qs.stringify({
      refresh_token,
      grant_type: 'refresh_token',
      client_id: envConfig.x_client_id
    })

    const BasicAuthToken = Buffer.from(`${envConfig.x_client_id}:${envConfig.x_client_secret}`, 'utf8').toString(
      'base64'
    )

    const response = await axios.post(`${X_API_URI}/oauth2/token`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${BasicAuthToken}`
      }
    })

    await database.socialCredential.update({
      where: {
        id: socialCredentialId
      },
      data: {
        credentials: {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token
        }
      }
    })
    return response.data
  } catch (error: any) {
    if (error.response.status === 401) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: 'Error refreshing token'
      })
    }
    throw new ErrorWithStatus({
      status: HTTP_STATUS_CODE.BAD_REQUEST,
      message: 'Error refreshing token'
    })
  }
}

export const getXEngagement = async (
  publishedPostId: string,
  access_token: string,
  refreshToken: string,
  socialCredentialId: string,
  postId: string
): Promise<any> => {
  try {
    const queryParams = new URLSearchParams({
      ids: publishedPostId,
      'tweet.fields': 'public_metrics'
    })
    const response = await axios.get(`https://api.twitter.com/2/tweets?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    })

    const metrics = response.data.data[0]?.public_metrics
    const engagement = {
      likes: metrics?.like_count || 0,
      replies: metrics?.reply_count || 0,
      retweets: metrics?.retweet_count || 0,
      quotes: metrics?.quote_count || 0,
      bookmarks: metrics?.bookmark_count || 0
    }

    await database.publishedPost.update({
      where: {
        id_postId: {
          id: postId,
          postId: publishedPostId
        }
      },
      data: {
        metadata: {
          metrics: engagement
        }
      }
    })

    return engagement
  } catch (error: any) {
    if (error.response.status === 401) {
      const xToken = await refreshXToken(refreshToken, socialCredentialId)
      return getXEngagement(publishedPostId, xToken.access_token, xToken.refresh_token, socialCredentialId, postId)
    }
    if (error.response.status === 429) {
      const cachedData = await database.publishedPost.findUnique({
        where: {
          id_postId: {
            id: postId,
            postId: publishedPostId
          }
        }
      })

      if ((cachedData?.metadata as any)?.metrics) {
        const metrics = (cachedData?.metadata as any).metrics
        return {
          likes: metrics?.likes || 0,
          replies: metrics?.replies || 0,
          retweets: metrics?.retweets || 0,
          quotes: metrics?.quotes || 0,
          bookmarks: metrics?.bookmarks || 0
        }
      }
    }

    return {
      likes: 0,
      replies: 0,
      retweets: 0,
      quotes: 0,
      bookmarks: 0
    }
  }
}
