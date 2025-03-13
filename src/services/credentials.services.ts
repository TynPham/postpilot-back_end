import { getLongLivedTokenFacebook } from '~/helpers/token'
import { CreateCredentialRequestBody } from '~/models/request/credential.request'
import database from './database.services'
import { omit } from 'lodash'

class CredentialServices {
  async createCredential(body: CreateCredentialRequestBody[]) {
    try {
      switch (body[0].platform) {
        case 'facebook':
          const credentialsData = await Promise.all(
            body.map(async (credential) => {
              const longLiveTokenFb = await getLongLivedTokenFacebook(credential.credential.code)
              return {
                platform: credential.platform,
                socialOwnerId: credential.socialOwnerId,
                socialId: credential.socialId,
                credentials: {
                  access_token: longLiveTokenFb,
                  page_id: credential.credential.page_id
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
      }
    } catch (error) {
      throw error
    }
  }

  async getCredentials(platform?: string) {
    try {
      const credentials = await database.socialCredential.findMany({
        where: {
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
