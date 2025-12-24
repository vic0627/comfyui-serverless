export type Status = 'success' | 'error'

export interface ServerlessRes<T> {
  delayTime: number
  executionTime: number
  id: string
  output: T
  status: Status
}

export type SuccessData = {
  message: string // base64, this is the image!
  status: Status
}

export type Image = {
  name: string
  image: string // base64
}

export type ImageProps = {
  images: Image[]
  positivePrompt?: string
  negativePrompt?: string
  steps?: number
  cfg?: number
  diffusionModel: string
}
