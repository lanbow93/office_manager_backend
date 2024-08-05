import mongoose from '../config/database.js'

const { Schema, model } = mongoose

const shiftSchema = new Schema(
  {
    start: Date,
    end: Date,
    role: String,
    location: String,
    status: {
      type: String,
      enum: [
        'Scheduled',
        'On-Shift',
        'Late Clock In',
        'On Break',
        'Clocked Out',
        'No Show',
        'Absent'
      ]
    },
    notes: String
  },
  { _id: false }
)

const Shift = model('Shift', shiftSchema)

export default Shift
