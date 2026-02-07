const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Order = require('../models/Order');

// @route   GET /api/admin/stats
// @desc    Get platform overview stats
// @access  Private (Admin)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const totalRestaurants = await Restaurant.countDocuments();
        const activeRestaurants = await Restaurant.countDocuments({ status: 'active' });
        const pendingRestaurants = await Restaurant.countDocuments({ status: 'pending' });

        const totalCustomers = await User.countDocuments({ role: 'customer' });
        const totalDeliveryAgents = await User.countDocuments({ role: 'delivery' });

        const totalOrders = await Order.countDocuments();
        const todayOrders = await Order.countDocuments({
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });

        const totalRevenue = await Order.aggregate([
            { $match: { status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        res.json({
            success: true,
            data: {
                restaurants: { total: totalRestaurants, active: activeRestaurants, pending: pendingRestaurants },
                users: { customers: totalCustomers, deliveryAgents: totalDeliveryAgents },
                orders: { total: totalOrders, today: todayOrders },
                revenue: totalRevenue[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/restaurants
// @desc    Get all restaurants
// @access  Private (Admin)
router.get('/restaurants', protect, authorize('admin'), async (req, res) => {
    try {
        const restaurants = await Restaurant.find().populate('owner', 'name email phone');

        res.json({ success: true, data: restaurants });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', protect, authorize('admin'), async (req, res) => {
    try {
        const { role } = req.query;

        const query = role ? { role } : {};
        const users = await User.find(query).select('-password');

        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/delivery-agents
// @desc    Get all delivery agents
// @access  Private (Admin)
router.get('/delivery-agents', protect, authorize('admin'), async (req, res) => {
    try {
        const agents = await User.find({ role: 'delivery' }).select('-password');

        res.json({ success: true, data: agents });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/admin/restaurant/:id/status
// @desc    Approve/suspend restaurant
// @access  Private (Admin)
router.put('/restaurant/:id/status', protect, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'active', 'inactive', 'suspended'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        res.json({ success: true, data: restaurant });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
