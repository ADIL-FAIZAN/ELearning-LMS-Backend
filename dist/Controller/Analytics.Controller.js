"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const sendMail = require("../utils/sendMail");
const analyticsGenerator_1 = require("../utils/analyticsGenerator");
const auth_1 = require("../middleware/auth");
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
router.get("/get-users-analytics", auth_1.UpdateAccessToken, isUserAuthenticated, isAdmin, async (req, res, next) => {
    try {
        const userAnalytics = await (0, analyticsGenerator_1.generateLast12MonthsData)(User); //      
        res.status(201).json({ message: "User Analytics Found SuccessFully", userAnalytics });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
//Get Courses Analytics
router.get("/get-courses-analytics", auth_1.UpdateAccessToken, isUserAuthenticated, isAdmin, async (req, res, next) => {
    try {
        const CourseAnalytics = await (0, analyticsGenerator_1.generateLast12MonthsData)(Course); //      
        res.status(201).json({ message: "Course Analytics Found SuccessFully", CourseAnalytics });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
//Get Order Analytics
router.get("/get-orders-analytics", auth_1.UpdateAccessToken, isUserAuthenticated, isAdmin, async (req, res, next) => {
    try {
        const OrderAnalytics = await (0, analyticsGenerator_1.generateLast12MonthsData)(Order); //      
        res.status(201).json({ message: "Order Analytics Found SuccessFully", OrderAnalytics });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
module.exports = router;
//# sourceMappingURL=Analytics.Controller.js.map