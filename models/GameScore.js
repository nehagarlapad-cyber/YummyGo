const mongoose = require('mongoose');

const gameScoreSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    gameType: {
        type: String,
        enum: ['food-match', 'trivia', 'spinner'],
        required: true,
    },
    score: {
        type: Number,
        required: true,
    },
    pointsEarned: {
        type: Number,
        required: true,
    },
    level: {
        type: Number,
        default: 1,
    },
    achievements: [{
        name: String,
        unlockedAt: Date,
    }],
    playedAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for leaderboard
gameScoreSchema.index({ gameType: 1, score: -1 });
gameScoreSchema.index({ user: 1, playedAt: -1 });

module.exports = mongoose.model('GameScore', gameScoreSchema);
