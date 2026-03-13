const express = require('express');
const router = express.Router();
const {
  getOffer,
  upsertOffer,
  addBonus,
  removeBonus
} = require('../controllers/offerController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Offer routes
router.route('/:projectId')
  .get(getOffer)
  .post(upsertOffer);

// Bonus routes
router.post('/:projectId/bonuses', addBonus);
router.delete('/:projectId/bonuses/:bonusId', removeBonus);

module.exports = router;