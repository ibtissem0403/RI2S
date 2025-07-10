import React from 'react';
import { experimentationService } from '@/services/experimentationServices';
import ExperimentationForm from '../../../../components/experimentation/ExperimentationForm';

interface EditExperimentationPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: 'Modifier l\'expérimentation | RI2S',
  description: 'Modifier une expérimentation existante',
};

// Fonction pour récupérer les données de l'expérimentation
async function getExperimentationData(id: string) {
  try {
    // Cette fonction est exécutée côté serveur, donc nous devons utiliser une approche différente
    // Dans un vrai environnement, vous pourriez utiliser un fetch direct ou une API route
    // Ici, on simule un appel
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/experimentations/${id}/complete`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données');
    }
    
    return response.json();
  } catch (error) {
    console.error('Erreur de chargement:', error);
    return null;
  }
}

export default async function EditExperimentationPage({ params }: EditExperimentationPageProps) {
  // Récupérer les données de l'expérimentation
  const experimentationData = await getExperimentationData(params.id);
  
  // Convertir les données pour le formulaire si elles existent
  const initialData = experimentationData ? {
    _id: experimentationData.experimentation._id,
    name: experimentationData.experimentation.name,
    code: experimentationData.experimentation.code,
    description: experimentationData.experimentation.description,
    startDate: experimentationData.experimentation.startDate,
    endDate: experimentationData.experimentation.endDate,
    protocolVersion: experimentationData.experimentation.protocolVersion,
    status: experimentationData.experimentation.status,
    entreprise: experimentationData.experimentation.entreprise,
    contact_referent: experimentationData.experimentation.contact_referent,
    champs_communs: experimentationData.champsCommuns,
    cibles: experimentationData.cibles.map((cible: any) => ({
      ...cible,
      statuts: cible.statuts ? cible.statuts.map((statut: any) => ({
        ...statut,
        champs: statut.champs || []
      })) : []
    }))
  } : undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      <ExperimentationForm 
        initialData={initialData} 
        isEditing={true} 
      />
    </div>
  );
}