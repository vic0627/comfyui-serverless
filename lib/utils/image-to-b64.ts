import { readFile } from 'node:fs/promises'

export const imageToBase64 = async (imagePath: string) => {
  const buffer = await readFile(imagePath)
  return buffer.toString('base64')
}
