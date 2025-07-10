const mongoose = require('mongoose');

const BeneficiaryClinicalLinkSchema = new mongoose.Schema({
  beneficiary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RealBeneficiary',
    required: true,
    index: true
  },
  clinicalData: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClinicalData',
    required: true,
    index: true
  },
  relationType: {
    type: String,
    enum: ['Principal', 'Secondaire', 'Contrôle'],
    default: 'Principal'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Index composé pour éviter les doublons
BeneficiaryClinicalLinkSchema.index(
  { beneficiary: 1, clinicalData: 1 }, 
  { unique: true }
);

module.exports = mongoose.model('BeneficiaryClinicalLink', BeneficiaryClinicalLinkSchema);