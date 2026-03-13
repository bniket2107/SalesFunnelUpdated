const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectProgress,
  getDashboardStats
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// Project routes
router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

router.route('/:id/progress').get(getProjectProgress);

module.exports = router;