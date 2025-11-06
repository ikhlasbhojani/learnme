import mongoose, { Schema, Document, Model } from 'mongoose'

export type ThemePreference = 'light' | 'dark' | 'blue' | 'green'

export interface IUser {
  id: string
  email: string
  passwordHash: string
  themePreference?: ThemePreference | null
  lastLoginAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface IUserDocument extends IUser, Document {
  toJSON(): Omit<IUser, 'passwordHash'>
}

const userSchema = new Schema<IUserDocument>(
  {
    _id: {
      type: String,
      default: () => `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'blue', 'green'],
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    _id: false,
    id: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.passwordHash
        delete ret.__v
        ret.id = ret._id
        delete ret._id
        return ret
      },
    },
  }
)

// Method to convert to JSON (excluding sensitive fields)
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.passwordHash
  delete obj.__v
  obj.id = obj._id
  delete obj._id
  return obj
}

const UserModel = mongoose.model<IUserDocument>('User', userSchema)

// Static methods for compatibility with existing code - wrap original Mongoose methods
const originalFindOne = UserModel.findOne.bind(UserModel)
const originalFindById = UserModel.findById.bind(UserModel)
const originalCreate = UserModel.create.bind(UserModel)

UserModel.findOne = async function (query: { email?: string; id?: string }): Promise<IUserDocument | null> {
  if (query.email) {
    return await originalFindOne({ email: query.email.toLowerCase() })
  } else if (query.id) {
    return await originalFindById(query.id)
  }
  return null
}

UserModel.findById = async function (id: string): Promise<IUserDocument | null> {
  // For custom string _id fields, we need to query by _id directly
  // Use the original Mongoose findOne, not our custom override
  return await originalFindOne({ _id: id })
}

UserModel.create = async function (data: {
  email: string
  passwordHash: string
  themePreference?: ThemePreference | null
}): Promise<IUserDocument> {
  return await originalCreate({
    _id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    themePreference: data.themePreference || null,
  })
}

UserModel.update = async function (id: string, updates: {
  lastLoginAt?: Date | null
  themePreference?: ThemePreference | null
}): Promise<IUserDocument> {
  const updated = await UserModel.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  )
  if (!updated) {
    throw new Error('User not found')
  }
  return updated
}

// Export with static methods
export const User = UserModel as typeof UserModel & {
  findOne(query: { email?: string; id?: string }): Promise<IUserDocument | null>
  findById(id: string): Promise<IUserDocument | null>
  create(data: {
    email: string
    passwordHash: string
    themePreference?: ThemePreference | null
  }): Promise<IUserDocument>
  update(id: string, updates: {
    lastLoginAt?: Date | null
    themePreference?: ThemePreference | null
  }): Promise<IUserDocument>
}

export default User
