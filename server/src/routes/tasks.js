const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMyTasks,
  getAllTasks,
  getTask,
  updateTaskStatus,
  updateTaskContent,
  getTeamMembers,
  uploadTaskFiles
} = require('../controllers/taskController');

// All routes require authentication
router.use(protect);

// Routes for assigned user
router.get('/my-tasks', getMyTasks);
router.put('/:taskId/status', updateTaskStatus);
router.put('/:taskId/content', updateTaskContent);
router.post('/:taskId/upload', uploadTaskFiles);
router.get('/team-members', getTeamMembers);

// Routes for PM/admin
router.get('/', authorize('admin', 'manager', 'performance_marketer'), getAllTasks);
router.get('/:taskId', getTask);

module.exports = router;