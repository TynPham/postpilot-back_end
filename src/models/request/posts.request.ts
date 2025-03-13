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
