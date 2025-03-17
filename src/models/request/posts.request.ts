import { ParamsDictionary } from 'express-serve-static-core'

export interface CreatePostRequestBody {
  publicationTime: string
  socialPosts: {
    platform: string
    socialCredentialID: string
    metadata: {
      type: string
      content: string
      assets: {
        type: string
        url: string
      }[]
      [key: string]: any
    }
  }[]
}

export interface GetPostQuery {
  platform: string
}

export interface GetPostDetailsParams extends ParamsDictionary {
  id: string
}
