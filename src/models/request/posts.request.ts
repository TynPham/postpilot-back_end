import { ParamsDictionary } from 'express-serve-static-core'
import { ParsedQs } from 'qs'

export interface PostStatus {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  progress: number
  error?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreatePostRequestBody {
  publicationTime: string
  socialPosts: {
    platform: string
    socialCredentialID: string
    recurringPostId?: string
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

export interface UpdatePostRequestBody {
  publicationTime: string
  metadata: {
    type: string
    content: string
    assets: {
      type: string
      url: string
    }[]
    [key: string]: any
  }
}
export interface GetPostQuery extends ParsedQs {
  platform?: string
}

export interface GetPostDetailsParams extends ParamsDictionary {
  id: string
}

export type DeletePostParams = GetPostDetailsParams
export type UpdatePostParams = GetPostDetailsParams

export interface PostResponse {
  id: string
  status: PostStatus
  platform: string
  socialCredentialID: string
  metadata: any
  error?: string
  progress?: number
  createdAt: Date
  updatedAt: Date
}
