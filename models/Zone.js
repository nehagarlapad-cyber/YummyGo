const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    area: {
        type: String,
    },
    coordinates: {
        type: {
            type: String,
            enum: ['Polygon'],
            default: 'Polygon',
        },
        coordinates: {
            type: [[[Number]]], // Array of arrays of coordinates
        },
    },
    deliveryFee: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Geospatial index for zone lookup
zoneSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Zone', zoneSchema);
