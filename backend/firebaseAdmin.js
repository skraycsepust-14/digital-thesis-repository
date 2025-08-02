// backend/firebaseAdmin.js
const admin = require('firebase-admin');

// Note: It's highly recommended to use environment variables for this.
// For now, we will use a direct path for simplicity.
// Make sure this file is not exposed to the public.
// This is the service account key you download from the Firebase console.
const serviceAccount = require('./serviceAccountKey.json')

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

module.exports = admin;