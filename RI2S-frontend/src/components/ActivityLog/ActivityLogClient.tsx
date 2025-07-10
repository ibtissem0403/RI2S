'use client';
import React, { useState, useEffect } from 'react';
import { ActivityLogResponse } from '@/types/activityLog';
import { useRouter } from 'next/navigation';
import Notification, { NotificationType } from '@/components/Notification/Notification';
import { useSessionCheck, handleSessionExpired } from '@/utils/sessionHandler';
import AuthGuard from '@/components/AuthGuard';
import './ActivityLogClient.css';

const ActivityLogClient = () => {
  const router = useRouter();
  
  // États pour les logs d'activité
  const [logs, setLogs] = useState<ActivityLogResponse | null>(null);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20
  });
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
    isVisible: boolean;
  }>({
    type: 'info',
    message: '',
    isVisible: false
  });
  
  // Show notification
  const showNotification = (type: NotificationType, message: string) => {
    setNotification({
      type,
      message,
      isVisible: true
    });
  };

  // Close notification
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };
  
  // Vérification de session
  useSessionCheck(showNotification);
  
  // Charger les logs d'activité
  useEffect(() => {
    const fetchLogs = async () => {
      setLogsLoading(true);
      setLogsError(null);
      
      try {
        // Récupérer le token
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          handleSessionExpired(showNotification);
          return;
        }
        
        // Préparer l'URL avec les paramètres de filtre
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            queryParams.append(key, String(value));
          }
        });
        
        // Faire la requête
        const response = await fetch(`http://localhost:5000/api/activity-logs?${queryParams}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Vérifier si l'authentification a échoué
        if (response.status === 401) {
          handleSessionExpired(showNotification);
          return;
        }
        
        // Vérifier les autres erreurs
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        // Récupérer les données
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des logs:', error);
        setLogsError('Erreur lors du chargement des logs d\'activité.');
        showNotification('error', `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      } finally {
        setLogsLoading(false);
      }
    };
    
    fetchLogs();
  }, [filters]);
  
  // Gestionnaire de changement de page
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };
  
  // Gestionnaire de changement de filtre
  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...newFilters, page: 1 });
  };
  
  // Rendu de la table des logs d'activité
  const renderLogsTable = () => {
    if (logsLoading) {
      return (
        <div className="loader">
          <div className="spinner"></div>
        </div>
      );
    }
    
    if (logsError) {
      return (
        <div className="error-message">
          <p>{logsError}</p>
        </div>
      );
    }
    
    if (!logs || logs.data.length === 0) {
      return (
        <div className="no-results">
          <p className="no-results-text">Aucune activité trouvée avec ces critères.</p>
        </div>
      );
    }
    
    return (
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th>Date</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Type d'entité</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {logs.data.map((log) => (
                <tr key={log._id} className="table-row">
                  <td className="table-cell">
                    {new Date(log.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="table-cell">
                    <div className="font-medium">{log.user.fullName}</div>
                    <div className="text-gray-500">{log.user.email}</div>
                  </td>
                  <td className="table-cell">
                    <span className={`status-badge status-${log.action.toLowerCase()}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`status-badge entity-${log.entityType.toLowerCase()}`}>
                      {log.entityType}
                    </span>
                    {log.entityId && (
                      <div className="text-xs text-gray-500 mt-1">
                        ID: {log.entityId.substring(0, 8)}...
                      </div>
                    )}
                  </td>
                  <td className="table-cell">
                    {log.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {logs.totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              <p>
                Affichage de <span className="font-medium">{(logs.page - 1) * logs.limit + 1}</span> à{' '}
                <span className="font-medium">
                  {Math.min(logs.page * logs.limit, logs.total)}
                </span>{' '}
                sur <span className="font-medium">{logs.total}</span> résultats
              </p>
            </div>
            <div className="pagination-nav">
              <button
                onClick={() => handlePageChange(logs.page - 1)}
                disabled={logs.page === 1}
                className="pagination-button pagination-prev"
              >
                <span className="sr-only">Précédent</span>
                &larr;
              </button>
              
              {/* Affichage des numéros de page */}
              {Array.from({ length: Math.min(5, logs.totalPages) }, (_, i) => {
                const pageNum = logs.page <= 3 
                  ? i + 1 
                  : logs.page >= logs.totalPages - 2 
                    ? logs.totalPages - 4 + i 
                    : logs.page - 2 + i;
                
                if (pageNum <= 0 || pageNum > logs.totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`pagination-number ${logs.page === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(logs.page + 1)}
                disabled={logs.page === logs.totalPages}
                className="pagination-button pagination-next"
              >
                <span className="sr-only">Suivant</span>
                &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Rendu du composant principal
  return (
    <AuthGuard>
      <div className="activity-log-container">
        <div className="activity-log-header">
          <h1 className="activity-log-title">Journal d'activité</h1>
        </div>
        
        <div className="activity-log-content">
          {/* Filtres */}
          <div className="filters-container">
            <h2 className="filters-title">Filtres</h2>
            
            <div className="filters-grid">
              {/* Filtre par action */}
              <div className="filter-item">
                <label htmlFor="action" className="filter-label">
                  Action
                </label>
                <select
                  id="action"
                  name="action"
                  value={filters.action || ''}
                  onChange={(e) => handleFilterChange({ ...filters, action: e.target.value || undefined })}
                  className="filter-select"
                >
                  <option value="">Toutes les actions</option>
                  <option value="CREATE">Création</option>

                  <option value="UPDATE">Modification</option>
                  <option value="DELETE">Suppression</option>
                  <option value="LOGIN">Connexion</option>
                  <option value="LOGOUT">Déconnexion</option>
                  <option value="EXPORT">Export</option>
                </select>
              </div>
              
              {/* Filtre par type d'entité */}
              <div className="filter-item">
                <label htmlFor="entityType" className="filter-label">
                  Type d'entité
                </label>
                <select
                  id="entityType"
                  name="entityType"
                  value={filters.entityType || ''}
                  onChange={(e) => handleFilterChange({ ...filters, entityType: e.target.value || undefined })}
                  className="filter-select"
                >
                  <option value="">Tous les types</option>
                  <option value="WeakSignal">WeakSignal</option>
                  <option value="Beneficiary">Beneficiary</option>
                  <option value="ClinicalData">ClinicalData</option>
                  <option value="User">User</option>
                  <option value="System">System</option>
                </select>
              </div>
              
              {/* Filtre par date */}
              <div className="filter-item">
                <label htmlFor="startDate" className="filter-label">
                  Date de début
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange({ ...filters, startDate: e.target.value || undefined })}
                  className="filter-select"
                />
              </div>
              
              {/* Filtre par utilisateur - si besoin */}
              <div className="filter-item">
                <label htmlFor="user" className="filter-label">
                  Utilisateur
                </label>
                <input
                  type="text"
                  id="user"
                  name="user"
                  value={filters.user || ''}
                  onChange={(e) => handleFilterChange({ ...filters, user: e.target.value || undefined })}
                  className="filter-select"
                  placeholder="ID de l'utilisateur"
                />
              </div>
            </div>
            
            <div className="filter-reset-btn">
              <button
                onClick={() => handleFilterChange({ page: 1, limit: 20 })}
                className="reset-btn"
              >
                Réinitialiser
              </button>
            </div>
          </div>
          
          {/* Table des logs */}
          {renderLogsTable()}
        </div>
        
        {/* Notification */}
        <Notification
          type={notification.type}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={closeNotification}
          position="fixed"
        />
      </div>
    </AuthGuard>
  );
};

export default ActivityLogClient;