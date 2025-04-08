import { Request, Response, Router } from 'express'
import { getTelegramStatus, telegramAuth } from '~/controllers/auth.controller'
import { sendPostNotification, sendUserNotification } from '~/helpers/telegram'
import { authValidator } from '~/middlewares/auth.middleware'
import { wrapHandleRequest } from '~/utils/handles'

const authRouter = Router()

authRouter.post('/telegram', authValidator, wrapHandleRequest(telegramAuth))
authRouter.get('/telegram-status', authValidator, wrapHandleRequest(getTelegramStatus))

export default authRouter
