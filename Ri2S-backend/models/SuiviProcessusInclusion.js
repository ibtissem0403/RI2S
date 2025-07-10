const mongoose = require('mongoose');

const suiviProcessusInclusionSchema = new mongoose.Schema({
  beneficiaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BeneficiaireExperimentation',
    required: true
  },
  processus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcessusInclusion',
    required: true
  },
  etape_courante: {
    type: String,
    enum: ['IDENTIFIER', 'RECONTACTER', 'VISITER', 'METTRE_EN_PLACE', 'DESINSTALLER'],
    required: true,
    default: 'IDENTIFIER'
  },
  historique: [{
    etape: {
      type: String,
      enum: ['IDENTIFIER', 'RECONTACTER', 'VISITER', 'METTRE_EN_PLACE', 'DESINSTALLER'],
      required: true
    },
    date_debut: {
      type: Date,
      default: Date.now
    },
    date_fin: Date,
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    actions_completees: [{
      nom: String,
      date: {
        type: Date,
        default: Date.now
      },
      notes: String,
      documents: [{
        nom: String,
        chemin: String,
        type: String
      }]
    }],
    notes: String,
    statut: {
      type: String,
      enum: ['EN_COURS', 'COMPLETE', 'ANNULE', 'EN_ATTENTE'],
      default: 'EN_COURS'
    }
  }],
  date_creation: {
    type: Date,
    default: Date.now
  },
  date_derniere_modification: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SuiviProcessusInclusion', suiviProcessusInclusionSchema);