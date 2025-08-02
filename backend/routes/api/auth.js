const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');

// Import the Firebase Admin SDK
const admin = require('../../firebaseAdmin');

const auth = require('../../middleware/auth');

// @route   GET api/auth
// @desc    Get authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth
// @desc    Authenticate user & get token (standard email/password login)
// @access  Public
router.post(
    '/',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if (!user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            const payload = {
                user: {
                    id: user.id,
                    role: user.role,
                },
            };

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: '1h' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   POST api/auth/google
// @desc    Authenticate user with Firebase Google ID token & get custom JWT
// @access  Public
router.post('/google', async (req, res) => {
    const { idToken } = req.body;

    try {
        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email, name } = decodedToken;

        // Check if the user already exists in your database
        let user = await User.findOne({ email });

        if (!user) {
            // If the user doesn't exist, create a new user entry
            // You can generate a random password or use a placeholder
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash('firebase-login', salt); // Placeholder password

            user = new User({
                username: name || email.split('@')[0],
                email,
                password,
                role: 'user', // Default role for new users
            });

            await user.save();
        }

        // Create and return your own custom JWT for the user
        const payload = {
            user: {
                id: user.id,
                role: user.role,
            },
        };

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        console.error('Firebase authentication error:', err.message);
        res.status(401).json({ msg: 'Firebase token is not valid' });
    }
});

module.exports = router;