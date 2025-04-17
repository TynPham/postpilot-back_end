export interface CreateRecurringPostRequestBody {
  socialPosts: {
    platform: string
    socialCredentialID: string
    metadata: {
      type: string
      content: string
      assets: { type: string; url: string }[]
    }
  }[]
  publicationTime: string
  recurring: {
    frequency: 'daily' | 'weekly'
    daysOfWeek?: number[]
    startDate: string
    endDate: string
  }
}
