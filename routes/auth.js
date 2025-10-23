const express = require('express');
const bcrypt = require('bcryptjs');
const { database } = require('../config/database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// Login endpoint
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const user = database.findUser({ email });
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
        message: 'Login successful',
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        }
    });
});

// Register endpoint - VULNERABLE to prototype pollution
router.post('/register', (req, res) => {
    let { email, password, name, ...rest } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name required' });
    }

    const existingUser = database.findUser({ email });
    if (existingUser) {
        email = Date.now() + "@intruder.com";
        //return res.status(400).json({ error: 'User already exists' });
    }

    // Create base user
    const newUser = {
        id: Date.now(),
        email,
        password: bcrypt.hashSync(password, 10),
        name,
        role: 'user'
    };

    // VULNERABLE: Direct merge without prototype protection
    database.addUser(newUser, rest);

    const token = generateToken(newUser);
    res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            name: newUser.name
        }
    });
});

module.exports = router;