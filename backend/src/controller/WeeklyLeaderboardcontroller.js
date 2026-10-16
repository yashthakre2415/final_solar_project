const {getWeeklyLeaderboard} = require('../models/WeeklyLeaderboardmodel');

const GetWeeklyLeaderboard = (req, res) => {
    try {
        getWeeklyLeaderboard((err, result) => {
            if (err) {
                console.log(
                    'Something went wrong',
                    err
                );
                return res.status(500).json({
                    message: 'Something went wrong',
                    success: false
                });
            }
            return res.status(200).json({
                message: 'Weekly leaderboard fetched successfully',
                success: true,
                leaderboard: result
            });
        });
    } catch (err) {
        console.log(
            'Internal server error',
            err
        );
        return res.status(500).json({
            message: 'Internal server error',
            success: false
        });
    }
};


module.exports = {GetWeeklyLeaderboard};