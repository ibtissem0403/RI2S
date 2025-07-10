// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, notificationController.getUserNotifications);
router.put('/:id', protect, notificationController.markAsRead);
router.put('/', protect, notificationController.markAllAsRead);
// Marquer les notifications liées à un signal comme lues
router.put(
    '/signal/:signalId/mark-read',
    protect,
    async (req, res) => {
      try {
        const { signalId } = req.params;
        
        const result = await Notification.updateMany(
          {
            user: req.user._id,
            'relatedTo.model': 'WeakSignal',
            'relatedTo.id': signalId,
            isRead: false
          },
          { isRead: true }
        );
        
        res.json({
          message: 'Notifications liées au signal marquées comme lues',
          count: result.modifiedCount || result.nModified || 0
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

module.exports = router;
