import mongoose, { Document, Model, Schema, Types } from "mongoose";

interface IComment extends Document{

    user: object,
    question:string,
    questionReplies?:IComment[]

}

interface IReview extends Document{

    user: object,
    rating:number,
    comment:string,
    commentReplies:IComment[]

}

interface ILink extends Document {

    title: string,
    url: string,

}

interface ICourseData extends Document{

    title: string,
    description: string,
    videoUrl: string,
    videoThumbnail:object
    videoSection: string,
    videoLength: number,
    videoPlayer: string,
    links: ILink[],
    suggestion: string,
    questions: IComment[]

}

export interface ICourse extends Document{

    name: string,
    description: string,
    categories:string
    price: number,
    estimatedPrice?:number
    thumbnail: object,
    tags: string,
    level: string,
    demoUrl: string,
    benefits: { title: string }[],
    prerequistes: { title: string }[],
    reviews: IReview[],
    courseData: ICourseData[],
    ratings?: number,
    purchased?:number

}


const reviewreplySchema = new mongoose.Schema({
  user: Object,
  comment: String
}, { timestamps: true });


const reviewSchema: Schema<IReview> = new mongoose.Schema({

    user: Object,
    
    rating: {
        type: Number,
        default:0
    },
    comment:String,
    commentReplies:[reviewreplySchema] 

},{timestamps:true});

const linkSchema: Schema<ILink> = new mongoose.Schema({

    title:String,
    url:String

});

const replySchema = new mongoose.Schema({
  user: Object,
  answer: String
}, { timestamps: true });

const commentSchema: Schema<IComment> = new mongoose.Schema({
    user: Object,
    question: String,
    questionReplies:[replySchema]

},{timestamps:true});

const courseDataSchema: Schema<ICourseData> = new mongoose.Schema({

    videoUrl: String,
    title: String,
    videoSection: String,
    description: String,
    videoLength: Number,
    videoPlayer: String,
    links:[linkSchema],
    suggestion: String,
    questions:[commentSchema]

});


const courseSchema: Schema<ICourse> = new mongoose.Schema({
    
    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    categories:{

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

            type:String
        },
        url: {

            type:String

        }
},

    tags:{
        type: String,
        required:true
    },

    level: {
     
        type: String,
        required:true

},

    demoUrl: {
     
        type: String,
        required:true

    },
    
   benefits:[{title:String}],
   prerequistes: [{ title: String }],
   reviews: [reviewSchema],
   courseData: [courseDataSchema],
    ratings: {
        type: Number,
        default:0
    },
    purchased: {
        type: Number,
        default:0

    }


},{timestamps:true});


const Course:Model<ICourse> = mongoose.model("Course", courseSchema);
module.exports = Course;