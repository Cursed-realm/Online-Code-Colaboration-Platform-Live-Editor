const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

// All project routes are protected
router.use(protect);

// Create project
router.post('/', projectController.createProject);

// Specific project operations (these must come before wildcard :roomId)
router.get('/user/projects', projectController.getUserProjects);
router.get('/:roomId', projectController.getProject);
router.post('/:roomId/join', projectController.joinProject);
router.put('/:roomId', projectController.updateProject);
router.delete('/:roomId', projectController.deleteProject);

module.exports = router;
