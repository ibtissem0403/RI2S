const express = require("express");
const router = express.Router();
const beneficiaryCtrl = require("../controllers/beneficiaryController");
const {
  associateToExperimentation,
} = require("../controllers/beneficiaireExperimentationController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../config/multer");
const { logActivity } = require("../middleware/activityLogger");

router.post(
  "/",
  authMiddleware.protect,
  upload.array("clinicalDocuments"),
  logActivity(),
  beneficiaryCtrl.createBeneficiary
);

// GET /api/beneficiaries
router.get("/", beneficiaryCtrl.getAllBeneficiaries);

// GET /api/beneficiaries/:id
// routes/beneficiary.js
router.get("/pseudo/:pseudoId", beneficiaryCtrl.getBeneficiary); // Nouveau format
router.post("/pseudo/:pseudoId/associate", associateToExperimentation);
// PUT /api/beneficiaries/:id
router.put(
  "/pseudo/:pseudoId",
  authMiddleware.protect,
  logActivity(),
  beneficiaryCtrl.updateBeneficiary
);
// DELETE /api/beneficiaries/:beneficiaryId/clinical-data
router.delete(
  "/:beneficiaryId/clinical-data",
  authMiddleware.protect,
  logActivity(),
  beneficiaryCtrl.deleteClinicalDataByBeneficiary
);

// DELETE /api/beneficiaries/:id (suppression complète)
router.delete(
  "/:id",
  authMiddleware.protect,
  logActivity(),
  beneficiaryCtrl.deleteBeneficiary
);

// AJOUT OBLIGATOIRE
router.get(
  "/:beneficiaryId/clinical-data",
  authMiddleware.protect,
  logActivity(),
  beneficiaryCtrl.getBeneficiaryClinicalData
);

router.get(
  "/convert/:pseudoId",
  authMiddleware.protect,
  beneficiaryCtrl.convertPseudoIdToRealId
);

module.exports = router;
