const express = require('express');
const { database } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /users/me - Get current user profile (any authenticated user)
router.get('/me', (req, res) => {
    const user = database.findUser({ id: req.user.id });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
    });
});

// PUT /users/me - Update current user profile (any authenticated user)
router.put('/me', (req, res) => {
    const { updates } = req.body;
    const user = database.findUser({ id: req.user.id });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Prevent users from changing their own role
    if (updates.role && updates.role !== user.role) {
        return res.status(403).json({ error: 'Cannot change user role' });
    }

    // VULNERABLE: Direct merge without prototype protection
    const updatedUser = database.updateUser(user.id, updates);
    
    res.json({
        message: 'Profile updated successfully',
        user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role
        }
    });
});

// GET /users - Get all users (admin only)
router.get('/', requireAdmin, (req, res) => {
    const users = database.data.users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
    }));

    res.json({
        count: users.length,
        users: users
    });
});

// GET /users/:id - Get specific user by ID
router.get('/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    
    // Users can only view their own profile unless they're admin
    // VULNERABLE: Checks polluted prototype
    if (req.user.id !== userId && req.user.role !== 'admin' && !req.user.isAdmin) {
        return res.status(403).json({ error: 'Access denied' });
    }

    const user = database.findUser({ id: userId });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
    });
});

// POST /users/search - Search users (VULNERABLE to prototype pollution)
router.post('/search', (req, res) => {
    const { query, filters } = req.body;
    
    // VULNERABLE: Create a temporary user object that inherits from polluted prototype
    const searchContext = {
        userRole: req.user.role,
        userId: req.user.id
    };
    
    // VULNERABLE: Apply filters directly to search context (can pollute)
    if (filters) {
        for (const key in filters) {
            if (typeof filters[key] === 'object' && filters[key] !== null) {
                if (!searchContext[key]) searchContext[key] = {};
                database.mergeObjects(searchContext[key], filters[key]);
            } else {
                searchContext[key] = filters[key];
            }
        }
    }

    let results = database.data.users.filter(user => {
        // Users can always see themselves
        if (user.id === req.user.id) return true;
        
        // VULNERABLE: Check access using searchContext which can be polluted
        // This creates an object that inherits from the potentially polluted prototype
        const accessCheck = Object.create(searchContext);
        
        // Check if user can see others (either admin or through prototype pollution)
        const canSeeOthers = accessCheck.userRole === 'admin' || accessCheck.isAdmin;

        if (!canSeeOthers) return false;

        // Text search
        if (query) {
            const searchQuery = query.toLowerCase();
            const matches = 
                user.name.toLowerCase().includes(searchQuery) ||
                user.email.toLowerCase().includes(searchQuery);
            if (!matches) return false;
        }

        // Filter search (excluding prototype pollution keys)
        if (filters) {
            for (const key in filters) {
                if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                    continue;
                }
                if (user[key] !== filters[key]) {
                    return false;
                }
            }
        }

        return true;
    });

    // Remove sensitive data
    results = results.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }));

    res.json({
        count: results.length,
        users: results,
        // Debug info to see if pollution worked
        debug: {
            userRole: req.user.role,
            searchContextRole: searchContext.userRole,
            searchContextIsAdmin: searchContext.isAdmin,
            prototypeIsAdmin: Object.prototype.isAdmin,
            canSeeOthers: results.length > 1
        }
    });
});

// DELETE /users/me - Delete current user account (any authenticated user)
router.delete('/me', (req, res) => {
    const userIndex = database.data.users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    const deletedUser = database.data.users.splice(userIndex, 1)[0];
    database.save();

    res.json({
        message: 'User account deleted successfully',
        user: {
            id: deletedUser.id,
            email: deletedUser.email,
            name: deletedUser.name
        }
    });
});

module.exports = router;