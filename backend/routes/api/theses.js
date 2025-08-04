const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const Thesis = require('../../models/Thesis');
const User = require('../../models/User');
const thesisLogger = require('../../middleware/thesisLogger');
const sendEmail = require('../../utils/sendEmail');
const multer = require('multer');
const path = require('path');

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Public GET routes
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

router.get('/departments', async (req, res) => {
  try {
    const departments = await Thesis.distinct('department');
    res.json(departments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/supervisors', async (req, res) => {
  try {
    const supervisors = await Thesis.distinct('supervisor');
    res.json(supervisors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Analytics routes
router.get('/analytics/by-department', auth, role(['admin', 'supervisor']), async (req, res) => {
  try {
    const data = await Thesis.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/analytics/by-status', auth, role(['admin', 'supervisor']), async (req, res) => {
  try {
    const data = await Thesis.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Authenticated GET routes
router.get('/pending', auth, role(['admin', 'supervisor']), async (req, res) => {
  try {
    const theses = await Thesis.find({ status: 'pending' });
    res.json(theses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/my-theses', auth, async (req, res) => {
  try {
    const theses = await Thesis.find({ user: req.user.id }).sort({ submissionDate: -1 });
    res.json(theses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (
      !thesis ||
      (thesis.status !== 'approved' &&
        req.user.id !== thesis.user.toString() &&
        !['admin', 'supervisor'].includes(req.user.role))
    ) {
      return res.status(404).json({ msg: 'Thesis not found or not authorized' });
    }
    res.json(thesis);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST - Upload thesis + Notify admins
router.post('/', auth, upload.single('thesisFile'), async (req, res) => {
  try {
    const { title, authorName, department, submissionYear, abstract, keywords, supervisor } = req.body;

    if (!req.file) {
      return res.status(400).json({ msg: 'Thesis file is required' });
    }

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

    // 🔔 Email notify admins
    const admins = await User.find({ role: 'admin' }).select('email');
    const adminEmails = admins.map(a => a.email);
    if (adminEmails.length > 0) {
      await sendEmail(
        adminEmails.join(','),
        'New Thesis Submission',
        `New thesis submitted:\n\nTitle: ${title}\nAuthor: ${authorName}\nDepartment: ${department}\nSupervisor: ${supervisor}`
      );
    }

    res.json(thesis);
  } catch (err) {
    console.error('Thesis upload error:', err.message);
    res.status(500).send('Server Error');
  }
});

// PUT - Approve/Reject
router.put('/approve/:id', auth, role(['admin', 'supervisor']), thesisLogger, async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ msg: 'Thesis not found' });
    thesis.status = 'approved';
    await thesis.save();
    res.json(thesis);
  } catch (err) {
    console.error(err.message);
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
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT - Update editable fields
router.put('/:id', auth, async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ msg: 'Thesis not found' });
    if (thesis.user.toString() !== req.user.id || thesis.status !== 'pending') {
      return res.status(401).json({ msg: 'Not authorized or thesis already reviewed' });
    }

    const fieldsToUpdate = {
      title: req.body.title,
      authorName: req.body.authorName,
      department: req.body.department,
      submissionYear: req.body.submissionYear,
      abstract: req.body.abstract,
      keywords: Array.isArray(req.body.keywords)
        ? req.body.keywords
        : req.body.keywords.split(',').map(k => k.trim()),
      supervisor: req.body.supervisor
    };

    const updated = await Thesis.findByIdAndUpdate(req.params.id, { $set: fieldsToUpdate }, { new: true });
    res.json(updated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ msg: 'Thesis not found' });
    if (thesis.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    await thesis.remove();
    res.json({ msg: 'Thesis removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
