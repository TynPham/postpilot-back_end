import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'

type ErrorsType = Record<
  string,
  {
    msg: string
    [p: string]: any
  }
>

export class ErrorWithStatus {
  message: string
  status: number

  constructor({ message, status }: { message: string; status: number }) {
    this.message = message
    this.status = status
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorsType

  constructor({
    message = 'Validation error',
    status = HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY,
    errors
  }: {
    message?: string
    status?: number
    errors: ErrorsType
  }) {
    super({ message, status })
    this.errors = errors
  }
}
