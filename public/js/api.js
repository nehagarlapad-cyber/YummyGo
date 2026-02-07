// API Base URL
const API_BASE = '/api';

// API wrapper with error handling
class API {
    static async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                credentials: 'include',
                ...options,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    static auth = {
        signup: (data) => API.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        restaurantSignup: (data) => API.request('/auth/restaurant/signup', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        login: (data) => API.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        logout: () => API.request('/auth/logout', { method: 'POST' }),
        me: () => API.request('/auth/me'),
    };

    // Customer endpoints
    static customer = {
        getRestaurants: (params = '') => API.request(`/customer/restaurants${params}`),
        getMenu: (restaurantId) => API.request(`/customer/menu/${restaurantId}`),
        addToCart: (data) => API.request('/customer/cart', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getCart: () => API.request('/customer/cart'),
        removeFromCart: (itemId) => API.request(`/customer/cart/${itemId}`, { method: 'DELETE' }),
        placeOrder: (data) => API.request('/customer/order', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getOrders: () => API.request('/customer/orders'),
        getOrder: (orderId) => API.request(`/customer/orders/${orderId}`),
        getProfile: () => API.request('/customer/profile'),
        updateProfile: (data) => API.request('/customer/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        getPoints: () => API.request('/customer/points'),
    };

    // Restaurant endpoints
    static restaurant = {
        getDashboard: () => API.request('/restaurant/dashboard'),
        getOrders: () => API.request('/restaurant/orders'),
        acceptOrder: (orderId) => API.request(`/restaurant/orders/${orderId}/accept`, { method: 'PUT' }),
        rejectOrder: (orderId, reason) => API.request(`/restaurant/orders/${orderId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        }),
        updateOrderStatus: (orderId, status) => API.request(`/restaurant/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        }),
        getMenu: () => API.request('/restaurant/menu'),
        addMenuItem: (data) => API.request('/restaurant/menu', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        updateMenuItem: (itemId, data) => API.request(`/restaurant/menu/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        toggleMenuItem: (itemId) => API.request(`/restaurant/menu/${itemId}/toggle`, { method: 'PUT' }),
        deleteMenuItem: (itemId) => API.request(`/restaurant/menu/${itemId}`, { method: 'DELETE' }),
        createPromo: (data) => API.request('/restaurant/promo', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        togglePromo: (promoId) => API.request(`/restaurant/promo/${promoId}/toggle`, { method: 'PUT' }),
        getPromos: () => API.request('/restaurant/promo'),
        getAnalytics: () => API.request('/restaurant/analytics'),
    };

    // Delivery endpoints
    static delivery = {
        toggleStatus: () => API.request('/delivery/toggle-status', { method: 'PUT' }),
        updateZones: (zoneIds) => API.request('/delivery/zones', {
            method: 'PUT',
            body: JSON.stringify({ zoneIds }),
        }),
        getZones: () => API.request('/delivery/zones'),
        getAvailableOrders: () => API.request('/delivery/available-orders'),
        acceptOrder: (orderId) => API.request(`/delivery/accept/${orderId}`, { method: 'POST' }),
        rejectOrder: (orderId) => API.request(`/delivery/reject/${orderId}`, { method: 'POST' }),
        updateStatus: (orderId, status) => API.request(`/delivery/status/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        }),
        getHistory: () => API.request('/delivery/history'),
        getEarnings: () => API.request('/delivery/earnings'),
    };

    // Swipe endpoints
    static swipe = {
        getItems: () => API.request('/swipe/items'),
        recordAction: (menuItemId, action) => API.request('/swipe/action', {
            method: 'POST',
            body: JSON.stringify({ menuItemId, action }),
        }),
        getMatches: () => API.request('/swipe/matches'),
    };

    // Game endpoints
    static game = {
        start: (gameType) => API.request(`/game/start?gameType=${gameType}`),
        submitScore: (gameType, score) => API.request('/game/score', {
            method: 'POST',
            body: JSON.stringify({ gameType, score }),
        }),
        getLeaderboard: (gameType = '') => API.request(`/game/leaderboard${gameType ? `?gameType=${gameType}` : ''}`),
    };

    // Admin endpoints
    static admin = {
        getStats: () => API.request('/admin/stats'),
        getRestaurants: () => API.request('/admin/restaurants'),
        getUsers: (role = '') => API.request(`/admin/users${role ? `?role=${role}` : ''}`),
        getDeliveryAgents: () => API.request('/admin/delivery-agents'),
        updateRestaurantStatus: (restaurantId, status) => API.request(`/admin/restaurant/${restaurantId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        }),
    };
}

// Utility functions
const Utils = {
    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    // Format currency
    formatCurrency(amount) {
        return `₹${amount.toFixed(2)}`;
    },

    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    },

    // Format time
    formatTime(date) {
        return new Date(date).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    },

    // Show loading spinner
    showLoading(element) {
        element.innerHTML = '<div class="flex-center"><div class="spinner"></div></div>';
    },

    // Get order status badge class
    getStatusBadge(status) {
        const badges = {
            pending: 'badge-warning',
            confirmed: 'badge-info',
            preparing: 'badge-info',
            ready: 'badge-success',
            'out-for-delivery': 'badge-primary',
            delivered: 'badge-success',
            cancelled: 'badge-error',
            rejected: 'badge-error',
        };
        return badges[status] || 'badge-gray';
    },
};

// Export for use in other files
window.API = API;
window.Utils = Utils;
