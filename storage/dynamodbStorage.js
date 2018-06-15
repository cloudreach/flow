const dynamodbDataTypes = require('dynamodb-data-types')

const { TaskAlreadyCompleteError } = require('../medium')

dynamodbDataTypes.preserveArrays()

const attr = dynamodbDataTypes.AttributeValue

module.exports = class DynamodbStorage {
  constructor (DynamoDB, tableName) {
    this._tableName = tableName

    this._dynamodb = new DynamoDB({ params: { TableName: tableName } })
  }

  insertTasks (tasks) {
    if (tasks.length === 0) {
      return Promise.resolve(tasks)
    }

    const batchWriteLimit = 25
    const taskBatches = chunk(tasks, batchWriteLimit)

    return Promise.all(taskBatches.map((taskBatch) => {
      return this._dynamodb.batchWriteItem({
        RequestItems: {
          [this._tableName]: taskBatch.map(task => ({
            PutRequest: { Item: attr.wrap(task) }
          }))
        }
      }).promise()
    }))
      .then(responses => {
        for (const response of responses) {
          const unprocessedItems = response.UnprocessedItems[this._tableName]
          if (unprocessedItems && unprocessedItems.length > 0) {
            throw new Error('Failed to create all tasks')
          }
        }
        return tasks
      })
  }

  loadTask (taskId) {
    return this._dynamodb.getItem({ Key: attr.wrap({ id: taskId }) }).promise()
      .then(task => task && attr.unwrap(task.Item))
  }

  loadDependencies (dependencies) {
    if (dependencies.length === 0) {
      return Promise.resolve([])
    }

    return this._dynamodb.batchGetItem({
      RequestItems: {
        [this._tableName]: {
          Keys: dependencies.map(id => attr.wrap({ id })),
          ProjectionExpression: '#id, #output, #status',
          ExpressionAttributeNames: { '#id': 'id', '#output': 'output', '#status': 'status' }
        }
      }
    }).promise()
      .then(data => {
        const unprocessedKeys = data.UnprocessedKeys[this._tableName]
        if (unprocessedKeys && unprocessedKeys.Keys.length > 0) {
          throw new Error('Failed to load all dependencies')
        }

        return data.Responses[this._tableName].map(attr.unwrap)
      })
  }

  completeTask (taskId, output) {
    const updateExpression =
      'SET #output = :output, #status = :statusComplete, #statusUpdatedAt = :statusUpdatedAt'
    const conditionExpression = '#status = :statusPending'
    const expressionAttributeNames = {
      '#output': 'output',
      '#status': 'status',
      '#statusUpdatedAt': 'statusUpdatedAt'
    }
    const expressionAttributeValues = {
      ':output': JSON.stringify(output) || null,
      ':statusComplete': 'complete',
      ':statusPending': 'pending',
      ':statusUpdatedAt': new Date().toISOString()
    }

    return this._dynamodb.updateItem({
      Key: attr.wrap({ id: taskId }),
      UpdateExpression: updateExpression,
      ConditionExpression: conditionExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: attr.wrap(expressionAttributeValues),
      ReturnValues: 'ALL_NEW'
    }).promise()
      .then(task => attr.unwrap(task.Attributes))
      .catch(error => {
        if (error.code === 'ConditionalCheckFailedException') {
          // Fail quietly if task was already completed
          throw new TaskAlreadyCompleteError(taskId)
        } else {
          throw error
        }
      })
  }
}

function chunk (array, chunkSize) {
  const chunks = []
  for (let chunkStart = 0; chunkStart < array.length; chunkStart += chunkSize) {
    chunks.push(array.slice(chunkStart, chunkStart + chunkSize))
  }
  return chunks
}
