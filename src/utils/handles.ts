import { NextFunction, Request, RequestHandler, Response } from 'express'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const wrapHandleRequest = <T>(func: RequestHandler<T, any, any, any>) => {
  return async (req: Request<T>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
