// models/WeakSignal.js
const mongoose = require('mongoose');

const weakSignalSchema = new mongoose.Schema({
  // Lien avec l'usager RI2S (remplace beneficiary -> RealBeneficiary)
  beneficiary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsagerRI2S', // Changé de 'RealBeneficiary' vers 'UsagerRI2S'
    required: true
  },
  // Date de réception du signal
  receptionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Type de signal (champ libre)
  signalType: {
    type: String,
    required: true
    // Champ libre : "Chute", "Douleur", "Problème technique", "Isolement social", etc.
  },
  // Description du signal
  description: {
    type: String,
    required: true
  },
  // Source du signal (ex: Telegrafik)
  source: {
    type: String,
    required: true
  },
  // Infirmière de coordination qui a reçu/traité le signal
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Contacts effectués pour ce signal (remplace physician et physicianResponse)
  contacts: [{
    // Informations sur la personne contactée
    contactedPerson: {
      name: {
        type: String,
        required: true
      },
      profession: {
        type: String,
        required: true
        // Champ libre : médecin traitant, aidant familial, infirmier libéral, 
        // kinésithérapeute, pharmacien, famille, etc.
      }
    },
    // Informations sur le contact initial
    contactDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    contactMethod: {
      type: String,
      enum: ['Téléphone', 'Email', 'Courrier', 'SMS', 'Visite', 'Autre'],
      required: true,
      default: 'Téléphone'
    },
    contactSubject: {
      type: String,
      required: true
      // Le "quoi" - sujet/raison du contact
    },
    contactContent: {
      type: String
      // Détails du contact, ce qui a été dit/demandé
    },
    // Réponse de la personne contactée (optionnel)
    response: {
      date: Date,
      content: String,
      responseMethod: {
        type: String,
        enum: ['Téléphone', 'Email', 'Courrier', 'SMS', 'Visite', 'Autre']
      },
      hasResponse: {
        type: Boolean,
        default: false
      }
    },
    // Qui a effectué ce contact
    contactedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  // État du signal
  status: {
    type: String,
    enum: ['Nouveau', 'En cours', 'Clôturé'],
    default: 'Nouveau'
  },
  // Notes additionnelles
  notes: String
}, { 
  timestamps: true 
});

// Index pour améliorer les performances
weakSignalSchema.index({ beneficiary: 1, status: 1 });
weakSignalSchema.index({ receptionDate: -1 });
weakSignalSchema.index({ coordinator: 1 });
weakSignalSchema.index({ 'beneficiary': 1, 'status': 1, 'receptionDate': -1 }); // Index composé

// Middleware pour normaliser les champs avant la sauvegarde
weakSignalSchema.pre('save', function(next) {
  // Normaliser la source (première lettre en majuscule, reste en minuscule)
  if (this.source) {
    this.source = this.source.charAt(0).toUpperCase() + this.source.slice(1).toLowerCase();
  }
  
  // Normaliser le type de signal (première lettre en majuscule, reste en minuscule)
  if (this.signalType) {
    this.signalType = this.signalType.charAt(0).toUpperCase() + this.signalType.slice(1).toLowerCase();
  }
  
  // Normaliser les professions des contacts
  if (this.contacts && this.contacts.length > 0) {
    this.contacts.forEach(contact => {
      if (contact.contactedPerson && contact.contactedPerson.profession) {
        contact.contactedPerson.profession = 
          contact.contactedPerson.profession.charAt(0).toUpperCase() + 
          contact.contactedPerson.profession.slice(1).toLowerCase();
      }
    });
  }
  
  next();
});

// Middleware pour valider que le bénéficiaire est bien un senior
weakSignalSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('beneficiary')) {
    try {
      const UsagerRI2S = mongoose.model('UsagerRI2S');
      const usager = await UsagerRI2S.findById(this.beneficiary);
      
      if (!usager) {
        return next(new Error('Usager RI2S non trouvé'));
      }
      
      if (usager.role !== 'senior') {
        return next(new Error('Les signaux faibles ne peuvent être créés que pour des seniors'));
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Méthode pour vérifier si le signal a des réponses
weakSignalSchema.methods.hasResponses = function() {
  return this.contacts.some(contact => contact.response && contact.response.hasResponse);
};

// Méthode pour obtenir le nombre total de contacts
weakSignalSchema.methods.getContactCount = function() {
  return this.contacts ? this.contacts.length : 0;
};

// Méthode pour obtenir le dernier contact
weakSignalSchema.methods.getLatestContact = function() {
  if (!this.contacts || this.contacts.length === 0) return null;
  return this.contacts.sort((a, b) => new Date(b.contactDate) - new Date(a.contactDate))[0];
};

// Méthode pour obtenir les contacts sans réponse
weakSignalSchema.methods.getPendingContacts = function() {
  if (!this.contacts) return [];
  return this.contacts.filter(contact => !contact.response || !contact.response.hasResponse);
};

// Méthode pour obtenir le nombre de réponses reçues
weakSignalSchema.methods.getResponseCount = function() {
  if (!this.contacts) return 0;
  return this.contacts.filter(contact => contact.response && contact.response.hasResponse).length;
};

// Méthode pour obtenir le pseudoId du bénéficiaire
weakSignalSchema.methods.getBeneficiaryPseudoId = async function() {
  if (!this.populated('beneficiary')) {
    await this.populate({
      path: 'beneficiary',
      select: 'pseudoId fullName'
    });
  }
  return this.beneficiary?.pseudoId || null;
};

// Méthode pour vérifier si le signal est récent (moins de 7 jours)
weakSignalSchema.methods.isRecent = function() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return this.receptionDate >= sevenDaysAgo;
};

// Méthode pour calculer la durée depuis la réception
weakSignalSchema.methods.getDaysSinceReception = function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.receptionDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Méthode statique pour normaliser une chaîne (première lettre majuscule, reste minuscule)
weakSignalSchema.statics.normalizeString = function(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Méthode statique pour obtenir les statistiques globales
weakSignalSchema.statics.getGlobalStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalSignals: { $sum: 1 },
        newSignals: {
          $sum: { $cond: [{ $eq: ['$status', 'Nouveau'] }, 1, 0] }
        },
        inProgressSignals: {
          $sum: { $cond: [{ $eq: ['$status', 'En cours'] }, 1, 0] }
        },
        closedSignals: {
          $sum: { $cond: [{ $eq: ['$status', 'Clôturé'] }, 1, 0] }
        },
        averageContactsPerSignal: { $avg: { $size: '$contacts' } }
      }
    }
  ]);
  
  return stats[0] || {
    totalSignals: 0,
    newSignals: 0,
    inProgressSignals: 0,
    closedSignals: 0,
    averageContactsPerSignal: 0
  };
};

// Méthode statique pour trouver les signaux par usager RI2S
weakSignalSchema.statics.findByUsagerRI2S = function(usagerId, options = {}) {
  const query = this.find({ beneficiary: usagerId });
  
  if (options.status) {
    query.where('status').equals(options.status);
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  return query
    .populate('coordinator', 'fullName email')
    .populate('contacts.contactedBy', 'fullName')
    .sort({ receptionDate: -1 });
};

// Méthode statique pour les signaux en attente de réponse
weakSignalSchema.statics.findPendingResponses = function() {
  return this.find({
    status: { $in: ['Nouveau', 'En cours'] },
    'contacts.response.hasResponse': false
  })
  .populate({
    path: 'beneficiary',
    select: 'fullName firstName pseudoId'
  })
  .populate('coordinator', 'fullName email')
  .sort({ receptionDate: -1 });
};

module.exports = mongoose.model('WeakSignal', weakSignalSchema);