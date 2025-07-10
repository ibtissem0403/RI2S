'use client';

// src/utils/logActivity.ts
import React from 'react';
import axios from 'axios';
import { ActivityAction, EntityType } from '@/types/activityLog';

interface LogActivityParams {
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Fonction pour enregistrer une activité
 * Note: Cette fonction est utilisée lorsque le middleware côté serveur n'est pas disponible
 */
export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    await axios.post('/api/activity-logs', params, {
      withCredentials: true
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'activité:', error);
    // Ne pas faire échouer l'opération principale en cas d'erreur
  }
};

/**
 * Crée une description standardisée pour une activité
 */
export const formatActivityDescription = (
  action: ActivityAction,
  entityType: EntityType,
  entityName: string = ''
): string => {
  const actionMap: Record<ActivityAction, string> = {
    CREATE: 'Création',
    READ: 'Consultation',
    UPDATE: 'Mise à jour',
    DELETE: 'Suppression',
    LOGIN: 'Connexion',
    LOGOUT: 'Déconnexion',
    EXPORT: 'Export'
  };
  
  const entityMap: Record<EntityType, string> = {
    WeakSignal: 'du signal faible',
    Beneficiary: 'du bénéficiaire',
    ClinicalData: 'des données cliniques',
    User: 'de l\'utilisateur',
    System: 'du système'
  };
  
  let description = `${actionMap[action]} ${entityMap[entityType]}`;
  if (entityName) {
    description += ` ${entityName}`;
  }
  
  return description;
};