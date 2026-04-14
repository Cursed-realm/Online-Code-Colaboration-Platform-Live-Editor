const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const { protect } = require('../middleware/auth');

// All GitHub routes are protected
router.use(protect);

// Get repositories
router.get('/repositories', githubController.getRepositories);

// Get GitHub user info
router.get('/user', githubController.getGithubUser);

// Push code to GitHub
router.post('/push', githubController.pushToGithub);

module.exports = router;
