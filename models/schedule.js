import mongoose from '../config/database.js'

const { Schema, model } = mongoose

const scheduleSchema = new Schema(
  {
    eventName: String,
    company: String,
    department: String,
    hoursNeeded: Number,
    shifts: [{ type: Schema.Types.ObjectId, ref: 'Shift' }]
  },
  { timestamps: true }
)

const Schedule = model('Schedule', scheduleSchema)

export default Schedule
