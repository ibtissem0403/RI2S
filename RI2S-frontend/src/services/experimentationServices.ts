import axios from 'axios';
import { 
  Experimentation, 
  ExperimentationFormData, 
  ExperimentationComplete 
} from '../types/models';

const API_URL = 'http://localhost:5000/api/experimentations';

export const experimentationService = {
  // Récupérer toutes les expérimentations
  getAll: async (): Promise<Experimentation[]> => {
    const response = await axios.get(API_URL);
    return response.data;
  },
  
  // Récupérer une expérimentation par ID
  getById: async (id: string): Promise<Experimentation> => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },
  
  // Récupérer une expérimentation complète avec cibles, statuts et champs
  getComplete: async (id: string): Promise<ExperimentationComplete> => {
    const response = await axios.get(`${API_URL}/${id}/complete`);
    return response.data;
  },
  
  // Créer une expérimentation simple
  create: async (experimentation: Omit<Experimentation, '_id'>): Promise<Experimentation> => {
    const response = await axios.post(API_URL, experimentation);
    return response.data.data;
  },
  
  // Créer une expérimentation complète avec cibles, statuts et champs
  createComplete: async (data: ExperimentationFormData): Promise<Experimentation> => {
    const response = await axios.post(`${API_URL}/complete`, data);
    return response.data.data;
  },
  
  // Mettre à jour une expérimentation
  update: async (id: string, experimentation: Partial<Experimentation>): Promise<Experimentation> => {
    const response = await axios.put(`${API_URL}/${id}`, experimentation);
    return response.data.data;
  },
  
  // Supprimer une expérimentation
  delete: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/${id}`);
  },
};