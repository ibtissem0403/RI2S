import { Document } from 'mongoose';

  interface Cohort extends Document {
    _id: string;
    name: string;
    experimentation: string;
    code?: string;
    startDate?: Date;
    endDate?: Date;
    inclusionCriteria?: string[];
    exclusionCriteria?: string[];
    isActive?: boolean;
  }

  interface User extends Document {
    fullName: string;
    email: string;
    password: string;
    role: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    comparePassword: (password: string) => Promise<boolean>;
  }

  export interface RealBeneficiary {
    _id?: string;
    fullName: string;
    firstName: string;
    birthDate: Date | string;
    sex: 'M' | 'F' | 'Other';
    address: string;
    phone: string;
    status: 'Actif'| 'Sorti'| 'Suspendu',
    email?: string;
    caregiver: {
      name?: string;
      firstName?: string;
      relation?: string;
      phone?: string;
    };
    recruiter: string; 
    cohort: string;   
    recruitmentMethod: 'Domicile' | 'Partenaire' | 'Spontané' | 'Autre';
    inclusionDate: Date | string;
    clinicalDocuments?: File[]; // Spécifique au frontend
  }

  export interface ClinicalDocument {
    _id: string;
    fileName: string;
    fileUrl: string;
    fileMimeType: string;
    examType: string;
    examDate: string;
    recordedBy?: {
      _id: string;
      fullName: string;
    };
  }

 

  export interface Contact {
    _id?: string;
    contactedPerson: {
      name: string;
      profession: string;
    };
    contactDate: string;
    contactMethod: 'Téléphone' | 'Email' | 'SMS' | 'Visite' | 'Courrier' | 'Autre';
    contactSubject: string;
    contactContent: string;
    contactedBy: {
      _id: string;
      fullName: string;
    } | string;
    response?: {
      date?: string;
      content?: string;
      responseMethod?: 'Téléphone' | 'Email' | 'SMS' | 'Visite' | 'Courrier' | 'Autre';
      hasResponse: boolean;
    };
  }
  
  export interface WeakSignal {
    _id: string;
    beneficiary: {
      _id: string;
      fullName: string;
      firstName: string;
    };
    receptionDate: string;
    signalType: string; // Maintenant un champ libre au lieu d'un enum
    description: string;
    source: string;
    coordinator: {
      _id: string;
      fullName: string;
      email: string;
    };
    contacts: Contact[]; // Nouveau système de contacts
    status: 'Nouveau' | 'En cours' | 'Clôturé';
    notes?: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface WeakSignalFormData {
    beneficiary: string;
    receptionDate: string;
    signalType: string; // Champ libre
    description: string;
    source: string;
    notes?: string;
    status: 'Nouveau' | 'En cours' | 'Clôturé';
    contacts?: Contact[]; // Nouveau système de contacts
    coordinator?: string;
  }
  
  
  export interface WeakSignalStats {
    totalCount: number;
    byStatus: {
      new: number;
      inProgress: number;
      closed: number;
    };
    byType: Array<{
      _id: string;
      count: number;
    }>;
    bySource: Array<{
      _id: string;
      count: number;
    }>;
    byContactType: Array<{ // Nouveau : statistiques par type de contact
      _id: string;
      count: number;
    }>;
    byMonth: Array<{
      _id: {
        year: number;
        month: number;
      };
      count: number;
    }>;
    avgClosureTime: number; // En jours
  }

  // Statistiques des usagers RI2S
export interface UsagerRI2SStats {
  usagers: {
    total: number;
    pseudonymises: number;
    tauxPseudonymisation: number;
  };
  distribution: {
    parType: Array<{ _id: string; count: number }>;
    parRole: Array<{ _id: string; count: number }>;
    parTypeEtRole: Array<{ _id: { type: string; role: string }; count: number }>;
  };
  experimentations: {
    usagersParExperimentation: Array<{
      _id: string;
      nomExperimentation: string;
      codeExperimentation?: string;
      count: number;
    }>;
    tauxRattachement: number;
    nbUsagersRattaches: number;
  };
  tendances: {
    creationParMois: Array<{
      mois: number;
      annee: number;
      nom: string;
      count: number;
    }>;
  };
  professionnels: {
    specialites: Array<{ _id: string; count: number }>;
    total: number;
  };
  aidants: {
    total: number;
    rattachesASenior: number;
    pourcentageRattaches: number;
    ratioAidantSenior: number;
  };
  seniors: {
    total: number;
  };
  utilisateurs?: {
    topCreateurs: Array<{
      _id?: string;
      nom: string;
      email?: string;
      count: number;
    }>;
  };
  dateGeneration: string;
}

  // src/types/models.d.ts - À ajouter à votre fichier existant

// Modèles pour le système RI2S
export interface Experimentation {
  _id: string;
  name: string;
  code: string;
  description?: string;
  company: string;
  startDate: string | Date;
  endDate?: string | Date;
  protocolVersion: string;
  status: 'Active' | 'Terminée' | 'En pause';
  referent?: {
    name: string;
    email: string;
    phone: string;
    function: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TargetExperimentation {
  _id: string;
  experimentation: string | Experimentation;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface TargetStatus {
  _id: string;
  target: string | TargetExperimentation;
  name: string;
  code: string;
  description?: string;
  order: number;
  isActive: boolean;
}

export interface Field {
  _id: string;
  name: string;
  code: string;
  fieldType: 'text' | 'date' | 'number' | 'select' | 'file' | 'textarea' | 'boolean';
  isRequired: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
  minValue?: number;
  maxValue?: number;
  order: number;
  helpText?: string;
}

export interface CommonField extends Field {
  experimentation: string | Experimentation;
  validationRules?: string[];
}

export interface StatusField extends Field {
  status: string | TargetStatus;
}

export interface FieldValue {
  _id?: string;
  beneficiary: string;
  experimentation: string;
  fieldType: 'common' | 'status';
  field: string;
  fieldModel: 'CommonField' | 'StatusField';
  value: any;
  fileUrl?: string;
  fileName?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface StatusHistory {
  status: string | TargetStatus;
  date: string | Date;
  changedBy: string | User;
  notes?: string;
}

export interface ExperimentationDetail {
  experimentation: string | Experimentation;
  target: string | TargetExperimentation;
  status: string | TargetStatus;
  statusDate: string | Date;
  statusHistory: StatusHistory[];
  notes?: string;
  startDate: string | Date;
  endDate?: string | Date;
}

// Extension du RealBeneficiary existant pour RI2S
export interface RI2SBeneficiary extends RealBeneficiary {
  experimentationDetails?: ExperimentationDetail[];
  dossierNumber?: string;
}

export interface PseudonymizedBeneficiary {
  _id: string;
  pseudoId: string;
  pseudoName: string;
  status: string;
  category?: string;
  experiments: string[];
  dossierNumber: string;
  inclusionDate: string | Date;
  realBeneficiary: string | RI2SBeneficiary;
}

// Interface pour le formulaire d'ajout de bénéficiaire
export interface BeneficiaryFormData {
  fullName: string;
  firstName: string;
  birthDate: string;
  sex: 'M' | 'F' | 'Other';
  address: string;
  phone: string;
  email?: string;
  caregiverName?: string;
  caregiverFirstName?: string;
  caregiverRelation?: string;
  caregiverPhone?: string;
  recruitmentMethod: 'Domicile' | 'Partenaire' | 'Spontané' | 'Autre';
  inclusionDate: string;
  status: 'Actif' | 'Sorti' | 'Suspendu';
  statusNotes?: string;
  experimentation: string;
  target: string;
  targetStatus: string;
  fieldValues?: FieldValue[];
  clinicalDocuments?: File[];
}

export interface ContactReferent {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
}

export interface Experimentation {
  _id: string;
  name: string;
  code: string;
  description?: string;
  startDate: string;
  endDate?: string;
  protocolVersion: string;
  status: 'Active' | 'Terminée' | 'En pause';
  entreprise: string;
  contact_referent?: ContactReferent;
  createdAt?: string;
  updatedAt?: string;
}

// Types pour les cibles, statuts et champs
export interface CibleExperimentation {
  _id: string;
  experimentation: string | Experimentation;
  nom_cible: string;
  code_cible?: string;
  description?: string;
  statuts?: StatutCible[];
}

export interface StatutCible {
  _id: string;
  cible: string | CibleExperimentation;
  nom_statut: string;
  ordre: number;
  description?: string;
  champs?: ChampStatut[];
}

export type ChampType = 'texte' | 'date' | 'nombre' | 'liste' | 'fichier';

export interface ChampBase {
  _id: string;
  nom_champ: string;
  type_champ: ChampType;
  options?: string[];
  obligatoire: boolean;
  description?: string;
}

export interface ChampStatut extends ChampBase {
  statut: string | StatutCible;
}

export interface ChampCommun extends ChampBase {
  experimentation: string | Experimentation;
}

// Types pour les bénéficiaires
export interface HistoriqueStatut {
  statut: string | StatutCible;
  date_changement: string;
  note?: string;
}

export interface BeneficiaireExperimentation {
  _id: string;
  usager: any; // Type RealBeneficiary
  experimentation: string | Experimentation;
  cible: string | CibleExperimentation;
  statut: string | StatutCible;
  date_rattachement: string;
  historique_statuts: HistoriqueStatut[];
}

export interface ValeurChampStatut {
  _id: string;
  beneficiaire: string | BeneficiaireExperimentation;
  champ?: string | ChampStatut;
  champ_commun?: string | ChampCommun;
  valeur: any;
}

// Types pour la création d'une expérimentation complète
export interface ChampFormData {
  nom_champ: string;
  type_champ: ChampType;
  options?: string[];
  obligatoire: boolean;
  description?: string;
}

export interface StatutFormData {
  nom_statut: string;
  ordre?: number;
  description?: string;
  champs: ChampFormData[];
}

export interface CibleFormData {
  nom_cible: string;
  code_cible?: string;
  description?: string;
  statuts: StatutFormData[];
}

export interface ExperimentationFormData {
  name: string;
  code: string;
  description?: string;
  startDate: string;
  endDate?: string;
  protocolVersion: string;
  status: 'Active' | 'Terminée' | 'En pause';
  entreprise: string;
  contact_referent?: ContactReferent;
  cibles: CibleFormData[];
  champs_communs: ChampFormData[];
}

// Type pour la réponse de l'API complète
export interface ExperimentationComplete {
  experimentation: Experimentation;
  champsCommuns: ChampCommun[];
  cibles: CibleExperimentation[];
}
  
