import axios from 'axios'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { ErrorWithStatus } from '~/models/errors'
import { UploadImageFbType } from '~/models/utils'

export const uploadImageFb = async ({ access_token, page_id, url }: UploadImageFbType) => {
  try {
    const response = await axios.post(`https://graph.facebook.com/v22.0/${page_id}/photos`, {
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
