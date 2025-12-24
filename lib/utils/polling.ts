import { delay } from './time'
import { status } from './http'

type WaitForCompletionOptions = {
  intervalMs?: number
}

export const waitForCompletion = async (jobId: string, options: WaitForCompletionOptions = {}) => {
  const pollIntervalMs = options.intervalMs ?? 5000
  while (true) {
    const response = await status(jobId)
    const data = response.data
    if (data?.status === 'COMPLETED' || data?.status === 'FAILED') {
      return data
    }
    await delay(pollIntervalMs)
  }
}
