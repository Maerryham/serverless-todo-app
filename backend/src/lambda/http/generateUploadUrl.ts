import 'source-map-support/register'

import {  APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { createAttachmentPresignedUrl, todoById, updateAttachedImage } from '../../helpers/todos'

import * as uuid from 'uuid'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const imageId = uuid.v4()  

    const todo = await todoById(todoId)

    // if (!validTodoId) {
    //   return {
    //     statusCode: 404,
    //     body: JSON.stringify({
    //       error: 'Todo does not exist'
    //     })
    //   }
    // }

    await updateAttachedImage(todo, imageId)

    const presignedUrl =  await createAttachmentPresignedUrl(imageId)

    return {
      statusCode: 201,
      body: JSON.stringify({
        uploadUrl: presignedUrl
      })
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
