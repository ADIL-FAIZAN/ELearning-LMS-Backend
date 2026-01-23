require("dotenv").config();
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
const sendMail = require("../utils/sendMail");
import { generateLast12MonthsData } from "../utils/analyticsGenerator";
import { UpdateAccessToken } from "../middleware/auth";
const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const { isAdmin, isUserAuthenticated } = require("../middleware/auth");
const redis = require("../utils/redis");
const cloudinary = require("cloudinary");
const Course = require("../model/Courses.model");
const User = require("../model/User.model");
const Order = require("../model/Order.model");

                                              //Get User Analytics

router.get("/get-users-analytics",UpdateAccessToken,isUserAuthenticated,isAdmin,async (req: Request, res: Response, next: NextFunction) => {
  
  try {
  
  const userAnalytics = await generateLast12MonthsData(User);  //      
  res.status(201).json({ message: "User Analytics Found SuccessFully",userAnalytics });  

  } catch(err: any){
     
  return next(new ErrorHandler(err.message, 500));
  
  };

});

                                              //Get Courses Analytics

router.get("/get-courses-analytics",UpdateAccessToken,isUserAuthenticated,isAdmin,async (req: Request, res: Response, next: NextFunction) => {
  
  try {
  
  const CourseAnalytics = await generateLast12MonthsData(Course);  //      
  res.status(201).json({ message: "Course Analytics Found SuccessFully",CourseAnalytics });  

  } catch(err: any){
     
  return next(new ErrorHandler(err.message, 500));
  
  };

    
});

                                              //Get Order Analytics

router.get("/get-orders-analytics",UpdateAccessToken,isUserAuthenticated,isAdmin,async (req: Request, res: Response, next: NextFunction) => {
  
  try {
  
  const OrderAnalytics = await generateLast12MonthsData(Order);  //      
  res.status(201).json({ message: "Order Analytics Found SuccessFully",OrderAnalytics });  

  } catch(err: any){
     
  return next(new ErrorHandler(err.message, 500));
  
  };

});





module.exports = router; 

