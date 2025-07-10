const mongoose = require('mongoose');

const valeurChampStatutSchema = new mongoose.Schema({
  beneficiaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BeneficiaireExperimentation',
    required: true
  },
  // Un des deux champs suivants doit être rempli (mais pas les deux)
  champ: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChampStatut'
  },
  champ_commun: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChampCommun'
  },
  valeur: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

// Validation pour s'assurer qu'un seul des champs (champ ou champ_commun) est rempli
valeurChampStatutSchema.pre('validate', function(next) {
  if (!this.champ && !this.champ_commun) {
    return next(new Error('Soit champ soit champ_commun doit être renseigné'));
  }
  if (this.champ && this.champ_commun) {
    return next(new Error('Seul champ ou champ_commun doit être renseigné, pas les deux'));
  }
  next();
});

// Index pour recherche efficace
valeurChampStatutSchema.index({ beneficiaire: 1, champ: 1 }, { sparse: true });
valeurChampStatutSchema.index({ beneficiaire: 1, champ_commun: 1 }, { sparse: true });

module.exports = mongoose.model('ValeurChampStatut', valeurChampStatutSchema);