const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token
 * @param {object} payload 
 * @returns {string}
 */
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'secretkey');
};

/**
 * Verify a JWT token
 * @param {string} token 
 * @returns {object|null} Decoded payload or null if invalid
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    } catch (error) {
        return null;
    }
};

module.exports = { generateToken, verifyToken };
