import type { NextFunction, Request, Response } from "express";
import { UpdateAccessToken } from "../middleware/auth";
const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const { isAdmin, isUserAuthenticated } = require("../middleware/auth");
const cloudinary = require("cloudinary");
const LayoutModel = require("../model/LayoutModel");


router.post("/create-layout",UpdateAccessToken,isUserAuthenticated, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  
    try {
    
      const { type,image, title, subTitle  } = req.body;
      console.log({type,image, title, subTitle  })

      const isTypeExist = await LayoutModel.findOne({type});
      
      if (isTypeExist) return next(new ErrorHandler(`${type} Type Already Exist`, 400)); 

      if (type === "Banner"){
        
      const { image, title, subTitle } = req.body;   
          
      const myCloud = await cloudinary.v2.uploader.upload(image, { folder: "layout", width: 150 });   
          
        
      const banner = {
          
      image:{
              
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
          
      },

      title,
      subTitle
        
      };    
        
        const AllBannerData= {
      
        type ,         
        banner

       } 
        
    await LayoutModel.create(AllBannerData);
                
    };
      
    if (type === "FAQ") {
        
    const { faq } = req.body;   
        
        const faqItem = await Promise.all(
            
            faq.map(async (item: any) => {
    
                return {
    
                    question: item.question,
                    answer: item.answer

                }
            }));

    await LayoutModel.create({ type: "FAQ", faq: faqItem });
                
    };
      
  if (type === "Categories") {
        
    const { categories } = req.body;   
      
      const categoriesItem = await Promise.all(
            
            categories.map(async (item: any) => {
    
                return {
    
                title: item.title,

                }
            }));
      

  await LayoutModel.create({ type: "Categories", categories: categoriesItem });
                
  };  
      
  res.status(201).json({success:true,message: "Layout Created Successfully" });  
    
  } catch(err: any){
     
  return next(new ErrorHandler(err.message, 500));
  
  };

});


// Edit


interface updatedObj{


  image?: {
    
    public_id: string,
    url:string
    
  },
  
  title?: string,
  subTitle?:string

}


router.put("/edit-layout",UpdateAccessToken ,isUserAuthenticated, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  
    try {
    
      const { type } = req.body;


      if (type === "Banner"){
        
      const bannerData = await LayoutModel.findOne({ type: "Banner" });

      const { image, title, subTitle } = req.body;   

        
        let updatedObj:updatedObj = {};
        
        if (image === bannerData?.banner?.image?.url) { // Agr image update nahi hui
          

          updatedObj.title = title;
          updatedObj.subTitle = subTitle;
          updatedObj.image = bannerData?.banner?.image;


        } else {
          

        const myCloud = await cloudinary.v2.uploader.upload(image, { folder: "layout", width: 150 }); 

           
         updatedObj.title = title;
         updatedObj.subTitle = subTitle;  
         updatedObj.image = {
              
         public_id: myCloud.public_id,
         url: myCloud.secure_url,
          
      };      
  };
           
          
        await LayoutModel.findByIdAndUpdate(bannerData._id, { $set: { banner: { ...updatedObj } } });
                
    };
      
    if (type === "FAQ") {
        
    const { faq } = req.body;   
        
    const FaqItems = await LayoutModel.findOne({type:"FAQ"});  
      
    const faqItem = await Promise.all(
            
            faq.map(async (item: any) => {
    
                return {
    
                    question: item.question,
                    answer: item.answer

              }
              
            }));

    await LayoutModel.findByIdAndUpdate(FaqItems?._id,{ type: "FAQ", faq: faqItem });
                
    };
      
  if (type === "Categories") {
        
    const { categories } = req.body;   
      
    const categorieData = await LayoutModel.findOne({type:"Categories"});  
    const categoriesItem = await Promise.all(
            
    categories.map(async (item: any) => {
    
    return {
    
    title: item.title,

    };
    
    }));
      

  await LayoutModel.findByIdAndUpdate(categorieData?._id,{ type: "Categories", categories: categoriesItem });
                
  };  
      
  res.status(201).json({success:true,message: "Layout Updated Successfully"});       
      
  } catch(err: any) {
     
  return next(new ErrorHandler(err.message, 500));
  
  };

});


router.get("/get-layout/:type", async (req: Request, res: Response, next: NextFunction) => {
  
  try {
    
    const { type } = req.params;
      
    const layout = await LayoutModel.findOne({type});  
      
    if (!layout) {
  
       return next(new ErrorHandler(`No Any ${type} are present!`, 500));
}

  res.status(201).json({success:true,message: "Layout Fetched Successfully",layout});       
      
  } catch(err: any) {
     
  return next(new ErrorHandler(err.message, 500));
  
  };

});





module.exports = router;