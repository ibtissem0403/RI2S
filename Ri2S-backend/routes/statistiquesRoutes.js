const express = require('express');
const router = express.Router();
const statistiquesController = require('../controllers/statistiquesController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { logActivity } = require('../middleware/activityLogger');

// Tableau de bord principal
router.get(
  '/tableau-de-bord',
  protect,
  statistiquesController.getTableauDeBord
);

// Rapport détaillé d'une expérimentation
router.get(
  '/experimentation/:experimentationId',
  protect,
  statistiquesController.getRapportExperimentation
);

// Comparaison entre expérimentations
router.post(
  '/comparer-experimentations',
  protect,
  logActivity(),
  statistiquesController.comparerExperimentations
);

// Rapport d'efficacité des actions
router.get(
  '/efficacite-actions',
  protect,
  statistiquesController.getRapportEfficaciteActions
);

// Export des données
router.get(
  '/export',
  protect,
  logActivity(),
  statistiquesController.exporterDonnees
);
// Génération de rapport PDF
router.get(
    '/rapport-pdf',
    protect,
    logActivity(),
    statistiquesController.genererRapportPDF
  );
module.exports = router;