import { Redis } from "ioredis";



const redisClient = (): string => {
    

    if(process.env.Redis_Url) {
        
    console.log("Redis Connected");
    
    return process.env.Redis_Url;
        
    };

    throw new Error("Redis connected Failed");

};

const redis = new Redis(redisClient(), {
  tls: {},                        // Required for Upstash
  maxRetriesPerRequest: null,      // Disable max retries error
  retryStrategy: (times) => Math.min(times * 50, 2000), // Retry delay (ms)
});

redis.on("connect", () => console.log("Redis connected successfully"));
redis.on("error", (err) => console.error("Redis error:", err));

module.exports =  redis;