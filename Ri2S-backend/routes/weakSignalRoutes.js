// routes/weakSignalRoutes.js
const express = require('express');
const router = express.Router();
const weakSignalController = require('../controllers/weakSignalController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { logActivity } = require('../middleware/activityLogger');

// Routes protégées (authentification requise)
// Accès limité aux rôles de coordination et médicaux
const authorizedRoles = ['infirmier de coordination', 'coordinateur', 'admin'];

// IMPORTANT: L'ordre des routes est crucial - les routes spécifiques doivent être avant les routes paramétrées

// Routes pour les statistiques (avant /:id)
router.get(
  '/stats', 
  protect, 
  authorize(...authorizedRoles), 
  weakSignalController.getWeakSignalStats
);

// Routes pour les exports (avant /:id)
router.get(
  '/export/excel',
  protect,
  authorize(...authorizedRoles),
  weakSignalController.exportToExcel
); 

router.get(
  '/export/pdf',
  protect,
  authorize(...authorizedRoles),
  weakSignalController.exportToPDF
);

// Route pour récupérer tous les signaux faibles (avec filtres optionnels)
router.get(
  '/', 
  protect, 
  authorize(...authorizedRoles), 
  weakSignalController.getAllWeakSignals
);

// Route pour créer un signal faible
router.post(
  '/', 
  protect, 
  authorize(...authorizedRoles), 
  logActivity('CREATE_WEAK_SIGNAL'), 
  weakSignalController.createWeakSignal
);

// Route pour récupérer tous les signaux faibles d'un bénéficiaire spécifique
router.get(
  '/beneficiary/:beneficiaryId', 
  protect, 
  authorize(...authorizedRoles), 
  weakSignalController.getWeakSignalsByBeneficiary
);

// Route pour mettre à jour la réponse d'un contact spécifique
router.put(
  '/:signalId/contacts/:contactIndex/response',
  protect,
  authorize(...authorizedRoles),
  logActivity('UPDATE_CONTACT_RESPONSE'),
  weakSignalController.updateContactResponse
);

// Route pour récupérer un signal faible par ID
router.get(
  '/:id', 
  protect, 
  authorize(...authorizedRoles), 
  weakSignalController.getWeakSignalById
);

// Route pour mettre à jour un signal faible
router.put(
  '/:id', 
  protect, 
  authorize(...authorizedRoles), 
  logActivity('UPDATE_WEAK_SIGNAL'), 
  weakSignalController.updateWeakSignal
);

// Route pour supprimer un signal faible
router.delete(
  '/:id', 
  protect, 
  authorize(...authorizedRoles), 
  logActivity('DELETE_WEAK_SIGNAL'),  
  weakSignalController.deleteWeakSignal
);

// Middleware de gestion d'erreurs spécifique aux signaux faibles
router.use((error, req, res, next) => {
  console.error('Erreur dans les routes weak signals:', error);
  
  // Erreur de validation MongoDB
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      message: 'Erreur de validation',
      errors
    });
  }
  
  // Erreur de cast MongoDB (ID invalide)
  if (error.name === 'CastError') {
    return res.status(400).json({
      message: 'ID de signal invalide'
    });
  }
  
  // Erreur de duplication (peu probable pour les signaux)
  if (error.code === 11000) {
    return res.status(400).json({
      message: 'Conflit de données'
    });
  }
  
  // Erreur générique
  res.status(500).json({
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
  });
});

module.exports = router;