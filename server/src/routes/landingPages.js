const express = require('express');
const router = express.Router();
const {
  getLandingPage,
  upsertLandingPage,
  addNurturing,
  removeNurturing
} = require('../controllers/landingPageController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Landing page routes
router.route('/:projectId')
  .get(getLandingPage)
  .post(upsertLandingPage);

// Nurturing routes
router.post('/:projectId/nurturing', addNurturing);
router.delete('/:projectId/nurturing/:nurturingId', removeNurturing);

module.exports = router;