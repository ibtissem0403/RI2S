const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const { protect, authorize } = require('../middleware/authMiddleware');
const importUpload = require('../config/importMulter'); // Configuration Multer spécifique aux imports
const { logActivity } = require('../middleware/activityLogger');


// Middleware pour vérifier les rôles autorisés
const checkRoles = (roles) => authorize(...roles);

// Rôles autorisés pour l'importation
const importRoles = ['admin', 'gestionnaire'];
// Rôles autorisés pour la validation
const validationRoles = ['admin'];

/**
 * @route POST /api/import
 * @desc Importe un fichier de données pour une expérimentation
 * @access Privé (gestionnaire, admin)
 */
router.post(
  '/',
  protect,
  checkRoles(importRoles),
  importUpload.single('file'),
    logActivity(), 
  importUpload.logUpload, // Middleware de logging ajouté
  importController.importFile
);

/**
 * @route GET /api/import
 * @desc Liste tous les fichiers importés
 * @access Privé (gestionnaire, admin)
 */
router.get(
  '/',
  protect,
  checkRoles([...importRoles, ...validationRoles]),
  importController.listImportedFiles
);

/**
 * IMPORTANT: Routes spécifiques avant les routes avec paramètres
 * Ces routes doivent être définies AVANT /:id pour éviter les conflits
 */

/**
 * @route GET /api/import/:id/download
 * @desc Télécharge le fichier original importé
 * @access Privé (gestionnaire, admin)
 */
router.get(
  '/:id/download',
  protect,
  logActivity(), 
  checkRoles([...importRoles, ...validationRoles]),
  importController.downloadOriginalFile
);

/**
 * @route GET /api/import/:id/view
 * @desc Affiche le contenu d'un fichier importé pour visualisation
 * @access Privé (gestionnaire, admin) - Auth gérée manuellement dans le controller
 */
router.get(
  '/:id/view',
  // Pas de middleware protect car on gère l'auth manuellement avec le token
  importController.viewFile
);

/**
 * @route GET /api/import/:id/preview
 * @desc Prévisualise les données d'un fichier importé
 * @access Privé (gestionnaire, admin)
 */
router.get(
  '/:id/preview',
  protect,
  checkRoles([...importRoles, ...validationRoles]),
  importController.previewFile
);

/**
 * @route GET /api/import/:id/errors
 * @desc Télécharge le fichier d'erreurs
 * @access Privé (gestionnaire, admin)
 */
router.get(
  '/:id/errors',
  protect,
  logActivity(), 
  checkRoles([...importRoles, ...validationRoles]),
  importController.downloadErrorsFile
);

/**
 * @route GET /api/import/:id
 * @desc Récupère les détails d'un fichier importé
 * @access Privé (gestionnaire, admin)
 */
router.get(
  '/:id',
  protect,
  checkRoles([...importRoles, ...validationRoles]),
  importController.getImportedFile
);

/**
 * @route PUT /api/import/:id/validate
 * @desc Valide ou rejette un fichier importé
 * @access Privé (admin)
 */
router.put(
  '/:id/validate',
  protect,
  logActivity(), 
  checkRoles(validationRoles),
  importController.validateImportedFile
);

/**
 * @route POST /api/import/:id/integrate
 * @desc Intègre les données d'un fichier validé
 * @access Privé (admin)
 */
router.post(
  '/:id/integrate',
  protect,
    logActivity(), 
  
  checkRoles(validationRoles),
  importController.integrateData
);

/**
 * @route DELETE /api/import/:id
 * @desc Supprime un fichier importé
 * @access Privé (admin)
 */
router.delete(
  '/:id',
  protect,
  logActivity(),
  checkRoles(validationRoles),
  importController.deleteImportedFile
);

module.exports = router;