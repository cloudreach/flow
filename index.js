import Medium from './medium'
import * as executor from './executor'
import * as handler from './handler'
import * as storage from './storage'

export default function flow (medium, handlers) {
  for (let taskName of Object.keys(handlers)) {
    medium.registerHandler(taskName, handlers[taskName])
  }

  return medium.createHandler()
}

Object.assign(flow, { Medium, executor, handler, storage })
