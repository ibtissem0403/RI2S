// routes/usagerRI2SStatistiquesRoutes.js
const express = require('express');
const router = express.Router();
const statistiquesController = require('../controllers/usagerRI2SStatistiquesController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Tous les endpoints nécessitent une authentification
// Les statistiques peuvent être limitées aux rôles administratifs et de coordination

// Tableau de bord principal
router.get(
  '/tableau-de-bord',
  protect,
  statistiquesController.getTableauDeBord
);

// Statistiques générales
router.get(
  '/generales',
  protect,
  statistiquesController.getStatistiquesGenerales
);

// Statistiques d'une expérimentation spécifique
router.get(
  '/experimentations/:experimentationId',
  protect,
  statistiquesController.getStatistiquesExperimentation
);

// Export Excel
router.get(
  '/export/excel',
  protect,
  statistiquesController.exporterExcel
);

// Export PDF
router.get(
  '/export/pdf',
  protect,
  statistiquesController.exporterPDF
);

module.exports = router;