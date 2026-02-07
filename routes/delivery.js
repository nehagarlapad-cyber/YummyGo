const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Order = require('../models/Order');
const User = require('../models/User');
const Zone = require('../models/Zone');

// @route   PUT /api/delivery/toggle-status
// @desc    Toggle active/offline status
// @access  Private (Delivery)
router.put('/toggle-status', protect, authorize('delivery'), async (req, res) => {
    try {
        req.user.deliveryStatus = req.user.deliveryStatus === 'active' ? 'offline' : 'active';
        await req.user.save();

        res.json({ success: true, data: { deliveryStatus: req.user.deliveryStatus } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/delivery/zones
// @desc    Update active delivery zones
// @access  Private (Delivery)
router.put('/zones', protect, authorize('delivery'), async (req, res) => {
    try {
        const { zoneIds } = req.body;

        req.user.activeZones = zoneIds;
        await req.user.save();

        res.json({ success: true, data: { activeZones: req.user.activeZones } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/delivery/zones
// @desc    Get available zones
// @access  Private (Delivery)
router.get('/zones', protect, authorize('delivery'), async (req, res) => {
    try {
        const zones = await Zone.find({ isActive: true });

        res.json({ success: true, data: zones });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/delivery/available-orders
// @desc    Get available orders (based on zones)
// @access  Private (Delivery)
router.get('/available-orders', protect, authorize('delivery'), async (req, res) => {
    try {
        // Get orders that are ready and don't have a delivery agent assigned
        const orders = await Order.find({
            status: 'ready',
            deliveryAgent: null
        })
            .populate('restaurant')
            .populate('customer', 'name phone address')
            .sort('createdAt');

        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/delivery/accept/:orderId
// @desc    Accept delivery
// @access  Private (Delivery)
router.post('/accept/:orderId', protect, authorize('delivery'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.deliveryAgent) {
            return res.status(400).json({ success: false, message: 'Order already assigned' });
        }

        order.deliveryAgent = req.user._id;
        order.status = 'out-for-delivery';
        order.statusHistory.push({ status: 'out-for-delivery', timestamp: new Date() });
        await order.save();

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/delivery/reject/:orderId
// @desc    Reject delivery
// @access  Private (Delivery)
router.post('/reject/:orderId', protect, authorize('delivery'), async (req, res) => {
    try {
        // Simply don't assign - order remains available for others
        res.json({ success: true, message: 'Order rejected' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/delivery/status/:orderId
// @desc    Update delivery status
// @access  Private (Delivery)
router.put('/status/:orderId', protect, authorize('delivery'), async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findOne({
            _id: req.params.orderId,
            deliveryAgent: req.user._id
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = status;
        order.statusHistory.push({ status, timestamp: new Date() });

        if (status === 'delivered') {
            order.actualDeliveryTime = new Date();
            // Update earnings
            const deliveryEarnings = 30; // Base delivery fee earning
            req.user.earnings += deliveryEarnings;
            await req.user.save();
        }

        await order.save();

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/delivery/history
// @desc    Get delivery history
// @access  Private (Delivery)
router.get('/history', protect, authorize('delivery'), async (req, res) => {
    try {
        const orders = await Order.find({ deliveryAgent: req.user._id })
            .populate('restaurant')
            .populate('customer', 'name phone')
            .sort('-createdAt');

        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/delivery/earnings
// @desc    Get earnings stats
// @access  Private (Delivery)
router.get('/earnings', protect, authorize('delivery'), async (req, res) => {
    try {
        const totalDeliveries = await Order.countDocuments({
            deliveryAgent: req.user._id,
            status: 'delivered'
        });

        const todayDeliveries = await Order.countDocuments({
            deliveryAgent: req.user._id,
            status: 'delivered',
            actualDeliveryTime: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });

        res.json({
            success: true,
            data: {
                totalEarnings: req.user.earnings,
                totalDeliveries,
                todayDeliveries
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
