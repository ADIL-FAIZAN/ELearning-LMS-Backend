"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const auth_1 = require("../middleware/auth");
const express = require("express");
const User = require("../model/User.model");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const jwt = require("jsonwebtoken");
const ejs = require("ejs");
const { join } = require("path");
const sendMail = require("../utils/sendMail");
const { fileURLToPath } = require("url");
const { sendToken } = require("../jwt/Authentication");
const { isUserAuthenticated, UpdateAccessToken } = require("../middleware/auth");
const redis = require("../utils/redis");
const cloudinary = require("cloudinary");
// POST /create-user
router.post("/create-user", async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return next(new ErrorHandler("Please Fill All the Fields!", 400));
        }
        const emailExist = await User.findOne({ email });
        if (emailExist) {
            return next(new ErrorHandler("User Already Exists!", 400));
        }
        const newUser = { name, email, password };
        // Create Activation Token
        const ActivationToken = createActivationToken(newUser);
        const ActivationCode = ActivationToken.ActivationCode;
        // EJS Data
        const data = { name: newUser.name, activationCode: ActivationCode };
        //Render EJS file with correct path
        const html = await ejs.renderFile(join(__dirname, "..", "mails", "activation-mail.ejs"), data);
        // Send Mail
        await sendMail({
            email: newUser.email,
            subject: "Activate your account",
            template: "activation-mail.ejs",
            data
        });
        res.status(201).json({
            success: true,
            message: `Please check your email: ${newUser.email} to activate your account!`,
            token: ActivationToken
        });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
