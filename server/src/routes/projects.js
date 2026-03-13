const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectProgress,
  getDashboardStats,
  assignTeam,
  toggleProjectActivation,
  uploadAssets,
  getAssignedProjects
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');
const { handleUpload, uploadBrandAssets } = require('../middleware/upload');

// All routes are protected
router.use(protect);

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// Assigned projects
router.get('/assigned', getAssignedProjects);

// Project routes
router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(authorize('admin'), deleteProject);

router.route('/:id/progress').get(getProjectProgress);

// Team assignment (Admin only)
router.put('/:id/assign-team', authorize('admin'), assignTeam);

// Project activation (Admin only)
router.put('/:id/activate', authorize('admin'), toggleProjectActivation);

// Brand assets upload
router.post('/:id/assets', handleUpload(uploadBrandAssets), uploadAssets);

module.exports = router;