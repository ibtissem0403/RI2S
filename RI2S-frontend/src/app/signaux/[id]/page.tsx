// app/signaux/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { WeakSignal } from '@/types/models';
import { useUser } from '@/contexts/UserContext';
import { UserProvider } from '@/contexts/UserContext';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import Notification, { NotificationType } from '@/components/Notification/Notification';
import '@fortawesome/fontawesome-free/css/all.min.css';

// CSS harmonisé avec la plateforme
const styles = `
  .signal-detail-container {
    width: 100%;
    padding: 0 0.5rem;
  }

  .signal-detail-header {
    background-color: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid #dee2e6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .signal-detail-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .signal-detail-title i {
    color: #22577a;
    font-size: 1.25rem;
  }

  .signal-detail-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .signal-detail-meta-item {
    background-color: #f8f9fa;
    padding: 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid #dee2e6;
  }

  .signal-detail-meta-label {
    font-size: 0.75rem;
    color: #6c757d;
    margin-bottom: 0.25rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .signal-detail-meta-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: #333;
  }

  .signal-detail-status {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .signal-detail-status.nouveau {
    background-color: #f8d7da;
    color: #721c24;
  }

  .signal-detail-status.en-cours {
    background-color: #fff3cd;
    color: #856404;
  }

  .signal-detail-status.cloture {
    background-color: #d4edda;
    color: #155724;
  }

  .signal-detail-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .signal-detail-section {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    border: 1px solid #dee2e6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .signal-detail-section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 1rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #22577a;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .signal-detail-section-title i {
    color: #22577a;
    font-size: 1rem;
  }

  .signal-detail-description {
    font-size: 0.9rem;
    line-height: 1.5;
    color: #495057;
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 0.375rem;
    border-left: 4px solid #22577a;
  }

  .signal-detail-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .signal-detail-info-item {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 0.375rem;
    border: 1px solid #dee2e6;
  }

  .signal-detail-info-label {
    font-size: 0.75rem;
    color: #6c757d;
    font-weight: 500;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .signal-detail-info-label i {
    color: #6c757d;
    font-size: 0.7rem;
  }

  .signal-detail-info-value {
    font-size: 0.9rem;
    color: #333;
    font-weight: 600;
  }

  .signal-detail-contacts-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .signal-detail-contact-item {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    padding: 1rem;
    border-left: 4px solid #4a9540;
    transition: box-shadow 0.2s;
  }

  .signal-detail-contact-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .signal-detail-contact-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .signal-detail-contact-info {
    flex: 1;
  }

  .signal-detail-contact-person {
    font-size: 1rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .signal-detail-contact-person i {
    color: #4a9540;
  }

  .signal-detail-contact-profession {
    font-size: 0.8rem;
    color: #6c757d;
    font-weight: 500;
    margin-bottom: 0.75rem;
    padding: 0.25rem 0.75rem;
    background: rgba(74, 149, 64, 0.1);
    border-radius: 12px;
    display: inline-block;
  }

  .signal-detail-contact-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .signal-detail-contact-meta-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #6c757d;
    background: white;
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
    border: 1px solid #dee2e6;
  }

  .signal-detail-contact-meta-item i {
    color: #6c757d;
  }

  .signal-detail-contact-subject {
    font-size: 0.9rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.5rem;
    padding: 0.75rem;
    background: white;
    border-radius: 0.25rem;
    border: 1px solid #dee2e6;
  }

  .signal-detail-contact-content {
    font-size: 0.85rem;
    color: #495057;
    line-height: 1.4;
    background: white;
    padding: 0.75rem;
    border-radius: 0.25rem;
    border: 1px solid #dee2e6;
    margin-bottom: 0.5rem;
  }

  .signal-detail-contact-response {
    background: #e6f7ed;
    border: 1px solid #28a745;
    border-radius: 0.25rem;
    padding: 0.75rem;
    margin-top: 0.5rem;
  }

  .signal-detail-response-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .signal-detail-response-badge {
    background: #28a745;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .signal-detail-response-date {
    font-size: 0.75rem;
    color: #155724;
    font-weight: 500;
  }

  .signal-detail-response-content {
    font-size: 0.85rem;
    color: #155724;
    line-height: 1.4;
    background: rgba(255, 255, 255, 0.7);
    padding: 0.5rem;
    border-radius: 0.25rem;
  }

  .signal-detail-no-contacts {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
    background: #f8f9fa;
    border-radius: 0.375rem;
    border: 2px dashed #dee2e6;
  }

  .signal-detail-no-contacts i {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #dee2e6;
  }

  .signal-detail-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #dee2e6;
  }

  .signal-detail-btn {
    padding: 0.6rem 1.5rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
  }

  .signal-detail-btn-back {
    background: #6c757d;
    color: white;
  }

  .signal-detail-btn-back:hover {
    background: #5a6268;
  }

  .signal-detail-btn-edit {
    background: #22577a;
    color: white;
  }

  .signal-detail-btn-edit:hover {
    background: #1a4b6d;
  }

  .signal-detail-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    text-align: center;
  }

  .signal-detail-spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid #f3f4f6;
    border-top: 3px solid #22577a;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .signal-detail-error {
    background: #f8d7da;
    color: #721c24;
    padding: 1.5rem;
    border-radius: 0.375rem;
    text-align: center;
    margin: 1rem 0;
    border: 1px solid #f5c6cb;
  }

  .signal-detail-error h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
  }

  .signal-detail-error p {
    margin: 0 0 1rem 0;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .signal-detail-meta {
      grid-template-columns: 1fr;
    }

    .signal-detail-info-grid {
      grid-template-columns: 1fr;
    }

    .signal-detail-contact-header {
      flex-direction: column;
      gap: 0.75rem;
      align-items: stretch;
    }

    .signal-detail-contact-meta {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }

    .signal-detail-actions {
      flex-direction: column;
    }

    .signal-detail-btn {
      width: 100%;
      justify-content: center;
    }
  }
`;

