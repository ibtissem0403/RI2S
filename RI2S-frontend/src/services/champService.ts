import axios from 'axios';
import { ChampStatut, ChampCommun } from '../types/models';

const API_URL = 'http://localhost:5000/api/ri2s';

export const champService = {
  // Champs de statut
  getChampsByStatut: async (statutId: string): Promise<ChampStatut[]> => {
    const response = await axios.get(`${API_URL}/statuts/${statutId}/champs`);
    return response.data;
  },
  
  getChampById: async (id: string): Promise<ChampStatut> => {
    const response = await axios.get(`${API_URL}/champs-statut/${id}`);
    return response.data;
  },
  
  createChamp: async (champ: Omit<ChampStatut, '_id'>): Promise<ChampStatut> => {
    const response = await axios.post(`${API_URL}/champs-statut`, champ);
    return response.data.data;
  },
  
  updateChamp: async (id: string, champ: Partial<ChampStatut>): Promise<ChampStatut> => {
    const response = await axios.put(`${API_URL}/champs-statut/${id}`, champ);
    return response.data.data;
  },
  
  deleteChamp: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/champs-statut/${id}`);
  },
  
  // Champs communs
  getChampsCommunsByExperimentation: async (experimentationId: string): Promise<ChampCommun[]> => {
    const response = await axios.get(`${API_URL}/experimentations/${experimentationId}/champs-commun`);
    return response.data;
  },
  
  getChampCommunById: async (id: string): Promise<ChampCommun> => {
    const response = await axios.get(`${API_URL}/champs-commun/${id}`);
    return response.data;
  },
  
  createChampCommun: async (champ: Omit<ChampCommun, '_id'>): Promise<ChampCommun> => {
    const response = await axios.post(`${API_URL}/champs-commun`, champ);
    return response.data.data;
  },
  
  updateChampCommun: async (id: string, champ: Partial<ChampCommun>): Promise<ChampCommun> => {
    const response = await axios.put(`${API_URL}/champs-commun/${id}`, champ);
    return response.data.data;
  },
  
  deleteChampCommun: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/champs-commun/${id}`);
  },
};