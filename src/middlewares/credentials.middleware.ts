import { checkSchema } from 'express-validator'
import { validate } from '~/utils/validation'
export const createCredentialValidator = validate(
  checkSchema(
    {
      '': {
        isArray: {
          errorMessage: 'Body must be an array'
        }
      },
      '*.platform': {
        isString: true,
        notEmpty: true,
        errorMessage: 'Platform must be a non-empty string'
      },
      '*.socialId': {
        isString: true,
        notEmpty: true,
        errorMessage: 'Social ID must be a non-empty string'
      },
      '*.credentials.code': {
        isString: true,
        notEmpty: true,
        errorMessage: 'Code must be a non-empty string'
      },
      '*.metadata.name': {
        isString: true,
        notEmpty: true,
        errorMessage: 'Name must be a non-empty string'
      },
      '*.metadata.avatar_url': {
        isURL: true,
        notEmpty: true,
        errorMessage: 'Avatar URL must be a valid non-empty URL'
      }
    },
    ['body']
  )
)

export const getCredentialValidator = validate(
  checkSchema(
    {
      platform: {
        isString: true,
        notEmpty: true,
        optional: true,
        errorMessage: 'Platform must be a non-empty string'
      }
    },
    ['query']
  )
)
