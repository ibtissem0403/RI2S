import mongoose from 'mongoose';
import Experimentation from '@/models/Experimentation'; // Ajout crucial
import Cohort from '@/models/Cohort'; 

const MONGODB_URI = process.env.MONGODB_URI!;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;

  // Enregistrement explicite des modèles
  mongoose.model('Experimentation', Experimentation.schema);
  mongoose.model('Cohort', Cohort.schema);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connecté à MongoDB');
  } catch (error) {
    console.error('Erreur MongoDB:', error);
    throw error;
  }
}