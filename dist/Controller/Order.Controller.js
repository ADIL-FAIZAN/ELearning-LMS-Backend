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
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// Create Course
router.post("/create-order", auth_1.UpdateAccessToken, isUserAuthenticated, async (req, res, next) => {
    try {
        const { courseId, payment_info } = req.body;
        const user = req.user;
        if (payment_info) {
            if ("id" in payment_info) {
                const paymentIntentId = payment_info.id;
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                if (paymentIntent.status !== "succeeded") {
                    return next(new ErrorHandler("Payment not authorized!", 400));
                }
                ;
            }
            ;
        }
        ;
        const userCoursesList = req.user.courses;
        const UserCourseExist = userCoursesList.some((e) => { if (e.courseId === courseId.toString()) {
            return true;
        }
        else {
            return false;
        } });
        if (UserCourseExist) {
            return next(new ErrorHandler("You already purchased this course!", 400));
        }
        ;
        const course = await Course.findById(courseId);
        if (!course) {
            return next(new ErrorHandler(`There are no Course available of this id:${courseId} inside database!`, 400));
        }
        ;
        const orderData = {
            courseId,
            userId: user?._id,
            paymentinfo: payment_info
        };
        const newOrder = new Order(orderData);
        await newOrder.save();
        // course Sold Out also increase 
        course.purchased += 1;
        await course.save();
        const CachedExist = await redis.get(courseId);
        if (CachedExist) {
            await redis.set(courseId.toString(), JSON.stringify(course), "EX", 604800);
        }
        // EJS Data
        const data = {
            id: newOrder._id.toString().slice(0, 6),
            name: course.name,
            price: course.price,
            date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        };
        //Render EJS file with correct path
        const html = await ejs.renderFile(join(__dirname, "..", "mails", "Order-confirmation.ejs"), data);
        // Send Mail
        try {
            await sendMail({
                email: user.email,
                subject: "Order Confirmation",
                template: "Order-confirmation.ejs",
                data
            });
        }
        catch (err) {
            return next(new ErrorHandler(err.message, 400));
        }
        ;
        const UserDb = await User.findById(req.user._id);
        UserDb.courses = [...UserDb.courses, { courseId: course?._id }];
        //Redis
        await UserDb.save();
        await redis.set(UserDb._id.toString(), JSON.stringify(UserDb));
        const notification = new Notification({
            userId: req.user._id,
            title: "New Order",
            message: `You have a new Order from ${course.name}`
        });
        await notification.save();
        res.status(201).json({ message: "New Order Add Successfully", success: true, newOrder });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
// Get All Orders
router.get("/get-all-orders", auth_1.UpdateAccessToken, isUserAuthenticated, isAdmin, async (req, res, next) => {
    try {
        let AllOrders = await Order.find().sort({ createdAt: -1 });
        if (AllOrders.length === 0) {
            return next(new ErrorHandler("No Order Exist!", 400));
        }
        ;
        res.status(201).json({ message: "All Orders Data Fetched SuccessFully", AllOrders });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
module.exports = router;
//# sourceMappingURL=Order.Controller.js.map