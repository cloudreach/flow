module.exports = class LambdaSnsExecutor {
  constructor (SNS, topicArn) {
    this._sns = new SNS({ params: { TopicArn: topicArn } })
  }

  runTask (handler, event, context, callback) {
    const message = JSON.parse(event.Records[0].Sns.Message)
    const taskId = message.id
    const taskName = message.name
    return handler(taskId, taskName)
      .then(output => callback(null, output))
      .catch(callback)
  }

  startTask (handler, taskId, taskName) {
    const message = { id: taskId, name: taskName }
    return this._sns.publish({ Message: JSON.stringify(message) }).promise()
  }
}
