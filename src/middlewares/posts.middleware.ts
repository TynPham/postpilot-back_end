import { checkSchema } from 'express-validator'
import { validate } from '~/utils/validation'

export const createPostValidator = validate(
  checkSchema({
    publicationTime: {
      isISO8601: true,
      errorMessage: 'Invalid publication time'
    },
    socialPosts: {
      isArray: {
        bail: true,
        errorMessage: 'Social posts must be an array'
      },
      custom: {
        options: (value) => {
          if (Array.isArray(value) && value.length > 0) {
            return true
          }
          throw new Error('Social posts must be a non-empty array')
        }
      }
    },
    'socialPosts.*.platform': {
      isString: true,
      notEmpty: true,
      errorMessage: 'Platform must be a non-empty string'
    },
    'socialPosts.*.socialCredentialID': {
      isString: true,
      notEmpty: true,
      errorMessage: 'Social Credential ID must be a non-empty string'
    },
    'socialPosts.*.metadata.type': {
      isString: true,
      notEmpty: true,
      errorMessage: 'Metadata type must be a non-empty string'
    },
    'socialPosts.*.metadata.content': {
      isString: true,
      notEmpty: true,
      errorMessage: 'Metadata content must be a non-empty string'
    },
    'socialPosts.*.metadata.assets': {
      isArray: {
        bail: true,
        errorMessage: 'Assets must be an array'
      },
      custom: {
        options: (value) => {
          if (Array.isArray(value) && value.length > 0) {
            return true
          }
          throw new Error('Assets must be a non-empty array')
        }
      }
    },
    'socialPosts.*.metadata.assets.*.type': {
      isString: true,
      notEmpty: true,
      errorMessage: 'Asset type must be a non-empty string'
    },
    'socialPosts.*.metadata.assets.*.url': {
      isURL: true,
      notEmpty: true,
      errorMessage: 'Asset URL must be a valid non-empty URL'
    }
  })
)
