import type { NextFunction, Request, Response } from "express";
import { UserInterface } from "../model/User.model";
const ErrorHandler = require("../utils/ErrorHandler");
const jwt =require("jsonwebtoken");
const { UserInterface } = require("../model/User.model");
const redis = require("../utils/redis");


export async function isUserAuthenticated(req:Request,res:Response,next:NextFunction){

    try {

    const { access_token } = req.cookies;
        
    if(!access_token){
      
    return next(new ErrorHandler("Please Login To Continue!",400));   
    
    };

    const decoded = jwt.verify(access_token,process.env.AccessToken!) as { id: string };

    if(!decoded){
        
    return next(new ErrorHandler("Invalid Token!",400));  

    };
    
    const User = await redis.get(decoded.id);

    if(!User){
 
    return next(new ErrorHandler("User not found in session!", 401));
 
    };
        

    (req as any).user = JSON.parse(User) as UserInterface;     
        
    next();    
                
    }catch(err: any){
 
    return next(new ErrorHandler(err?.message  || "Authentication failed" ,400));      
  
    }

};

export async function isAdmin(req:Request,res:Response,next:NextFunction){

    try {

    const { access_token } = req.cookies;

    if(!access_token){
      
    return next(new ErrorHandler("Please Login To Continue!",400));   
    
    };

    const decoded = jwt.verify(access_token,process.env.AccessToken!) as { id: string };

    if(!decoded){
        
    return next(new ErrorHandler("Invalid Token!",400));  

    };
    
    let User = await redis.get(decoded.id);

    User = JSON.parse(User) as UserInterface;   
        
    if(!User){
 
    return next(new ErrorHandler("User not found in session!", 401));
 
    };
        
        
        if (User.role !== "admin") {
 
        return next(new ErrorHandler("Only admin have authority to access this route!", 400));

        };
        
        
    next();    
                
    }catch(err: any){
 
    return next(new ErrorHandler(err?.message  || "Authentication failed" ,400));      
  
    }

};

export async function UpdateAccessToken(req: Request, res: Response, next: NextFunction) {
  
 try {
  
  const {refresh_token} = req.cookies;
   
  const decoded = jwt.verify(refresh_token,process.env.RefreshToken!);  
    
  if (!decoded) {
    
  return next(new ErrorHandler("Could not refresh token", 400));  
  
  };
    
  const session = await redis.get(decoded.id);
  
  if (!session){
  
  return next(new ErrorHandler("Please Login for access this resource!", 400));
  
  };  
    
  const user = JSON.parse(session);
    
  const AccessToken = jwt.sign({ id: user._id}, process.env.AccessToken!,{expiresIn:"5m"});  
  const RefreshToken = jwt.sign({ id: user._id}, process.env.RefreshToken!,{expiresIn:"3d"}); 
  const AccessTokenExpire  = parseInt(process.env.Access_Token_Expire! || '300',10);
  const RefreshTokenExpire = parseInt(process.env.Refresh_Token_Expire! || '1200',10); 
      
   interface CookiesOptionsInterface{
        
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
        sameSite: "none",
        secure:true

    };
    
   const RefreshTokenOptions:CookiesOptionsInterface = {
        
        expires: new Date(Date.now() + RefreshTokenExpire * 24 * 60 * 60 * 1000),
        maxAge: RefreshTokenExpire * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "none",
        secure:true
 
    };
    
  res.cookie("access_token", AccessToken, AccessTokenOptions);
  res.cookie("refresh_token", RefreshToken, RefreshTokenOptions);
    
  await redis.set(user._id,JSON.stringify(user),"EX",604800);

    next();
    
  }catch(err: any){
     
  return next(new ErrorHandler(err.message, 500));
  
  };

}