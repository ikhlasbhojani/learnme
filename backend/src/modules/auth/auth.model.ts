import { Schema, model, type Document, type Model } from 'mongoose'

export type ThemePreference = 'light' | 'dark' | 'blue' | 'green'

export interface IUser {
  email: string
  passwordHash: string
  themePreference?: ThemePreference | null
  lastLoginAt?: Date | null
}

export interface IUserDocument extends IUser, Document {
  createdAt: Date
  updatedAt: Date
}

export type UserModel = Model<IUserDocument>

const userSchema = new Schema<IUserDocument>(
  {
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
    versionKey: false,
  }
)

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.passwordHash
    return ret
  },
})

export const User: UserModel = model<IUserDocument>('User', userSchema)

export default User

