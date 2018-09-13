module.exports = class SequelizeStorage {
  constructor (Sequelize, Task) {
    this._Sequelize = Sequelize
    this._Task = Task
  }

  async insertTasks (tasks) {
    await this._Task.bulkCreate(tasks)
    return tasks
  }

  async loadTask (taskId) {
    const task = await this._Task.findById(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }
    return {
      ...task.dataValues,
      output: JSON.stringify(task.dataValues.output)
    }
  }

  async loadDependencies (dependencies) {
    const dependencyTasks = await this._Task.findAll({
      where: {
        'id': {
          [this._Sequelize.Op.in]: dependencies
        }
      }
    })

    return dependencyTasks.map(({ id, output, status }) => {
      return { id, output: JSON.stringify(output), status }
    })
  }

  async completeTask (taskId, output) {
    const task = await this._Task.findById(taskId)

    task.output = output
    task.status = 'complete'
    task.statusUpdatedAt = new Date()

    await task.save()
    return task.dataValues
  }

  static defineTaskModel (sequelize, name, options = {}) {
    const { DataTypes } = sequelize.Sequelize

    return sequelize.define(name, {
      'id': {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false
      },
      'name': DataTypes.STRING,
      'input': DataTypes.JSONB,
      'output': DataTypes.JSONB,
      'dependencies': {
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: false
      },
      'dependents': {
        type: DataTypes.JSONB,
        defaultValue: [],
        allowNull: false
      },
      'status': {
        type: DataTypes.STRING,
        allowNull: false
      },
      'statusUpdatedAt': {
        type: DataTypes.DATE,
        allowNull: false
      }
    }, options)
  }
}
