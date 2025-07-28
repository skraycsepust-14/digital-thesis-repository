require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const app = express();

connectDB();

app.use(express.json({ extended: false }));
app.use(cors());

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define API routes - They must be placed before any frontend serving
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/theses', require('./routes/api/theses'));

// The fix: Serve the frontend's static files and handle all other routes
// This should be placed at the end of your routes
if (process.env.NODE_ENV === 'production') {
    // Serve any static files from the 'dist' directory
    app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

    // All other GET requests will serve the frontend's index.html file
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '..', 'frontend', 'dist', 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));