// backend/routes/api/theses.js
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const Thesis = require('../../models/Thesis');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const { check, validationResult } = require('express-validator');
const axios = require('axios');

// --- AI Service Configuration ---
const AI_SERVICE_BASE_URL = 'http://127.0.0.1:5001'; // Base URL of your local Python AI service

// --- Helper function to call the AI model (for general analysis) ---
const getAIAnalysis = async (text) => {
    console.log("Starting AI analysis via local Python service...");

    try {
        const response = await axios.post(`${AI_SERVICE_BASE_URL}/analyze`, { text });
        const analysis = response.data;

        console.log("AI analysis finished.");
        return analysis;
    } catch (aiError) {
        console.error("Error during AI analysis call to local service:", aiError.message);
        if (aiError.response) {
            console.error("AI Service Response Data:", aiError.response.data);
            console.error("AI Service Response Status:", aiError.response.status);
        }
        return {
            summary: 'AI analysis failed.',
            keywords: [],
            sentiment: 'Failed'
        };
    }
};

// Configure Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Create the Multer upload middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});

// @route   POST api/theses
// @desc    Submit a new thesis
// @access  Private
router.post(
    '/',
    auth,
    upload.single('thesisFile'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ msg: 'No file uploaded. Thesis file is required.' });
            }

            const { title, abstract, authorName, department, submissionYear, supervisor, keywords } = req.body;

            const relativeFilePath = path.join('uploads', req.file.filename);

            const newThesis = new Thesis({
                user: req.user.id,
                title,
                abstract,
                authorName,
                department,
                submissionYear,
                supervisor,
                keywords: keywords.split(',').map(keyword => keyword.trim()),
                filePath: relativeFilePath,
                fileName: req.file.originalname,
                analysisStatus: 'pending'
            });

            await newThesis.save();

            // Trigger AI analysis asynchronously after saving the thesis
            (async () => {
                try {
                    const pdfPath = path.join(__dirname, '../../', newThesis.filePath);
                    if (!fs.existsSync(pdfPath)) {
                        console.error(`PDF file not found for analysis: ${pdfPath}`);
                        newThesis.analysisStatus = 'failed';
                        await newThesis.save();
                        return;
                    }

                    const dataBuffer = fs.readFileSync(pdfPath);
                    const pdfData = await pdf(dataBuffer);
                    const fullText = pdfData.text;

                    const aiResults = await getAIAnalysis(fullText);

                    newThesis.aiSummary = aiResults.summary;
                    newThesis.aiKeywords = aiResults.keywords;
                    newThesis.aiSentiment = aiResults.sentiment;
                    newThesis.analysisStatus = 'complete';
                    await newThesis.save();
                    console.log(`AI analysis completed for thesis: ${newThesis._id}`);
                } catch (aiErr) {
                    console.error(`Error during background AI analysis for thesis ${newThesis._id}:`, aiErr.message);
                    newThesis.analysisStatus = 'failed';
                    await newThesis.save();
                }
            })();

            res.status(201).json(newThesis);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// --- New: Route for Editorial Assistant (Grammar Checker) ---
// @route   POST api/theses/check-grammar
// @desc    Check grammar of provided text using AI service
// @access  Private
router.post('/check-grammar', auth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ msg: 'Text is required for grammar check.' });
        }

        const response = await axios.post(`${AI_SERVICE_BASE_URL}/check-grammar`, { text });
        res.json(response.data);
    } catch (error) {
        console.error('Error calling grammar checker AI service:', error.message);
        if (error.response) {
            console.error("AI Service Response Data:", error.response.data);
            console.error("AI Service Response Status:", error.response.status);
        }
        res.status(500).json({ msg: 'Failed to perform grammar check.' });
    }
});

// --- New: Route for Plagiarism Scan ---
// @route   POST api/theses/check-plagiarism
// @desc    Perform plagiarism scan on provided text using AI service
// @access  Private
router.post('/check-plagiarism', auth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ msg: 'Text is required for plagiarism scan.' });
        }

        const response = await axios.post(`${AI_SERVICE_BASE_URL}/check-plagiarism`, { text });
        res.json(response.data);
    } catch (error) {
        console.error('Error calling plagiarism checker AI service:', error.message);
        if (error.response) {
            console.error("AI Service Response Data:", error.response.data);
            console.error("AI Service Response Status:", error.response.status);
        }
        res.status(500).json({ msg: 'Failed to perform plagiarism scan.' });
    }
});


// @route   GET api/theses
// @desc    Get all theses
// @access  Public
router.get('/', async (req, res) => {
    try {
        const theses = await Thesis.find().sort({ date: -1 });
        res.json(theses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/theses/pending
// @desc    Get all pending theses for admin/supervisor dashboard
// @access  Private (Admin & Supervisor only)
router.get('/pending', auth, role(['admin', 'supervisor']), async (req, res) => {
    try {
        const pendingTheses = await Thesis.find({ status: 'pending' }).populate('user', ['username']);
        res.json(pendingTheses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/theses/me
// @desc    Get all theses for the authenticated user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const userTheses = await Thesis.find({ user: req.user.id });
        res.json(userTheses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/theses/public
// @desc    Get all public and approved theses
// @access  Public
router.get('/public', async (req, res) => {
    try {
        const publicTheses = await Thesis.find({ status: 'approved', isPublic: true });
        res.json(publicTheses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/theses/:id
// @desc    Get a single thesis by ID
// @access  Public (for approved/public theses) or Private (for user/admin)
router.get('/:id', auth, async (req, res) => {
    try {
        const thesis = await Thesis.findById(req.params.id).populate('user', ['username']);

        if (!thesis) {
            return res.status(404).json({ msg: 'Thesis not found' });
        }

        const isPublic = thesis.status === 'approved' && thesis.isPublic;
        const isOwner = req.user && req.user.id.toString() === thesis.user._id.toString();
        const isAdminOrSupervisor = req.user && (req.user.role === 'admin' || req.user.role === 'supervisor');

        if (isPublic || isOwner || isAdminOrSupervisor) {
            res.json(thesis);
        } else {
            return res.status(403).json({ msg: 'Access denied. You do not have permission to view this thesis.' });
        }
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Thesis not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/theses/:id/approve
// @desc    Approve a pending thesis
// @access  Private (Admin & Supervisor Only)
router.put('/:id/approve', auth, role(['admin', 'supervisor']), async (req, res) => {
    try {
        const thesis = await Thesis.findById(req.params.id);
        if (!thesis) {
            return res.status(404).json({ message: 'Thesis not found' });
        }

        thesis.status = 'approved';
        await thesis.save();
        res.status(200).json({ message: 'Thesis approved successfully', thesis });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/theses/:id/reject
// @desc    Reject a pending thesis
// @access  Private (Admin & Supervisor Only)
router.put('/:id/reject', auth, role(['admin', 'supervisor']), async (req, res) => {
    try {
        const thesis = await Thesis.findById(req.params.id);
        if (!thesis) {
            return res.status(404).json({ message: 'Thesis not found' });
        }

        thesis.status = 'rejected';
        await thesis.save();
        res.status(200).json({ message: 'Thesis rejected successfully', thesis });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;