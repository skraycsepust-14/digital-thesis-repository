const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const Thesis = require('../../models/Thesis');
const thesisLogger = require('../../middleware/thesisLogger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// PUBLIC: Get approved theses with optional filtering/sorting
router.get('/', async (req, res) => {
    try {
        const { department, supervisor, submissionYear, sort } = req.query;
        let filter = {};
        if (department) filter.department = department;
        if (supervisor) filter.supervisor = supervisor;
        if (submissionYear) filter.submissionYear = submissionYear;

        let sortOption = {};
        if (sort === 'oldest') sortOption.submissionDate = 1;
        else if (sort === 'title_asc') sortOption.title = 1;
        else if (sort === 'title_desc') sortOption.title = -1;
        else sortOption.submissionDate = -1;

        const theses = await Thesis.find({ ...filter, status: 'approved' }).sort(sortOption);
        res.json(theses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUBLIC: Search theses
router.get('/search', async (req, res) => {
    try {
        const { q, department, supervisor, submissionYear, sort } = req.query;
        let filter = {};
        if (q) {
            const regex = new RegExp(q, 'i');
            filter.$or = [
                { title: regex },
                { authorName: regex },
                { abstract: regex }
            ];
        }
        if (department) filter.department = department;
        if (supervisor) filter.supervisor = supervisor;
        if (submissionYear) filter.submissionYear = submissionYear;

        let sortOption = {};
        if (sort === 'oldest') sortOption.submissionDate = 1;
        else if (sort === 'title_asc') sortOption.title = 1;
        else if (sort === 'title_desc') sortOption.title = -1;
        else sortOption.submissionDate = -1;

        const theses = await Thesis.find({ ...filter, status: 'approved' }).sort(sortOption);
        res.json(theses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUBLIC: Distinct fields
router.get('/departments', async (_, res) => {
    try {
        const departments = await Thesis.distinct('department');
        res.json(departments);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/supervisors', async (_, res) => {
    try {
        const supervisors = await Thesis.distinct('supervisor');
        res.json(supervisors);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// PRIVATE (Admin/Supervisor): Analytics
router.get('/analytics/by-department', auth, role(['admin', 'supervisor']), async (_, res) => {
    try {
        const data = await Thesis.aggregate([
            { $match: { status: 'approved' } },
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        res.json(data);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/analytics/by-status', auth, role(['admin', 'supervisor']), async (_, res) => {
    try {
        const data = await Thesis.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        res.json(data);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// PRIVATE: Get pending
router.get('/pending', auth, role(['admin', 'supervisor']), async (_, res) => {
    try {
        const theses = await Thesis.find({ status: 'pending' });
        res.json(theses);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// PRIVATE: Get current user's theses
router.get('/my-theses', auth, async (req, res) => {
    try {
        const theses = await Thesis.find({ user: req.user.id }).sort({ submissionDate: -1 });
        res.json(theses);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// PRIVATE: Get thesis by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const thesis = await Thesis.findById(req.params.id);
        if (!thesis || (thesis.status !== 'approved' && req.user.id !== thesis.user.toString() && !['admin', 'supervisor'].includes(req.user.role))) {
            return res.status(404).json({ msg: 'Thesis not found or not authorized' });
        }
        res.json(thesis);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// PRIVATE: Upload thesis
router.post('/', auth, upload.single('thesisFile'), async (req, res) => {
    try {
        const { title, authorName, department, submissionYear, abstract, keywords, supervisor } = req.body;

        if (!req.file) return res.status(400).json({ msg: 'Thesis file is required' });

        const newThesis = new Thesis({
            user: req.user.id,
            title,
            authorName,
            department,
            submissionYear,
            abstract,
            keywords: keywords.split(',').map(k => k.trim()),
            supervisor,
            filePath: req.file.path,
            fileName: req.file.originalname
        });

        const thesis = await newThesis.save();
        res.json(thesis);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// PRIVATE: Update thesis (optional file)
router.put('/:id', auth, upload.single('thesisFile'), async (req, res) => {
    try {
        const thesis = await Thesis.findById(req.params.id);
        if (!thesis) return res.status(404).json({ msg: 'Thesis not found' });

        if (thesis.user.toString() !== req.user.id || thesis.status !== 'pending') {
            return res.status(401).json({ msg: 'Not authorized or thesis already reviewed' });
        }

        if (req.file) {
            // Delete old file
            if (thesis.filePath && fs.existsSync(thesis.filePath)) {
                fs.unlinkSync(thesis.filePath);
            }
            thesis.filePath = req.file.path;
            thesis.fileName = req.file.originalname;
        }

        const { title, authorName, department, submissionYear, abstract, keywords, supervisor } = req.body;
        thesis.title = title;
        thesis.authorName = authorName;
        thesis.department = department;
        thesis.submissionYear = submissionYear;
        thesis.abstract = abstract;
        thesis.keywords = Array.isArray(keywords) ? keywords : keywords.split(',').map(k => k.trim());
        thesis.supervisor = supervisor;

        const updated = await thesis.save();
        res.json(updated);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// PRIVATE: Approve/reject
router.put('/approve/:id', auth, role(['admin', 'supervisor']), thesisLogger, async (req, res) => {
    try {
        const thesis = await Thesis.findById(req.params.id);
        if (!thesis) return res.status(404).json({ msg: 'Thesis not found' });
        thesis.status = 'approved';
        await thesis.save();
        res.json(thesis);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.put('/reject/:id', auth, role(['admin', 'supervisor']), thesisLogger, async (req, res) => {
    try {
        const thesis = await Thesis.findById(req.params.id);
        if (!thesis) return res.status(404).json({ msg: 'Thesis not found' });
        thesis.status = 'rejected';
        await thesis.save();
        res.json(thesis);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// PRIVATE: Delete thesis
router.delete('/:id', auth, async (req, res) => {
    try {
        const thesis = await Thesis.findById(req.params.id);
        if (!thesis) return res.status(404).json({ msg: 'Thesis not found' });

        if (thesis.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Delete file
        if (thesis.filePath && fs.existsSync(thesis.filePath)) {
            fs.unlinkSync(thesis.filePath);
        }

        await thesis.remove();
        res.json({ msg: 'Thesis removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
