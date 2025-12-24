import dotenv from 'dotenv'
import { basename, extname, resolve } from 'node:path'
import { run } from '../utils/http'
import { base64ToImage } from '../utils/b64-to-image'
import { imageToBase64 } from '../utils/image-to-b64'
import { buildOutputName, extractImages } from '../utils/output'
import { waitForCompletion } from '../utils/polling'
import { loadWorkflow } from '../utils/workflow'
import type { Image } from '../../types/index'

dotenv.config()

type Options = {
  imagePaths: string[]
  positivePrompt: string
  negativePrompt: string
  steps: number
  cfg: number
  outputDir: string
  pollIntervalMs: number
}

const getNumber = (value: string | undefined) => {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const parseArgs = (argv: string[]) => {
  const options: Options = {
    imagePaths: [],
    positivePrompt: '',
    negativePrompt: '',
    steps: 20,
    cfg: 10,
    outputDir: 'output',
    pollIntervalMs: 5000,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '-pp') {
      options.positivePrompt = argv[index + 1] ?? ''
      index += 1
      continue
    }
    if (arg === '-np') {
      options.negativePrompt = argv[index + 1] ?? ''
      index += 1
      continue
    }
    if (arg === '-s') {
      const parsed = getNumber(argv[index + 1])
      if (typeof parsed === 'number') options.steps = parsed
      index += 1
      continue
    }
    if (arg === '-c') {
      const parsed = getNumber(argv[index + 1])
      if (typeof parsed === 'number') options.cfg = parsed
      index += 1
      continue
    }
    if (arg === '-o') {
      options.outputDir = argv[index + 1] ?? options.outputDir
      index += 1
      continue
    }
    if (arg === '-t') {
      const parsed = getNumber(argv[index + 1])
      if (typeof parsed === 'number') options.pollIntervalMs = parsed
      index += 1
      continue
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    }
    if (options.imagePaths.length < 3) {
      options.imagePaths.push(arg)
    }
  }

  if (options.imagePaths.length === 0) {
    throw new Error(
      'Missing image path. Usage: npm run qwen:edit -- <image-path>... [-pp <positive-prompt>] [-np <negative-prompt>] [-s <steps>] [-c <cfg>] [-o <output-dir>] [-t <interval>]'
    )
  }

  return options
}

const main = async () => {
  const options = parseArgs(process.argv.slice(2))

  const images: Image[] = await Promise.all(
    options.imagePaths.map(async (imagePath) => ({
      name: basename(imagePath),
      image: await imageToBase64(imagePath),
    }))
  )
  const payload = await loadWorkflow({
    images,
    positivePrompt: options.positivePrompt,
    negativePrompt: options.negativePrompt,
    steps: options.steps,
    cfg: options.cfg,
    diffusionModel: 'qwen_image_edit_fp8_e4m3fn.safetensors',
  })

  const runResponse = await run(payload)
  const runData = runResponse.data
  const jobId = runData?.id
  if (!jobId) {
    throw new Error('Serverless request did not return a job id.')
  }

  const statusData = await waitForCompletion(jobId, { intervalMs: options.pollIntervalMs })
  if (statusData?.status === 'FAILED') {
    throw new Error(statusData?.error ?? 'Serverless request failed.')
  }

  const outputImages = extractImages(statusData)
  const baseName = basename(images[0]?.name ?? 'image', extname(images[0]?.name ?? 'image'))
  const outputDir = resolve(options.outputDir)

  const written: string[] = []
  for (const [index, item] of outputImages.entries()) {
    const imageData = typeof item === 'string' ? item : item?.image ?? item?.data
    if (!imageData) continue
    const outputName = buildOutputName(baseName, index, imageData, item?.filename ?? item?.name)
    const outputPath = resolve(outputDir, outputName)
    await base64ToImage(imageData, outputPath)
    written.push(outputPath)
  }

  console.log(JSON.stringify({ ...statusData, saved: written }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
