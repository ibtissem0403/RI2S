const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Seuls les admins peuvent voir les logs d'activité
router.get(
  '/',
  protect,
  authorize('admin'),
  activityLogController.getActivityLogs
);

router.get(
  '/summary',
  protect,
  authorize('admin'),
  activityLogController.getActivitySummary
);

module.exports = router;