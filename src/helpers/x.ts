import axios from 'axios'
import qs from 'qs'
import { envConfig } from '~/configs/env.config'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { ErrorWithStatus } from '~/models/errors'
import database from '~/services/database.services'

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
  metadata: { text: string; media_ids: string[]; socialCredentialID: string; refresh_token: string }
): Promise<any> => {
  try {
    const response = await axios.post(
      `${X_API_URI}/tweets`,
      {
        text: metadata.text,
        media: {
          media_ids: metadata.media_ids
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )
    return response.data
  } catch (error: any) {
    console.log(error)
    if (error.response.status === 401) {
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
  } catch (error) {
    console.log('Refresh Token Error:', error)
    throw new ErrorWithStatus({
      status: HTTP_STATUS_CODE.UNAUTHORIZED,
      message: 'Error refreshing token'
    })
  }
}
