import ContentInput, {
  type IContentInputDocument,
} from './content.model'
import {
  type CreateContentInput,
  type UpdateContentInput,
} from './content.validation'
import { AppError } from '../../utils/appError'

export async function createContentInput(
  userId: string,
  input: CreateContentInput
): Promise<ReturnType<IContentInputDocument['toJSON']>> {
  const content = await ContentInput.create({
    userId,
    type: input.type,
    source: input.source,
    content: input.content ?? null,
  })

  return content.toJSON()
}

export async function listContentInputs(
  userId: string
): Promise<Array<ReturnType<IContentInputDocument['toJSON']>>> {
  const items = await ContentInput.find({ userId })
  return items.map((item) => item.toJSON())
}

export async function getContentInputById(
  userId: string,
  id: string
): Promise<ReturnType<IContentInputDocument['toJSON']>> {
  const item = await ContentInput.findOne({ id, userId })
  if (!item) {
    throw new AppError('Content input not found', 404)
  }

  return item.toJSON()
}

export async function updateContentInput(
  userId: string,
  id: string,
  updates: UpdateContentInput
): Promise<ReturnType<IContentInputDocument['toJSON']>> {
  const item = await ContentInput.update(id, userId, {
    source: updates.source,
    content: updates.content,
  })

  return item.toJSON()
}

export async function deleteContentInput(userId: string, id: string): Promise<void> {
  const deleted = await ContentInput.deleteOne(id, userId)
  if (!deleted) {
    throw new AppError('Content input not found', 404)
  }
}

