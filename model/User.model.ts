import mongoose,{Document,Model,Schema,Types} from "mongoose";
const bcrypt =require("bcryptjs");
const jwt =require("jsonwebtoken");

const emailRegex:RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UserInterface extends Document {

    _id: Types.ObjectId;
    name: string,
    email: string,
    password: string,

    avatar: {
    public_id: string,
    url: string,
    },

    role: string,
    isVerified: boolean,
    courses: Array<{ courseId: string }>,
    comparePassword: (enteredPassword: string) => Promise<boolean>,
    SignAccessToken():string,   
    SignRefreshToken(): string
    
};

const userSchema : Schema<UserInterface> = new mongoose.Schema({
  
    name: {
    
    type: String,
    required: [true, "Please enter your name!"],
  
    },

    email: {
    
        type: String,
        required: [true, "Please enter your email!"],
        validate: {
        
        validator: function (value: string) {
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

  
    role:{
    
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
 userSchema.pre<UserInterface>("save", async function (next) {
  
    if(!this.isModified("password")){
        return next();
    };

    this.password = await bcrypt.hash(this.password, 10);
    next();
  
 });

// compare password
userSchema.methods.comparePassword = async function (enteredPassword:string): Promise<boolean> {
return await bcrypt.compare(enteredPassword, this.password);
};


// Sign Access Token 
userSchema.methods.SignAccessToken = function(){
return jwt.sign({ id: this._id}, process.env.AccessToken!,{expiresIn:"5m"});
};


// Sign Refresh Token token
userSchema.methods.SignRefreshToken = function(){
return jwt.sign({ id: this._id}, process.env.RefreshToken!,{expiresIn:"3d"});
};



// // jwt token
// userSchema.methods.getJwtToken = function () {
//   return jwt.sign({ id: this._id}, process.env.JWT_SECRET_KEY,{
//     expiresIn: process.env.JWT_EXPIRES,
//   });
// };


const User:Model<UserInterface> = mongoose.model("User", userSchema);
module.exports = User;