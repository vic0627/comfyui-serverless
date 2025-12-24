import dotenv from 'dotenv'
import { cancel } from '../utils/http'

dotenv.config()

type Options = {
  jobId: string
}

const parseArgs = (argv: string[]): Options => {
  let jobId = ''

  for (const arg of argv) {
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    }
    if (!jobId) {
      jobId = arg
    }
  }

  if (!jobId) {
    throw new Error('Missing job id. Usage: npm run qwen:cancel -- <job-id>')
  }

  return { jobId }
}

const main = async () => {
  const options = parseArgs(process.argv.slice(2))
  const response = await cancel(options.jobId)
  console.log(JSON.stringify(response.data, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
