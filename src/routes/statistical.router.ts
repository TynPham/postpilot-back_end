import { Router } from 'express'
import { getStatisticalController } from '~/controllers/statistical.controller'
import { authValidator } from '~/middlewares/auth.middleware'
import { wrapHandleRequest } from '~/utils/handles'

const statisticalRouter = Router()

statisticalRouter.get('/', authValidator, wrapHandleRequest(getStatisticalController))

export default statisticalRouter
