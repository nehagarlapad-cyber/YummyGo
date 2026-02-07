const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

// @route   GET /api/restaurant/dashboard
// @desc    Get restaurant dashboard stats
// @access  Private (Restaurant)
router.get('/dashboard', protect, authorize('restaurant'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        const totalOrders = await Order.countDocuments({ restaurant: restaurant._id });
        const pendingOrders = await Order.countDocuments({ restaurant: restaurant._id, status: 'pending' });
        const todayOrders = await Order.countDocuments({
            restaurant: restaurant._id,
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        });

        const revenue = await Order.aggregate([
            { $match: { restaurant: restaurant._id, status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        res.json({
            success: true,
            data: {
                restaurant,
                stats: {
                    totalOrders,
                    pendingOrders,
                    todayOrders,
                    totalRevenue: revenue[0]?.total || 0
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/restaurant/orders
// @desc    Get all orders for restaurant
// @access  Private (Restaurant)
router.get('/orders', protect, authorize('restaurant'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        const orders = await Order.find({ restaurant: restaurant._id })
            .populate('customer', 'name phone')
            .populate('deliveryAgent', 'name phone')
            .sort('-createdAt');

        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/restaurant/orders/:id/accept
// @desc    Accept order
// @access  Private (Restaurant)
router.put('/orders/:id/accept', protect, authorize('restaurant'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        const order = await Order.findOne({ _id: req.params.id, restaurant: restaurant._id });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = 'confirmed';
        order.statusHistory.push({ status: 'confirmed', timestamp: new Date() });
        await order.save();

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/restaurant/orders/:id/reject
// @desc    Reject order
// @access  Private (Restaurant)
router.put('/orders/:id/reject', protect, authorize('restaurant'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        const order = await Order.findOne({ _id: req.params.id, restaurant: restaurant._id });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = 'rejected';
        order.statusHistory.push({ status: 'rejected', timestamp: new Date(), note: req.body.reason });
        await order.save();

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/restaurant/orders/:id
// @desc    Update order status
// @access  Private (Restaurant)
router.put('/orders/:id', protect, authorize('restaurant'), async (req, res) => {
    try {
        const { status } = req.body;
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        const order = await Order.findOne({ _id: req.params.id, restaurant: restaurant._id });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = status;
        order.statusHistory.push({ status, timestamp: new Date() });
        await order.save();

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/restaurant/menu
// @desc    Get menu items
// @access  Private (Restaurant)
router.get('/menu', protect, authorize('restaurant'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        const menuItems = await MenuItem.find({ restaurant: restaurant._id });

        res.json({ success: true, data: menuItems });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/restaurant/menu
// @desc    Add menu item
// @access  Private (Restaurant)
router.post('/menu', protect, authorize('restaurant'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        const menuItem = await MenuItem.create({
            ...req.body,
            restaurant: restaurant._id
        });

        res.status(201).json({ success: true, data: menuItem });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/restaurant/menu/:id
// @desc    Update menu item (including price)
// @access  Private (Restaurant)
router.put('/menu/:id', protect, authorize('restaurant'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        const menuItem = await MenuItem.findOne({ _id: req.params.id, restaurant: restaurant._id });

        if (!menuItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        Object.assign(menuItem, req.body);
        await menuItem.save();

        res.json({ success: true, data: menuItem });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/restaurant/menu/:id/toggle
// @desc    Toggle item availability
// @access  Private (Restaurant)
router.put('/menu/:id/toggle', protect, authorize('restaurant'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        const menuItem = await MenuItem.findOne({ _id: req.params.id, restaurant: restaurant._id });

        if (!menuItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        menuItem.isAvailable = !menuItem.isAvailable;
        await menuItem.save();

        res.json({ success: true, data: menuItem });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/restaurant/menu/:id
// @desc    Delete menu item
// @access  Private (Restaurant)
router.delete('/menu/:id', protect, authorize('restaurant'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        const menuItem = await MenuItem.findOne({ _id: req.params.id, restaurant: restaurant._id });

        if (!menuItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        await MenuItem.deleteOne({ _id: menuItem._id });

        res.json({ success: true, message: 'Menu item deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/restaurant/promo
//  @desc    Create promo code
// @access  Private (Restaurant)
router.post('/promo', protect, authorize('restaurant'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        const { code, discount, discountType, minOrder, maxDiscount, expiresAt, usageLimit } = req.body;

        restaurant.promoCodes.push({
            code: code.toUpperCase(),
            discount,
            discountType,
            minOrder,
            maxDiscount,
            expiresAt,
            usageLimit,
            isActive: true
        });

        await restaurant.save();

        res.status(201).json({ success: true, data: restaurant.promoCodes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/restaurant/promo/:id/toggle
// @desc    Activate/deactivate promo code
// @access  Private (Restaurant)
router.put('/promo/:id/toggle', protect, authorize('restaurant'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        const promo = restaurant.promoCodes.id(req.params.id);

        if (!promo) {
            return res.status(404).json({ success: false, message: 'Promo code not found' });
        }

        promo.isActive = !promo.isActive;
        await restaurant.save();

        res.json({ success: true, data: restaurant.promoCodes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/restaurant/promo
// @desc    Get all promo codes
// @access  Private (Restaurant)
router.get('/promo', protect, authorize('restaurant'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        res.json({ success: true, data: restaurant.promoCodes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/restaurant/analytics
// @desc    Get analytics data
// @access  Private (Restaurant)
router.get('/analytics', protect, authorize('restaurant'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const ordersByStatus = await Order.aggregate([
            { $match: { restaurant: restaurant._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const revenueByDay = await Order.aggregate([
            { $match: { restaurant: restaurant._id, status: 'delivered', createdAt: { $gte: last30Days } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                ordersByStatus,
                revenueByDay
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
