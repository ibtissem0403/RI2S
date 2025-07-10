const express = require('express');
const router = express.Router();
const experimentationController = require('../controllers/experimentationController');
const { logActivity } = require('../middleware/activityLogger');

// Routes existantes
router.post('/', logActivity(), experimentationController.createExperimentation);
router.get('/', experimentationController.getAllExperimentations);
router.get('/:id', experimentationController.getExperimentationById);
router.put('/:id', logActivity(), experimentationController.updateExperimentation);
router.delete('/:id', logActivity(), experimentationController.deleteExperimentation);

// Nouvelles routes
router.post('/complete', logActivity(), experimentationController.createExperimentationComplete);
router.get('/:id/complete', experimentationController.getExperimentationComplete);

module.exports = router;