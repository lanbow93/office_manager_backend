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
            company: request.body.company.toLowerCase().trim(),
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

/*
Purpose: Finds all schedules based on department
Needed: :id = department name {ALL LOWERCASE}
*/

router.get('/department/:id', async (request, response) => {
    try{
        const schedules = await Schedule.find({department: request.params.id})
        if (schedules.length === 0) { 
            throw new Error("No schedules found for the department");
        }
        successfulRequest(response, "Success", "Successful Search", schedules )

    }catch(error){
        failedRequest(response, "Failed Search", "Unable To Locate Department", error)
    }
})


/*
Purpose: Finds all schedules based on username
Needed: :id = username {ALL LOWERCASE}
*/
router.get('/user/:id', async (request, response) => {
    try{
        const schedules = await Schedule.find({username: request.params.id})
        if (schedules.length === 0) { 
            throw new Error(`No schedules found for the ${request.params.id}`);
        }
        successfulRequest(response, "Success", "Successful Search", schedules )

    }catch(error){
        failedRequest(response, "Failed Search", "Unable To Locate User", error)
    }
})


export default router