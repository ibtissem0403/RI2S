const express = require('express');
const router = express.Router();
const processusInclusionController = require('../controllers/processusInclusionController');
const authMiddleware = require('../middleware/authMiddleware');
const { logActivity } = require('../middleware/activityLogger');
const upload = require('../config/multer');

// Créer un processus d'inclusion par défaut pour une expérimentation
router.post(
  '/experimentations/:experimentationId/processus', 
  authMiddleware.protect, 
  logActivity(), 
  processusInclusionController.createDefaultProcessus
);

// Récupérer le processus d'inclusion d'une expérimentation
router.get(
  '/experimentations/:experimentationId/processus', 
  authMiddleware.protect, 
  processusInclusionController.getProcessusInclusion
);

// Démarrer le processus d'inclusion pour un bénéficiaire
router.post(
  '/processus/demarrer', 
  authMiddleware.protect, 
  logActivity(), 
  processusInclusionController.demarrerProcessus
);

// Passer à l'étape suivante du processus
router.put(
  '/suivis/:suiviId/etape-suivante', 
  authMiddleware.protect, 
  logActivity(), 
  processusInclusionController.passerEtapeSuivante
);

// Récupérer le suivi du processus d'inclusion d'un bénéficiaire
router.get(
  '/beneficiaires/:beneficiaireId/suivi-processus', 
  authMiddleware.protect, 
  processusInclusionController.getSuiviProcessus
);

// Changer le statut du processus (annuler, mettre en pause, reprendre)
router.put(
  '/suivis/:suiviId/statut', 
  authMiddleware.protect, 
  logActivity(), 
  processusInclusionController.changerStatutProcessus
);

// Ajouter ces routes à votre fichier routes/processusInclusionRoutes.js

// Routes pour les actions spécifiques
router.post(
    '/beneficiaires/:beneficiaireId/etape/:etape/actions',
    authMiddleware.protect,
    logActivity(), 
    processusInclusionController.creerActionsSpecifiques
  );
  
  router.get(
    '/beneficiaires/:beneficiaireId/etape/:etape/actions',
    authMiddleware.protect,
    processusInclusionController.getActionsEtape
  );
  
  router.put(
    '/actions/:actionId/statut',
    authMiddleware.protect,
    logActivity(),
    processusInclusionController.updateActionStatus
  );
  
  // Routes pour la gestion des documents
  router.post(
    '/actions/:actionId/documents',
    authMiddleware.protect,
    upload.single('document'),
    logActivity(),
    processusInclusionController.ajouterDocumentAction
  );
  
  router.delete(
    '/actions/:actionId/documents/:documentId',
    authMiddleware.protect,
    logActivity(),
    processusInclusionController.supprimerDocumentAction
  );

module.exports = router;