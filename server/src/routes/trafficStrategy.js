const express = require('express');
const router = express.Router();
const {
  getTrafficStrategy,
  upsertTrafficStrategy,
  addHook,
  removeHook,
  toggleChannel
} = require('../controllers/trafficStrategyController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Traffic strategy routes
router.route('/:projectId')
  .get(getTrafficStrategy)
  .post(upsertTrafficStrategy);

// Hook routes
router.post('/:projectId/hooks', addHook);
router.delete('/:projectId/hooks/:hookId', removeHook);

// Channel routes
router.patch('/:projectId/channels/:channelName', toggleChannel);

module.exports = router;