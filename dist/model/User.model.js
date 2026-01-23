"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
;
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name!"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email!"],
        validate: {
            validator: function (value) {
                return emailRegex.test(value);
            },
            message: "Please enter a valid email",
        },
        unique: true,
    },
    password: {
        type: String,
        minLength: [6, "Password should be greater than 6 characters"],
        select: false,
    },
    avatar: {
        public_id: String,
        url: String
    },
    role: {
        type: String,
        default: "user",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    courses: [
        {
            courseId: { type: String }
        },
    ],
}, { timestamps: true });
//Password Hashed Logic
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    ;
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
// compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
// Sign Access Token 
userSchema.methods.SignAccessToken = function () {
    return jwt.sign({ id: this._id }, process.env.AccessToken, { expiresIn: "5m" });
};
// Sign Refresh Token token
userSchema.methods.SignRefreshToken = function () {
    return jwt.sign({ id: this._id }, process.env.RefreshToken, { expiresIn: "3d" });
};
// // jwt token
// userSchema.methods.getJwtToken = function () {
//   return jwt.sign({ id: this._id}, process.env.JWT_SECRET_KEY,{
//     expiresIn: process.env.JWT_EXPIRES,
//   });
// };
const User = mongoose_1.default.model("User", userSchema);
module.exports = User;
//# sourceMappingURL=User.model.js.map