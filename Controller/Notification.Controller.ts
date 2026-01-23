require("dotenv").config();
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { INotification } from "../model/Notification.model";
import { UpdateAccessToken } from "../middleware/auth";
const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const { isAdmin, isUserAuthenticated } = require("../middleware/auth");
const redis = require("../utils/redis");
const cloudinary = require("cloudinary");
const Course = require("../model/Courses.model");
const ejs = require("ejs");
const { join } = require("path");
const Order = require("../model/Order.model");

const sendMail = require("../utils/sendMail");
const User = require("../model/User.model");
const Notification = require("../model/Notification.model");
const cron = require("node-cron");


                                // Get All Notifications

router.get("/get-all-notification",UpdateAccessToken,isUserAuthenticated,isAdmin,async (req: Request, res: Response, next: NextFunction) => {
    
  try {
                        
    const AllNotifications = await Notification.find().sort({createdAt:-1});

    if(AllNotifications.length===0){

    return next(new ErrorHandler(`No notification available!`,400));
      
    };    

    res.status(201).json({ message: "All Notifications Fetched Successfully", success: true, AllNotifications });
    
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

                                               // Update Notification Status

    router.put("/update-notification-status/:id",UpdateAccessToken,isUserAuthenticated,isAdmin,async (req: Request, res: Response, next: NextFunction) => {
    
    try {
                        
    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId);

    if(!notification){

    return next(new ErrorHandler(`Notification not found!`,400));
      
    };    
      
      notification.status = "read";
      await notification.save();

    const AllNotifications = await Notification.find().sort({createdAt:-1});


    res.status(201).json({ message: "Notification status update Successfully", success: true, AllNotifications });
    
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);                                          


//30 Days Ago Notifications Delete

cron.schedule("*0 0 0 * * *",async ()=> {
 
 const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

 await Notification.deleteMany({ status: "read", createdAt: { $lt: thirtyDaysAgo } });

 console.log("Delete Notification 30 days ago")

});



module.exports = router;