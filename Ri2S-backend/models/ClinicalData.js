const mongoose = require('mongoose');

const clinicalDataSchema = new mongoose.Schema({
  realBeneficiary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RealBeneficiary',
    required: false
  },
  experimentation: {
    type: String,
    required: true,
    enum: ['Presage', 'Telegrafik']
  },
  examType: {
    type: String,
    required: true,
    enum: ['Biologie', 'Imagerie', 'Clinique', 'Questionnaire', 'Document']
    },
  examSubType: String,
  result: {
    type: String,
    required: true
  },
  unit: String,
  normalRange: String,
  examDate: {
    type: Date,
    required: true
  },
  recordingDate: {
    type: Date,
    default: Date.now
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comment: String,
  isAbnormal: Boolean,
  requiresFollowUp: Boolean,
  fileUrl: { type: String },
  fileName: { type: String },
  fileMimeType: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ClinicalData', clinicalDataSchema);