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
      '*.credentials.code': {
        isString: true,
        notEmpty: true,
        errorMessage: 'Code must be a non-empty string'
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
        optional: true,
        errorMessage: 'Platform must be a string'
      }
    },
    ['query']
  )
)
