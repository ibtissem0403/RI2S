const mongoose = require('mongoose');

const professionalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  speciality: {
    type: String,
    required: true,
    enum: ['Médecin généraliste', 'Infirmier', 'Psychologue', 'Kinésithérapeute']
  },
  institution: {
    name: String,
    address: String,
    phone: String
  },
  availability: {
    days: [String], // ['Lundi', 'Mardi', ...]
    hours: {
      start: String,
      end: String
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Professional', professionalSchema);