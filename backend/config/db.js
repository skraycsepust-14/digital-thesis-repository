const mongoose = require('mongoose');

// Get the MongoDB connection string from process.env
const db = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        // The options { useNewUrlParser: true, useUnifiedTopology: true }
        // are no longer needed and have been removed as they are now
        // the default behavior.
        await mongoose.connect(db);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(err.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;
