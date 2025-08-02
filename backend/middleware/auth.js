const jwt = require('jsonwebtoken');
const config = require('config');
const admin = require('../firebaseAdmin'); // Import Firebase Admin SDK

module.exports = async function (req, res, next) {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // FIRST: Try to verify the token with your custom JWT secret
        const decoded = jwt.verify(token, config.get('jwtSecret'));
        req.user = decoded.user;
        return next(); // If successful, move on
    } catch (jwtErr) {
        // If custom JWT verification fails, try to verify with Firebase Admin SDK
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            // If the Firebase token is valid, create a user object for your routes
            req.user = {
                id: decodedToken.uid,
                email: decodedToken.email,
                // You may want to fetch the user's role from your database here
                // or use a default value if you haven't set up custom claims in Firebase
                role: 'user' 
            };
            return next(); // If successful, move on
        } catch (firebaseErr) {
            // If both verifications fail, send an authorization denied error
            console.error('Authentication failed:', jwtErr.message, ' and ', firebaseErr.message);
            return res.status(401).json({ msg: 'Token is not valid' });
        }
    }
};