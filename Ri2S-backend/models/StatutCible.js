const mongoose = require('mongoose');

const statutCibleSchema = new mongoose.Schema({
  cible: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CibleExperimentation',
    required: true
  },
  nom_statut: {
    type: String,
    required: true
  },
  ordre: {
    type: Number,
    default: 0
  },
  description: String
}, {
  timestamps: true
});

// Index composé pour assurer l'unicité par cible
statutCibleSchema.index({ cible: 1, nom_statut: 1 }, { unique: true });

module.exports = mongoose.model('StatutCible', statutCibleSchema);