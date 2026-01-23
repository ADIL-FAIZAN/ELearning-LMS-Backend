"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const ErrorMiddleware = require("./middleware/error");
const UserController = require("./Controller/User.Controller");
const CourseController = require("./Controller/Course.Controller");
const AnalyticsController = require("./Controller/Analytics.Controller");
const OrderController = require("./Controller/Order.Controller");
const PaymentController = require("./Controller/Payment.Controller");
const LayoutController = require("./Controller/Layout.Controller");
const notificationController = require("./Controller/Notification.Controller");
const cloudinary = require("cloudinary").v2;
const http = require("http");
const server = http.createServer(app);
const initSocketServer = require("./SocketServer");
const { rateLimit } = require("express-rate-limit");
// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});
app.use(cors({
    origin: "http://localhost:3000", // tumhara frontend URL
    credentials: true, // cookies allow karne ke liye
}));
//Api Request Limit 
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
});
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.get("/test", (req, res, next) => {
    res.send("Hello world!");
});
initSocketServer(server);
// Routes                          
app.use("/api/v2/user", UserController);
app.use("/api/v2/course", CourseController);
app.use("/api/v2/order", OrderController);
app.use("/api/v2/notification", notificationController);
app.use("/api/v2/analytics", AnalyticsController);
app.use("/api/v2/layout", LayoutController);
app.use("/api/v2/payment", PaymentController);
let isConnected = false; // global flag to reuse connection
async function connectDB() {
    if (isConnected)
        return;
    try {
        const db = await mongoose.connect(process.env.DB_URL);
        isConnected = db.connection.readyState === 1;
        console.log("MongoDB Connected Successfully!");
    }
    catch (err) {
        console.error(" MongoDB Connection Error:", err.message);
        process.exit(1); // stop server if DB connection fails
    }
}
;
// Start Server only after MongoDB connection
async function startServer() {
    await connectDB();
    server.listen(process.env.PORT || 8000, () => {
        console.log(`Server running on PORT ${process.env.PORT || 8000}`);
    });
}
;
startServer();
app.use(limiter);
app.use(ErrorMiddleware);
//  app.all("*",(req:Request, res:Response, next:NextFunction) => {
//     const err = new Error(`Route ${req.originalUrl} not found`) as any;
//     err.statusCode = 404;
//     next(err); 
//  });
//# sourceMappingURL=index.js.map