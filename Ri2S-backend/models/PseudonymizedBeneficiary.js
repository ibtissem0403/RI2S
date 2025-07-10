// models/PseudonymizedBeneficiary.js
const mongoose = require('mongoose');

const pseudonymizedBeneficiarySchema = new mongoose.Schema({
  pseudoId: {
    type: String,
    required: true,
    unique: true
  },
  pseudoName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Actif', 'Sorti', 'Suspendu'],
    required: true
  },
  category: {
    type: String
  },
  notes: {
    type: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Référence à UsagerRI2S uniquement
  usagerRI2S: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsagerRI2S'
  },
  
  dossierNumber: {
    type: String,
    unique: true,
    index: true
  },
  inclusionDate: {
    type: Date,
    default: Date.now
  },
  
  // Liste des expérimentations auxquelles ce bénéficiaire participe
  experiments: {
    type: [String],
    default: []
  }
}, { timestamps: true });

// Index sur usagerRI2S
pseudonymizedBeneficiarySchema.index({ usagerRI2S: 1 });

// Hook pour mettre à jour les références associées lors de la suppression
pseudonymizedBeneficiarySchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.usagerRI2S) {
    // Mise à jour de l'usager pour supprimer la référence au pseudoId
    await mongoose.model('UsagerRI2S').findByIdAndUpdate(doc.usagerRI2S, {
      $unset: { pseudoId: '' }
    });
  }
});

module.exports = mongoose.model('PseudonymizedBeneficiary', pseudonymizedBeneficiarySchema);