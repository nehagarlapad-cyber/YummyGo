# YummyGo - Food Delivery Platform

Premium food delivery platform with unique features built with Node.js, Express, MongoDB, and Vanilla JavaScript.

## 🌟 Features

### Core Features
- **Multi-Role System**: Customer, Restaurant, Delivery Agent, and Admin
- **Real-time Order Tracking**: Socket.io for live updates
- **Promo Codes**: Restaurants can create and manage discount codes
- **Points System**: Customers earn points with every order
- **Zone-based Delivery**: Delivery agents can select active zones

### Unique Features
- **🔥 Tinder for Food**: Swipe-based food discovery with personalized recommendations
- **🎮 Points Game**: Interactive games to earn reward points

## 🛠️ Tech Stack

### Backend
- Node.js & Express.js
- MongoDB (Mongoose ODM)
- Redis (Caching & Sessions)
- Bull (Background job processing)
- Socket.io (Real-time features)
- JWT Authentication
- Prometheus & Grafana (Monitoring)

### Frontend
- Vanilla HTML, CSS, JavaScript
- Modern CSS with gradients, animations
- Orange-white premium theme
- Fully responsive design

## 📋 Prerequisites

- Node.js (v16+)
- MongoDB
- Redis
- Docker (optional - for containerized services)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# If you encounter PowerShell execution policy issues, run:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Then install
npm install
```

### 2. Setup Environment

Create a `.env` file (or use the existing one):

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/yummygo
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=yummygo_secret_jwt_key_2024
JWT_EXPIRES_IN=7d
SESSION_SECRET=yummygo_session_secret_2024
ADMIN_EMAIL=admin@yummygo.com
ADMIN_PASSWORD=Admin@123
```

### 3. Start Services

#### Option A: Using Docker (Recommended)

```bash
docker-compose up -d
```

This will start MongoDB, Redis, Prometheus, and Grafana.

#### Option B: Local Services

Ensure MongoDB and Redis are running locally.

### 4. Seed Database

```bash
npm run seed
```

This creates sample data including:
- Admin user
- Sample customer
- Sample restaurant with menu
- Sample delivery agent
- Delivery zones

### 5. Start Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will be running at `http://localhost:3000`

## 👤 Default Login Credentials

After seeding, use these credentials:

- **Admin**: `admin@yummygo.com` / `Admin@123`
- **Customer**: `customer@test.com` / `password123`
- **Restaurant**: `restaurant@test.com` / `password123`
- **Delivery Agent**: `delivery@test.com` / `password123`

## 📁 Project Structure

```
g766/
├── config/              # Database, Redis, Bull configuration
├── models/              # Mongoose models
├── routes/              # API routes
├── middleware/          # Auth, metrics middleware
├── public/              # Frontend files
│   ├── css/            # Design system
│   ├── js/             # Shared utilities
│   ├── auth/           # Authentication pages
│   ├── customer/       # Customer portal
│   ├── restaurant/     # Restaurant portal
│   ├── delivery/       # Delivery agent portal
│   └── admin/          # Admin portal
├── utils/              # Utility functions
├── server.js           # Main server file
├── seed.js             # Database seeder
└── docker-compose.yml   # Docker services
```

## 🎯 Key Features by Role

### Customer
- Browse restaurants and menus
- **Swipe UI** for food discovery
- Add items to cart with special instructions
- Apply promo codes
- Real-time order tracking
- **Play games** to earn points
- Order history
- Points balance

### Restaurant
- **Separate signup** page
- Dashboard with stats
- **Accept/reject** incoming orders
- Menu management (CRUD)
- **Toggle item availability**
- **Update prices** inline
- **Create and manage** promo codes
- View analytics

### Delivery Agent
- **Active/offline** status toggle
- **Select delivery zones**
- View available orders (filtered by zone)
- **Accept/reject** orders
- Update delivery status
- Track earnings
- Delivery history

### Admin
- Platform overview stats
- Manage restaurants (approve/suspend)
- Manage users
- Manage delivery agents
- View Grafana dashboards

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/signup` - Customer/Delivery signup
- `POST /api/auth/restaurant/signup` - Restaurant signup
- `POST /api/auth/login` - Login (all roles)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Customer
- `GET /api/customer/restaurants` - Browse restaurants
- `GET /api/customer/menu/:restaurantId` - Get menu
- `POST /api/customer/cart` - Add to cart
- `POST /api/customer/order` - Place order
- `GET /api/customer/orders` - Order history

### Restaurant
- `GET /api/restaurant/dashboard` - Dashboard stats
- `PUT /api/restaurant/orders/:id/accept` - Accept order
- `PUT /api/restaurant/orders/:id/reject` - Reject order
- `PUT /api/restaurant/menu/:id/toggle` - Toggle availability
- `POST /api/restaurant/promo` - Create promo code
- `PUT /api/restaurant/promo/:id/toggle` - Toggle promo

### Delivery
- `PUT /api/delivery/toggle-status` - Toggle active/offline
- `PUT /api/delivery/zones` - Update zones
- `POST /api/delivery/accept/:orderId` - Accept order
- `POST /api/delivery/reject/:orderId` - Reject order

### Swipe & Game
- `GET /api/swipe/items` - Get swipe items
- `POST /api/swipe/action` - Record swipe
- `POST /api/game/score` - Submit game score
- `GET /api/game/leaderboard` - Get leaderboard

## 📊 Monitoring

- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3001` (admin/admin)

## 🎨 Design System

The application uses a custom design system with:
- Orange-white premium theme
- Modern gradients and shadows
- Smooth animations
- Responsive grid system
- Reusable components (cards, buttons, forms, badges)

## 📝 Notes

- All buttons are functional and connected to backend APIs
- Real-time order updates via Socket.io
- Points system automatically awards points with orders
- Promo codes are validated and applied at checkout
- Zone-based order filtering for delivery agents
- Admin credentials are hardcoded (single admin only)

## 🚧 Development

### Adding New Features

1. Create model in `models/`
2. Add routes in `routes/`
3. Create frontend pages in `public/`
4. Use the API wrapper in `public/js/api.js`
5. Update seed data if needed

### Testing

Test the application by:
1. Starting all services
2. Seeding the database
3. Logging in with different roles
4. Testing each feature workflow

## 📜 License

MIT

## 👨‍💻 Author

Built with ❤️ and 🍕
