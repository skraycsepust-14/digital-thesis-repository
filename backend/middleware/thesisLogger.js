// backend/middleware/thesisLogger.js
const thesisLogger = (req, res, next) => {
    const thesisId = req.params.id;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip; // Note: For accurate IP, you might need 'express-ip' or configure proxy settings

    console.log(`[Thesis Access Log] Thesis ID: ${thesisId}, IP: ${ipAddress}, User-Agent: ${userAgent}`);

    // Call next() to pass control to the next middleware function
    next();
};

module.exports = thesisLogger;