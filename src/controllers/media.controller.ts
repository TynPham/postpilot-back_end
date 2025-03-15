import { NextFunction, Request, Response } from 'express'
import mediaServices from '~/services/media.services'
import formidable from 'formidable'
import path from 'path'
import { HTTP_STATUS_CODE } from '~/constants/httpStatusCode'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const form = formidable({
    uploadDir: path.resolve('uploads/images/temp'),
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 1000 * 1024 * 4, // 2mb,
    filter: ({ name, originalFilename, mimetype }) => {
      const valid = name === 'images' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is invalid') as any)
      }
      return valid
    }
  })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      next(err)
      return
    }

    if (!Boolean(files.images)) {
      next(new Error('File is empty'))
      return
    }

    const result = await mediaServices.uploadImage(files.images as formidable.File[])

    res.status(HTTP_STATUS_CODE.OK).json({
      message: 'Upload image successfully',
      data: result
    })
  })
}
