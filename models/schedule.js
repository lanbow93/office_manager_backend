import mongoose from '../config/database.js'

const { Schema, model } = mongoose

const scheduleSchema = new Schema(
  {
    department: { type: String, unique: true },
    badgeName: { type: String, unique: true },
    
  },
  { timestamps: true }
)

const User = model('Schedule', userSchema)

export default User
