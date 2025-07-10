'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Notification, { NotificationType } from '@/components/Notification/Notification';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [notification, setNotification] = useState({
    type: 'error' as NotificationType,
    message: '',
    isVisible: false
  });

  const showNotification = (type: NotificationType, message: string) => {
    setNotification({
      type,
      message,
      isVisible: true
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier si token existe
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
          // Token absent, rediriger vers login
          showNotification('error', 'Session expirée. Redirection vers la page de connexion...');
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        // Vérifier validité du token
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          // Token invalide/expiré
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          showNotification('error', 'Session expirée. Redirection vers la page de connexion...');
          setTimeout(() => router.push('/'), 3000);
          return;
        }
        
        if (!response.ok) {
          throw new Error('Erreur de validation de session');
        }
        
        // Session valide
        setIsChecking(false);
      } catch (error) {
        console.error('Auth check error:', error);
        showNotification('error', 'Erreur lors de la vérification de session');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    checkAuth();
  }, [router]);

  return (
    <>
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={closeNotification}
        position="fixed"
      />
      
      {isChecking ? (
        <div className="auth-checking">
          <div className="spinner"></div>
          <p>Vérification de votre session...</p>
          <style jsx>{`
            .auth-checking {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
            }
            .spinner {
              border: 4px solid rgba(0, 0, 0, 0.1);
              border-top: 4px solid #22974c;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin-bottom: 1rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        children
      )}
    </>
  );
}