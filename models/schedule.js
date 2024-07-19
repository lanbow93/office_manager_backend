import mongoose from '../config/database.js'

const { Schema, model } = mongoose

const shiftSchema = new Schema(
  {
    start: Date,
    end: Date,
    role: String,
    location: String,
    notes: String
  },
  { _id: false }
)

const scheduleSchema = new Schema(
  {
    event: String,
    department: String,
    badgeName: String,
    shifts: [shiftSchema]
  },
  { timestamps: true }
)

const Schedule = model('Schedule', scheduleSchema)

export default Schedule