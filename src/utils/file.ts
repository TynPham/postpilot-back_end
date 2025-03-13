import path from 'path'
import fs from 'fs'

export const initFolder = (name: string) => {
  const pathFolder = path.resolve(name)

  if (!fs.existsSync(pathFolder)) {
    fs.mkdirSync(pathFolder, {
      recursive: true
    })
  }
}
