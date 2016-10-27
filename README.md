# flow

A small library for batch computations.

This was born from billing projects where the same task coordination logic was being repeatedly
written and copied around, and where workflows that were to be executed in AWS Lambda would need to
be tested locally.

## Concepts

- **task:** A task is a unit of work. Tasks in flow are described by an object with the following
  fields:

  - **`id`:** Unique identifier for the task.
  - **`name`:** Name of the task, used to determine a handler for the task.
  - **`input`:** Data to be processed.
  - **`output`:** Result of processing.
  - **`dependencies`:** Tasks that must be complete before this task.
  - **`dependents`:** Tasks that should be started once this task is complete.
  - **`status`:** Status of the task, either "pending" or "complete".
  - **`statusUpdatedAt`:** When the task's status was last updated. Could be used to determine
    whether a task has timed out.

- **handler:** A handler is a function to process tasks with a certain name. Handlers are given the
  following arguments:

  - **`input`:** Data to be processed.
  - **`task`:** Task being processed.
  - **`medium`:** Reference to the medium the flow is running through.

  A number of handler decorators with specific purposes are provided:

  - **compute:** The return value of a compute handler is written as the task output, and dependent
    tasks are started.
  - **graph:** Graph handlers are invoked with a task graph instance, through which the handler
    can define more tasks to be ran to compute an output. The return value of graph handlers is
    ignored, however metadata is injected into the sink of the graph to update the task output
    later.
  - **sink:** Sink handlers are invoked with an array of the outputs of the task's dependencies.
    They also handle metadata from graph tasks to redirect output to a source task.

- **task graph:** A task graph defines tasks to be executed, along with the dependencies between
  them.

- **medium:** A 'medium' is a combination of storage and executor, used to run a flow handler. The
  medium provides the API through which handlers can store output, start dependents or get the
  status of other tasks.

  - **storage:** The 'storage' aspect of the medium defines how task definitions are persisted. In
    particular it defines how to retrieve a persisted task, how to persist a new task, how to update
    a task's output, etc.
  - **executor:** The 'executor' aspect of the medium defines how task handlers are invoked. In
    particular it defines how to start a task with a given ID and name, and how to execute a task.
