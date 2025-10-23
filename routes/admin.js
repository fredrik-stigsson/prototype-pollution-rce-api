const express = require('express');
const child_process = require('child_process');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { database } = require('../config/database');

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);
router.use(requireAdmin);

// VULNERABLE: RCE endpoint for admin users
router.post('/execute', (req, res) => {
    const { command, timeout = 5000 } = req.body;

    if (!command) {
        return res.status(400).json({ error: 'Command is required' });
    }

    // VULNERABLE: Direct command execution for admin
    child_process.exec(command, { timeout }, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ 
                error: error.message,
                stderr: stderr 
            });
        }

        res.json({
            command: command,
            output: stdout
        });
    });
});

// VULNERABLE: Eval endpoint for calculations
router.post('/eval', (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    try {
        // VULNERABLE: Direct eval execution
        const result = eval(code);
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// VULNERABLE: System info endpoint
router.get('/system-info', (req, res) => {
    const config = {
        allowedInfo: ['version', 'platform', 'arch'],
        maxDepth: 2
    };

    // Get system information
    const info = {};
    
    if (config.allowedInfo.includes('version') || config.allowAll) {
        info.version = process.version;
    }
    if (config.allowedInfo.includes('platform') || config.allowAll) {
        info.platform = process.platform;
    }
    if (config.allowedInfo.includes('arch') || config.allowAll) {
        info.arch = process.arch;
    }

    // VULNERABLE: If prototype polluted, we might expose more
    if (config.exposeEnv) {
        info.env = process.env;
    }

    res.json(info);
});

module.exports = router;