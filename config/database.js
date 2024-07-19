import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
const { MONGODB_URL } = process.env

mongoose.set('strictQuery', false)

mongoose.connect(MONGODB_URL, {})

mongoose.connection
  .on('open', () => console.log('Mongoose connected'))
  .on('close', () => console.log('Disconnected from Mongoose'))
  .on('error', (error) => console.log(error))

export default mongoose
