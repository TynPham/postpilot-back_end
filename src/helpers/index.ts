import { publishPostFb } from './facebook'
import { publishPostInstagram } from './instagram'
import { publishPostThreads } from './threads'
import { publishPostX } from './x'

export const platformHandlers: { [key: string]: any } = {
  facebook: (metadata: any, credentials: any) =>
    publishPostFb({
      access_token: credentials.access_token,
      page_id: credentials.page_id,
      metadata: {
        message: metadata.content,
        attached_media: metadata.media_fbid
      }
    }),
  threads: (metadata: any, credentials: any) =>
    publishPostThreads({
      access_token: credentials.access_token,
      threads_user_id: credentials.user_id,
      metadata: {
        creation_id: metadata.creation_id
      }
    }),
  x: (metadata: any, credentials: any) =>
    publishPostX(credentials.access_token, {
      text: metadata.content,
      media_ids: metadata.media_ids,
      socialCredentialID: credentials.socialCredentialID,
      refresh_token: credentials.refresh_token
    }),
  instagram: (metadata: any, credentials: any) =>
    publishPostInstagram(credentials.access_token, credentials.user_id, metadata.creation_id)
}
