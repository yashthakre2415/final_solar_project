const express = require('express');
const {GetWeeklyLeaderboard} = require('../controller/WeeklyLeaderboardcontroller');
const authMiddleware = require('../middleware/authMiddleware');
const boardouter = express.Router();

boardouter.get('/weekly-leaderboard',authMiddleware,GetWeeklyLeaderboard);


module.exports = boardouter;