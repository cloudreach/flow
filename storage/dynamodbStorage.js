import aws from 'aws-sdk'
import dynamodbDataTypes, { AttributeValue as attr } from 'dynamodb-data-types'

import { TaskAlreadyCompleteError } from '../medium'

dynamodbDataTypes.preserveArrays()

export default class DynamodbStorage {
  constructor (tableName) {
    this._tableName = tableName

    this._dynamodb = new aws.DynamoDB({ params: { TableName: tableName } })
  }

  insertTasks (tasks) {
    if (tasks.length === 0) {
      return Promise.resolve(tasks)
    }

    return this._dynamodb.batchWriteItem({
      RequestItems: {
        [this._tableName]: tasks.map(task => ({
          PutRequest: { Item: attr.wrap(task) }
        }))
      }
    }).promise()
      .then(data => {
        const unprocessedItems = data.UnprocessedItems[this._tableName]
        if (unprocessedItems && unprocessedItems.length > 0) {
          throw new Error('Failed to create all tasks')
        }
        return tasks
      })
  }

  loadTask (taskId) {
    return this._dynamodb.getItem({ Key: attr.wrap({ id: taskId }) }).promise()
      .then(task => task && attr.unwrap(task.Item))
  }

  loadDependencies (dependencies) {
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
