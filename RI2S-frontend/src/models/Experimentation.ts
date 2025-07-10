import mongoose from 'mongoose';

export const experimentationSchema = new mongoose.Schema({ 
      name: {
    type: String,
    required: true,
    enum: ['Presage', 'Telegrafik'],
    unique: true
  },
  code: { 
    type: String,
    required: true,
    enum: ['PSG', 'TLG'],
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
  }
}, { timestamps: true });

export default mongoose.models.Experimentation || 
  mongoose.model('Experimentation', experimentationSchema);