const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../data/database.json');

// VULNERABLE: Unsafe database operations
class Database {
    constructor() {
        this.data = this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(DB_PATH)) {
                const rawData = fs.readFileSync(DB_PATH, 'utf8');
                return JSON.parse(rawData);
            }
        } catch (error) {
            console.error('Database load error:', error);
        }
        
        // Default data with admin user
        return {
            users: [
                {
                    id: 1,
                    email: 'admin@example.com',
                    password: bcrypt.hashSync('admin123', 10),
                    role: 'admin',
                    name: 'System Administrator'
                },
                {
                    id: 2,
                    email: 'user@example.com',
                    password: bcrypt.hashSync('user123', 10),
                    role: 'user',
                    name: 'Regular Person'
                },
                {
                    id: 3,
                    email: 'harald@example.com',
                    password: bcrypt.hashSync('harald123', 10),
                    role: 'user',
                    name: 'Harald Bluetooth'
                },
                {
                    id: 4,
                    email: 'hacker@example.com',
                    password: bcrypt.hashSync('hacker123', 10),
                    role: 'admin',
                    name: 'Very Kind Person'
                }
            ],
            config: {
                debug: false,
                maxLoginAttempts: 5
            }
        };
    }

    save() {
        try {
            fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('Database save error:', error);
            return false;
        }
    }

    // VULNERABLE: Finds user with prototype pollution risk
    findUser(query) {
        const users = this.data.users;
        for (const user of users) {
            let match = true;
            for (const key in query) {
                if (user[key] !== query[key]) {
                    match = false;
                    break;
                }
            }
            if (match) return user;
        }
        return null;
    }

    // VULNERABLE: Add user with unsafe merge
    addUser(user, rest) {
        if (!user) return null;
        
        // Vulnerable object merge
        for (const key in rest) {
            if (typeof rest[key] === 'object' && rest[key] !== null) {
                if (!user[key]) user[key] = {};
                this.mergeObjects(user[key], rest[key]);
            } else {
                user[key] = rest[key];
            }
        }

        this.data.users.push(user);
        this.save();
        return user;
    }

    // VULNERABLE: Updates user with unsafe merge
    updateUser(userId, updates) {
        const user = this.data.users.find(u => u.id === userId);
        if (!user) return null;

        // Vulnerable object merge
        for (const key in updates) {
            if (typeof updates[key] === 'object' && updates[key] !== null) {
                if (!user[key]) user[key] = {};
                this.mergeObjects(user[key], updates[key]);
            } else {
                user[key] = updates[key];
            }
        }

        this.save();
        return user;
    }

    // VULNERABLE: Prototype-pollutable merge function
    mergeObjects(target, source, visited = new WeakMap()) {
        // Prevent infinite recursion with circular references
        if (visited.has(source)) {
            return target;
        }
        visited.set(source, true);
        
        for (const key in source) {
            
            // Only merge own properties, not inherited ones (like polluted properties)
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    this.mergeObjects(target[key], source[key], visited);
                } else if (Array.isArray(source[key])) {
                    target[key] = [...source[key]];
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

}

const database = new Database();

// Initialize with default data
function initialize() {
    database.save();
}

module.exports = { database, initialize };