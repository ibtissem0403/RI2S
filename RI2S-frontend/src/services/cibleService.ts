import axios from 'axios';
import { CibleExperimentation } from '../types/models';

const API_URL = 'http://localhost:5000/api/ri2s';

export const cibleService = {
  // Récupérer toutes les cibles d'une expérimentation
  getByExperimentation: async (experimentationId: string): Promise<CibleExperimentation[]> => {
    const response = await axios.get(`${API_URL}/experimentations/${experimentationId}/cibles`);
    return response.data;
  },
  
  // Récupérer une cible par ID
  getById: async (id: string): Promise<CibleExperimentation> => {
    const response = await axios.get(`${API_URL}/cibles/${id}`);
    return response.data;
  },
  
  // Créer une cible
  create: async (cible: Omit<CibleExperimentation, '_id'>): Promise<CibleExperimentation> => {
    const response = await axios.post(`${API_URL}/cibles`, cible);
    return response.data.data;
  },
  
  // Mettre à jour une cible
  update: async (id: string, cible: Partial<CibleExperimentation>): Promise<CibleExperimentation> => {
    const response = await axios.put(`${API_URL}/cibles/${id}`, cible);
    return response.data.data;
  },
  
  // Supprimer une cible
  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/cibles/${id}`);
  },
};