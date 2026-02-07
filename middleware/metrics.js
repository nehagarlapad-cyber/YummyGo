const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// HTTP request counter
const httpRequestCounter = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
});

// HTTP request duration
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
});

// Order metrics
const orderCounter = new promClient.Counter({
    name: 'orders_total',
    help: 'Total number of orders',
    labelNames: ['status'],
    registers: [register],
});

// Middleware to collect metrics
const metricsMiddleware = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route ? req.route.path : req.path;

        httpRequestCounter.inc({
            method: req.method,
            route,
            status: res.statusCode,
        });

        httpRequestDuration.observe(
            {
                method: req.method,
                route,
                status: res.statusCode,
            },
            duration
        );
    });

    next();
};

module.exports = {
    register,
    metricsMiddleware,
    orderCounter,
};
