const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/github', authController.githubLogin);
router.get('/github/callback', authController.githubCallback);

// Protected routes
router.get('/me', protect, authController.getMe);

module.exports = router;
