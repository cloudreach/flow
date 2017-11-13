import uuid from 'uuid'

import { DependencyNotCompleteError } from './medium'

/*
 * Creates a flow compute handler wrapping the given function.
 *
 * A compute handler will be given the input and the task, and the result will be stored as output
 * and the task's dependents will be started.
 */
export function compute (fn) {
  return (input, task, medium) => {
    return fn(input, task, medium)
      .then(output => medium.startDependents(task.id, output))
  }
}

/*
 * Creates a flow graph handler, wrapping the given function.
 *
 * A graph handler generates a subgraph to compute task output. A graph should be terminated by a
 * sink task.
 *
 * Graph handlers ignore the result of the function, as output will be computed for the tasks in the
 * graph.
 */
export function graph (fn) {
  return (input, task, medium) => {
    const graph = new TaskGraph()

    return fn(graph)(input, task, medium)
      .then(() => {
        if (task) {
          if (graph.tasks.length === 0) {
            // If no tasks were defined, resort to `compute` behaviour (with no output)
            return medium.startDependents(task.id, task.output)
          }

          if (!graph.end.dependencies.length === 1) {
            throw new Error('A graph task must end with exactly one dependency')
          }

          // Override the sink input to set the source task ID to the graph task's ID
          const sink = graph.tasks.find(task => task.id === graph.end.dependencies[0])
          sink.input = {
            sourceTaskId: task.id,
            input: sink.input
          }
        }

        return medium.startGraph(graph)
      })
  }
}

/*
 * Creates a flow sink handler, wrapping the given function.
 *
 * A sink handler ensures all its dependencies are complete before invoking, and passes the
 * dependency output as input to the task. It also handles saving back to a source task if
 * specified.
 */
export function sink (fn) {
  return (input, task, medium) => {
    return medium.loadDependencyOutputs(task.dependencies)
      .then(_sink)
      .catch(error => {
        if (error instanceof DependencyNotCompleteError) {
          // Fail silently. The sink will be triggered again when the dependency is completed.
          return
        }
        throw error
      })

    function _sink (dependencies) {
      let sourceTaskId = null
      if (input && input.sourceTaskId) {
        ({ sourceTaskId, input } = input)
      }

      return fn(dependencies)(input, task, medium)
        .then(output => medium.startDependents(task.id, output))
        .then(output => sourceTaskId ? medium.startDependents(sourceTaskId, output) : output)
    }
  }
}

/*
 * Provides an interface for defining a graph of tasks.
 */
export class TaskGraph {
  constructor (sourceTask) {
    this.tasks = []

    this.start = { dependents: [] }
    this.end = { dependencies: [] }
  }

  task (task) {
    task = Object.assign({
      id: uuid.v4(),
      name: null,
      input: null,
      output: null,
      dependencies: [],
      dependents: [],
      status: 'pending',
      statusUpdatedAt: new Date()
    }, task)
    this.tasks.push(task)
    return task
  }

  pipe (source, destination) {
    if (destination.id) {
      source.dependents.push({ id: destination.id, name: destination.name })
    }
    if (source.id) {
      destination.dependencies.push(source.id)
    }
  }
}
