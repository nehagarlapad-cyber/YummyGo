const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

// @route   GET /api/customer/restaurants
// @desc    Browse all active restaurants
// @access  Private (Customer)
router.get('/restaurants', protect, authorize('customer'), async (req, res) => {
    try {
        const { search, cuisine } = req.query;

        const query = { status: 'active' };

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (cuisine) {
            query.cuisineTypes = cuisine;
        }

        const restaurants = await Restaurant.find(query).select('-promoCodes');

        res.json({ success: true, data: restaurants });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/customer/menu/:restaurantId
// @desc    Get restaurant menu
// @access  Private (Customer)
router.get('/menu/:restaurantId', protect, authorize('customer'), async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        const menuItems = await MenuItem.find({
            restaurant: req.params.restaurantId,
            isAvailable: true
        });

        res.json({
            success: true,
            data: {
                restaurant,
                menuItems
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/customer/cart
// @desc    Add item to cart
// @access  Private (Customer)
router.post('/cart', protect, authorize('customer'), async (req, res) => {
    try {
        const { menuItemId, quantity, specialInstructions } = req.body;

        const menuItem = await MenuItem.findById(menuItemId).populate('restaurant');

        if (!menuItem || !menuItem.isAvailable) {
            return res.status(404).json({ success: false, message: 'Menu item not available' });
        }

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = await Cart.create({
                user: req.user._id,
                restaurant: menuItem.restaurant._id,
                items: [{ menuItem: menuItemId, quantity, specialInstructions }]
            });
        } else {
            // Check if cart is from same restaurant
            if (cart.restaurant.toString() !== menuItem.restaurant._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot add items from different restaurants'
                });
            }

            // Check if item already in cart
            const existingItem = cart.items.find(item => item.menuItem.toString() === menuItemId);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({ menuItem: menuItemId, quantity, specialInstructions });
            }

            await cart.save();
        }

        await cart.populate('items.menuItem');

        res.json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/customer/cart
// @desc    Get cart
// @access  Private (Customer)
router.get('/cart', protect, authorize('customer'), async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.menuItem')
            .populate('restaurant');

        res.json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   DELETE /api/customer/cart/:itemId
// @desc    Remove item from cart
// @access  Private (Customer)
router.delete('/cart/:itemId', protect, authorize('customer'), async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);

        if (cart.items.length === 0) {
            await Cart.deleteOne({ _id: cart._id });
            return res.json({ success: true, data: null });
        }

        await cart.save();
        await cart.populate('items.menuItem');

        res.json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   POST /api/customer/order
// @desc    Place order
// @access  Private (Customer)
router.post('/order', protect, authorize('customer'), async (req, res) => {
    try {
        const { deliveryAddress, paymentMethod, promoCode } = req.body;

        const cart = await Cart.findOne({ user: req.user._id }).populate('items.menuItem');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        // Calculate totals
        let subtotal = 0;
        const orderItems = cart.items.map(item => {
            const itemTotal = item.menuItem.price * item.quantity;
            subtotal += itemTotal;
            return {
                menuItem: item.menuItem._id,
                name: item.menuItem.name,
                price: item.menuItem.price,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions
            };
        });

        const deliveryFee = 50;
        const tax = subtotal * 0.05;
        let discount = 0;
        let promoData = null;

        // Apply promo code if provided
        if (promoCode) {
            const restaurant = await Restaurant.findById(cart.restaurant);
            const promo = restaurant.promoCodes.find(p =>
                p.code === promoCode.toUpperCase() &&
                p.isActive &&
                new Date(p.expiresAt) > new Date()
            );

            if (promo && subtotal >= promo.minOrder) {
                if (promo.discountType === 'percentage') {
                    discount = (subtotal * promo.discount) / 100;
                    if (promo.maxDiscount) {
                        discount = Math.min(discount, promo.maxDiscount);
                    }
                } else {
                    discount = promo.discount;
                }

                promoData = { code: promo.code, discountAmount: discount };

                // Update promo usage
                promo.usageCount += 1;
                await restaurant.save();
            }
        }

        const total = subtotal + deliveryFee + tax - discount;
        const pointsEarned = Math.floor(total / 10);

        // Create order
        const order = await Order.create({
            customer: req.user._id,
            restaurant: cart.restaurant,
            items: orderItems,
            subtotal,
            deliveryFee,
            tax,
            discount,
            promoCode: promoData,
            total,
            deliveryAddress,
            paymentMethod,
            pointsEarned,
            estimatedDeliveryTime: new Date(Date.now() + 40 * 60 * 1000), // 40 mins
            statusHistory: [{ status: 'pending', timestamp: new Date() }]
        });

        // Update user points
        req.user.points += pointsEarned;
        await req.user.save();

        // Clear cart
        await Cart.deleteOne({ _id: cart._id });

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        console.error('Order error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/customer/orders
// @desc    Get order history
// @access  Private (Customer)
router.get('/orders', protect, authorize('customer'), async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user._id })
            .populate('restaurant')
            .populate('deliveryAgent')
            .sort('-createdAt');

        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/customer/orders/:orderId
// @desc    Get single order
// @access  Private (Customer)
router.get('/orders/:orderId', protect, authorize('customer'), async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.orderId,
            customer: req.user._id
        })
            .populate('restaurant')
            .populate('deliveryAgent');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/customer/profile
// @desc    Get customer profile
// @access  Private (Customer)
router.get('/profile', protect, authorize('customer'), async (req, res) => {
    try {
        res.json({ success: true, data: req.user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/customer/profile
// @desc    Update customer profile
// @access  Private (Customer)
router.put('/profile', protect, authorize('customer'), async (req, res) => {
    try {
        const { name, phone, address } = req.body;

        req.user.name = name || req.user.name;
        req.user.phone = phone || req.user.phone;
        req.user.address = address || req.user.address;

        await req.user.save();

        res.json({ success: true, data: req.user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// @route   GET /api/customer/points
// @desc    Get points balance
// @access  Private (Customer)
router.get('/points', protect, authorize('customer'), async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                points: req.user.points
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
