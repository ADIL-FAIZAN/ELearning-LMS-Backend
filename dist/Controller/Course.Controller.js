"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = __importDefault(require("mongoose"));
const sendMail = require("../utils/sendMail");
const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const { isAdmin, isUserAuthenticated, UpdateAccessToken } = require("../middleware/auth");
const redis = require("../utils/redis");
const cloudinary = require("cloudinary");
const Course = require("../model/Courses.model");
const ejs = require("ejs");
const { join } = require("path");
const Notification = require("../model/Notification.model");
const { ICourse } = require("../model/Courses.model");
// Create Course
router.post("/create-course", UpdateAccessToken, isUserAuthenticated, isAdmin, async (req, res, next) => {
    try {
        const CourseData = req.body;
        const courseThumbnail = CourseData.thumbnail;
        console.log("Create Course Request Body:", CourseData);
        if (courseThumbnail) {
            const myCloud = await cloudinary.v2.uploader.upload(courseThumbnail, {
                folder: "Courses",
                width: 150,
            });
            CourseData.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        const newCourse = new Course(CourseData);
        await newCourse.save();
        res
            .status(201)
            .json({ message: "New Course Upload Successfully", success: true });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
// Edit course
router.put("/edit-course/:id", UpdateAccessToken, isUserAuthenticated, isAdmin, async (req, res, next) => {
    try {
        const newCourseData = req.body;
        const courseThumbnail = newCourseData.thumbnail;
        if (courseThumbnail) {
            const myCloud = await cloudinary.v2.uploader.upload(courseThumbnail, {
                folder: "Courses",
                width: 150,
            });
            newCourseData.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        const course = await Course.findByIdAndUpdate(req.params.id, {
            $set: newCourseData,
        }, { new: true });
        // if cache EXIST
        if (redis.get(req.params.id.toString())) {
            await redis.set(req.params.id.toString(), JSON.stringify(course), "EX", 604800);
        }
        ;
        res.status(201).json({
            message: "Course Data Update Successfully",
            success: true,
            updatedCourse: course,
        });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
// get single course - without purchasing
router.get("/get-course/:id", async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const CachedExist = await redis.get(courseId);
        if (CachedExist) {
            res.status(201).json({
                success: true,
                message: "Course Fetched Succesfully",
                course: JSON.parse(CachedExist),
            });
        }
        else {
            const CourseData = await Course.findById(courseId).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
            if (!CourseData) {
                return next(new ErrorHandler("Invalid Course Id", 400));
            }
            ;
            //Redis
            await redis.set(courseId.toString(), JSON.stringify(CourseData), "EX", 604800);
            res.status(201).json({
                success: true,
                message: "Course Fetched Succesfully",
                course: CourseData,
            });
        }
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
// get single course - for Admin
router.get("/get-courseDetail/:id", async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const CourseData = await Course.findById(courseId);
        if (!CourseData) {
            return next(new ErrorHandler("Invalid Course Id", 400));
        }
        res.status(201).json({
            success: true,
            message: "Course Fetched Succesfully",
            course: CourseData,
        });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
// get All Course - without purchasing
router.get("/get-All-Courses-user", async (req, res, next) => {
    try {
        const CachedExist = await redis.get("AllCourses");
        if (CachedExist) {
            res.status(201).json({
                success: true,
                message: "All Courses Fetched Succesfully",
                AllCoursesData: JSON.parse(CachedExist),
            });
        }
        else {
            const AllCourses = await Course.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
            redis.set("AllCourses", JSON.stringify(AllCourses));
            res.status(201).json({
                success: true,
                message: "All Courses Data Fetched Succesfully",
                AllCoursesData: AllCourses,
            });
        }
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
// get Course Content - Only for Valid User
router.get("/get-course-content/:id", UpdateAccessToken, isUserAuthenticated, async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const userCoursesList = req.user.courses;
        const validUserForCourseAccess = userCoursesList.find((e) => {
            if (e.courseId === courseId.toString()) {
                return true;
            }
            else {
                return false;
            }
            ;
        });
        if (!validUserForCourseAccess) {
            return next(new ErrorHandler("Kindly buy this course To access the course content", 400));
        }
        const CourseContent = await Course.findOne({ _id: courseId });
        if (!CourseContent) {
            return next(new ErrorHandler(`There are no Course available of this id:${courseId} inside database!`, 400));
        }
        res.status(201).json({ success: true, message: "Course Content Fetched Succesfully", CourseContent });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
// Add Question
router.put("/add-question", UpdateAccessToken, isUserAuthenticated, async (req, res, next) => {
    try {
        const { question, courseId, contentId } = req.body;
        const course = await Course.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid content id", 400));
        }
        ;
        const courseContent = course?.courseData?.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler("Invalid content id", 400));
        }
        ;
        // create a new question object
        const newQuestion = {
            user: req.user,
            question,
            questionReplies: []
        };
        courseContent.questions.push(newQuestion);
        await course.save();
        const notification = new Notification({
            userId: req.user._id,
            title: "New Question Received",
            message: `You have a new Question in ${courseContent.title}`
        });
        await notification.save();
        res.status(200).json({ success: true, course });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
// Add Answer 
router.put("/add-answer", UpdateAccessToken, isUserAuthenticated, async (req, res, next) => {
    try {
        const { answer, questionId, courseId, contentId } = req.body;
        console.log(answer, questionId, courseId, contentId);
        const course = await Course.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("invalid content id", 400));
        }
        const courseContent = course.courseData.find((item) => item._id.equals(contentId));
        if (!courseContent) {
            return next(new ErrorHandler("invalid content id", 400));
        }
        ;
        const question = courseContent.questions.find((item) => item._id.equals(questionId));
        if (!question) {
            return next(new ErrorHandler("invalid question id", 400));
        }
        ;
        // Create a new answer object
        const newAnswer = {
            user: req.user,
            answer
        };
        question.questionReplies.push(newAnswer);
        await course.save();
        if (req.user._id === question.user._id) {
            const notification = new Notification({
                userId: req.user._id,
                title: "New Question Reply Recived",
                message: `You have a new Question reply in ${courseContent.title}`
            });
            await notification.save();
        }
        else {
            const data = {
                name: question.user.name,
                title: courseContent.title
            };
            //Render EJS file with correct path
            const html = await ejs.renderFile(join(__dirname, "..", "mails", "question-reply.ejs"), data);
            // Send Mail
            await sendMail({
                email: question.user.email,
                subject: "Question Reply",
                template: "question-reply.ejs",
                data
            });
        }
        res.status(201).json({
            success: true,
            course,
            question: question?.question
        });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
// Add Review in the Course
router.put("/add-review/:id", UpdateAccessToken, isUserAuthenticated, async (req, res, next) => {
    try {
        const { review, rating } = req.body;
        const courseId = req.params.id;
        const userCoursesList = req.user.courses;
        const validUserForGiveReview = userCoursesList.some((e) => {
            if (e.courseId === courseId.toString()) {
                return true;
            }
            else {
                return false;
            }
            ;
        });
        if (!validUserForGiveReview) {
            return next(new ErrorHandler("You are not eligible To give the review", 400));
        }
        const course = await Course.findOne({ _id: courseId });
        if (!course) {
            return next(new ErrorHandler(`There are no Course available of this id:${courseId} inside database!`, 400));
        }
        ;
        const newReview = {
            user: req.user,
            comment: review,
            rating
        };
        course.reviews = [...course.reviews, newReview];
        let avg = 0;
        course.reviews.forEach((e) => {
            avg += e.rating;
        });
        course.ratings = avg / course.reviews.length;
        await course.save();
        const CachedExist = await redis.get(courseId);
        if (CachedExist) {
            const CourseData = await Course.findById(courseId).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
            if (!CourseData) {
                return next(new ErrorHandler("Invalid Course Id", 400));
            }
            ;
            //Redis
            await redis.set(courseId.toString(), JSON.stringify(CourseData), "EX", 604800);
        }
        const notification = new Notification({
            userId: req.user._id,
            title: "New Review Recived",
            message: `${req?.user?.name} has given a review in ${course?.name} `
        });
        await notification.save();
        res.status(201).json({ success: true, message: "Review Added Succesfully", newReview });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
// Add Review in the Course
router.put("/admin-review-reply", UpdateAccessToken, isUserAuthenticated, isAdmin, async (req, res, next) => {
    try {
        const { review, reviewId, courseId } = req.body;
        const course = await Course.findOne({ _id: courseId });
        if (!course) {
            return next(new ErrorHandler(`There are no Course available of this id:${courseId} inside database!`, 400));
        }
        const Review = course.reviews.find((review) => review._id.toString() === reviewId);
        if (!Review) {
            return next(new ErrorHandler(`There are no Review available of this id:${reviewId} inside database!`, 400));
        }
        const newReview = {
            user: req.user,
            comment: review,
        };
        Review.commentReplies = [...Review.commentReplies, newReview];
        await course.save();
        const CachedExist = await redis.get(courseId);
        if (CachedExist) {
            const CourseData = await Course.findById(courseId).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
            if (!CourseData) {
                return next(new ErrorHandler("Invalid Course Id", 400));
            }
            ;
            //Redis
            await redis.set(courseId.toString(), JSON.stringify(CourseData), "EX", 604800);
        }
        ;
        res.status(201).json({ success: true, message: "Review Reply Added Succesfully", newReview });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
//Get All Courses
router.get("/get-all-courses", async (req, res, next) => {
    try {
        let AllCourses = await Course.find().sort({ createdAt: -1 });
        if (AllCourses.length === 0) {
            return next(new ErrorHandler("No Course Exist!", 400));
        }
        ;
        res.status(201).json({ message: "All Courses Data Fetched SuccessFully", AllCourses });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
// Delete Course by admin
router.delete("/delete-course/:id", UpdateAccessToken, isUserAuthenticated, isAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log("Params Id:", id);
        const courseExist = await Course.findById(id);
        if (!courseExist) {
            return next(new ErrorHandler("Course Not Exist", 400));
        }
        ;
        let course = await Course.findByIdAndDelete(id);
        await redis.del(course._id);
        res.status(201).json({ message: "Course Deleted Successfully", course });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
router.post("/get-videoCipher-otp", isUserAuthenticated, async (req, res, next) => {
    try {
        const { videoId } = req.body;
        console.log("videoId", videoId);
        const response = await axios_1.default.post(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { ttl: 300 }, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Apisecret ${process.env.VIDEO_CIPHER_API_SECRET}`,
            }
        });
        res.json(response.data);
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
module.exports = router;
//# sourceMappingURL=Course.Controller.js.map