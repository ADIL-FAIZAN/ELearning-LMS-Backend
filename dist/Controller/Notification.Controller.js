"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const auth_1 = require("../middleware/auth");
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
router.get("/get-all-notification", auth_1.UpdateAccessToken, isUserAuthenticated, isAdmin, async (req, res, next) => {
    try {
        const AllNotifications = await Notification.find().sort({ createdAt: -1 });
        if (AllNotifications.length === 0) {
            return next(new ErrorHandler(`No notification available!`, 400));
        }
        ;
        res.status(201).json({ message: "All Notifications Fetched Successfully", success: true, AllNotifications });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
// Update Notification Status
router.put("/update-notification-status/:id", auth_1.UpdateAccessToken, isUserAuthenticated, isAdmin, async (req, res, next) => {
    try {
        const notificationId = req.params.id;
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return next(new ErrorHandler(`Notification not found!`, 400));
        }
        ;
        notification.status = "read";
        await notification.save();
        const AllNotifications = await Notification.find().sort({ createdAt: -1 });
        res.status(201).json({ message: "Notification status update Successfully", success: true, AllNotifications });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
//30 Days Ago Notifications Delete
cron.schedule("*0 0 0 * * *", async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await Notification.deleteMany({ status: "read", createdAt: { $lt: thirtyDaysAgo } });
    console.log("Delete Notification 30 days ago");
});
module.exports = router;
//# sourceMappingURL=Notification.Controller.js.map