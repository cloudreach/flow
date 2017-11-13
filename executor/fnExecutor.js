export default class FnExecutor {
  runTask (handler, taskId, taskName) {
    return handler(taskId, taskName)
  }

  startTask (handler, taskId, taskName) {
    setImmediate(() => {
      this.runTask(handler, taskId, taskName)
    })
    return Promise.resolve()
  }
}
