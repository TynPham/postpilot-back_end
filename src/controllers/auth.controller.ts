import { Request, Response, NextFunction } from 'express'
import { verifyTelegramLogin } from '~/helpers/telegram'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'
import { ErrorWithStatus } from '~/models/errors'
import database from '~/services/database.services'

export const telegramAuth = async (req: Request, res: Response, next: NextFunction) => {
  const telegramData = req.body

  try {
    const isValid = verifyTelegramLogin(telegramData)
    if (!isValid) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS_CODE.UNAUTHORIZED,
        message: 'Invalid Telegram login data'
      })
    }

    await database.user.update({
      where: {
        id: req.auth?.userId as string
      },
      data: {
        telegramId: telegramData.id.toString(),
        telegramUsername: telegramData.username
      }
    })

    res.json({
      message: 'Telegram account linked successfully'
    })
  } catch (error) {
    next(error)
  }
}

export const getTelegramStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId as string
    const user = await database.user.findUnique({
      where: {
        id: userId
      }
    })

    if (user?.telegramId) {
      res.json({
        linked: true
      })
    } else {
      res.json({
        linked: false
      })
    }
  } catch (error) {
    next(error)
  }
}
