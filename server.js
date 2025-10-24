const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json({ extended: true })); // Vulnerable extended parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/admin', require('./routes/admin'));

// Initialize database
require('./config/database').initialize();

app.listen(PORT, () => {
    console.log(`🚨 Vulnerable API running on http://localhost:${PORT}`);
    console.log('⚠️  WARNING: Contains prototype pollution and RCE vulnerabilities');
    console.log('🎯 Educational purposes only - DO NOT USE IN PRODUCTION');
});

module.exports = app;