// Create Activation Token
const createActivationToken = (user) => {
    const ActivationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jwt.sign({ user, ActivationCode }, process.env.ACTIVATION_SECRET, { expiresIn: "5m" });
    return { token, ActivationCode };
};
router.post("/activation", async (req, res, next) => {
    try {
        const { activation_Token, ActivationCode } = req.body;
        console.log("activation_Token", activation_Token);
        console.log("ActivationCode", ActivationCode);
        const user = jwt.verify(activation_Token.token, process.env.ACTIVATION_SECRET);
        if (!user) {
            return next(new ErrorHandler("Invalid token", 400));
        }
        ;
        if (user.ActivationCode !== ActivationCode.toString()) {
            return next(new ErrorHandler("Kindly Enter Correct Activation Code!", 400));
        }
        ;
        const newUser = new User({
            name: user.user.name,
            email: user.user.email,
            password: user.user.password,
        });
        await newUser.save();
        res.status(200).json({ message: "Your Account Created Successfully", success: true });
        // sendToken(newUser, 201, res);
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
router.post("/login-user", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (email == "" || password == "") {
            return next(new ErrorHandler("Please Provide All Fields!", 400));
        }
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler("User does not Exist!", 400));
        }
        const passwordValid = await user.comparePassword(password);
        if (!passwordValid) {
            return next(new ErrorHandler("Incorrect Password", 400));
        }
        await sendToken(user, 201, res);
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
//Log out User
router.get("/logout", isUserAuthenticated, async (req, res, next) => {
    try {
        await redis.del(req.user?._id);
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        res.status(201).json({ success: true, message: "LogOut Successfull!" });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
//Update Access Token
router.get("/refresh-user-token", async (req, res, next) => {
    try {
        const { refresh_token } = req.cookies;
        const decoded = jwt.verify(refresh_token, process.env.RefreshToken);
        if (!decoded) {
            return next(new ErrorHandler("Could not refresh token", 400));
        }
        ;
        const session = await redis.get(decoded.id);
        if (!session) {
            return next(new ErrorHandler("Please Login for access this resource!", 400));
        }
        ;
        const user = JSON.parse(session);
        const AccessToken = jwt.sign({ id: user._id }, process.env.AccessToken, { expiresIn: "5m" });
        const RefreshToken = jwt.sign({ id: user._id }, process.env.RefreshToken, { expiresIn: "3d" });
        const AccessTokenExpire = parseInt(process.env.Access_Token_Expire || '300', 10);
        const RefreshTokenExpire = parseInt(process.env.Refresh_Token_Expire || '1200', 10);
        ;
        const AccessTokenOptions = {
            expires: new Date(Date.now() + AccessTokenExpire * 60 * 1000),
            maxAge: AccessTokenExpire * 60 * 1000,
            httpOnly: true,
            sameSite: "lax",
        };
        const RefreshTokenOptions = {
            expires: new Date(Date.now() + RefreshTokenExpire * 24 * 60 * 60 * 1000),
            maxAge: RefreshTokenExpire * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "lax",
        };
        res.cookie("access_token", AccessToken, AccessTokenOptions);
        res.cookie("refresh_token", RefreshToken, RefreshTokenOptions);
        await redis.set(user._id, JSON.stringify(user), "EX", 604800);
        next();
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
//Get User By Id
router.get("/get-login-user-info", UpdateAccessToken, isUserAuthenticated, async (req, res, next) => {
    try {
        const userId = req.user._id.toString();
        let user = await redis.get(userId);
        if (!user) {
            return next(new ErrorHandler("User Not Exist!", 400));
        }
        ;
        user = JSON.parse(user);
        res.status(201).json({ message: "Login User Found SuccessFully", User: user, token: req.cookies.access_token });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
router.post("/social-Auth", async (req, res, next) => {
    try {
        const { name, email, image } = req.body;
        let user = await User.findOne({ email });
        if (!user) {
            const avatar = {
                url: image
            };
            user = new User({
                name,
                email,
                avatar
            });
            user = await user.save();
        }
        ;
        await sendToken(user, 200, res);
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
router.put("/update-user-info", isUserAuthenticated, async (req, res, next) => {
    try {
        const { name } = req.body;
        console.log("name:", name);
        let user = await User.findById(req.user._id);
        if (!user) {
            return next(new ErrorHandler("User Not Exist", 400));
        }
        ;
        if (name) {
            user.name = name;
        }
        ;
        const updatedUser = await user.save();
        await redis.set(updatedUser._id, JSON.stringify(updatedUser));
        res.status(201).json({ message: "User Updated Successfully", User: updatedUser });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
router.put("/update-user-password", isUserAuthenticated, async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        let user = await User.findById(req.user._id).select("+password");
        if (!user) {
            return next(new ErrorHandler("User Not Exist!", 400));
        }
        ;
        if (!oldPassword || !newPassword)
            return next(new ErrorHandler("Please enter old and new password!", 400));
        console.log("User", user);
        if (user.password === undefined)
            return next(new ErrorHandler("Invalid User!", 400));
        const PasswordValid = await user.comparePassword(oldPassword);
        if (!PasswordValid)
            return next(new ErrorHandler("Old Password Are Not Correct!", 400));
        user.password = newPassword;
        const updatedUser = await user.save();
        redis.set(updatedUser._id, JSON.stringify(updatedUser));
        res.status(201).json({ message: "User Password Updated Successfully", user: updatedUser });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
// Update User Avatar
router.put("/update-user-avatar", isUserAuthenticated, async (req, res, next) => {
    try {
        const { avatar } = req.body;
        console.log("Avatar", avatar);
        let user = await User.findById(req.user._id).select("+password");
        if (!user) {
            return next(new ErrorHandler("User Not Exist!", 400));
        }
        ;
        if (avatar) {
            if (user?.avatar?.public_id) { //if user profile avatar already exist
                //first delete the  avaratr
                await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
                //upload on cloudinary
                const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                };
            }
            else {
                const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                };
            }
            await user.save();
            await redis.set(user._id, JSON.stringify(user));
        }
        ;
        res.status(201).json({ message: "User Avatar Updated Successfully", user });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
//Get All Users
router.get("/get-all-users", UpdateAccessToken, isUserAuthenticated, auth_1.isAdmin, async (req, res, next) => {
    try {
        let AllUsers = await User.find().sort({ createdAt: -1 });
        if (AllUsers.length === 0) {
            return next(new ErrorHandler("User Not Exist!", 400));
        }
        ;
        res.status(201).json({ message: "All Users Fetched SuccessFully", AllUsers });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
// Update User Role by admin
router.put("/update-user-role", UpdateAccessToken, isUserAuthenticated, auth_1.isAdmin, async (req, res, next) => {
    try {
        const { email, role } = req.body;
        const isUser = await User.findOne({ email });
        if (!isUser) {
            return next(new ErrorHandler("Email Not Exist!", 400));
        }
        ;
        let user = await User.findByIdAndUpdate(isUser?._id, { role }, { new: true });
        if (!user) {
            return next(new ErrorHandler("User Not Exist", 400));
        }
        ;
        const updatedUser = await user.save();
        res.status(201).json({ message: "User Updated Successfully", User: updatedUser });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
// Delete User by admin
router.delete("/delete-user/:id", isUserAuthenticated, auth_1.isAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userExist = await User.findById(id);
        if (!userExist) {
            return next(new ErrorHandler("User Not Exist", 400));
        }
        ;
        let user = await User.findByIdAndDelete(id);
        res.status(201).json({ message: "User Deleted Successfully", user });
    }
    catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
    ;
});
module.exports = router;
//# sourceMappingURL=User.Controller.js.map