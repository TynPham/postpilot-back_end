import { CreateCredentialRequestBody } from '~/models/request/credential.request'
import database from './database.services'
import { omit } from 'lodash'
import { getLongLivedTokenThreads, getProfileThreads } from '~/helpers/threads'
import { Platform } from '~/constants/enum'
import { getLongLivedTokenFacebook } from '~/helpers/facebook'
import { getXProfile } from '~/helpers/x'
import { getXToken } from '~/helpers/x'
import { getInstagramProfile, getLongLivedTokenInstagram } from '~/helpers/instagram'

class CredentialServices {
  async createCredential(userId: string, body: CreateCredentialRequestBody[]) {
    try {
      switch (body[0].platform) {
        case Platform.Facebook:
          const credentialsData = await Promise.all(
            body.map(async (credential) => {
              const longLiveTokenFb = await getLongLivedTokenFacebook(credential.credentials.code)
              const existCredential = await database.socialCredential.findUnique({
                where: {
                  userId_socialId: {
                    userId: userId,
                    socialId: credential.socialId
                  }
                }
              })

              const bodyData = {
                platform: credential.platform,
                userId,
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
                },
                is_disconnected: false
              }

              if (existCredential) {
                await database.socialCredential.update({
                  where: {
                    id: existCredential.id
                  },
                  data: bodyData
                })
                return null
              }

              return bodyData
            })
          )

          const newCredentials = credentialsData.filter((cred) => cred !== null)
          if (newCredentials.length > 0) {
            await database.socialCredential.createMany({
              data: newCredentials,
              skipDuplicates: true
            })
          }
          break
        case Platform.Threads:
          const threadsCredentials = body[0]
          const longLivedToken = await getLongLivedTokenThreads(
            threadsCredentials.credentials.code,
            threadsCredentials.credentials.redirect_uri
          )
          const threadsProfile = await getProfileThreads(longLivedToken.access_token)

          const threadsBodyData = {
            platform: threadsCredentials.platform,
            userId,
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
            },
            is_disconnected: false
          }

          const existThreadsCredential = await database.socialCredential.findUnique({
            where: {
              userId_socialId: {
                userId: userId,
                socialId: threadsProfile.id
              }
            }
          })

          if (existThreadsCredential) {
            await database.socialCredential.update({
              where: {
                id: existThreadsCredential.id
              },
              data: threadsBodyData
            })
          } else {
            await database.socialCredential.create({
              data: threadsBodyData
            })
          }
          break
        case Platform.X:
          const xCredentials = body[0]
          const xAccessToken = await getXToken(
            xCredentials.credentials.code,
            xCredentials.credentials.redirect_uri,
            xCredentials.credentials.code_verifier
          )
          const xProfile = await getXProfile(xAccessToken.access_token)
          const xBodyData = {
            platform: xCredentials.platform,
            userId,
            socialOwnerId: xProfile.data.id,
            socialId: xProfile.data.id,
            credentials: {
              access_token: xAccessToken.access_token,
              user_id: xProfile.data.id,
              refresh_token: xAccessToken.refresh_token
            },
            metadata: {
              name: xProfile.data.name,
              avatar_url: xProfile.data.profile_image_url,
              username: xProfile.data.username,
              public_metrics: xProfile.data.public_metrics
            },
            is_disconnected: false
          }
          const existCredential = await database.socialCredential.findUnique({
            where: {
              userId_socialId: {
                userId: userId,
                socialId: String(xProfile.data.id)
              }
            }
          })

          if (existCredential?.id) {
            await database.socialCredential.update({
              where: {
                id: existCredential.id
              },
              data: xBodyData
            })
          } else {
            await database.socialCredential.create({
              data: xBodyData
            })
          }
          break
        case Platform.Instagram:
          const instagramCredentials = body[0]
          const longLivedTokenInstagram = await getLongLivedTokenInstagram(
            instagramCredentials.credentials.code,
            instagramCredentials.credentials.redirect_uri
          )
          const instagramProfile = await getInstagramProfile(longLivedTokenInstagram.access_token)
          const instagramBodyData = {
            platform: instagramCredentials.platform,
            userId,
            socialOwnerId: instagramProfile.user_id,
            socialId: instagramProfile.user_id,
            credentials: {
              access_token: longLivedTokenInstagram.access_token,
              user_id: instagramProfile.user_id
            },
            metadata: {
              name: instagramProfile.name,
              avatar_url: instagramProfile.profile_picture_url,
              username: instagramProfile.username,
              followers_count: instagramProfile.followers_count
            },
            is_disconnected: false
          }
          const existInstagramCredential = await database.socialCredential.findUnique({
            where: {
              userId_socialId: {
                userId: userId,
                socialId: instagramProfile.user_id
              }
            }
          })

          if (existInstagramCredential) {
            await database.socialCredential.update({
              where: {
                id: existInstagramCredential.id
              },
              data: instagramBodyData
            })
          } else {
            await database.socialCredential.create({
              data: instagramBodyData
            })
          }
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
          userId,
          platform,
          is_disconnected: false
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

  async disconnectCredential(userId: string, credentialId: string) {
    try {
      const credential = await database.socialCredential.findFirst({
        where: {
          id: credentialId,
          userId
        }
      })

      if (!credential) {
        throw new Error('Credential not found')
      }

      // Update the credential to mark it as disconnected
      await database.socialCredential.update({
        where: {
          id: credentialId
        },
        data: {
          is_disconnected: true
        }
      })

      return { message: 'Credential disconnected successfully' }
    } catch (error) {
      throw error
    }
  }
}

const credentialServices = new CredentialServices()

export default credentialServices
