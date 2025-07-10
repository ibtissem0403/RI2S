import axios from 'axios';
import { StatutCible } from '../types/models';

const API_URL = 'http://localhost:5000/api/ri2s';

export const statutService = {
  // Récupérer tous les statuts d'une cible
  getByCible: async (cibleId: string): Promise<StatutCible[]> => {
    const response = await axios.get(`${API_URL}/cibles/${cibleId}/statuts`);
    return response.data;
  },
  
  // Récupérer un statut par ID
  getById: async (id: string): Promise<StatutCible> => {
    const response = await axios.get(`${API_URL}/statuts/${id}`);
    return response.data;
  },
  
  // Créer un statut
  create: async (statut: Omit<StatutCible, '_id'>): Promise<StatutCible> => {
    const response = await axios.post(`${API_URL}/statuts`, statut);
    return response.data.data;
  },
  
  // Mettre à jour un statut
  update: async (id: string, statut: Partial<StatutCible>): Promise<StatutCible> => {
    const response = await axios.put(`${API_URL}/statuts/${id}`, statut);
    return response.data.data;
  },
  
  // Supprimer un statut
  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/statuts/${id}`);
  },
};