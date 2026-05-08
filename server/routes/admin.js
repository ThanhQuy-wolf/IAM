const router = require('express').Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate, authorize('admin'));

router.get('/users', (req, res) => res.json({ message: 'TODO' }));
router.patch('/users/:id/role', (req, res) => res.json({ message: 'TODO' }));
router.delete('/users/:id', (req, res) => res.json({ message: 'TODO' }));
router.get('/stats', (req, res) => res.json({ message: 'TODO' }));

module.exports = router;
