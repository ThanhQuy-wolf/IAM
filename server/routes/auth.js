const router = require('express').Router();

// POST /api/auth/register
router.post('/register', (req, res) => res.json({ message: 'TODO' }));

// POST /api/auth/login
router.post('/login', (req, res) => res.json({ message: 'TODO' }));

// POST /api/auth/refresh
router.post('/refresh', (req, res) => res.json({ message: 'TODO' }));

// POST /api/auth/logout
router.post('/logout', (req, res) => res.json({ message: 'TODO' }));

// GET /api/auth/me
router.get('/me', (req, res) => res.json({ message: 'TODO' }));

module.exports = router;
