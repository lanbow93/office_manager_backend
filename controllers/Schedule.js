import express from 'express'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { successfulRequest, failedRequest } from '../utils/SharedFunctions.js'
import { userLoggedIn } from '../utils/UserVerified.js'
import Schedule from '../models/schedule.js'

const router = express.Router()

/*
Purpose: Creates a new schedule
Needed: eventName | firstName | lastName | password | email |
*/
router.post('/', async (request, response) => {
    try{
        const newSchedule = {
            eventName: request.body.eventName.toLowerCase().trim(),
            department: request.body.department.toLowerCase().trim(),
            hoursNeeded: request.body.hoursNeeded,
            username: request.body.username.toLowerCase().trim(),
            shifts: request.body.shifts
        }
        const schedule = await Schedule.create(newSchedule)
        successfulRequest(response, "Successful Post", "New Schedule Successfully Submitted", schedule)
    }catch(error){
        failedRequest(response, "Failed Operation", "Failed Schedule Post", error)
    }
})

export default router