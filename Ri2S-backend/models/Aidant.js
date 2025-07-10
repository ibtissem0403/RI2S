// models/Aidant.js
const mongoose = require('mongoose');

const aidantSchema = new mongoose.Schema({
  usagerRi2s: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsagerRi2s',
    required: true
  },
  lienAvecSenior: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Senior',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Aidant', aidantSchema);