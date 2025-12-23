import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

export type Base64Image = {
  data: string
  mime?: string
}

export const parseBase64Image = (input: string): Base64Image => {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(input)
  if (!match) return { data: input }
  return { data: input.slice(match[0].length), mime: match[1] }
}

export const mimeToExtension = (mime?: string) => {
  if (!mime) return undefined
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/gif') return 'gif'
  if (mime === 'image/bmp') return 'bmp'
  if (mime === 'image/tiff') return 'tiff'
  return undefined
}

export const base64ToImage = async (input: string, outputPath: string) => {
  const { data } = parseBase64Image(input)
  await mkdir(dirname(outputPath), { recursive: true })
  const buffer = Buffer.from(data, 'base64')
  await writeFile(outputPath, buffer)
}
