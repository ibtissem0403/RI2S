const mongoose = require('mongoose');

const dossierCounterSchema = new mongoose.Schema({
  prefix: {
    type: String,
    required: true,
    unique: true
  },
  seq: {
    type: Number,
    default: 1
  }
});

module.exports = mongoose.model('DossierCounter', dossierCounterSchema);