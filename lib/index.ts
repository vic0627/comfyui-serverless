import dotenv from 'dotenv'
import ejs from 'ejs'
import { readFile } from 'node:fs/promises'
import { basename, extname, resolve } from 'node:path'
import { runSync } from './utils/http'
import { base64ToImage, mimeToExtension, parseBase64Image } from './utils/b64-to-image'
import { imageToBase64 } from './utils/image-to-b64'

dotenv.config()

const workflowPath = resolve('workflows/qwen-image-edit-2509-fp8/single-image.json')

const getNumber = (value: string | undefined) => {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const getEnv = (name: string) => process.env[name]

const loadWorkflow = async (imageName: string, image: string) => {
  const template = await readFile(workflowPath, 'utf8')
  const rendered = ejs.render(template, {
    imageName,
    image,
    positivePrompt: getEnv('POSITIVE_PROMPT') ?? '',
    negativePrompt: getEnv('NEGATIVE_PROMPT') ?? '',
    steps: getNumber(getEnv('STEPS')),
    cfg: getNumber(getEnv('CFG')),
  })

  return JSON.parse(rendered)
}

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

const extractImages = (payload: any) => {
  const output = payload?.output ?? payload
  if (Array.isArray(output?.images)) return output.images
  if (Array.isArray(output)) return output
  const message = output?.message
  if (typeof message === 'string') return coerceImagesFromMessage(message)
  return []
}

const buildOutputName = (baseName: string, index: number, image: string, providedName?: string) => {
  const name = providedName ?? `${baseName}-${index + 1}`
  if (extname(name)) return name
  const { mime } = parseBase64Image(image)
  const ext = mimeToExtension(mime) ?? 'png'
  return `${name}.${ext}`
}

const main = async () => {
  const imagePath = process.argv[2]
  if (!imagePath) {
    throw new Error('Missing image path. Usage: tsx lib/index.ts /path/to/image.png')
  }

  const imageName = basename(imagePath)
  const image = await imageToBase64(imagePath)
  const payload = await loadWorkflow(imageName, image)
  const response = await runSync(payload)
  const data = response.data
  if (data?.status === 'error' || data?.output?.status === 'error') {
    throw new Error(data?.output?.message ?? 'Serverless request failed.')
  }

  const images = extractImages(data)
  const baseName = basename(imageName, extname(imageName))
  const outputDir = resolve(getEnv('OUTPUT_DIR') ?? 'output')

  const written: string[] = []
  for (const [index, item] of images.entries()) {
    const imageData = typeof item === 'string' ? item : item?.image
    if (!imageData) continue
    const outputName = buildOutputName(baseName, index, imageData, item?.filename ?? item?.name)
    const outputPath = resolve(outputDir, outputName)
    await base64ToImage(imageData, outputPath)
    written.push(outputPath)
  }

  console.log(JSON.stringify({ ...data, saved: written }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
