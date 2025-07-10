// models/RealBeneficiary.js
const mongoose = require('mongoose');

const medicalRelationSchema = new mongoose.Schema({
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relationType: {
    type: String,
    enum: ['Traitant', 'Référent', 'Intervenant'],
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  notes: String
});

const realBeneficiarySchema = new mongoose.Schema({
  // Référence à UsagerRI2S
  usagerRI2S: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsagerRI2S'
  },
  
  // Identification
  fullName: { type: String, required: true },
  firstName: { type: String, required: true },
  birthDate: { type: Date, required: true },
  sex: { 
    type: String, 
    enum: ['M', 'F', 'Other'], 
    required: true 
  },
  
  // Contact
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  
  // Responsable légal (nouveau format)
  caregiver: {
    name: { type: String },
    firstName: { type: String },
    relation: { type: String },
    phone: { type: String }
  },

  // Recrutement
  recruiter: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function(v) {
        const user = await mongoose.model('User').findById(v);
        return user && ['coordinateur', 'assistant_coordinateur'].includes(user.role);
      },
      message: props => `L'utilisateur ${props.value} n'est pas autorisé à recruter`
    },
    required: true
  },
  recruitmentDate: { 
    type: Date, 
    default: Date.now 
  },
  recruitmentMethod: {
    type: String,
    enum: ['Domicile', 'Partenaire', 'Spontané', 'Autre']
  },

  // Expérimentation
  cohort: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cohort'
  },
  randomizationGroup: {
    type: String,
    enum: ['Intervention', 'Contrôle']
  },
  inclusionDate: {
    type: Date
  },

  // Relations médicales
  medicalTeam: [medicalRelationSchema],

  // Données cliniques
  clinicalData: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClinicalData'
  }],
  
  dossierNumber: {
    type: String,
    unique: true,
    index: true
  },
  
  // Métadonnées
  status: {
    type: String,
    enum: ['Actif', 'Sorti', 'Suspendu'],
    default: 'Actif'
  }
}, { 
  timestamps: true,
  strict: true
});

const RealBeneficiary = mongoose.model('RealBeneficiary', realBeneficiarySchema);
module.exports = RealBeneficiary;