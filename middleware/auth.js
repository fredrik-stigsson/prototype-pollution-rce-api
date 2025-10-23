const jwt = require('jsonwebtoken');
const { database } = require('../config/database');

const JWT_SECRET = 'vulnerable_secret_key';

// VULNERABLE: JWT verification that checks polluted prototype
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        // FIXED: Always allow authenticated users, check admin only when needed
        req.user = user;
        next();
    });
}

// Separate middleware for admin-only routes
function requireAdmin(req, res, next) {
    // VULNERABLE: Checks polluted prototype for admin access
    if (req.user.isAdmin || req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
}

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role,
            // VULNERABLE: Not including isAdmin explicitly
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

module.exports = { authenticateToken, requireAdmin, generateToken };