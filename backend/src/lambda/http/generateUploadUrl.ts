import 'source-map-support/register'

import {  APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { createAttachmentPresignedUrl } from '../../helpers/todos'
// import { getUserId } from '../utils'
import * as uuid from 'uuid'

export const handler = middy(
  async (): Promise<APIGatewayProxyResult> => {
    // const todoId = event.pathParameters.todoId
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const imageId = uuid.v4()  

    // const userId = getUserId(event);
    const presignedUrl =  createAttachmentPresignedUrl(imageId)

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
