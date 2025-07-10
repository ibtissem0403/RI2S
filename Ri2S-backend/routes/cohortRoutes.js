const express = require('express');
const router = express.Router();
const cohortCtrl = require('../controllers/cohortController');
const { logActivity } = require('../middleware/activityLogger');


// POST /api/cohorts
router.post('/', logActivity(), cohortCtrl.createCohort);

// GET /api/cohorts
router.get('/', cohortCtrl.getAllCohorts);

// GET /api/cohorts/:id
router.get('/:id', cohortCtrl.getCohortById);

// PUT /api/cohorts/:id
router.put('/:id', logActivity(), cohortCtrl.updateCohort);

// DELETE /api/cohorts/:id
router.delete('/:id', logActivity(), cohortCtrl.deleteCohort);

module.exports = router;