// utils/sessionManager.ts
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationType } from '@/components/Notification/Notification';

// Type pour la fonction de notification
export type NotifyFunction = (type: NotificationType, message: string) => void;

// Vérifier si token présent
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
};

// Gérer l'expiration de session
export const handleSessionExpired = (
  notify?: NotifyFunction
): void => {
  // Supprimer tokens
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  
  // Afficher notification
  if (notify) {
    notify(
      'error', 
      'Votre session a expiré. Vous allez être redirigé vers la page de connexion.'
    );
  }
  
  // Redirection après délai avec window.location.replace
  setTimeout(() => {
    window.location.replace('/');
  }, 3000);
};

// Hook pour vérifier la session
export const useSessionCheck = (
  notify?: NotifyFunction
): void => {
  const router = useRouter();
  // Utiliser useRef pour suivre si la vérification a déjà été effectuée
  const hasCheckedRef = useRef(false);
  // Utiliser useRef pour suivre si une redirection est en cours
  const isRedirectingRef = useRef(false);
  
  useEffect(() => {
    // Ne vérifier qu'une seule fois
    if (hasCheckedRef.current || isRedirectingRef.current) return;
    
    const verifySession = async () => {
      try {
        // Marquer comme vérifié
        hasCheckedRef.current = true;
        
        if (!isAuthenticated()) {
          isRedirectingRef.current = true;
          handleSessionExpired(notify);
          return;
        }
        
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        // Vérifier la validité du token
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          isRedirectingRef.current = true;
          handleSessionExpired(notify);
        }
      } catch (error) {
        console.error('Session verification error:', error);
        if (!isRedirectingRef.current) {
          isRedirectingRef.current = true;
          handleSessionExpired(notify);
        }
      }
    };
    
    verifySession();
    
    // Nettoyage en cas de démontage du composant
    return () => {
      hasCheckedRef.current = true;
    };
  }, [notify]); // Simplifier les dépendances
};

// Wrapper pour les requêtes authentifiées
export const fetchWithAuth = async <T = any>(
  url: string,
  options: RequestInit = {},
  notify?: NotifyFunction
): Promise<T> => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    handleSessionExpired(notify);
    throw new Error('Authentification requise');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': options.headers?.['Content-Type'] as string || 'application/json'
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      handleSessionExpired(notify);
      throw new Error('Session expirée');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Erreur ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Une erreur est survenue');
  }
};