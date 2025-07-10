const mongoose = require('mongoose');

const experimentationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: String,
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  protocolVersion: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Terminée', 'En pause'],
    default: 'Active'
  },
  entreprise: {
    type: String,
    required: true
  },
  contact_referent: {
    nom: String,
    prenom: String,
    email: String,
    telephone: String
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Experimentation', experimentationSchema);