const mongoose = require('mongoose');

const champStatutSchema = new mongoose.Schema({
  statut: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StatutCible',
    required: true
  },
  nom_champ: {
    type: String,
    required: true
  },
  type_champ: {
    type: String,
    enum: ['texte', 'date', 'nombre', 'liste', 'fichier'],
    required: true
  },
  options: {
    type: [String],
    default: [] // Pour les champs de type 'liste'
  },
  obligatoire: {
    type: Boolean,
    default: false
  },
  description: String
}, {
  timestamps: true
});

// Index composé pour assurer l'unicité par statut
champStatutSchema.index({ statut: 1, nom_champ: 1 }, { unique: true });

module.exports = mongoose.model('ChampStatut', champStatutSchema);