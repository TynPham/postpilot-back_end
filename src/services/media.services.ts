import formidable from 'formidable'
import path from 'path'
import sharp from 'sharp'
import fsPromise from 'fs/promises'
import mime from 'mime'
import { MediaType } from '~/constants/enum'
import { uploadFileToS3 } from '~/utils/s3'
import fs from 'fs'

class MediaServices {
  async uploadImage(fileImages: formidable.File[]) {
    const result = await Promise.all(
      fileImages.map(async (file) => {
        const newName = file.newFilename.split('.')[0]
        const newPath = path.resolve('uploads/images', `${newName}.jpg`)
        await sharp(file.filepath).jpeg().toFile(newPath)

        const fileS3 = await uploadFileToS3({
          fileName: 'images/' + newName,
          filePath: newPath,
          content_type: mime.getType(newPath) as string
        })

        await Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)])
        return {
          url: fileS3.Location as string,
          type: MediaType.Image
        }
      })
    )
    return result
  }
}

const mediaServices = new MediaServices()

export default mediaServices
