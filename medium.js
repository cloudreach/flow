class Medium {
  constructor (executor, storage) {
    this._handlers = {}

    // Delegate executor methods
    for (let m of [ 'runTask', 'startTask' ]) {
      this[m] = executor[m].bind(executor)
    }

    // Delegate storage methods
    for (let m of [ 'insertTasks', 'loadTask', 'loadDependencies', 'completeTask' ]) {
      this[m] = storage[m].bind(storage)
    }
  }

  registerHandler (taskName, handler) {
    this._handlers[taskName] = taskId => {
      console.log('run', taskId)
      const task = taskId == null ? Promise.resolve(null) : this.loadPendingTask(taskId)
      return task
        .then(task => handler(task && task.input, task, this))
        .then(() => console.log('ok', taskId))
        .catch(error => {
          if (error instanceof TaskAlreadyCompleteError) {
            console.error('warn', taskId, error)
          } else {
            console.error('error', taskId, error)
            return Promise.reject(error)
          }
        })
    }
  }

  createHandler () {
    return (...args) => this.runTask((taskId, taskName) => {
      return this._handlers[taskName || 'default'](taskId)
    }, ...args)
  }

  loadPendingTask (taskId) {
    return this.loadTask(taskId)
      .then(task => {
        if (!task) {
          throw new TaskNotFoundError(taskId)
        }
        if (task.status === 'complete') {
          throw new TaskAlreadyCompleteError()
        }
        return task
      })
  }

  startGraph (graph) {
    return this.insertTasks(graph.tasks)
      .then(() => this.startTasks(graph.start.dependents))
  }

  loadDependencyOutputs (dependencies) {
    return this.loadDependencies(dependencies)
      .then(dependencies => {
        return dependencies.map(({ id, output, status }) => {
          if (status !== 'complete') {
            throw new DependencyNotCompleteError(id)
          }
          return output && JSON.parse(output)
        })
      })
  }

  startDependents (taskId, output) {
    return this.completeTask(taskId, output)
      .then(task => this.startTasks(task.dependents))
      .then(() => output)
  }

  startTasks (tasks) {
    return Promise.all(tasks.map(task => {
      return this.startTask(this._handlers[task.name], task.id, task.name)
    }))
  }
}

class TaskNotFoundError extends CustomError {
  constructor (taskId) {
    super(`Task ${taskId} not found`)
  }
}

class TaskAlreadyCompleteError extends CustomError {
  constructor (taskId) {
    super(`Task ${taskId} is already complete`)
  }
}

class DependencyNotCompleteError extends CustomError {
  constructor (dependencyId) {
    super(`Dependency task ${dependencyId} is not complete`)
  }
}

function CustomError (message) {
  this.name = this.constructor.name
  this.message = message
  Error.captureStackTrace(this, this.constructor)
}
CustomError.prototype = Object.create(Error.prototype)
CustomError.prototype.constructor = CustomError

Object.assign(Medium, {
  TaskNotFoundError,
  TaskAlreadyCompleteError,
  DependencyNotCompleteError
})

module.exports = Medium
