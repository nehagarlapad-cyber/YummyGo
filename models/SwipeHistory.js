const mongoose = require('mongoose');

const swipeHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true,
    },
    action: {
        type: String,
        enum: ['liked', 'disliked', 'skipped'],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for faster queries
swipeHistorySchema.index({ user: 1, menuItem: 1 });

module.exports = mongoose.model('SwipeHistory', swipeHistorySchema);
