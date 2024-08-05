import mongoose from '../config/database.js'

const { Schema, model } = mongoose

const unavailableSchema = new Schema(
  {
    start: Date,
    end: Date,
    reason: String
  },
  { _id: false }
)

const userSchema = new Schema(
  {
    username: { type: String, unique: true },
    firstName: String,
    lastName: String,
    company: String,
    password: String,
    email: { type: String, unique: true },
    verificationToken: String,
    isVerified: { type: Boolean, default: false, required: true },
    adminOf: [String],
    resetToken: String,
    resetTokenExpiry: Date,
    unavailableHours: [unavailableSchema]
  },
  { timestamps: true }
)

const User = model('User', userSchema)

export default User
