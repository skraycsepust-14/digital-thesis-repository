// backend/middleware/adminAuth.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // Correctly decode the JWT using the environment variable secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // IMPORTANT FIX:
        // The JWT payload is structured as { user: { id: ..., role: ... } }
        // We must assign the inner user object to req.user for consistency.
        req.user = decoded.user;

        // Now, the role can be checked directly on req.user
        if (req.user.role === 'admin' || req.user.role === 'supervisor') {
            next();
        } else {
            res.status(403).json({ msg: 'Access denied. You do not have the required permissions.' });
        }
    } catch (err) {
        // This will catch any token validation errors
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
