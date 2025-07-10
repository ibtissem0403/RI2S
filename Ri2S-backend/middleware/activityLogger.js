const ActivityLog = require('../models/ActivityLog');

/**
 * Middleware pour journaliser les activités
 * @param {Object} options - Options de configuration
 */
exports.logActivity = (options = {}) => {
  return async (req, res, next) => {
    // Continuer la chaîne de middleware
    next();
    
    try {
      // Ne pas journaliser si l'utilisateur n'est pas authentifié
      if (!req.user || !req.user._id) {
        return;
      }
      
      // Déterminer l'action en fonction de la méthode HTTP
      let action;
      switch (req.method) {
        case 'POST': action = 'CREATE'; break;
        case 'GET': action = 'READ'; break;
        case 'PUT': 
        case 'PATCH': action = 'UPDATE'; break;
        case 'DELETE': action = 'DELETE'; break;
        default: action = req.method;
      }
      
      // Déterminer l'entité en fonction du chemin
      let entityType = 'System';
      let entityId = null;
      let description = `${req.method} ${req.originalUrl}`;
      
      // Extraction de l'ID de l'entité depuis les paramètres ou le corps
      if (req.params.id) {
        entityId = req.params.id;
      } else if (req.params.signalId) {
        entityId = req.params.signalId;
        entityType = 'WeakSignal';
      } else if (req.params.beneficiaryId) {
        entityId = req.params.beneficiaryId;
        entityType = 'Beneficiary';
      }
      
      // Déterminer l'entité en fonction du chemin
      if (req.originalUrl.includes('/api/weak-signals')) {
        entityType = 'WeakSignal';
        if (action === 'CREATE') {
          description = 'Création d\'un nouveau signal faible';
        } else if (action === 'UPDATE') {
          description = 'Mise à jour d\'un signal faible';
        } else if (action === 'DELETE') {
          description = 'Suppression d\'un signal faible';
        }
      } else if (req.originalUrl.includes('/api/beneficiaries')) {
        entityType = 'Beneficiary';
      } else if (req.originalUrl.includes('/api/clinical-data')) {
        entityType = 'ClinicalData';
      } else if (req.originalUrl.includes('/api/users')) {
        entityType = 'User';
      }
      
      // Personnalisation en fonction des options
      if (options.action) action = options.action;
      if (options.entityType) entityType = options.entityType;
      if (options.entityId) entityId = options.entityId;
      if (options.description) description = options.description;
      
      // Créer l'entrée de journal
      await ActivityLog.create({
        user: req.user._id,
        action,
        entityType,
        entityId,
        description,
        metadata: {
          method: req.method,
          url: req.originalUrl,
          // On évite de stocker le corps complet pour des raisons de sécurité
          // et pour éviter des entrées trop volumineuses
          body: req.method === 'GET' ? {} : { hasBody: true }
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
    } catch (error) {
      console.error('Erreur lors de la journalisation:', error);
      // Ne pas bloquer la réponse en cas d'erreur de journalisation
    }
  };
};