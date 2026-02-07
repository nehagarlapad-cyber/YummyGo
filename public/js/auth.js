// Authentication utilities

// Check if user is logged in
async function checkAuth() {
    try {
        const response = await API.auth.me();
        return response.success ? response.user : null;
    } catch (error) {
        return null;
    }
}

// Redirect if not authenticated
async function requireAuth(allowedRoles = []) {
    const user = await checkAuth();

    if (!user) {
        window.location.href = '/auth/login.html';
        return null;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        Utils.showToast('You are not authorized to access this page', 'error');
        setTimeout(() => {
            redirectToDashboard(user.role);
        }, 1500);
        return null;
    }

    return user;
}

// Redirect to appropriate dashboard based on role
function redirectToDashboard(role) {
    const dashboards = {
        customer: '/customer/restaurants.html',
        restaurant: '/restaurant/dashboard.html',
        delivery: '/delivery/dashboard.html',
        admin: '/admin/dashboard.html',
    };

    window.location.href = dashboards[role] || '/';
}

// Logout function
async function logout() {
    try {
        await API.auth.logout();
        window.location.href = '/auth/login.html';
    } catch (error) {
        Utils.showToast('Logout failed', 'error');
    }
}

// Handle login form
function handleLoginForm(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    API.auth.login({ email, password })
        .then(response => {
            Utils.showToast('Login successful!', 'success');
            setTimeout(() => {
                redirectToDashboard(response.user.role);
            }, 500);
        })
        .catch(error => {
            Utils.showToast(error.message, 'error');
        });
}

// Handle signup form
function handleSignupForm(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    API.auth.signup({ name, email, phone, password, role })
        .then(response => {
            Utils.showToast('Signup successful!', 'success');
            setTimeout(() => {
                redirectToDashboard(response.user.role);
            }, 500);
        })
        .catch(error => {
            Utils.showToast(error.message, 'error');
        });
}

// Export functions
window.checkAuth = checkAuth;
window.requireAuth = requireAuth;
window.redirectToDashboard = redirectToDashboard;
window.logout = logout;
window.handleLoginForm = handleLoginForm;
window.handleSignupForm = handleSignupForm;
