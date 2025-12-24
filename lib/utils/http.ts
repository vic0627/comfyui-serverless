import axios from 'axios'
import dotenv from 'dotenv'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { ServerlessRes, SuccessData } from '~/index'

dotenv.config()

const http = axios.create({
  baseURL: 'https://api.runpod.ai/v2/' + process.env['ENDPOINT_ID'],
  headers: {
    Authorization: 'Bearer ' + process.env['COMFY_ORG_API_KEY'],
  },
})

const logResponse = async (url: string, res: unknown) => {
  const logDir = resolve('.log')
  await mkdir(logDir, { recursive: true })
  const time = new Date().toISOString()
  const fileName = time.replace(/[:.]/g, '-') + '.json'
  const payload = { time, url, res }
  await writeFile(resolve(logDir, fileName), JSON.stringify(payload, null, 2))
}

http.interceptors.response.use(async (response) => {
  const baseURL = response.config.baseURL ?? ''
  const url = response.config.url ?? 'unknown'
  let fullUrl = url
  if (baseURL) {
    try {
      fullUrl = new URL(url, baseURL).toString()
    } catch {
      fullUrl = `${baseURL}${url}`
    }
  }
  await logResponse(fullUrl, response.data)
  return response
})

const ContentTypeJson = {
  'Content-Type': 'application/json',
}

export const run = (data: any) =>
  http.post('/run', data, {
    headers: ContentTypeJson,
  })

export const runSync = (data: any) =>
  http.post<ServerlessRes<SuccessData>>('/runsync', data, {
    headers: ContentTypeJson,
  })

export const health = () => http.get('/health', { headers: ContentTypeJson })

export const cancel = (jobId: string) => http.post(join('/cancel', jobId), undefined, { headers: ContentTypeJson })

export const purgeQueue = () => http.post('/purge-queue', undefined, { headers: ContentTypeJson })

export const status = (jobId: string) => http.get(join('/status', jobId))

export const stream = (jobId: string) => http.get(join('/stream', jobId), { headers: ContentTypeJson })
