import mongoose, { Document, Model, Schema, Types } from "mongoose";

interface FaqItem extends Document{

  question: string,
  answer: string

}

interface Category extends Document{

    title: string  

}

interface BannerImage extends Document{

  public_id: string,
  url: string

}

export interface Layout extends Document{

    type: string,
    faq: FaqItem[],
    categories: Category[],

    banner: {
        image: BannerImage,
        title: string,
        subTitle: string
    
    },
}

const faqSchema: Schema<FaqItem> = new mongoose.Schema({

    question: {
    
        type: String

    },

    answer: {
    
        type: String

    }
    
});


const categorySchema: Schema<Category> = new mongoose.Schema({

     title:{
        type: String
    }
    
});


const BannerImageSchema = new mongoose.Schema({

    public_id: {
        type: String
    },
    
    url: {
      
        type: String
    
    }

});

const layoutSchema = new mongoose.Schema({
 
    type: {
        
        type: String
    
    },
    
    faq: [faqSchema],
    categories: [categorySchema],

    banner: {

        image:BannerImageSchema,
        title: {type: String},
        subTitle:{type: String}
  },

});

const LayoutModel = mongoose.model("LayoutModel", layoutSchema);

module.exports = LayoutModel;