import { useRouter } from 'next/navigation';

export async function authFetch<T = any>(
  url: string, 
  options: RequestInit = {},
  router?: ReturnType<typeof useRouter>
): Promise<T> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    if (router) {
      // Rediriger vers la page de login
      router.push('/');
    }
    throw new Error('Authentification requise');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': options.headers?.['Content-Type'] as string || 'application/json'
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    // Gérer les erreurs d'authentification
    if (response.status === 401) {
      // Supprimer le token
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      if (router) {
        // Rediriger vers la page de login
        router.push('/');
      }
      
      throw new Error('Session expirée. Veuillez vous reconnecter.');
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
}