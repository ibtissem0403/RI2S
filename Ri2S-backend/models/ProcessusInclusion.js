const mongoose = require('mongoose');

const processusInclusionSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    default: 'Processus d\'inclusion standard'
  },
  experimentation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experimentation',
    required: true
  },
  etapes: [{
    code: {
      type: String,
      required: true,
      enum: ['IDENTIFIER', 'RECONTACTER', 'VISITER', 'METTRE_EN_PLACE', 'DESINSTALLER']
    },
    nom: {
      type: String,
      required: true
    },
    description: String,
    ordre: {
      type: Number,
      required: true
    },
    actions: [{
      nom: String,
      description: String,
      documents_requis: [String],
      champs_requis: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChampStatut'
      }]
    }],
    sous_etapes: [{
      nom: String,
      description: String,
      documents_requis: [String],
      champs_requis: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChampStatut'
      }]
    }],
    statut_cible: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StatutCible'
    }
  }],
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProcessusInclusion', processusInclusionSchema);