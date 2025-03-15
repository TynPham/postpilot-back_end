export interface PublishPostFbType {
  access_token: string
  page_id: string
  metadata: {
    message: string
    attached_media: string[]
  }
}
