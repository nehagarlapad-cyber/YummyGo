require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');
const Zone = require('./models/Zone');

// Connect to database
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

async function seed() {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Restaurant.deleteMany({});
        await MenuItem.deleteMany({});
        await Zone.deleteMany({});

        console.log('🗑️  Cleared existing data');

        // Create Admin
        const admin = await User.create({
            email: process.env.ADMIN_EMAIL || 'admin@yummygo.com',
            password: process.env.ADMIN_PASSWORD || 'Admin@123',
            name: 'Admin User',
            role: 'admin',
        });
        console.log('👤 Created admin user');

        // Create Delivery Zones
        const zones = await Zone.insertMany([
            {
                name: 'Zone 1',
                city: 'Mumbai',
                area: 'Andheri',
                coordinates: {
                    type: 'Polygon',
                    coordinates: [[[72.8, 19.1], [72.9, 19.1], [72.9, 19.2], [72.8, 19.2], [72.8, 19.1]]]
                }
            },
            {
                name: 'Zone 2',
                city: 'Mumbai',
                area: 'Bandra',
                coordinates: {
                    type: 'Polygon',
                    coordinates: [[[72.81, 19.05], [72.86, 19.05], [72.86, 19.08], [72.81, 19.08], [72.81, 19.05]]]
                }
            },
            {
                name: 'Zone 3',
                city: 'Mumbai',
                area: 'Powai',
                coordinates: {
                    type: 'Polygon',
                    coordinates: [[[72.9, 19.11], [72.95, 19.11], [72.95, 19.14], [72.9, 19.14], [72.9, 19.11]]]
                }
            },
        ]);
        console.log('📍 Created delivery zones');

        // Create Sample Customer
        const customer = await User.create({
            email: 'customer@test.com',
            password: 'password123',
            name: 'John Customer',
            role: 'customer',
            phone: '+91 9876543210',
            points: 500,
        });
        console.log('👤 Created sample customer');

        // Create Sample Delivery Agent
        const deliveryAgent = await User.create({
            email: 'delivery@test.com',
            password: 'password123',
            name: 'Mike Delivery',
            role: 'delivery',
            phone: '+91 9876543211',
            deliveryStatus: 'active',
            activeZones: [zones[0]._id, zones[1]._id],
        });
        console.log('👤 Created sample delivery agent');

        // Create Sample Restaurant Owner
        const restaurantOwner = await User.create({
            email: 'restaurant@test.com',
            password: 'password123',
            name: 'Chef Maria',
            role: 'restaurant',
            phone: '+91 9876543212',
        });

        // Create Sample Restaurants
        const restaurants = [
            {
                name: 'Pizza Paradise',
                owner: restaurantOwner._id,
                description: 'Authentic Italian pizzas with fresh ingredients',
                address: {
                    street: '123 Main Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400001',
                },
                cuisineTypes: ['Italian', 'Pizza'],
                status: 'active',
                rating: { average: 4.5, count: 150 },
                deliveryTime: '30-35 mins',
                minimumOrder: 200,
                promoCodes: [
                    {
                        code: 'PIZZA50',
                        discount: 50,
                        discountType: 'fixed',
                        minOrder: 300,
                        isActive: true,
                        expiresAt: new Date('2025-12-31'),
                    },
                ],
            },
            {
                name: 'Burger Bliss',
                owner: restaurantOwner._id,
                description: 'Juicy burgers and crispy fries',
                address: {
                    street: '456 Food Lane',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400002',
                },
                cuisineTypes: ['American', 'Fast Food'],
                status: 'active',
                rating: { average: 4.3, count: 200 },
                deliveryTime: '25-30 mins',
                minimumOrder: 150,
                promoCodes: [
                    {
                        code: 'BURGER20',
                        discount: 20,
                        discountType: 'percentage',
                        minOrder: 250,
                        maxDiscount: 100,
                        isActive: true,
                        expiresAt: new Date('2025-12-31'),
                    },
                ],
            },
            {
                name: 'Curry House',
                owner: restaurantOwner._id,
                description: 'Traditional Indian curries and biryanis',
                address: {
                    street: '789 Spice Road',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    zipCode: '400003',
                },
                cuisineTypes: ['Indian', 'North Indian'],
                status: 'active',
                rating: { average: 4.7, count: 180 },
                deliveryTime: '35-40 mins',
                minimumOrder: 250,
            },
        ];

        const createdRestaurants = await Restaurant.insertMany(restaurants);
        console.log('🏪 Created sample restaurants');

        // Create Menu Items
        const menuItems = [
            // Pizza Paradise
            { restaurant: createdRestaurants[0]._id, name: 'Margherita Pizza', description: 'Classic tomato and cheese', price: 299, category: 'Main Course', isAvailable: true, image: '/images/food/pizza.jpg', tags: ['Italian', 'Cheese', 'Vegetarian'], isVegetarian: true },
            { restaurant: createdRestaurants[0]._id, name: 'Pepperoni Pizza', description: 'Loaded with pepperoni', price: 399, category: 'Main Course', isAvailable: true, image: '/images/food/pepperoni.jpg', tags: ['Italian', 'Meat'] },
            { restaurant: createdRestaurants[0]._id, name: 'Garlic Bread', description: 'Crispy garlic bread with herbs', price: 99, category: 'Appetizer', isAvailable: true, image: '/images/food/garlic-bread.jpg', tags: ['Italian', 'Vegetarian'], isVegetarian: true },

            // Burger Bliss
            { restaurant: createdRestaurants[1]._id, name: 'Classic Cheeseburger', description: 'Beef patty with cheese', price: 199, category: 'Main Course', isAvailable: true, image: '/images/food/burger.jpg', tags: ['American', 'Burger', 'Meat'] },
            { restaurant: createdRestaurants[1]._id, name: 'Veggie Burger', description: 'Plant-based patty', price: 179, category: 'Main Course', isAvailable: true, image: '/images/food/veggie-burger.jpg', tags: ['American', 'Vegetarian'], isVegetarian: true },
            { restaurant: createdRestaurants[1]._id, name: 'French Fries', description: 'Crispy golden fries', price: 89, category: 'Snack', isAvailable: true, image: '/images/food/fries.jpg', tags: ['American', 'Vegetarian'], isVegetarian: true },

            // Curry House
            { restaurant: createdRestaurants[2]._id, name: 'Chicken Biryani', description: 'Aromatic rice with chicken', price: 279, category: 'Main Course', isAvailable: true, image: '/images/food/biryani.jpg', tags: ['Indian', 'Rice', 'Spicy'], spiceLevel: 'Medium' },
            { restaurant: createdRestaurants[2]._id, name: 'Paneer Butter Masala', description: 'Creamy paneer curry', price: 249, category: 'Main Course', isAvailable: true, image: '/images/food/paneer.jpg', tags: ['Indian', 'Curry', 'Vegetarian'], isVegetarian: true },
            { restaurant: createdRestaurants[2]._id, name: 'Naan Bread', description: 'Soft Indian flatbread', price: 49, category: 'Appetizer', isAvailable: true, image: '/images/food/naan.jpg', tags: ['Indian', 'Vegetarian'], isVegetarian: true },
        ];

        await MenuItem.insertMany(menuItems);
        console.log('🍔 Created menu items');

        console.log('\n✨ Seed completed successfully!\n');
        console.log('📋 Login Credentials:');
        console.log('   Admin: admin@yummygo.com / Admin@123');
        console.log('   Customer: customer@test.com / password123');
        console.log('   Restaurant: restaurant@test.com / password123');
        console.log('   Delivery: delivery@test.com / password123\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed Error:', error);
        process.exit(1);
    }
}

seed();
