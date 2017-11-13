export default class MemoryStorage {
  constructor (tableName) {
    this.tasks = {}
  }

  insertTasks (tasks) {
    tasks.forEach(task => { this.tasks[task.id] = task })
    return Promise.resolve(tasks)
  }

  loadTask (taskId) {
    return Promise.resolve(this.tasks[taskId])
  }

  loadDependencies (dependencies) {
    return Promise.resolve(dependencies.map(id => {
      const { output, status } = this.tasks[id]
      return { id, output, status }
    }))
  }

  completeTask (taskId, output) {
    return Promise.resolve(Object.assign(this.tasks[taskId], {
      output,
      status: 'complete',
      statusUpdatedAt: new Date()
    }))
  }
}
