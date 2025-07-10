import React from 'react';
import ExperimentationDetails from '../../../components/experimentation/ExperimentationDetails';

interface ExperimentationDetailPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: 'Détails de l\'expérimentation | RI2S',
  description: 'Détails et gestion d\'une expérimentation RI2S',
};

// Conversion en fonction asynchrone
export default async function ExperimentationDetailPage({ params }: ExperimentationDetailPageProps) {
  // Attendre les paramètres
  const id = params.id;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <ExperimentationDetails experimentationId={id} />
    </div>
  );
}