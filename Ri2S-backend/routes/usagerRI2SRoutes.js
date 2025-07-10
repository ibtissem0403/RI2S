// routes/usagerRI2SRoutes.js
const express = require('express');
const router = express.Router();
const usagerRI2SController = require('../controllers/usagerRI2SController');
const { protect } = require('../middleware/authMiddleware');
const { logActivity } = require('../middleware/activityLogger');

// Créer un nouvel usager RI2S
router.post(
  '/',
  protect,
  logActivity(),
  usagerRI2SController.createUsagerRI2S
);

// Récupérer tous les usagers RI2S
router.get(
  '/',
  protect,
  usagerRI2SController.getAllUsagersRI2S
);

// Rechercher des usagers RI2S
router.get(
  '/search',
  protect,
  usagerRI2SController.searchUsagersRI2S
);

// Obtenir les seniors disponibles pour association avec un aidant
router.get(
  '/seniors-disponibles',
  protect,
  usagerRI2SController.getSeniorsDisponibles
);

// Obtenir les usagers par type et rôle
router.get(
  '/type/:type/role/:role',
  protect,
  usagerRI2SController.getUsagersByTypeAndRole
);

// Récupérer un usager RI2S par pseudoId
router.get(
  '/pseudo/:pseudoId',
  protect,
  usagerRI2SController.getUsagerByPseudoId
);

// Récupérer un usager RI2S par ID
router.get(
  '/:id',
  protect,
  usagerRI2SController.getUsagerRI2SById
);

// Mettre à jour un usager RI2S
router.put(
  '/:id',
  protect,
  logActivity(),
  usagerRI2SController.updateUsagerRI2S
);

// Supprimer un usager RI2S
router.delete(
  '/:id',
  protect,
  logActivity(),
  usagerRI2SController.deleteUsagerRI2S
);

// Rattacher un usager à une expérimentation
router.post(
  '/:usagerId/rattacher-experimentation',
  protect,
  logActivity(),
  usagerRI2SController.rattacherUsagerAExperimentation
);

module.exports = router;