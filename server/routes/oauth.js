const router = require('express').Router();

router.get('/google', (req, res) => res.json({ message: 'TODO' }));
router.get('/google/callback', (req, res) => res.json({ message: 'TODO' }));

module.exports = router;
