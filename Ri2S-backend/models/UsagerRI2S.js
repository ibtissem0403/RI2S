const mongoose = require('mongoose');

const usagerRI2SSchema = new mongoose.Schema({
  // Champs communs à tous les usagers
  fullName: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  // Type d'usager: professionnel ou non professionnel
  type_usager: {
    type: String,
    enum: ['pro', 'non_pro'],
    required: true
  },
  // Rôle selon le type
  role: {
    type: String,
    enum: ['médecin', 'infirmier', 'pharmacien', 'kiné', 'autre_pro', 'senior', 'aidant'],
    required: true
  },
  // Référence vers le pseudoId (identifiant pseudonymisé)
  pseudoId: {
    type: String
  },
  
  // Champs spécifiques pour les professionnels
  specialite: {
    type: String,
    required: function() { return this.type_usager === 'pro'; }
  },
  villeExercice: String,
  zoneGeographiquePatients: String,
  milieuExercice: String,
  nomStructure: String,
  
  // Champs spécifiques pour les seniors
  codePostal: String,
  dateNaissance: Date,
  horairePrefere: {
    type: String,
    enum: ['Matin', 'Midi', 'Après midi']
  },
  
  // Champs spécifiques pour les aidants
  lien_avec_senior: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsagerRI2S',
    required: function() { return this.type_usager === 'non_pro' && this.role === 'aidant'; }
  },
  
  // Qui a créé cet usager
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Index pour améliorer la recherche
usagerRI2SSchema.index({ fullName: 1, firstName: 1 });
usagerRI2SSchema.index({ email: 1 });
usagerRI2SSchema.index({ type_usager: 1, role: 1 });
usagerRI2SSchema.index({ pseudoId: 1 });

module.exports = mongoose.model('UsagerRI2S', usagerRI2SSchema);