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

app.get("/ipTest", (req, res) => {
    if (req.method === "GET") {
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
            } else {
                let response = await obj;
                console.log("response ==>", response);
                if (response == null) {
                    cache.hmset(clientIp, clientValue, redis.print);
                    cache.expire(clientIp, 60);
                    res.json({
                        status: "success",
                        msg: "Welcome user"
                    })
                } else {
                    let getLsm = Date.now() - parseInt(response.lsm)
                    if (getLsm < 60001 && parseInt(response.count) < requestCount) { 
                        let mClientValue = {
                            count: parseInt(response.count) + 1,
                            lsm: response.lsm
                        }
                        cache.hmset(clientIp, mClientValue, redis.print);
                        res.json({
                            status: "success",
                            msg: "Welcome user"
                        })
                    } else {
                        res.json({
                            status: "failed",
                            msg: "Are you a hacker ????"
                        })
                    }
                }
            }
        });

    } else {
        console.error("POST METHOD CALLED...")
    }
});


(async function () {
    redisClient.AUTH('', async function (err, result) {
        if (err) throw err;
        console.log("Redis Connection", result);
    });
    app.locals.redisdb = await redisClient;

    app.listen(4000, 'localhost', function () {
        console.log(
            "Node app is listening at http://%s:%s",
            'localhost',
            4000
        );
    });
})();



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