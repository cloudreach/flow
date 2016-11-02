import http from 'http'
import stream from 'stream'
import url from 'url'

export default class HttpExecutor {
  constructor (taskServerUrl) {
    this.taskServerUrl = typeof taskServerUrl === 'object'
      ? taskServerUrl
      : url.parse(taskServerUrl)
  }

  runTask (handler, taskId, taskName) {
    return handler(taskId, taskName)
  }

  startTask (handler, taskId, taskName) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({ id: taskId, name: taskName })
      const params = Object.assign({
        method: 'POST',
        headers: {
          'content-length': Buffer.byteLength(payload),
          'content-type': 'application/json'
        }
      }, this.taskServerUrl)
      const request = http.request(params, res => {
        const ok = res.statusCode.toString()[0] === '2'
        res.pipe(extractResponse(ok ? resolve : reject))
      })
      request.end(payload)
      request.on('error', reject)
    })
  }
}

function extractResponse (callback) {
  let buffers = []
  return new stream.Transform({
    transform (chunk, encoding, callback) {
      buffers.push(chunk)
      callback()
    },

    flush (_callback) {
      callback(Buffer.concat(buffers).toString())
      _callback()
    }
  })
}
