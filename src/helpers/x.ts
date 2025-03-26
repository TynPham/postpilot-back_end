import axios from 'axios'
import qs from 'qs'
import { envConfig } from '~/configs/env.config'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { ErrorWithStatus } from '~/models/errors'

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
    const response = await axios.post(`https://api.x.com/2/oauth2/token`, data, {
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
    const response = await axios.get(`https://api.x.com/2/users/me?${queryParams.toString()}`, {
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
