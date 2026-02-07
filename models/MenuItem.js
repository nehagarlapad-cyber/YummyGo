const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Snack', 'Salad', 'Combo', 'Other'],
    },
    image: {
        type: String,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    isVegetarian: {
        type: Boolean,
        default: false,
    },
    isVegan: {
        type: Boolean,
        default: false,
    },
    spiceLevel: {
        type: String,
        enum: ['None', 'Mild', 'Medium', 'Hot', 'Extra Hot'],
    },
    tags: [String], // For swipe recommendations
    preparationTime: {
        type: Number, // in minutes
    },
    calories: Number,
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
