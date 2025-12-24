import { extname } from 'node:path'
import { mimeToExtension, parseBase64Image } from './b64-to-image'

const coerceImagesFromMessage = (message: string) => {
  const trimmed = message.trim()
  if (!trimmed) return []
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      const output = parsed?.output ?? parsed
      if (Array.isArray(output?.images)) return output.images
      if (Array.isArray(output)) return output
    } catch {
      return []
    }
  }
  if (trimmed.startsWith('data:image/') || trimmed.length > 1024) {
    return [{ image: trimmed }]
  }
  return []
}

export const extractImages = (payload: any) => {
  const output = payload?.output ?? payload
  if (Array.isArray(output?.images)) return output.images
  if (Array.isArray(output)) return output
  const message = output?.message
  if (typeof message === 'string') return coerceImagesFromMessage(message)
  return []
}

export const buildOutputName = (baseName: string, index: number, image: string, providedName?: string) => {
  const name = providedName ?? `${baseName}-${index + 1}`
  if (extname(name)) return name
  const { mime } = parseBase64Image(image)
  const ext = mimeToExtension(mime) ?? 'png'
  return `${name}.${ext}`
}
