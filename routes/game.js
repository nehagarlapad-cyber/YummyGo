const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const GameScore = require('../models/GameScore');
const User = require('../models/User');

// @route   GET /api/game/start
// @desc    Start new game session
// @access  Private (Customer)
router.get('/start', protect, authorize('customer'), async (req, res) => {
    try {
        const { gameType } = req.query;

        // Return game configuration
        const config = {
            gameType: gameType || 'food-match',
            duration: 60, // seconds
            pointsMultiplier: 1,
            maxPoints: 1000
        };

        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/game/score
// @desc    Submit score and award points
// @access  Private (Customer)
router.post('/score', protect, authorize('customer'), async (req, res) => {
    try {
        const { gameType, score } = req.body;

        // Calculate points earned (1 point per 10 score)
        const pointsEarned = Math.floor(score / 10);

        // Save game score
        const gameScore = await GameScore.create({
            user: req.user._id,
            gameType,
            score,
            pointsEarned
        });

        // Update user points
        req.user.points += pointsEarned;
        await req.user.save();

        res.json({
            success: true,
            data: {
                score,
                pointsEarned,
                totalPoints: req.user.points
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/game/leaderboard
// @desc    Get top players
// @access  Private (Customer)
router.get('/leaderboard', protect, authorize('customer'), async (req, res) => {
    try {
        const { gameType } = req.query;

        const leaderboard = await GameScore.aggregate([
            { $match: gameType ? { gameType } : {} },
            {
                $group: {
                    _id: '$user',
                    highestScore: { $max: '$score' },
                    totalPoints: { $sum: '$pointsEarned' }
                }
            },
            { $sort: { highestScore: -1 } },
            { $limit: 10 }
        ]);

        // Populate user details
        await User.populate(leaderboard, { path: '_id', select: 'name' });

        const formattedLeaderboard = leaderboard.map((entry, index) => ({
            rank: index + 1,
            user: entry._id?.name || 'Anonymous',
            score: entry.highestScore,
            points: entry.totalPoints
        }));

        res.json({ success: true, data: formattedLeaderboard });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
