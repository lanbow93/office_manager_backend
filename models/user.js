import mongoose from '../config/database.js'

const { Schema, model } = mongoose

const userSchema = new Schema(
  {
    username: { type: String, unique: true },
    badgeName: { type: String, unique: true },
    company: String,
    password: String,
    email: { type: String, unique: true },
    verificationToken: String,
    isVerified: { type: Boolean, default: false, required: true },
    adminOf: [String],
    resetToken: String,
    resetTokenExpiry: Date
  },
  { timestamps: true }
)

const User = model('User', userSchema)

export default User
