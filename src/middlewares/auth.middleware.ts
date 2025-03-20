import { NextFunction, Request, Response } from 'express'
import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node'

export const authValidator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await new Promise<void>((resolve, reject) => {
      ;(ClerkExpressRequireAuth as any)()(req, res, (err: any) => {
        if (err) reject(err)
        else resolve()
      })
    })

    await new Promise<void>((resolve, reject) => {
      ;(ClerkExpressWithAuth as any)()(req, res, (err: any) => {
        if (err) reject(err)
        else resolve()
      })
    })

    next()
  } catch (error) {
    next(error)
  }
}
