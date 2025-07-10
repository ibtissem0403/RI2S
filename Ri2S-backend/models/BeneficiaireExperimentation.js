// models/BeneficiaireExperimentation.js
const mongoose = require('mongoose');

const beneficiaireExperimentationSchema = new mongoose.Schema({
  // Référence dynamique à UsagerRI2S ou RealBeneficiary
  usager: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'usagerModel',
    required: true
  },
  usagerModel: {
    type: String,
    enum: ['RealBeneficiary', 'UsagerRI2S'],
    required: true,
    default: 'UsagerRI2S' // Par défaut on utilise UsagerRI2S
  },
  
  experimentation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experimentation',
    required: true
  },
  cible: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CibleExperimentation',
    required: true
  },
  statut: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StatutCible',
    required: true
  },
  date_rattachement: {
    type: Date,
    default: Date.now
  },
  historique_statuts: [{
    statut: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StatutCible'
    },
    date_changement: {
      type: Date,
      default: Date.now
    },
    note: String
  }]
}, {
  timestamps: true
});

// Index pour recherche efficace
beneficiaireExperimentationSchema.index({ usager: 1, experimentation: 1, cible: 1 });

const BeneficiaireExperimentation = mongoose.model('BeneficiaireExperimentation', beneficiaireExperimentationSchema);
module.exports = BeneficiaireExperimentation;