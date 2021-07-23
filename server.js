require("dotenv").config();
const express = require('express')
const app = express()
const redis = require("redis")
const redisClient = redis.createClient(6379, '127.0.0.1')
const requestIp = require('request-ip');
app.use(express.json());
app.use(
    express.urlencoded({
        extended: false,
    })
);
const requestCount = 5  // Change the number of request user/minute 

//ROUTER
const homeRouter = require('./routes/home')

//ROUTE CONFIGURATION WITH MIDDLEWARE
app.use("/", requestTracker, homeRouter);  // Middleware is created below at the bottom of the page

(async function () {
    redisClient.AUTH(process.env.REDIS_PASS, async function (err, result) {
        if (err) throw err;
        console.log("Redis Connection", result);
    });
    app.locals.redisdb = await redisClient;

    app.listen(process.env.PORT, process.env.HOST, function () {
        console.log(
            "Node app is listening at http://%s:%s",
            process.env.HOST,
            process.env.PORT
        );
    });
})();


//MIDDLEWARE TO CHECK USER REQUEST LIMIT


function requestTracker(req, res, next) {
    const clientIp = requestIp.getClientIp(req);
    console.log("clientIp ::::>>>>> ", clientIp)
    let clientValue = {
        count: 1,
        lsm: Date.now()
    }
    let cache = req.app.locals.redisdb
    cache.hgetall(clientIp, async function (err, obj) {
        if (err) {
            console.error(err);
            res.json({
                status: "failed",
                msg: "Something went wrong..."
            })
        } else {
            let response = await obj;
            console.log("response ==>", response);
            if (response == null) {
                cache.hmset(clientIp, clientValue, redis.print);
                cache.expire(clientIp, 60);
                next()
            } else {
                let getLsm = Date.now() - parseInt(response.lsm)
                if (getLsm < 60001 && parseInt(response.count) < requestCount) {
                    let mClientValue = {
                        count: parseInt(response.count) + 1,
                        lsm: response.lsm
                    }
                    cache.hmset(clientIp, mClientValue, redis.print);
                    next()
                } else {
                    res.json({
                        status: "failed",
                        msg: "Are you a hacker ????"
                    })
                }
            }
        }
    });
}


/*
 LOGIC
 -------

 First I get the user Ip and search it on redis. If ip does not exist then Ip as key and
 value(count = 1 , lsm = Date.now()) is inserted i.e. default count as 1 and default lms as current time
 when the entry is made.

 If ip exists in redis, then lsm is compared with current time and also count is compared with no. of request
 allowed per minute, if the count is less than requestCount (permissible request per minute) then request is
 forwarded (next()) to concern api or else it is dropped with a message to client.

*/