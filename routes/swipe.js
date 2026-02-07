const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const MenuItem = require('../models/MenuItem');
const SwipeHistory = require('../models/SwipeHistory');

// @route   GET /api/swipe/items
// @desc    Get food items for swiping (personalized)
// @access  Private (Customer)
router.get('/items', protect, authorize('customer'), async (req, res) => {
    try {
        // Get items user has already swiped
        const swipedItems = await SwipeHistory.find({ user: req.user._id }).select('menuItem');
        const swipedIds = swipedItems.map(item => item.menuItem);

        // Get liked items for personalization
        const likedItems = await SwipeHistory.find({
            user: req.user._id,
            action: 'liked'
        }).populate('menuItem');

        const likedTags = likedItems.flatMap(item => item.menuItem?.tags || []);

        // Get new items (not swiped yet)
        let query = {
            _id: { $nin: swipedIds },
            isAvailable: true
        };

        // If user has liked items, prefer similar tags
        if (likedTags.length > 0) {
            query.tags = { $in: likedTags };
        }

        let items = await MenuItem.find(query).populate('restaurant').limit(20);

        // If not enough personalized items, get random ones
        if (items.length < 10) {
            const additionalItems = await MenuItem.find({
                _id: { $nin: [...swipedIds, ...items.map(i => i._id)] },
                isAvailable: true
            }).populate('restaurant').limit(20 - items.length);

            items = [...items, ...additionalItems];
        }

        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/swipe/action
// @desc    Record swipe action (like/dislike)
// @access  Private (Customer)
router.post('/action', protect, authorize('customer'), async (req, res) => {
    try {
        const { menuItemId, action } = req.body;

        if (!['liked', 'disliked', 'skipped'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        // Check if already swiped
        const existing = await SwipeHistory.findOne({
            user: req.user._id,
            menuItem: menuItemId
        });

        if (existing) {
            existing.action = action;
            await existing.save();
        } else {
            await SwipeHistory.create({
                user: req.user._id,
                menuItem: menuItemId,
                action
            });
        }

        res.json({ success: true, message: 'Swipe recorded' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/swipe/matches
// @desc    Get liked items
// @access  Private (Customer)
router.get('/matches', protect, authorize('customer'), async (req, res) => {
    try {
        const matches = await SwipeHistory.find({
            user: req.user._id,
            action: 'liked'
        }).populate({
            path: 'menuItem',
            populate: { path: 'restaurant' }
        });

        const items = matches.map(m => m.menuItem).filter(item => item !== null);

        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
