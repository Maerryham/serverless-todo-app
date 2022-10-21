import { TodoAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'
import { parseUserId } from '../auth/utils';
// import { getUserId } from '../lambda/utils'
import { TodoUpdate } from '../models/TodoUpdate';

// TODO: Implement businessLogic

const logger = createLogger('todos')
const todoAccess = new TodoAccess()

export async function getAllTodos(): Promise<TodoItem[]> {
  return todoAccess.getAllTodos()
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  jwtToken: string
): Promise<TodoItem> {

  const itemId = uuid.v4()
  const userId = parseUserId(jwtToken)

  const result = await todoAccess.createTodo({
    todoId: itemId,
    userId: userId,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false,
    createdAt: new Date().toISOString(),
    attachmentUrl: createTodoRequest.attachmentUrl,
  })

  logger.info('createTodo ', {
    result
  })
  return result
}


export async function updateTodo(
  updateTodoRequest: UpdateTodoRequest,
  userId: string, todoId: string
): Promise<TodoUpdate> {


  const result =  await todoAccess.updateTodo({
    name: updateTodoRequest.name,
    dueDate: updateTodoRequest.dueDate,
    done: updateTodoRequest.done
  }, userId, todoId)

  logger.info('updateTodo ', {
    result
  })
  return result
}

export async function deleteTodo(
  todoId: string, userId: string
): Promise<string> {

  const result = await todoAccess.deleteTodo(
    todoId,
    userId
  )

  logger.info('deleteTodo ', {
    result
  })
  return result
}


export async function todoExists(
  todoId: string
): Promise<boolean> {

  const result = await todoAccess.todoExists(
    todoId
  )

  logger.info('todoExists ', {
    result
  })
  return result
}


export async function getTodosForUser(
  todoId: string
): Promise<TodoItem[]> {

  const result = await todoAccess.getTodosForUser(
    todoId
  )

  logger.info('getTodosForUser ', {
    result
  })
  return result
}

export async function createAttachmentPresignedUrl(imageId: string) {
  const result =  AttachmentUtils(imageId)
  
  logger.info('createAttachmentPresignedUrl ', {
    result
  })
  return result
}

  
