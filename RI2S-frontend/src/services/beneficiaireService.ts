import axios from 'axios';
import { BeneficiaireExperimentation, ValeurChampStatut } from '../types/models';

const API_URL = 'http://localhost:5000/api/ri2s';
const BENEFICIARY_API_URL = 'http://localhost:5000/api/beneficiaries';

// Fonction utilitaire pour obtenir les en-têtes d'authentification
const getAuthHeaders = () => {
  // Récupération du token depuis localStorage ou sessionStorage
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    console.warn('Aucun token d\'authentification trouvé');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const beneficiaireService = {
  // Récupérer tous les bénéficiaires d'une expérimentation
  getByExperimentation: async (experimentationId: string): Promise<BeneficiaireExperimentation[]> => {
    const response = await axios.get(
      `${API_URL}/experimentations/${experimentationId}/beneficiaires`, 
      { headers: getAuthHeaders() }
    );
    return response.data;
  },
  
  // Récupérer un bénéficiaire par ID avec ses valeurs de champs
  getById: async (beneficiaireId: string): Promise<{
    beneficiaire: BeneficiaireExperimentation;
    valeursChamps: ValeurChampStatut[];
    valeursChampCommuns: ValeurChampStatut[];
  }> => {
    const response = await axios.get(
      `${API_URL}/beneficiaires/${beneficiaireId}`, 
      { headers: getAuthHeaders() }
    );
    return response.data;
  },
  
  // Rattacher un bénéficiaire à une expérimentation
  rattacher: async (data: {
    usagerId: string;
    experimentationId: string;
    cibleId: string;
    statutId: string;
    valeurs_champs?: Record<string, any>;
    valeurs_champs_communs?: Record<string, any>;
  }): Promise<BeneficiaireExperimentation> => {
    const response = await axios.post(
      `${API_URL}/beneficiaires`, 
      data, 
      { headers: getAuthHeaders() }
    );
    return response.data.data;
  },
  
  // Changer le statut d'un bénéficiaire
  changerStatut: async (
    beneficiaireId: string,
    data: {
      nouveauStatutId: string;
      note?: string;
      valeurs_champs?: Record<string, any>;
    }
  ): Promise<BeneficiaireExperimentation> => {
    const response = await axios.put(
      `${API_URL}/beneficiaires/${beneficiaireId}/statut`, 
      data, 
      { headers: getAuthHeaders() }
    );
    return response.data.data;
  },
  
  // Associer un bénéficiaire existant à une expérimentation
  associerPseudo: async (
    pseudoId: string,
    data: {
      experimentationId: string;
      cibleId: string;
      statutId: string;
      valeurs_champs?: Record<string, any>;
      valeurs_champs_communs?: Record<string, any>;
    }
  ): Promise<BeneficiaireExperimentation> => {
    try {
      // Log pour débogage
      console.log('Envoi de la requête d\'association:', {
        url: `${BENEFICIARY_API_URL}/pseudo/${pseudoId}/associate`,
        headers: getAuthHeaders(),
        data
      });
      
      const response = await axios.post(
        `${BENEFICIARY_API_URL}/pseudo/${pseudoId}/associate`, 
        data, 
        { 
          headers: getAuthHeaders(),
          withCredentials: true // Inclure les cookies si nécessaire
        }
      );
      return response.data.data;
    } catch (error: any) {
      // Log détaillé de l'erreur
      console.error('Erreur lors de l\'association:', error);
      
      if (error.response) {
        console.error('Réponse d\'erreur:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      throw error;
    }
  },
  
  // Récupérer les associations d'un bénéficiaire
  getExperimentationsByPseudo: async (pseudoId: string): Promise<BeneficiaireExperimentation[]> => {
    const response = await axios.get(
      `${BENEFICIARY_API_URL}/pseudo/${pseudoId}/experimentations`, 
      { headers: getAuthHeaders() }
    );
    return response.data;
  },
  
  // Récupérer tous les bénéficiaires pseudonymisés
  getAllPseudonymized: async (): Promise<any[]> => {
    try {
      const response = await axios.get(
        `${BENEFICIARY_API_URL}`, 
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des bénéficiaires:', error);
      
      if (error.response) {
        console.error('Réponse d\'erreur:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      throw error;
    }
  },
  
  // Récupérer un bénéficiaire pseudonymisé par ID
  getPseudonymizedById: async (pseudoId: string): Promise<any> => {
    const response = await axios.get(
      `${BENEFICIARY_API_URL}/pseudo/${pseudoId}`, 
      { headers: getAuthHeaders() }
    );
    return response.data;
  },
};