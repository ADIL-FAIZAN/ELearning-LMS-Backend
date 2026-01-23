import type { UserInterface } from "../model/User.model";
import type { NextFunction, Request, Response } from "express";
const redis = require("../utils/redis");

export const sendToken = (User:UserInterface, statusCode:number, res:Response) => {
    
 const AccessToken = User.SignAccessToken();
 const RefreshToken = User.SignRefreshToken();
  
                                //Redis
 redis.set(User._id.toString(),JSON.stringify(User) as any);

 const AccessTokenExpire = parseInt(process.env.Access_Token_Expire! || '300',10);
 const RefreshTokenExpire = parseInt(process.env.Refresh_Token_Expire! || '1200',10);
    
 interface CookiesOptionsInterface {
        
        expires:Date,
        maxAge: number,
        httpOnly: boolean,
        sameSite: "lax" | "strict" | "none" | undefined,
        secure?: boolean
        
 };   
        
 const AccessTokenOptions: CookiesOptionsInterface = {
        
        expires: new Date(Date.now() + AccessTokenExpire * 60 * 1000),
        maxAge:  AccessTokenExpire * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",

 };
    
   const RefreshTokenOptions:CookiesOptionsInterface = {
        
        expires: new Date(Date.now() + RefreshTokenExpire * 24 * 60 * 60 * 1000),
        maxAge: RefreshTokenExpire * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
 
    };
   
    res.cookie("access_token", AccessToken, AccessTokenOptions);
    res.cookie("refresh_token", RefreshToken, RefreshTokenOptions);
    res.status(statusCode).json({ success: true, User, AccessToken });

};