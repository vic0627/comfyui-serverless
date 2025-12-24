# Dev Spec

## User Interface

### edit

```bash
npm run qwen:edit -- <image-path>... [-pp <positive-prompt>] [-np <negative-prompt>] [-s <steps>] [-c <cfg>] [-o <output-dir>] [-t <interval>]
```

- `<image-path>...`: paths of images, required, sequential, max length 3, the 4th and after will be ignored
- `[-pp <positive-prompt>]`: default ''
- `[-np <negative-prompt>]`: default ''
- `[-s <steps>]`: default 20
- `[-c <cfg>]`: default 10
- `[-o <output-dir>]`: default 'output'
- `[-t <interval>]`: polling interval (ms), default 5000

### cancel

cancel an existing job.

```bash
npm run qwen:cancel -- <job-id>
```

- `<job-id>`

### await

polling and await for an processing / queueing job. if the job failed / completed, end this process.

```bash
npm run qwen:await -- <job-id> [-t <interval>]
```

- `<job-id>`
- `[-t <interval>]`: polling interval (ms), default 5000

## Log

each response must create a json file to record the content. use current time as file name. store the log file in `.log/`.

format:

```json
{
    "time": "request time",
    "url": "url of the request",
    "res": "response of the request without any processing"
}
```