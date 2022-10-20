import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
const userIdIndex = process.env.USER_ID_INDEX
export class TodoAccess {

    constructor(
      private readonly docClient: DocumentClient = createDynamoDBClient(),
      private readonly todosTable = process.env.TODOS_TABLE) {
    }
  
    async getAllTodos(): Promise<TodoItem[]> {
      console.log('Getting all todos')
  
      const result = await this.docClient.scan({
        TableName: this.todosTable
      }).promise()
  
      const items = result.Items
      return items as TodoItem[]
    }

    async getTodosForUser(userId: string): Promise<TodoItem[]> {
      console.log('Getting todos for users')

      const result = await this.docClient.query({
        TableName: this.todosTable,
        IndexName : userIdIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }).promise()

      const items = result.Items
      return items as TodoItem[]
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
        console.log('Creating todos')
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise()

        return todo
    }

    async updateTodo(todo: TodoUpdate, userId: string, todoId: string): Promise<TodoUpdate> {
        console.log('Updating todos')
        await this.docClient.update({
          TableName: this.todosTable,
          Key: {
            todoId: todoId,
            userId:  userId,
          },
          UpdateExpression: "SET name = :name,  dueDate = :dueDate,  done = :done ",
          ExpressionAttributeValues: {
            ":name": todo.name,
            ":dueDate": todo.dueDate,
            ":done": todo.done,
          },
        }).promise()
    
        return todo
      }
    
      async updateAttachedImage(todo: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
          TableName: this.todosTable,
          Item: todo
        }).promise()
    
        return todo
      }


      async  todoExists(todoId: string) {
        const result = await this.docClient
          .get({
            TableName: this.todosTable,
            Key: {
              todoId: todoId
            }
          })
          .promise()

        console.log('Get todo: ', result)
        return !!result.Item
      }

      async deleteTodo(todoId: string, userId: string): Promise<string> {
        console.log('Deleting todo')
        await this.docClient.delete({
          TableName: this.todosTable,
          Key: {
            todoId: todoId,
            userId: userId
          }
        }).promise()
    
        return 'Deleted'
      }



}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
    })
    }

    return new XAWS.DynamoDB.DocumentClient()
}
      