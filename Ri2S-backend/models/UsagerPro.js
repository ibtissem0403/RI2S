// models/UsagerPro.js
const mongoose = require('mongoose');

const usagerProSchema = new mongoose.Schema({
  usagerRi2s: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsagerRi2s',
    required: true
  },
  profession: {
    type: String,
    required: true
  },
  villeExercice: String,
  zoneGeographiquePatients: String,
  milieuExercice: String,
  nomStructure: String
}, { timestamps: true });

module.exports = mongoose.model('UsagerPro', usagerProSchema);