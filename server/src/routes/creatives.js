const express = require('express');
const router = express.Router();
const {
  getCreativeStrategy,
  upsertCreativeStrategy,
  addCreative,
  updateCreative,
  deleteCreative,
  generateCreativeCards
} = require('../controllers/creativeController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Creative strategy routes
router.route('/:projectId')
  .get(getCreativeStrategy)
  .post(upsertCreativeStrategy);

// Generate creative cards
router.post('/:projectId/generate', generateCreativeCards);

// Creative item routes
router.post('/:projectId/stages/:stage/creatives', addCreative);
router.put('/:projectId/stages/:stage/creatives/:creativeId', updateCreative);
router.delete('/:projectId/stages/:stage/creatives/:creativeId', deleteCreative);

module.exports = router;