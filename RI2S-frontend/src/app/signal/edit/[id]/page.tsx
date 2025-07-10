// app/signals/edit/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { WeakSignal } from '@/types/models';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import WeakSignalEditForm from '@/components/WeakSignalEditForm/WeakSignalEditForm';
import Notification, { NotificationType } from '@/components/Notification/Notification';
import { UserProvider } from '@/contexts/UserContext';

// CSS harmonisé avec la plateforme
const styles = `
  .edit-signal-container {
   max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
  }

  .edit-signal-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    text-align: center;
    color: #6c757d;
  }

  .edit-signal-spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid #f3f4f6;
    border-top: 3px solid #22577a;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .edit-signal-error {
    background: #f8d7da;
    color: #721c24;
    padding: 1.5rem;
    border-radius: 0.375rem;
    text-align: center;
    margin: 1rem 0;
    border: 1px solid #f5c6cb;
  }

  .edit-signal-error h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
  }

  .edit-signal-error p {
    margin: 0 0 1rem 0;
  }

  .edit-signal-back-btn {
    background-color: #22577a;
    color: white;
    border: none;
    padding: 0.6rem 1.5rem;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .edit-signal-back-btn:hover {
    background-color: #1a4b6d;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default function EditSignalPage() {
  return (
    <UserProvider>
      <EditSignalContent />
    </UserProvider>
  );
}

function EditSignalContent() {
  const router = useRouter();
  const params = useParams();
  const [signal, setSignal] = useState<WeakSignal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // État pour les notifications
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
    isVisible: boolean;
  }>({
    type: 'info',
    message: '',
    isVisible: false
  });

  // Fonction pour afficher une notification
  const showNotification = (type: NotificationType, message: string) => {
    setNotification({
      type,
      message,
      isVisible: true
    });
  };

  // Fonction pour fermer la notification
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const fetchSignal = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');
      
      const response = await axios.get<WeakSignal>(
        `http://localhost:5000/api/weak-signals/${params.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSignal(response.data);
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors du chargement du signal';
      setError(errorMessage);
      showNotification('error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSignal = async (updates: Partial<WeakSignal>) => {
    try {
      setIsSubmitting(true);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');

      const response = await axios.put(
        `http://localhost:5000/api/weak-signals/${params.id}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification('success', 'Signal mis à jour avec succès !');
      
      // Redirection après 2 secondes
      setTimeout(() => {
        router.push('/signals');
      }, 2000);

      return { success: true };
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour du signal';
      showNotification('error', errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchSignal();
  }, [params.id]);

  const breadcrumbItems = [
    { label: 'Accueil', href: '/index' },
    { label: 'Signaux Faibles', href: '/signals' },
    { label: 'Modifier', isCurrentPage: true }
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <style>{styles}</style>
        <div className="edit-signal-container">
          <div className="edit-signal-loading">
            <div className="edit-signal-spinner"></div>
            <h2>Chargement du signal...</h2>
            <p>Veuillez patienter pendant que nous récupérons les données.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !signal) {
    return (
      <DashboardLayout>
        <style>{styles}</style>
        <div className="edit-signal-container">
          <div className="breadcrumbs-container">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <div className="edit-signal-error">
            <h3>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
              Erreur de chargement
            </h3>
            <p>{error || "Signal non trouvé"}</p>
            <button 
              onClick={() => router.push('/signals')} 
              className="edit-signal-back-btn"
            >
              <i className="fas fa-arrow-left"></i>
              Retour à la liste
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <UserProvider>
      <style>{styles}</style>
      <div className="edit-signal-container">
        <div className="breadcrumbs-container">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        
        {/* <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: '#333', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <i className="fas fa-edit" style={{ color: '#22577a' }}></i>
          Modifier le signal #{signal._id.slice(-6).toUpperCase()}
        </h1> */}
        
        <WeakSignalEditForm 
          signal={signal} 
          onSubmit={handleUpdateSignal}
          isSubmitting={isSubmitting}
          onCancel={() => router.push('/signals')}
        />

        {/* Notification */}
        <Notification
          type={notification.type}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={closeNotification}
        />
      </div>
    </UserProvider>
  );
}