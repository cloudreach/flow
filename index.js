const Medium = require('./medium')
const executor = require('./executor')
const handler = require('./handler')
const storage = require('./storage')

function flow (medium, handlers) {
  for (let taskName of Object.keys(handlers)) {
    medium.registerHandler(taskName, handlers[taskName])
  }

  return medium.createHandler()
}

Object.assign(flow, { Medium, executor, handler, storage })

module.exports = flow
