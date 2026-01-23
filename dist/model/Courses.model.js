"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const reviewreplySchema = new mongoose_1.default.Schema({
    user: Object,
    comment: String
}, { timestamps: true });
const reviewSchema = new mongoose_1.default.Schema({
    user: Object,
    rating: {
        type: Number,
        default: 0
    },
    comment: String,
    commentReplies: [reviewreplySchema]
}, { timestamps: true });
const linkSchema = new mongoose_1.default.Schema({
    title: String,
    url: String
});
const replySchema = new mongoose_1.default.Schema({
    user: Object,
    answer: String
}, { timestamps: true });
const commentSchema = new mongoose_1.default.Schema({
    user: Object,
    question: String,
    questionReplies: [replySchema]
}, { timestamps: true });
const courseDataSchema = new mongoose_1.default.Schema({
    videoUrl: String,
    title: String,
    videoSection: String,
    description: String,
    videoLength: Number,
    videoPlayer: String,
    links: [linkSchema],
    suggestion: String,
    questions: [commentSchema]
});
const courseSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    categories: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    estimatedPrice: {
        type: Number
    },
    thumbnail: {
        public_id: {
            type: String
        },
        url: {
            type: String
        }
    },
    tags: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    demoUrl: {
        type: String,
        required: true
    },
    benefits: [{ title: String }],
    prerequistes: [{ title: String }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: {
        type: Number,
        default: 0
    },
    purchased: {
        type: Number,
        default: 0
    }
}, { timestamps: true });
const Course = mongoose_1.default.model("Course", courseSchema);
module.exports = Course;
//# sourceMappingURL=Courses.model.js.map