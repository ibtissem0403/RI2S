const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { logActivity } = require('../middleware/activityLogger');

// Contrôleurs (avec les noms corrects)
const cibleController = require('../controllers/cibleExperimentationController');
const statutController = require('../controllers/statutCibleController');
const champStatutController = require('../controllers/champStatutController');
const champCommunController = require('../controllers/champCommunController');
const beneficiaireController = require('../controllers/beneficiaireExperimentationController');
const valeurChampController = require('../controllers/ValeurChampStatutController');

// Routes pour cibles
router.post('/cibles', authMiddleware.protect, logActivity(), cibleController.createCible);
router.get('/experimentations/:experimentationId/cibles', cibleController.getCiblesExperimentation);
router.get('/cibles/:id', cibleController.getCibleById);
router.put('/cibles/:id', authMiddleware.protect, logActivity(), cibleController.updateCible);
router.delete('/cibles/:id', authMiddleware.protect, logActivity(), cibleController.deleteCible);

// Routes pour statuts
router.post('/statuts', authMiddleware.protect, logActivity(), statutController.createStatut);
router.get('/cibles/:cibleId/statuts', statutController.getStatutsCible);
router.get('/statuts/:id', statutController.getStatutById);
router.put('/statuts/:id', authMiddleware.protect, logActivity(), statutController.updateStatut);
router.delete('/statuts/:id', authMiddleware.protect, logActivity(), statutController.deleteStatut);

// Routes pour champs de statut
router.post('/champs-statut', authMiddleware.protect, logActivity(), champStatutController.createChamp);
router.get('/statuts/:statutId/champs', champStatutController.getChampsStatut);
router.get('/champs-statut/:id', champStatutController.getChampById);
router.put('/champs-statut/:id', authMiddleware.protect, logActivity(), champStatutController.updateChamp);
router.delete('/champs-statut/:id', authMiddleware.protect, logActivity(), champStatutController.deleteChamp);

// Routes pour champs communs
router.post('/champs-commun', authMiddleware.protect, logActivity(), champCommunController.createChampCommun);
router.get('/experimentations/:experimentationId/champs-commun', champCommunController.getChampsCommuns);
router.get('/champs-commun/:id', champCommunController.getChampCommunById);
router.put('/champs-commun/:id', authMiddleware.protect, logActivity(), champCommunController.updateChampCommun);
router.delete('/champs-commun/:id', authMiddleware.protect, logActivity(), champCommunController.deleteChampCommun);

// Routes pour gérer les valeurs des champs
router.get('/beneficiaires/:beneficiaireId/valeurs', valeurChampController.getValeursBeneficiaire);
router.put('/valeurs/:valeurId', authMiddleware.protect, logActivity(), valeurChampController.updateValeurChamp);


// Routes pour bénéficiaires d'expérimentation
router.post('/beneficiaires', authMiddleware.protect, logActivity(), beneficiaireController.rattacherBeneficiaire);
router.put('/beneficiaires/:beneficiaireId/statut', authMiddleware.protect, logActivity(), beneficiaireController.changerStatut);
router.get('/beneficiaires/:beneficiaireId/complet', beneficiaireController.getBeneficiaireById);
router.get('/experimentations/:experimentationId/beneficiaires', beneficiaireController.getBeneficiairesExperimentation);
// Ajouter cette route pour l'association d'un bénéficiaire à une expérimentation
router.post('/beneficiaires/pseudo/:pseudoId/associer',
    authMiddleware.protect,
    logActivity(),
    beneficiaireController.associateToExperimentation
  );
  
  // Ajouter cette route pour récupérer les expérimentations d'un bénéficiaire
  router.get('/beneficiaires/pseudo/:pseudoId/experimentations',
    authMiddleware.protect,
    beneficiaireController.getBeneficiaryExperimentations
  );


module.exports = router;