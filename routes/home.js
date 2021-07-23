const express = require('express');
const router = express.Router();
const controller = require('../app/api/controllers/homeController');

router.get('/ipTest',controller.ipTest);
module.exports = router;