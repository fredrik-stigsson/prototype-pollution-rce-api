// VULNERABLE: Helper functions with prototype pollution risks

// Unsafe object copy
function copyObject(obj) {
    const newObj = {};
    for (const key in obj) {
        newObj[key] = obj[key];
    }
    return newObj;
}

// Unsafe deep clone
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    
    const cloned = {};
    for (const key in obj) {
        cloned[key] = deepClone(obj[key]);
    }
    return cloned;
}

// VULNERABLE: Config merger
function mergeConfig(defaults, overrides) {
    const config = deepClone(defaults);
    
    for (const key in overrides) {
        if (typeof overrides[key] === 'object' && overrides[key] !== null) {
            if (!config[key]) config[key] = {};
            mergeConfig(config[key], overrides[key]);
        } else {
            config[key] = overrides[key];
        }
    }
    
    return config;
}

module.exports = {
    copyObject,
    deepClone,
    mergeConfig
};