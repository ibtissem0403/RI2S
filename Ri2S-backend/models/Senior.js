// models/Senior.js
const mongoose = require('mongoose');

const seniorSchema = new mongoose.Schema({
  usagerRi2s: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsagerRi2s',
    required: true
  },
  codePostal: String,
  dateNaissance: Date,
  telephone: String
}, { timestamps: true });

module.exports = mongoose.model('Senior', seniorSchema);