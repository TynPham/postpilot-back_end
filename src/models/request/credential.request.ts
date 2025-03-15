export interface CreateCredentialRequestBody {
  platform: string
  socialOwnerId: string
  socialId: string
  credentials: {
    code: string
    [key: string]: any
  }
  metadata: {
    avatar_url: string
    name: string
    [key: string]: any
  }
}

export interface GetCredentialRequestQuery {
  platform?: string
}
