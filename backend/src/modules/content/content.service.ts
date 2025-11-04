import { Types } from 'mongoose'
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
    user: new Types.ObjectId(userId),
    type: input.type,
    source: input.source,
    content: input.content ?? null,
  })

  return content.toJSON()
}

export async function listContentInputs(
  userId: string
): Promise<Array<ReturnType<IContentInputDocument['toJSON']>>> {
  const items = await ContentInput.find({ user: userId }).sort({ createdAt: -1 })
  return items.map((item) => item.toJSON())
}

export async function getContentInputById(
  userId: string,
  id: string
): Promise<ReturnType<IContentInputDocument['toJSON']>> {
  const item = await ContentInput.findOne({ _id: id, user: userId })
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
  const item = await ContentInput.findOneAndUpdate(
    { _id: id, user: userId },
    {
      ...(typeof updates.source !== 'undefined' ? { source: updates.source } : {}),
      ...(typeof updates.content !== 'undefined' ? { content: updates.content } : {}),
    },
    { new: true }
  )

  if (!item) {
    throw new AppError('Content input not found', 404)
  }

  return item.toJSON()
}

export async function deleteContentInput(userId: string, id: string): Promise<void> {
  const result = await ContentInput.deleteOne({ _id: id, user: userId })
  if (result.deletedCount === 0) {
    throw new AppError('Content input not found', 404)
  }
}

