import ejs from 'ejs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { ImageProps } from '../../types/index'

const workflowPaths = {
  1: resolve('workflows/qwen-image-edit-2509-fp8/single-image.json'),
  2: resolve('workflows/qwen-image-edit-2509-fp8/dual-images.json'),
  3: resolve('workflows/qwen-image-edit-2509-fp8/triple-images.json'),
} as const

export const loadWorkflow = async (options: ImageProps) => {
  const workflowPath = workflowPaths[options.images.length as 1 | 2 | 3]
  const template = await readFile(workflowPath, 'utf8')
  const rendered = ejs.render(template, {
    images: options.images,
    positivePrompt: options.positivePrompt,
    negativePrompt: options.negativePrompt,
    steps: options.steps,
    cfg: options.cfg,
    diffusionModel: options.diffusionModel,
  })

  return JSON.parse(rendered)
}
