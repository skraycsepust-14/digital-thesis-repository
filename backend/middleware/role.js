// This is a higher-order function that takes an array of roles
module.exports = (roles) => (req, res, next) => {
    // Check if the user object exists from the auth middleware
    if (!req.user || !req.user.role) {
        return res.status(401).json({ msg: 'Authorization denied, user role not found' });
    }

    const userRole = req.user.role;

    // Check if the user's role is in the list of allowed roles
    if (!roles.includes(userRole)) {
        return res.status(403).json({ msg: 'Access denied, insufficient permissions' });
    }

    // If the role is allowed, proceed to the next middleware/route handler
    next();
};