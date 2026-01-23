import mongoose, { Document, Model, Schema, Types } from "mongoose";


interface Order extends Document{

    courseId: string,
    userId: string,
    paymentinfo:object

}


const orderSchema: Schema<Order> = new mongoose.Schema({
    
    courseId: {
      
    type: String,
    required: true
    
    },

    userId: {
    
    type: String,
    required: true
    
    },

    paymentinfo: {
    
    type: Object
       
    }
   
},{timestamps:true});


const Order:Model<Order> = mongoose.model("Order", orderSchema);
module.exports = Order;