export default function SignalDetailPage() {
  return (
    <UserProvider>
      <SignalDetailContent />
    </UserProvider>
  );
}

function SignalDetailContent() {
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  
  const [signal, setSignal] = useState<WeakSignal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Charger les détails du signal
  useEffect(() => {
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

    if (params.id) {
      fetchSignal();
    }
  }, [params.id]);

  // Fonction pour formater le statut
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Nouveau':
        return 'nouveau';
      case 'En cours':
        return 'en-cours';
      case 'Clôturé':
        return 'cloture';
      default:
        return '';
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fonction pour formater la date avec l'heure
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const breadcrumbItems = [
    { label: 'Accueil', href: '/index' },
    { label: 'Signaux Faibles', href: '/signals' },
    { label: 'Détails du Signal', isCurrentPage: true }
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <style>{styles}</style>
        <div className="signal-detail-container">
          <div className="signal-detail-loading">
            <div className="signal-detail-spinner"></div>
            <p>Chargement des détails du signal...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !signal) {
    return (
      <DashboardLayout>
        <style>{styles}</style>
        <div className="signal-detail-container">
          <div className="breadcrumbs-container">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <div className="signal-detail-error">
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
            <h3>Erreur de chargement</h3>
            <p>{error || 'Signal non trouvé'}</p>
            <button
              onClick={() => router.push('/signals')}
              className="signal-detail-btn signal-detail-btn-back"
              style={{ margin: '0 auto' }}
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
    <DashboardLayout>
      <style>{styles}</style>
      <div className="signal-detail-container">
        <div className="breadcrumbs-container">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        
        {/* En-tête du signal */}
        <div className="signal-detail-header">
          {/* <h1 className="signal-detail-title">
            <i className="fas fa-exclamation-triangle"></i>
            Signal #{signal._id.slice(-6).toUpperCase()}
          </h1> */}
          
          <div className="signal-detail-meta">
            <div className="signal-detail-meta-item">
              <div className="signal-detail-meta-label">Statut</div>
              <div className="signal-detail-meta-value">
                <span className={`signal-detail-status ${getStatusClass(signal.status)}`}>
                  <i className="fas fa-flag"></i>
                  {signal.status}
                </span>
              </div>
            </div>
            
            <div className="signal-detail-meta-item">
              <div className="signal-detail-meta-label">Type</div>
              <div className="signal-detail-meta-value">{signal.signalType}</div>
            </div>
            
            <div className="signal-detail-meta-item">
              <div className="signal-detail-meta-label">Source</div>
              <div className="signal-detail-meta-value">{signal.source}</div>
            </div>
            
            <div className="signal-detail-meta-item">
              <div className="signal-detail-meta-label">Date de réception</div>
              <div className="signal-detail-meta-value">{formatDate(signal.receptionDate)}</div>
            </div>
          </div>
        </div>

        <div className="signal-detail-content">
          {/* Section informations générales */}
          <div className="signal-detail-section">
            <h2 className="signal-detail-section-title">
              <i className="fas fa-info-circle"></i>
              Informations générales
            </h2>
            
            <div className="signal-detail-info-grid">
              <div className="signal-detail-info-item">
                <div className="signal-detail-info-label">
                  <i className="fas fa-user"></i>
                  Bénéficiaire
                </div>
                <div className="signal-detail-info-value">
                  {signal.beneficiary?.fullName} {signal.beneficiary?.firstName}
                </div>
              </div>
              
              <div className="signal-detail-info-item">
                <div className="signal-detail-info-label">
                  <i className="fas fa-user-tie"></i>
                  Coordinateur
                </div>
                <div className="signal-detail-info-value">
                  {user && signal.coordinator._id === user._id ? (
                    <span style={{ 
                      background: '#22577a', 
                      color: 'white', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      Vous
                    </span>
                  ) : (
                    signal.coordinator.fullName
                  )}
                </div>
              </div>
              
              <div className="signal-detail-info-item">
                <div className="signal-detail-info-label">
                  <i className="fas fa-calendar-plus"></i>
                  Créé le
                </div>
                <div className="signal-detail-info-value">
                  {formatDateTime(signal.createdAt)}
                </div>
              </div>
              
              <div className="signal-detail-info-item">
                <div className="signal-detail-info-label">
                  <i className="fas fa-calendar-check"></i>
                  Dernière mise à jour
                </div>
                <div className="signal-detail-info-value">
                  {formatDateTime(signal.updatedAt)}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <div className="signal-detail-info-label" style={{ marginBottom: '0.75rem' }}>
                <i className="fas fa-file-alt"></i>
                Description détaillée
              </div>
              <div className="signal-detail-description">
                {signal.description}
              </div>
            </div>

            {signal.notes && (
              <div style={{ marginTop: '1rem' }}>
                <div className="signal-detail-info-label" style={{ marginBottom: '0.75rem' }}>
                  <i className="fas fa-sticky-note"></i>
                  Notes additionnelles
                </div>
                <div className="signal-detail-description">
                  {signal.notes}
                </div>
              </div>
            )}
          </div>

          {/* Section contacts */}
          <div className="signal-detail-section">
            <h2 className="signal-detail-section-title">
              <i className="fas fa-phone"></i>
              Contacts et suivi
              <span style={{ 
                marginLeft: 'auto', 
                fontSize: '0.75rem', 
                fontWeight: '500',
                background: '#4a9540',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px'
              }}>
                {signal.contacts?.length || 0} contact{(signal.contacts?.length || 0) > 1 ? 's' : ''}
              </span>
            </h2>
            
            <div className="signal-detail-contacts-list">
              {signal.contacts && signal.contacts.length > 0 ? (
                signal.contacts.map((contact, index) => (
                  <div key={index} className="signal-detail-contact-item">
                    <div className="signal-detail-contact-header">
                      <div className="signal-detail-contact-info">
                        <div className="signal-detail-contact-person">
                          <i className="fas fa-user-circle"></i>
                          {contact.contactedPerson.name}
                        </div>
                        {contact.contactedPerson.profession && (
                          <div className="signal-detail-contact-profession">
                            {contact.contactedPerson.profession}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="signal-detail-contact-meta">
                      <div className="signal-detail-contact-meta-item">
                        <i className="fas fa-calendar"></i>
                        {formatDate(contact.contactDate)}
                      </div>
                      <div className="signal-detail-contact-meta-item">
                        <i className="fas fa-phone"></i>
                        {contact.contactMethod}
                      </div>
                      {contact.contactedBy && typeof contact.contactedBy === 'object' && (
                        <div className="signal-detail-contact-meta-item">
                          <i className="fas fa-user"></i>
                          Contacté par: {contact.contactedBy.fullName}
                        </div>
                      )}
                    </div>
                    
                    <div className="signal-detail-contact-subject">
                      <i className="fas fa-tag" style={{ marginRight: '0.5rem', color: '#4a9540' }}></i>
                      {contact.contactSubject}
                    </div>
                    
                    {contact.contactContent && (
                      <div className="signal-detail-contact-content">
                        {contact.contactContent}
                      </div>
                    )}
                    
                    {contact.response?.hasResponse && contact.response.content && (
                      <div className="signal-detail-contact-response">
                        <div className="signal-detail-response-header">
                          <span className="signal-detail-response-badge">
                            <i className="fas fa-reply"></i>
                            Réponse reçue
                          </span>
                          {contact.response.date && (
                            <span className="signal-detail-response-date">
                              le {formatDate(contact.response.date)}
                              {contact.response.responseMethod && ` via ${contact.response.responseMethod}`}
                            </span>
                          )}
                        </div>
                        <div className="signal-detail-response-content">
                          {contact.response.content}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="signal-detail-no-contacts">
                  <i className="fas fa-phone-slash"></i>
                  <h3>Aucun contact enregistré</h3>
                  <p>Aucun contact n'a encore été ajouté pour ce signal.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="signal-detail-actions">
          <button
            onClick={() => router.push('/signals')}
            className="signal-detail-btn signal-detail-btn-back"
          >
            <i className="fas fa-arrow-left"></i>
            Retour à la liste
          </button>
          
          <button
            onClick={() => router.push(`/signal/edit/${signal._id}`)}
            className="signal-detail-btn signal-detail-btn-edit"
          >
            <i className="fas fa-edit"></i>
            Modifier ce signal
          </button>
        </div>

        {/* Notification */}
        <Notification
          type={notification.type}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={closeNotification}
        />
      </div>
    </DashboardLayout>
  );
}