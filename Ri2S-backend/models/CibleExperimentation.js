const mongoose = require('mongoose');

const cibleExperimentationSchema = new mongoose.Schema({
  experimentation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experimentation',
    required: true
  },
  nom_cible: {
    type: String,
    required: true
  },
  code_cible: String,
  description: String
}, {
  timestamps: true
});

// Index composé pour assurer l'unicité par expérimentation
cibleExperimentationSchema.index({ experimentation: 1, nom_cible: 1 }, { unique: true });

module.exports = mongoose.model('CibleExperimentation', cibleExperimentationSchema);