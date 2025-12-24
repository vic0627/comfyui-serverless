import dotenv from 'dotenv'
import { waitForCompletion } from '../utils/polling'

dotenv.config()

type Options = {
  jobId: string
  pollIntervalMs: number
}

const getNumber = (value: string | undefined) => {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const parseArgs = (argv: string[]): Options => {
  let jobId = ''
  let pollIntervalMs = 5000

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '-t') {
      const parsed = getNumber(argv[index + 1])
      if (typeof parsed === 'number') pollIntervalMs = parsed
      index += 1
      continue
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    }
    if (!jobId) {
      jobId = arg
    }
  }

  if (!jobId) {
    throw new Error('Missing job id. Usage: npm run qwen:await -- <job-id> [-t <interval>]')
  }

  return { jobId, pollIntervalMs }
}

const main = async () => {
  const options = parseArgs(process.argv.slice(2))
  const statusData = await waitForCompletion(options.jobId, { intervalMs: options.pollIntervalMs })
  console.log(JSON.stringify(statusData, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
