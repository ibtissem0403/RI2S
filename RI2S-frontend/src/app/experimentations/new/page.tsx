import React from 'react';
import ExperimentationForm from '../../../components/experimentation/ExperimentationForm';

export const metadata = {
  title: 'Nouvelle expérimentation | RI2S',
  description: 'Créer une nouvelle expérimentation RI2S',
};

export default function NewExperimentationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ExperimentationForm />
    </div>
  );
}