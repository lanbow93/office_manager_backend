import express from 'express'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import sgMail from '@sendgrid/mail'
import crypto from 'crypto'
// Model & Type Imports
import User from '../models/user.js'
import Shift from '../models/shift.js'
import Assignment from '../models/assignment.js'

import { successfulRequest, failedRequest } from '../utils/SharedFunctions.js'
import { userLoggedIn } from '../utils/UserVerified.js'
import {
  forgotPasswordEmailGenerator,
  verifyEmailGenerator
} from '../utils/emails.js'
dotenv.config()

const router = express.Router()
const SECRET = process.env.SECRET || ''

const frontendUrl = 'http://localhost:5173'
const siteName = 'Office Manager'
const borderColor = '#9DD9F3'
const cornerColor = '#77C3EC'

/*
Purpose: Creates a new user
Needed: username | firstName | lastName | password | email |
*/
router.post('/signup', async (request, response) => {
  try {
    // Hash password
    request.body.password = await bcrypt.hash(
      request.body.password,
      await bcrypt.genSalt(10)
    )
    // Generate a verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    const userObject = {
      username: request.body.username.toLowerCase().trim(),
      firstName: request.body.firstName.toLowerCase().trim(),
      lastName: request.body.lastName.toLowerCase().trim(),
      password: request.body.password,
      email: request.body.email.toLowerCase().trim(),
      verificationToken,
      isVerified: false,
      resetToken: '',
      resetTokenExpiry: new Date(),
      unavailableHours: []
    }
    const user = await User.create(userObject)
    // Send verification email

    const verificationLink = `${frontendUrl}/verify-email/${verificationToken}`
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')
    const msg = {
      to: request.body.email,
      from: 'speedycheckin.automated@gmail.com',
      subject: `Verify Your Email - ${siteName}`,
      text: 'Email Verification',
      html: verifyEmailGenerator(
        verificationLink,
        siteName,
        borderColor,
        cornerColor
      )
    }

    await sgMail.send(msg)

    successfulRequest(
      response,
      'Successful User Creation',
      'Please Check Your Email For Further Steps',
      user
    )
  } catch (error) {
    console.log(error)
    let message =
      'Unknown Error. Please Try Again. If issue persists contact Webmaster.'
    if (error.keyPattern.email) {
      message = 'Email Already Exists'
    }
    if (error.keyPattern.username) {
      message = 'Username Already Exists'
    }
    failedRequest(response, 'User Creation Failed', message, 'Signup Failed')
  }
})

