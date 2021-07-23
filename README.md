# IpRateLimiterEg

clone the project run -> npm install create .env file inside IpRateLimiterEg folder and paste below lines

HOST=localhost PORT=4000 REDIS_PASS=yourpassword

ofcourse, you need to change the redis password. You may keep the host and post as it is.

once done, start server as ---> node server

open your favourite browser and open this link --> http://localhost:4000/ipTest

The above link will change if you change the host and port.

Refresh the page more than 5 times in a minute. You will get success as status if request count is less than or equal to 5, if exceeded, you will get status failed.

You may change the request count limit in server.js page

After 60 seconds, you will be able to get success status till request count limit is over.
