import { CreateCredentialRequestBody } from '~/models/request/credential.request'
import database from './database.services'
import { omit } from 'lodash'
import { getLongLivedTokenThreads, getProfileThreads } from '~/helpers/threads'
import { Platform } from '~/constants/enum'
import { getLongLivedTokenFacebook } from '~/helpers/facebook'
import { getXProfile } from '~/helpers/x'
import { getXToken } from '~/helpers/x'

class CredentialServices {
  async createCredential(ownerId: string, body: CreateCredentialRequestBody[]) {
    try {
      switch (body[0].platform) {
        case Platform.Facebook:
          const credentialsData = await Promise.all(
            body.map(async (credential) => {
              const longLiveTokenFb = await getLongLivedTokenFacebook(credential.credentials.code)
              return {
                platform: credential.platform,
                ownerId,
                socialOwnerId: credential.socialOwnerId,
                socialId: credential.socialId,
                credentials: {
                  access_token: longLiveTokenFb,
                  page_id: credential.credentials.page_id
                },
                metadata: {
                  name: credential.metadata.name,
                  avatar_url: credential.metadata.avatar_url,
                  fan_count: credential.metadata.fan_count
                }
              }
            })
          )

          await database.socialCredential.createMany({
            data: credentialsData,
            skipDuplicates: true
          })
          break
        case Platform.Threads:
          const threadsCredentials = body[0]
          const longLivedToken = await getLongLivedTokenThreads(
            threadsCredentials.credentials.code,
            threadsCredentials.credentials.redirect_uri
          )
          const threadsProfile = await getProfileThreads(longLivedToken.access_token)

          await database.socialCredential.create({
            data: {
              platform: threadsCredentials.platform,
              ownerId,
              socialOwnerId: threadsProfile.id,
              socialId: threadsProfile.id,
              credentials: {
                access_token: longLivedToken.access_token,
                user_id: threadsProfile.id
              },
              metadata: {
                name: threadsProfile.name,
                avatar_url: threadsProfile.threads_profile_picture_url,
                biography: threadsProfile.threads_biography,
                username: threadsProfile.username
              }
            }
          })

          break
        case Platform.X:
          const xCredentials = body[0]
          const xAccessToken = await getXToken(
            xCredentials.credentials.code,
            xCredentials.credentials.redirect_uri,
            xCredentials.credentials.code_verifier
          )
          const xProfile = await getXProfile(xAccessToken.access_token)
          const xProfileData = xProfile.data
          await database.socialCredential.create({
            data: {
              platform: xCredentials.platform,
              ownerId,
              socialOwnerId: xProfileData.id,
              socialId: xProfileData.id,
              credentials: {
                access_token: xAccessToken.access_token,
                user_id: xProfileData.id,
                refresh_token: xAccessToken.refresh_token
              },
              metadata: {
                name: xProfileData.name,
                avatar_url: xProfileData.profile_image_url,
                username: xProfileData.username,
                public_metrics: xProfileData.public_metrics
              }
            }
          })
          break
      }
    } catch (error) {
      throw error
    }
  }

  async getCredentials(userId: string, platform?: string) {
    try {
      const credentials = await database.socialCredential.findMany({
        where: {
          ownerId: userId,
          platform
        }
      })
      const result = credentials.map((credential) => ({
        ...credential,
        credentials: omit(credential.credentials as Object, ['access_token'])
      }))
      return result
    } catch (error) {
      throw error
    }
  }
}

const credentialServices = new CredentialServices()

export default credentialServices
