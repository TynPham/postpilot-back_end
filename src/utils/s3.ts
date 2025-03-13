import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import fs from 'fs'
import { envConfig } from '~/configs/env.config'

const s3 = new S3({ region: envConfig.aws_region })

export const uploadFileToS3 = ({
  fileName,
  filePath,
  content_type
}: {
  fileName: string
  filePath: string
  content_type: string
}) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: {
      Bucket: envConfig.aws_s3_bucket,
      Key: fileName,
      Body: fs.readFileSync(filePath),
      ContentType: content_type
    },

    tags: [
      /*...*/
    ], // optional tags
    queueSize: 4, // optional concurrency configuration
    partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
    leavePartsOnError: false // optional manually handle dropped parts
  })

  parallelUploads3.on('httpUploadProgress', (progress) => {
    // console.log(progress)
  })

  return parallelUploads3.done()
}
