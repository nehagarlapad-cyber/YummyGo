// Socket.io client initialization
const socket = io();

// Order tracking
function trackOrder(orderId) {
    socket.emit('track-order', orderId);

    socket.on(`order-${orderId}-update`, (data) => {
        console.log('Order update:', data);
        // Update UI with new order status
        updateOrderStatus(data);
    });
}

// Restaurant order tracking
function trackRestaurantOrders(restaurantId) {
    socket.emit('track-restaurant-orders', restaurantId);

    socket.on(`restaurant-${restaurantId}-new-order`, (data) => {
        console.log('New order:', data);
        // Show notification and update UI
        Utils.showToast('New order received!', 'success');
        loadRestaurantOrders();
    });
}

// Export functions
window.trackOrder = trackOrder;
window.trackRestaurantOrders = trackRestaurantOrders;
