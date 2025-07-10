import mongoose from 'mongoose';

const RealBeneficiarySchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  firstName: { type: String, required: true },
  birthDate: { type: Date, required: true },
  sex: { type: String, enum: ['M', 'F', 'Other'], required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,

  caregiver: {
    name: String,
    firstName: String,
    relation: String,
    phone: String
  },

  recruiter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  cohort: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Cohort', 
    required: true 
  },
  recruitmentMethod: { 
    type: String, 
    enum: ['Domicile', 'Partenaire', 'Spontané', 'Autre'], 
    required: true 
  },
  inclusionDate: { 
    type: Date, 
    required: true,
    default: Date.now,
    validate: {
      validator: function(v: Date) {
        return v instanceof Date && !isNaN(v.getTime());
      },
      message: 'Date d\'inclusion invalide'
    }
  },
  clinicalData: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClinicalData',
    default: () => []
  }],
  status: {
    type: String,
    enum: ['Actif', 'En attente', 'Inactif'],
    default: 'En attente'
  }
}, { 
  timestamps: true,
  autoCreate: false // Désactive la création automatique de collection
});

// Vérification de l'existence du modèle
function getModel() {
  if (mongoose.models.RealBeneficiary) {
    return mongoose.model('RealBeneficiary');
  }
  return mongoose.model('RealBeneficiary', RealBeneficiarySchema);
}

const RealBeneficiary = getModel();
export default RealBeneficiary;