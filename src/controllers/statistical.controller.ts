import { Request, Response } from 'express'
import statisticalService from '~/services/statistical.services'

export const getStatisticalController = async (req: Request, res: Response) => {
  const userId = req.auth?.userId
  const result = await statisticalService.getStatistical(userId as string)

  res.status(200).json({
    message: 'Statistical data retrieved successfully',
    data: result
  })
}
