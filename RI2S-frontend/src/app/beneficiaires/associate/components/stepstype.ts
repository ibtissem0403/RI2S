export type Step = {
  id: number;
  key: string;
  label: string;
  description: string;
};

export const steps: Step[] = [
  {
    id: 1,
    key: "cible",
    label: "Cibles",
    description: "Sélectionner la cible",
  },
  {
    id: 2,
    key: "beneficiaire",
    label: "Bénéficiaire",
    description: "Sélectionner le bénéficiaire",
  },
  {
    id: 3,
    key: "donnees",
    label: "Données",
    description: "Remplissage des données",
  },
  {
    id: 4,
    key: "validation",
    label: "Validation",
    description: "Vérifier et enregistrer",
  },
];
