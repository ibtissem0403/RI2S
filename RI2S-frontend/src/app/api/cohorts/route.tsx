import { NextResponse } from 'next/server';
import { connectDB } from '@/models/connectDB';
import Cohort from '@/models/Cohort';

export async function GET() {
  try {
    // Connexion à la base de données
   await connectDB(); // La connexion enregistre les modèles
    
    const cohorts = await Cohort.find()
      .populate({
        path: 'experimentation',
        model: 'Experimentation', // Nom exact du modèle
        select: 'name code'
      })
      .lean();

    // Transformation des données pour la sérialisation
    const safeCohorts = cohorts.map((cohort: any) => ({
      ...cohort,
      _id: cohort._id?.toString() || '',
      experimentation: cohort.experimentation ? {
        _id: cohort.experimentation._id?.toString() || '',
        name: cohort.experimentation.name
      } : null
    }));

    return NextResponse.json(safeCohorts);

  } catch (error) {
    // Journalisation détaillée de l'erreur
    console.error('Erreur API cohorts:', error);
    return NextResponse.json(
      { 
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
console.log("Cohorts API route loaded");
}