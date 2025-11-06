import mongoose, { Schema, Document, Model } from 'mongoose'

export type ContentInputType = 'url' | 'file' | 'manual'

export interface IContentInput {
  id: string
  userId: string
  type: ContentInputType
  source: string
  content?: string | null
  timestamp?: Date
  createdAt: Date
  updatedAt: Date
}

export interface IContentInputDocument extends IContentInput, Document {
  toJSON(): IContentInput & { id: string; contentInputId?: never }
}

const contentInputSchema = new Schema<IContentInputDocument>(
  {
    _id: {
      type: String,
      default: () => `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    },
    userId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['url', 'file', 'manual'],
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    _id: false,
    id: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v
        ret.id = ret._id
        delete ret._id
        return ret
      },
    },
  }
)

// Create index on userId for faster queries
contentInputSchema.index({ userId: 1 })

const ContentInputModel = mongoose.model<IContentInputDocument>('ContentInput', contentInputSchema)

// Static methods for compatibility with existing code - wrap original Mongoose methods
const originalFind = ContentInputModel.find.bind(ContentInputModel)
const originalFindOne = ContentInputModel.findOne.bind(ContentInputModel)
const originalCreate = ContentInputModel.create.bind(ContentInputModel)

ContentInputModel.find = async function (query: { userId?: string; id?: string }): Promise<IContentInputDocument[]> {
  const mongoQuery: any = {}
  if (query.userId) mongoQuery.userId = query.userId
  if (query.id) mongoQuery._id = query.id
  
  return await originalFind(mongoQuery).sort({ createdAt: -1 })
}

ContentInputModel.findOne = async function (query: { userId?: string; id?: string }): Promise<IContentInputDocument | null> {
  const mongoQuery: any = {}
  if (query.userId) mongoQuery.userId = query.userId
  if (query.id) mongoQuery._id = query.id
  
  return await originalFindOne(mongoQuery)
}

ContentInputModel.create = async function (data: {
  userId: string
  type: ContentInputType
  source: string
  content?: string | null
}): Promise<IContentInputDocument> {
  return await originalCreate({
    _id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    userId: data.userId,
    type: data.type,
    source: data.source,
    content: data.content || null,
    timestamp: new Date(),
  })
}

ContentInputModel.update = async function (id: string, userId: string, updates: {
  source?: string
  content?: string | null
}): Promise<IContentInputDocument> {
  const updated = await ContentInputModel.findOneAndUpdate(
    { _id: id, userId },
    { $set: updates },
    { new: true, runValidators: true }
  )
  if (!updated) {
    throw new Error('Content input not found')
  }
  return updated
}

ContentInputModel.deleteOne = async function (id: string, userId: string): Promise<boolean> {
  const result = await ContentInputModel.deleteOne({ _id: id, userId })
  return result.deletedCount > 0
}

// Export with static methods
export const ContentInput = ContentInputModel as typeof ContentInputModel & {
  find(query: { userId?: string; id?: string }): Promise<IContentInputDocument[]>
  findOne(query: { userId?: string; id?: string }): Promise<IContentInputDocument | null>
  create(data: {
    userId: string
    type: ContentInputType
    source: string
    content?: string | null
  }): Promise<IContentInputDocument>
  update(id: string, userId: string, updates: {
    source?: string
    content?: string | null
  }): Promise<IContentInputDocument>
  deleteOne(id: string, userId: string): Promise<boolean>
}

export default ContentInput
