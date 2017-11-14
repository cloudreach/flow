import fs from 'fs'
import path from 'path'

export default class FileStorage {
  constructor (path) {
    this.path = path
  }

  insertTasks (tasks) {
    if (tasks.length === 0) {
      return Promise.resolve(tasks)
    }

    return new Promise((resolve, reject) => {
      let tasksWritten = 0

      tasks.forEach(task => {
        const filePath = path.join(this.path, `${task.id}.json`)
        fs.writeFile(filePath, JSON.stringify(task), error => {
          if (error) {
            reject(error)
            return
          }

          if (++tasksWritten === tasks.length) {
            resolve(tasks)
          }
        })
      })
    })
  }

  loadTask (taskId) {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.path, `${taskId}.json`)
      fs.readFile(filePath, (error, fileContent) => {
        if (error) {
          reject(error)
          return
        }

        resolve(JSON.parse(fileContent))
      })
    })
  }

  loadDependencies (dependencies) {
    return Promise.all(dependencies.map(id => {
      return this.loadTask(id)
        .then(task => {
          const { output, status } = task
          return { id, output, status }
        })
    }))
  }

  completeTask (taskId, output) {
    return this.loadTask(taskId)
      .then(task => {
        Object.assign(task, {
          output: JSON.stringify(output) || null,
          status: 'complete',
          statusUpdatedAt: new Date()
        })

        return this.insertTasks([task])
          .then(() => task)
      })
  }
}