router.get('/verify-email/:token', async (request, response) => {
  try {
    const token = request.params.token
    const user = await User.findOne({ verificationToken: token })

    if (user) {
      // Update isVerified field
      user.isVerified = true
      user.verificationToken = '' // Clear verification token
      const updatedUser = await User.findByIdAndUpdate(user._id, user, {
        new: true
      })

      successfulRequest(
        response,
        'Email Verification Successful',
        'Your email has been verified. You can now log in.',
        updatedUser
      )
    } else {
      failedRequest(
        response,
        'Email Verification Failed',
        'Invalid or expired verification token.',
        'Invalid Token'
      )
    }
  } catch (error) {
    failedRequest(response, 'Login Failed', 'Unknown', { error })
  }
})
/*
Purpose: Login and user provided cookie
Needed: username | password
*/
router.post('/login', async (request, response) => {
  try {
    request.body.username = request.body.username.toLowerCase()
    const username = request.body.username.toLowerCase().trim()
    const { password } = request.body

    // Searching collection for username
    const userObject = await User.findOne({ username })

    // If user exists checks for password
    if (userObject) {
      if (userObject.isVerified) {
        const passwordCheck = await bcrypt.compare(
          password,
          userObject.password
        )
        if (passwordCheck) {
          const payload = { username }
          const token = await jwt.sign(payload, SECRET)
          response
            .status(200)
            .cookie('token', token, {
              httpOnly: true,
              path: '/',
              sameSite: 'none',
              secure: request.hostname !== 'localhost'
            })
            .json({
              status: 'Logged In',
              message: 'Successfully Logged In',
              data: userObject.username
            })
        } else {
          failedRequest(
            response,
            'Login Failed',
            'Invalid Password/Username',
            'Incorrect P/U'
          )
        }
      } else {
        failedRequest(
          response,
          'Login Failed',
          'Email not verified. Please check your email for verification instructions.',
          'Email Not Verified'
        )
      }
    } else {
      failedRequest(
        response,
        'Login Failed',
        'Invalid Username/Password',
        'Incorrect U/P'
      )
    }
  } catch (error) {
    failedRequest(response, 'Login Failed', 'Unknown', { error })
  }
})
/*
Purpose: Generate random string && Update Token And Time
Needed: email
*/
router.put('/forgotpassword', async (request, response) => {
  try {
    request.body.email = request.body.email.toLowerCase().trim()
    const user = await User.findOne({ email: request.body.email })
    if (user) {
      // Used to generate random string and new time and store it
      const verificationString = crypto.randomBytes(32).toString('hex')
      user.resetToken = verificationString
      user.resetTokenExpiry = new Date()
      try {
        await User.findOneAndUpdate({ email: request.body.email }, user)
        // Beginning of sending autogenerated email
        sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')
        const msg = {
          to: request.body.email,
          from: 'speedycheckin.automated@gmail.com',
          subject: `${siteName} Password Reset`,
          text: 'Password Reset Email',
          html: forgotPasswordEmailGenerator(
            frontendUrl,
            verificationString,
            siteName,
            borderColor,
            cornerColor
          )
        }
        await sgMail.send(msg)
        successfulRequest(
          response,
          'Reset Email Successful',
          'Check Email For Next Steps',
          user
        )
      } catch (error) {
        failedRequest(
          response,
          'Failed Password Reset',
          'Unable To Reset Password',
          { error }
        )
      }
    } else {
      failedRequest(
        response,
        'Failed Password Reset',
        'Unable To Locate Account: Email Not Found',
        'Failed To Reset Password'
      )
    }
  } catch (error) {
    failedRequest(response, 'Failed Password Reset', 'Unable To Locate Email', {
      error
    })
  }
})
/*
Purpose: Verifies string and updates password
Needed: Params.id = resetToken string | username | password
*/
router.put('/forgotpassword/:id', async (request, response) => {
  const username = request.body.username.toLowerCase().trim()
  try {
    const user = await User.findOne({ username })
    // If user exists
    if (user) {
      const timeDifference = Math.abs(
        new Date().getTime() - user.resetTokenExpiry.getTime()
      ) // Difference in milliseconds
      const tenMinutesInMilliseconds = 10 * 60 * 1000 // 10 minutes in milliseconds
      const isMoreThanTenMinutes = timeDifference > tenMinutesInMilliseconds
      if (user.resetToken === request.params.id) {
        if (!isMoreThanTenMinutes) {
          user.resetToken = ''
          request.body.password = await bcrypt.hash(
            request.body.password,
            await bcrypt.genSalt(10)
          )
          user.password = request.body.password
          const newUser = await User.findOneAndUpdate({ username }, user, {
            new: true
          })
          newUser.password = '**********'
          successfulRequest(
            response,
            'Successful Reset',
            'Password Updated Successfully. Proceed To Login Screen.',
            { newUser }
          )
        } else {
          // Clears token after failed verification attempt
          user.resetToken = ''
          await User.findOneAndUpdate({ username }, user)
          failedRequest(
            response,
            'Password Reset Failed',
            'Email Link No Longer Valid. Try Again.',
            'resetToken Expired'
          )
        }
      } else {
        // Clears token after failed verification attempt
        user.resetToken = ''
        await User.findOneAndUpdate({ username }, user)
        failedRequest(
          response,
          'Password Reset Failed',
          'Email Link No Longer Valid. Try Again',
          "resetToken Doesn't Match"
        )
      }
    } else {
      failedRequest(
        response,
        'Password Reset Failed',
        'Unable To Find Username Submitted',
        'Unable To Find User'
      )
    }
  } catch (error) {
    failedRequest(
      response,
      'Failed To Update Password',
      'Unknown Error. Please Try Again. If issue persists contact Webmaster.',
      { error }
    )
  }
})
/*
Purpose: Update Email After Accepting Password On File
Needed: Params.id = user._id | password | new Email
*/
router.put('/emailupdate/:id', userLoggedIn, async (request, response) => {
  try {
    const user = await User.findById(request.params.id)
    if (user) {
      const passwordCheck = await bcrypt.compare(
        request.body.password,
        user.password
      )
      if (passwordCheck) {
        user.email = request.body.email.toLowerCase()
        const newUser = await User.findByIdAndUpdate(request.params.id, user, {
          new: true
        })
        if (newUser) {
          newUser.password = '**********'
          successfulRequest(
            response,
            'Update Successful',
            'Email Update Successful',
            newUser
          )
        } else {
          failedRequest(
            response,
            'Failed To Update Email',
            'User Found, Failed To Update Email',
            'User Located Unable To Update'
          )
        }
      } else {
        failedRequest(
          response,
          'Failed To Update Email',
          'Failed To Update Email: Password Incorrect',
          'Password Error'
        )
      }
    } else {
      failedRequest(
        response,
        'Failed To Update Email',
        'Unable To Locate Email',
        'Email Update Failed: _ID Match'
      )
    }
  } catch (error) {
    failedRequest(
      response,
      'Failed To Update Email',
      'Unable To Update. Try Again. If Issue Persists Contact Webmaster',
      {
        error
      }
    )
  }
})
/*
Purpose: Clears userToken
Needed: N/A
*/
router.post('/logout', async (request, response) => {
  response
    .cookie('token', '', {
      httpOnly: true,
      path: '/',
      expires: new Date(0), // Set the expiration to a past date to delete the cookie
      sameSite: 'none',
      secure: request.hostname !== 'localhost'
    })
    .status(200)
    .json({
      status: 'Successful Logout',
      message: 'Successful Logout',
      data: 'Token Deleted'
    })
})

export default router
