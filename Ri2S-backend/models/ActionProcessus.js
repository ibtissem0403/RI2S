// models/ActionProcessus.js
const mongoose = require('mongoose');

const actionProcessusSchema = new mongoose.Schema({
  beneficiaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BeneficiaireExperimentation',
    required: true
  },
  etape: {
    type: String,
    enum: ['IDENTIFIER', 'RECONTACTER', 'VISITER', 'METTRE_EN_PLACE', 'DESINSTALLER'],
    required: true
  },
  type_action: {
    type: String,
    enum: [
      'SAISIR_INFORMATIONS', 
      'VERIFIER_ELIGIBILITE', 
      'PLANIFIER_RDV', 
      'PRESENTER_PROJET', 
      'FAIRE_SIGNER_CONSENTEMENT', 
      'INSTALLER_MATERIEL', 
      'FORMER_BENEFICIAIRE', 
      'RECUPERER_MATERIEL', 
      'REALISER_ENQUETE'
    ],
    required: true
  },
  statut: {
    type: String,
    enum: ['A_FAIRE', 'EN_COURS', 'TERMINE', 'ANNULE'],
    default: 'A_FAIRE'
  },
  date_creation: {
    type: Date,
    default: Date.now
  },
  date_realisation: Date,
  commentaires: String,
  responsable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  documents: [{
    nom: String,
    fileUrl: String,
    fileName: String,
    fileMimeType: String,
    date_ajout: {
      type: Date,
      default: Date.now
    },
    ajoute_par: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

actionProcessusSchema.index({ beneficiaire: 1, etape: 1 });
actionProcessusSchema.index({ type_action: 1 });
actionProcessusSchema.index({ statut: 1 });

module.exports = mongoose.model('ActionProcessus', actionProcessusSchema);