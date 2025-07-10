import mongoose from 'mongoose';
import { experimentationSchema } from '@/models/Experimentation'; // Import du schéma

// Enregistrement préalable du modèle référencé
mongoose.models.Experimentation || 
  mongoose.model('Experimentation', experimentationSchema);

const CohortSchema = new mongoose.Schema({
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

export default mongoose.models.Cohort || mongoose.model('Cohort', CohortSchema);