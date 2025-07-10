const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/clinicalDataController');
const path = require('path');
const upload = require('../config/multer');
const { logActivity } = require('../middleware/activityLogger');


router.get('/', ctrl.getAllClinicalData);

router.get('/by-beneficiary/:beneficiaryId', ctrl.getClinicalDataByBeneficiary);

router.get('/:id', ctrl.getClinicalDataById);

router.put('/:id', logActivity(), ctrl.updateClinicalData);

router.delete('/:id', logActivity(), ctrl.deleteClinicalData);


router.delete('/by-beneficiary/:beneficiaryId', logActivity(), ctrl.deleteClinicalDataByBeneficiary);

router.post('/', upload.single('file'), logActivity(), ctrl.createClinicalData);
module.exports = router;