import { TodoAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'
import { parseUserId } from '../auth/utils';
import { getUserId } from '../lambda/utils'
import { TodoUpdate } from '../models/TodoUpdate';

// TODO: Implement businessLogic

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

  return await todoAccess.createTodo({
    todoId: itemId,
    userId: userId,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false,
    createdAt: new Date().toISOString(),
    attachmentUrl: createTodoRequest.attachmentUrl,
  })
}


export async function updateTodo(
  updateTodoRequest: UpdateTodoRequest,
  userId: string, todoId: string
): Promise<TodoUpdate> {


  return await todoAccess.updateTodo({
    name: updateTodoRequest.name,
    dueDate: updateTodoRequest.dueDate,
    done: updateTodoRequest.done
  }, userId, todoId)
}

export async function deleteTodo(
  todoId: string, userId: string
): Promise<string> {

  return await todoAccess.deleteTodo(
    todoId,
    userId
  )
}


export async function todoExists(
  todoId: string
): Promise<boolean> {

  return await todoAccess.todoExists(
    todoId
  )
}


export async function getTodosForUser(
  todoId: string
): Promise<TodoItem[]> {

  return await todoAccess.getTodosForUser(
    todoId
  )
}

export async function createAttachmentPresignedUrl(imageId: string) {
  return AttachmentUtils(imageId)
}

  
