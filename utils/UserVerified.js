import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { failedRequest } from './SharedFunctions.js'
dotenv.config()

const SECRET = process.env.SECRET || ''

export async function userLoggedIn (request, response, next) {
  try {
    // Check if token is in the cookies
    const { token = false } = request.cookies
    if (token) {
      // Verify token
      const payload = await jwt.verify(token, SECRET)
      // Add payload to request
      request.payload = payload
      next()
    } else {
      failedRequest(
        response,
        'Failed Action',
        'User Not Logged In',
        'No User Token'
      )
    }
  } catch (error) {
    response.status(400).json({
      message: 'Failed User Verification',
      status: 'User Cookie Not Verified'
    })
  }
}
