"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = void 0;
const redis = require("../utils/redis");
const sendToken = (User, statusCode, res) => {
    const AccessToken = User.SignAccessToken();
    const RefreshToken = User.SignRefreshToken();
    //Redis
    redis.set(User._id.toString(), JSON.stringify(User));
    const AccessTokenExpire = parseInt(process.env.Access_Token_Expire || '300', 10);
    const RefreshTokenExpire = parseInt(process.env.Refresh_Token_Expire || '1200', 10);
    ;
    const AccessTokenOptions = {
        expires: new Date(Date.now() + AccessTokenExpire * 60 * 1000),
        maxAge: AccessTokenExpire * 60 * 1000,
        httpOnly: true,
        sameSite: "none",
        secure: true
    };
    const RefreshTokenOptions = {
        expires: new Date(Date.now() + RefreshTokenExpire * 24 * 60 * 60 * 1000),
        maxAge: RefreshTokenExpire * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "none",
        secure: true
    };
    res.cookie("access_token", AccessToken, AccessTokenOptions);
    res.cookie("refresh_token", RefreshToken, RefreshTokenOptions);
    res.status(statusCode).json({ success: true, User, AccessToken });
};
exports.sendToken = sendToken;
//# sourceMappingURL=Authentication.js.map