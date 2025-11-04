import { Schema, model, type Document, type Model, Types } from 'mongoose'

export type ContentInputType = 'url' | 'file' | 'manual'

export interface IContentInput {
  user: Types.ObjectId
  type: ContentInputType
  source: string
  content?: string | null
  timestamp?: Date
}

export interface IContentInputDocument extends IContentInput, Document {
  createdAt: Date
  updatedAt: Date
}

export type ContentInputModel = Model<IContentInputDocument>

const contentInputSchema = new Schema<IContentInputDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['url', 'file', 'manual'],
      required: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

contentInputSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    ret.userId = ret.user?.toString()
    delete ret._id
    delete ret.user
    return ret
  },
})

export const ContentInput: ContentInputModel = model<IContentInputDocument>(
  'ContentInput',
  contentInputSchema
)

export default ContentInput

