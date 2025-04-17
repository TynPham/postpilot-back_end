import axios from 'axios'
import { envConfig } from '~/configs/env.config'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { ErrorWithStatus } from '~/models/errors'
import { CarouselInstagramPostParams, SingleInstagramPostParams } from '~/models/instagram'

const INSTAGRAM_API_URI = 'https://graph.instagram.com'
const INSTAGRAM_API_VERSION = 'v22.0'

export const exchangeCodeForTokenInstagram = async (code: string, redirectUri: string) => {
  try {
    const formData = new FormData()
    formData.append('client_id', envConfig.instagram_client_id)
    formData.append('client_secret', envConfig.instagram_client_secret)
    formData.append('grant_type', 'authorization_code')
    formData.append('code', code)
    formData.append('redirect_uri', redirectUri)
    const response = await axios.post(`https://api.instagram.com/oauth/access_token`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
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

export const getLongLivedTokenInstagram = async (code: string, redirectUri: string) => {
  try {
    const exchangeCode = await exchangeCodeForTokenInstagram(code, redirectUri)
    const access_token = exchangeCode.access_token
    const response = await axios.get(
      `${INSTAGRAM_API_URI}/access_token?grant_type=ig_exchange_token&client_secret=${envConfig.instagram_client_secret}&access_token=${access_token}`
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

export const getInstagramProfile = async (access_token: string) => {
  try {
    const response = await axios.get(
      `${INSTAGRAM_API_URI}/${INSTAGRAM_API_VERSION}/me?fields=user_id,name,username,profile_picture_url,followers_count&access_token=${access_token}`
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

export const createSingleInstagramMediaContainer = async (
  access_token: string,
  instagram_user_id: string,
  params: SingleInstagramPostParams
) => {
  try {
    const response = await axios.post(
      `${INSTAGRAM_API_URI}/${INSTAGRAM_API_VERSION}/${instagram_user_id}/media`,
      params,
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
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

export const createCarouselInstagramMediaContainer = async (
  access_token: string,
  instagram_user_id: string,
  params: CarouselInstagramPostParams
) => {
  try {
    const children = await Promise.all(
      params.image_urls.map(async (image_url) => {
        return await createSingleInstagramMediaContainer(access_token, instagram_user_id, {
          image_url,
          is_carousel_item: true
        })
      })
    )

    const response = await axios.post(
      `${INSTAGRAM_API_URI}/${INSTAGRAM_API_VERSION}/${instagram_user_id}/media`,
      {
        media_type: 'CAROUSEL',
        children,
        caption: params.caption,
        alt_text: params.alt_text
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
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

export const publishPostInstagram = async (access_token: string, instagram_user_id: string, creation_id: string) => {
  try {
    const response = await axios.post(
      `${INSTAGRAM_API_URI}/${INSTAGRAM_API_VERSION}/${instagram_user_id}/media_publish`,
      {
        creation_id
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
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

export const getIgEngagement = async (postId: string, access_token: string) => {
  try {
    const commentsParams = new URLSearchParams({
      fields: 'id,text,username,timestamp',
      access_token
    })
    const insightsParams = new URLSearchParams({
      metric: 'likes,shares',
      range: 'lifetime',
      access_token
    })

    const [commentsResponse, insightsResponse] = await Promise.all([
      axios.get(`${INSTAGRAM_API_URI}/${INSTAGRAM_API_VERSION}/${postId}/comments?${commentsParams}`),
      axios.get(`${INSTAGRAM_API_URI}/${INSTAGRAM_API_VERSION}/${postId}/insights?${insightsParams}`)
    ])

    const data = insightsResponse.data.data
    const likesCount = data.find((item: any) => item.name === 'likes')?.values[0]?.value || 0
    const sharesCount = data.find((item: any) => item.name === 'shares')?.values[0]?.value || 0

    return {
      comments: commentsResponse.data.data || [],
      likes: likesCount,
      shares: sharesCount
    }
  } catch (error) {
    console.log(error)
    return {
      comments: [],
      likes: 0,
      shares: 0
    }
  }
}

export const getIgEngagementCount = async (postId: string, access_token: string) => {
  try {
    const queryParams = new URLSearchParams({
      metric: 'comments,likes,saved,shares,views',
      range: 'lifetime',
      access_token
    })
    const response = await axios.get(`${INSTAGRAM_API_URI}/${INSTAGRAM_API_VERSION}/${postId}/insights?${queryParams}`)
    const data = response.data.data
    const engagement = {
      likes: data.find((item: any) => item.name === 'likes')?.values[0]?.value || 0,
      comments: data.find((item: any) => item.name === 'comments')?.values[0]?.value || 0,
      shares: data.find((item: any) => item.name === 'shares')?.values[0]?.value || 0,
      saved: data.find((item: any) => item.name === 'saved')?.values[0]?.value || 0,
      views: data.find((item: any) => item.name === 'views')?.values[0]?.value || 0
    }
    return engagement
  } catch (error) {
    console.log(error)
    return {
      likes: 0,
      comments: 0,
      shares: 0,
      saved: 0,
      views: 0
    }
  }
}
