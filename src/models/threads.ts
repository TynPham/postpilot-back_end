export type SingleThreadsPostParams = {
  image_url?: string
  video_url?: string
  media_type: 'TEXT' | 'IMAGE' | 'VIDEO'
  text?: string
}

export type CarouselThreadsPostParams = {
  image_url?: string[]
  video_url?: string[]
  media_type: 'IMAGE' | 'VIDEO'
  text?: string
}

export type PublishPostThreadsType = {
  access_token: string
  threads_user_id: string
  metadata: {
    creation_id: string
  }
}
