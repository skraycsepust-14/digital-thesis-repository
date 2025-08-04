// backend/routes/api/theses.js
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const Thesis = require('../../models/Thesis');
const thesisLogger = require('../../middleware/thesisLogger');

// @route   GET api/theses
// @desc    Get all public theses with optional filtering and sorting
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { department, supervisor, submissionYear, sort } = req.query;
        let filter = {};
        if (department) {
            filter.department = department;
        }
        if (supervisor) {
            filter.supervisor = supervisor;
        }
        if (submissionYear) {
            filter.submissionYear = submissionYear;
        }

        let sortOption = {};
        if (sort === 'oldest') {
            sortOption.submissionDate = 1;
        } else if (sort === 'title_asc') {
            sortOption.title = 1;
        } else if (sort === 'title_desc') {
            sortOption.title = -1;
        } else {
            sortOption.submissionDate = -1;
        }

        const theses = await Thesis.find({ ...filter, status: 'approved' }).sort(sortOption);
        res.json(theses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/theses/search
// @desc    Search public theses by title, author, or abstract with optional filtering and sorting
// @access  Public
router.get('/search', async (req, res) => {
    try {
        const { q, department, supervisor, submissionYear, sort } = req.query;
        let filter = {};

        // Build the search query
        if (q) {
            const regex = new RegExp(q, 'i'); // 'i' for case-insensitive
            filter.$or = [
                { title: regex },
                { authorName: regex },
                { abstract: regex }
            ];
        }

        // Apply additional filters
        if (department) {
            filter.department = department;
        }
        if (supervisor) {
            filter.supervisor = supervisor;
        }
        if (submissionYear) {
            filter.submissionYear = submissionYear;
        }

        let sortOption = {};
        if (sort === 'oldest') {
            sortOption.submissionDate = 1;
        } else if (sort === 'title_asc') {
            sortOption.title = 1;
        } else if (sort === 'title_desc') {
            sortOption.title = -1;
        } else {
            // Default sort for search is relevance or newest
            sortOption.submissionDate = -1;
        }

        const theses = await Thesis.find({ ...filter, status: 'approved' }).sort(sortOption);
        res.json(theses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/theses/departments
// @desc    Get unique list of all departments
// @access  Public
router.get('/departments', async (req, res) => {
    try {
        const departments = await Thesis.distinct('department');
        res.json(departments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/theses/supervisors
// @desc    Get unique list of all supervisors
// @access  Public
router.get('/supervisors', async (req, res) => {
    try {
        const supervisors = await Thesis.distinct('supervisor');
        res.json(supervisors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/theses/pending
// @desc    Get all pending theses
// @access  Private (Admin/Supervisor Only)
router.get('/pending', auth, role(['admin', 'supervisor']), async (req, res) => {
    try {
        const theses = await Thesis.find({ status: 'pending' });
        res.json(theses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/theses/:id
// @desc    Get thesis by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const thesis = await Thesis.findById(req.params.id);
        if (!thesis || (thesis.status !== 'approved' && (!req.user || (req.user.role !== 'admin' && req.user.role !== 'supervisor')))) {
            return res.status(404).json({ msg: 'Thesis not found or not approved' });
        }
        res.json(thesis);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Thesis not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST api/theses
// @desc    Create a thesis
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { title, authorName, department, submissionYear, abstract, keywords, supervisor } = req.body;

        const newThesis = new Thesis({
            user: req.user.id,
            title,
            authorName,
            department,
            submissionYear,
            abstract,
            keywords,
            supervisor,
        });

        const thesis = await newThesis.save();
        res.json(thesis);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/theses/approve/:id
// @desc    Approve a thesis
// @access  Private (Admin/Supervisor Only)
router.put('/approve/:id', auth, role(['admin', 'supervisor']), thesisLogger, async (req, res) => {
    try {
        const thesis = await Thesis.findById(req.params.id);
        if (!thesis) {
            return res.status(404).json({ msg: 'Thesis not found' });
        }
        thesis.status = 'approved';
        await thesis.save();
        res.json(thesis);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/theses/reject/:id
// @desc    Reject a thesis
// @access  Private (Admin/Supervisor Only)
router.put('/reject/:id', auth, role(['admin', 'supervisor']), thesisLogger, async (req, res) => {
    try {
        const thesis = await Thesis.findById(req.params.id);
        if (!thesis) {
            return res.status(404).json({ msg: 'Thesis not found' });
        }
        thesis.status = 'rejected';
        await thesis.save();
        res.json(thesis);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/theses/my-theses
// @desc    Get theses submitted by the current user
// @access  Private
router.get('/my-theses', auth, async (req, res) => {
    try {
        const theses = await Thesis.find({ user: req.user.id }).sort({ submissionDate: -1 });
        res.json(theses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;