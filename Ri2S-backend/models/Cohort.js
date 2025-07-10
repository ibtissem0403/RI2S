const mongoose = require('mongoose');

const cohortSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  experimentation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experimentation',
    required: true
  },
  code: {
    type: String,
    unique: true
  },
  startDate: Date,
  endDate: Date,
  inclusionCriteria: [String],
  exclusionCriteria: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Cohort', cohortSchema);