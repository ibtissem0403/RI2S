'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { WeakSignal, WeakSignalStats } from '@/types/models';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import WeakSignalList from '@/components/WeakSignalList/WeakSignalList';
import WeakSignalStatsDashboard from '@/components/WeakSignalStats/WeakSignalStatsDashboard';
import { UserProvider } from '@/contexts/UserContext';
import Notification, { NotificationType } from '@/components/Notification/Notification';
import Modal from '@/components/Modal/Modal';
import DeleteConfirmation from '@/components/DeleteConfirmation/DeleteConfirmation';
import ExportExcelButton from '@/components/ExportExcelButton/ExportExcelButton';
import ExportPDFButton from '@/components/ExportPDFButton/ExportPDFButton';
import '@fortawesome/fontawesome-free/css/all.min.css';

// CSS harmonisé avec la plateforme
const styles = `
  .signals-page-container {
    width: 100%;
    padding: 0 0.5rem;
  }

  .signals-page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .signals-page-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #333;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .signals-page-title i {
    color: #22577a;
    font-size: 1.25rem;
  }

  .signals-page-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-left: auto;
  }

  .signals-page-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;  /* MODIFIÉ: Réduit de 0.6rem 1rem */
    border: none;
    border-radius: 0.4rem;
    font-weight: 600;
    font-size: 0.85rem;     /* MODIFIÉ: Réduit de 0.9rem */
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
  }

  .signals-page-btn-primary {
    background-color: #22577a;
    color: white;
  }

  .signals-page-btn-primary:hover {
    background-color: #1a4b6d;
  }

  .signals-page-btn-secondary {
    background-color: #4a9540;
    color: white;
  }

  .signals-page-btn-secondary:hover:not(:disabled) {
    background-color: #3a8a32;
  }

  .signals-page-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .signals-page-stats-count {
    background-color: #f8f9fa;
    padding: 0.6rem 0.8rem;  /* MODIFIÉ: Réduit de 1rem 1.5rem */
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
    text-align: center;
  }

  .signals-page-stats-count-value {
    font-size: 1.5rem;      /* MODIFIÉ: Réduit de 2rem */
    font-weight: 700;
    color: #22577a;
    margin: 0;
  }

  .signals-page-stats-count-label {
    font-size: 0.875rem;
    color: #6c757d;
    margin: 0;
  }

  .signals-page-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .signals-page-filters {
    background-color: #f8f9fa;
    padding: 1rem 1.25rem;
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
  }

  .signals-page-filters-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .signals-page-filters-title i {
    color: #4a9540;
  }

  .signals-page-filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .signals-page-filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .signals-page-filter-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .signals-page-filter-label i {
    color: #6c757d;
    font-size: 0.75rem;
  }

  .signals-page-filter-input,
  .signals-page-filter-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: border-color 0.15s ease-in-out;
    background: white;
  }

  .signals-page-filter-input:focus,
  .signals-page-filter-select:focus {
    outline: none;
    border-color: #22577a;
    box-shadow: 0 0 0 2px rgba(34, 87, 122, 0.25);
  }

  .signals-page-filter-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .signals-page-filter-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .signals-page-filter-btn-clear {
    background-color: #6c757d;
    color: white;
  }

  .signals-page-filter-btn-clear:hover {
    background-color: #5a6268;
  }

  .signals-page-filter-btn-apply {
    background-color: #4a9540;
    color: white;
  }

  .signals-page-filter-btn-apply:hover {
    background-color: #3a8a32;
  }

  .signals-page-stats-toggle {
    background-color: white;
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
    overflow: hidden;
  }

  .signals-page-toggle-btn {
    width: 100%;
    padding: 1rem;
    border: none;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }

  .signals-page-toggle-btn:hover {
    background-color: #f8f9fa;
  }

  .signals-page-toggle-btn.active {
    background-color: #22577a;
    color: white;
  }

  .signals-page-toggle-btn i {
    font-size: 1.125rem;
  }

  .signals-page-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    text-align: center;
    color: #6c757d;
  }

  .signals-page-spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid #f3f4f6;
    border-top: 3px solid #22577a;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .signals-page-error {
    background-color: #f8d7da;
    color: #721c24;
    padding: 1rem;
    border-radius: 0.375rem;
    text-align: center;
    margin: 1rem 0;
    border: 1px solid #f5c6cb;
  }

  .signals-page-error h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
  }

  .signals-page-error p {
    margin: 0 0 1rem 0;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .signals-page-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .signals-page-actions {
      width: 100%;
      justify-content: space-between;
    }

    .signals-page-filters-grid {
      grid-template-columns: 1fr;
    }

    .signals-page-filter-actions {
      flex-direction: column;
    }

    .signals-page-filter-btn {
      width: 100%;
      justify-content: center;
    }
  }
`;

const breadcrumbItems = [
  { label: 'Accueil', href: '/index' },
  { label: 'Alertes', isCurrentPage: true }
];

function SignalsContent() {
  const router = useRouter();
  const [signals, setSignals] = useState<WeakSignal[]>([]);
  const [filteredSignals, setFilteredSignals] = useState<WeakSignal[]>([]);
  const [stats, setStats] = useState<WeakSignalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  // État pour la suppression et le modal de confirmation
  const [signalToDelete, setSignalToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
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
  
  // Filtres
  const [filters, setFilters] = useState({
    status: 'all',
    signalType: '',
    source: '',
    search: '',
    dateRange: {
      startDate: '',
      endDate: ''
    }
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

  // Fonction de navigation
  const handleEditSignal = (id: string) => {
    router.push(`/signal/edit/${id}`);
  };
  
  const handleViewDetails = (id: string) => {
    router.push(`/signaux/${id}`);
  };
  
  const handleCreateSignal = () => {
    router.push('/signalss');
  };

  // Gestion de la suppression
  const handleDeleteClick = (id: string) => {
    // Trouver les détails du signal pour afficher dans le modal
    const signalToDelete = signals.find(signal => signal._id === id);
    
    if (signalToDelete) {
      setSignalToDelete(id);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (!signalToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');

      // Appel API pour supprimer le signal
      await axios.delete(
        `http://localhost:5000/api/weak-signals/${signalToDelete}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Fermer le modal
      setShowDeleteModal(false);
      setSignalToDelete(null);
      
      // Rafraîchir la liste après suppression
      await fetchSignals(false);
      
      // Afficher une notification de succès
      showNotification('success', 'Signal supprimé avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression du signal';
      showNotification('error', errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSignalToDelete(null);
  };

  // Charger les signaux
  const fetchSignals = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');

      const response = await axios.get<WeakSignal[]>(
        'http://localhost:5000/api/weak-signals',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSignals(response.data || []);
      setFilteredSignals(response.data || []);
      
      if (showLoadingIndicator) {
        showNotification('success', `${response.data?.length || 0} signaux chargés`);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors du chargement des signaux';
      setError(errorMessage);
      showNotification('error', errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Charger les statistiques
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');

      const response = await axios.get<WeakSignalStats>(
        'http://localhost:5000/api/weak-signals/stats',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStats(response.data);
    } catch (error: any) {
      console.error('Erreur lors du chargement des statistiques:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors du chargement des statistiques';
      setStatsError(errorMessage);
      showNotification('error', errorMessage);
    } finally {
      setStatsLoading(false);
    }
  };

  // Appliquer les filtres
  const applyFilters = () => {
    let filtered = [...signals];

    // Filtre par statut
    if (filters.status !== 'all') {
      filtered = filtered.filter(signal => signal.status === filters.status);
    }

    // Filtre par type
    if (filters.signalType.trim()) {
      filtered = filtered.filter(signal => 
        signal.signalType.toLowerCase().includes(filters.signalType.toLowerCase())
      );
    }

    // Filtre par source
    if (filters.source.trim()) {
      filtered = filtered.filter(signal => 
        signal.source.toLowerCase().includes(filters.source.toLowerCase())
      );
    }

    // Recherche textuelle
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(signal => 
        signal.description.toLowerCase().includes(searchTerm) ||
        signal.signalType.toLowerCase().includes(searchTerm) ||
        signal.source.toLowerCase().includes(searchTerm) ||
        `${signal.beneficiary?.fullName} ${signal.beneficiary?.firstName}`.toLowerCase().includes(searchTerm)
      );
    }

    // Filtre par plage de dates
    if (filters.dateRange.startDate) {
      filtered = filtered.filter(signal => 
        new Date(signal.receptionDate) >= new Date(filters.dateRange.startDate)
      );
    }
    if (filters.dateRange.endDate) {
      filtered = filtered.filter(signal => 
        new Date(signal.receptionDate) <= new Date(filters.dateRange.endDate)
      );
    }

    setFilteredSignals(filtered);
    showNotification('info', `${filtered.length} signal${filtered.length > 1 ? 's' : ''} après filtrage`);
  };

  // Réinitialiser les filtres
  const clearFilters = () => {
    setFilters({
      status: 'all',
      signalType: '',
      source: '',
      search: '',
      dateRange: {
        startDate: '',
        endDate: ''
      }
    });
    setFilteredSignals(signals);
    showNotification('info', 'Filtres réinitialisés');
  };

  // Chargement initial
  useEffect(() => {
    fetchSignals();
  }, []);

  // Charger les stats quand on les affiche
  useEffect(() => {
    if (showStats && !stats && !statsLoading) {
      fetchStats();
    }
  }, [showStats, stats, statsLoading]);

  // AJOUT: Effet pour appliquer les filtres automatiquement
  useEffect(() => {
    // Appliquer les filtres automatiquement quand les filtres changent
    // (sans notification pour éviter le spam à chaque frappe)
    let filtered = [...signals];

    // Filtre par statut
    if (filters.status !== 'all') {
      filtered = filtered.filter(signal => signal.status === filters.status);
    }

    // Filtre par type
    if (filters.signalType.trim()) {
      filtered = filtered.filter(signal => 
        signal.signalType.toLowerCase().includes(filters.signalType.toLowerCase())
      );
    }

    // Filtre par source
    if (filters.source.trim()) {
      filtered = filtered.filter(signal => 
        signal.source.toLowerCase().includes(filters.source.toLowerCase())
      );
    }

    // Recherche textuelle
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(signal => 
        signal.description.toLowerCase().includes(searchTerm) ||
        signal.signalType.toLowerCase().includes(searchTerm) ||
        signal.source.toLowerCase().includes(searchTerm) ||
        `${signal.beneficiary?.fullName} ${signal.beneficiary?.firstName}`.toLowerCase().includes(searchTerm)
      );
    }

    // Filtre par plage de dates
    if (filters.dateRange.startDate) {
      filtered = filtered.filter(signal => 
        new Date(signal.receptionDate) >= new Date(filters.dateRange.startDate)
      );
    }
    if (filters.dateRange.endDate) {
      filtered = filtered.filter(signal => 
        new Date(signal.receptionDate) <= new Date(filters.dateRange.endDate)
      );
    }

    setFilteredSignals(filtered);
  }, [filters, signals]); // Ce useEffect s'exécute à chaque changement des filtres ou des signaux

  // Obtenir les détails du signal à supprimer
  const getSignalDetails = () => {
    if (!signalToDelete) return { beneficiary: '', type: '' };
    
    const signal = signals.find(s => s._id === signalToDelete);
    if (!signal) return { beneficiary: '', type: '' };
    
    const beneficiary = `${signal.beneficiary?.fullName || ''} ${signal.beneficiary?.firstName || ''}`.trim();
    return {
      beneficiary,
      type: signal.signalType
    };
  };

  // Détails du signal à supprimer pour le message du modal
  const { beneficiary, type } = getSignalDetails();

  if (isLoading) {
    return (
      <DashboardLayout>
        <style>{styles}</style>
        <div className="signals-page-container">
          <div className="signals-page-loading">
            <div className="signals-page-spinner"></div>
            <h2>Chargement des signaux...</h2>
            <p>Veuillez patienter pendant que nous récupérons les données.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <style>{styles}</style>
      <div className="signals-page-container">
        <div className="breadcrumbs-container">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        
        {/* En-tête */}
        <div className="signals-page-header">
          <h1 className="signals-page-title">
            <i className="fas fa-exclamation-triangle"></i>
            Gestion des Alertes
          </h1>
          
          <div className="signals-page-actions">
            <button
              onClick={handleCreateSignal}
              className="signals-page-btn signals-page-btn-primary"
            >
              <i className="fas fa-plus"></i>
              Créer un Signal
            </button>
            
            <button
              onClick={() => fetchSignals(false)}
              className="signals-page-btn signals-page-btn-secondary"
              disabled={isRefreshing}
            >
              <i className={`fas fa-sync ${isRefreshing ? 'fa-spin' : ''}`}></i>
              {isRefreshing ? 'Actualisation...' : 'Actualiser'}
            </button>

 
            
            <div className="signals-page-stats-count">
              <div className="signals-page-stats-count-value">{signals.length}</div>
              <div className="signals-page-stats-count-label">Total signaux</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="signals-page-error">
            <h3>
              <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }}></i>
              Erreur de chargement
            </h3>
            <p>{error}</p>
            <button
              onClick={() => fetchSignals()}
              className="signals-page-btn signals-page-btn-primary"
            >
              <i className="fas fa-redo"></i>
              Réessayer
            </button>
          </div>
        )}

        <div className="signals-page-content">
          {/* Filtres */}
          <div className="signals-page-filters">
            <h2 className="signals-page-filters-title">
              <i className="fas fa-filter"></i>
              Filtres et recherche
            </h2>
            
            <div className="signals-page-filters-grid">
              <div className="signals-page-filter-group">
                <label className="signals-page-filter-label">
                  <i className="fas fa-flag"></i>
                  Statut
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="signals-page-filter-select"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="Nouveau">Nouveau</option>
                  <option value="En cours">En cours</option>
                  <option value="Clôturé">Clôturé</option>
                </select>
              </div>

              <div className="signals-page-filter-group">
                <label className="signals-page-filter-label">
                  <i className="fas fa-tag"></i>
                  Type de signal
                </label>
                <input
                  type="text"
                  value={filters.signalType}
                  onChange={(e) => setFilters(prev => ({ ...prev, signalType: e.target.value }))}
                  className="signals-page-filter-input"
                  placeholder="Technique, Santé, Comportement..."
                />
              </div>

              <div className="signals-page-filter-group">
                <label className="signals-page-filter-label">
                  <i className="fas fa-satellite"></i>
                  Source
                </label>
                <input
                  type="text"
                  value={filters.source}
                  onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                  className="signals-page-filter-input"
                  placeholder="Capteur, Famille, Médecin..."
                />
              </div>

              <div className="signals-page-filter-group">
                <label className="signals-page-filter-label">
                  <i className="fas fa-search"></i>
                  Recherche globale
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="signals-page-filter-input"
                  placeholder="Rechercher dans tous les champs..."
                />
              </div>

              <div className="signals-page-filter-group">
                <label className="signals-page-filter-label">
                  <i className="fas fa-calendar"></i>
                  Date de début
                </label>
                <input
                  type="date"
                  value={filters.dateRange.startDate}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, startDate: e.target.value }
                  }))}
                  className="signals-page-filter-input"
                />
              </div>

              <div className="signals-page-filter-group">
                <label className="signals-page-filter-label">
                  <i className="fas fa-calendar"></i>
                  Date de fin
                </label>
                <input
                  type="date"
                  value={filters.dateRange.endDate}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    dateRange: { ...prev.dateRange, endDate: e.target.value }
                  }))}
                  className="signals-page-filter-input"
                />
              </div>
            </div>

            <div className="signals-page-filter-actions">
              <button
                onClick={clearFilters}
                className="signals-page-filter-btn signals-page-filter-btn-clear"
              >
                <i className="fas fa-times"></i>
                Effacer
              </button>
              <ExportExcelButton 
    currentFilters={{
      status: filters.status,
      signalType: filters.signalType,
      source: filters.source,
      dateRange: {
        startDate: filters.dateRange.startDate,
        endDate: filters.dateRange.endDate
      },
      search: filters.search
    }}
    onNotification={(type, message) => showNotification(type as NotificationType, message)}
  />
  <ExportPDFButton 
                currentFilters={{
                  status: filters.status,
                  signalType: filters.signalType,
                  source: filters.source,
                  dateRange: {
                    startDate: filters.dateRange.startDate,
                    endDate: filters.dateRange.endDate
                  },
                  search: filters.search
                }}
                onNotification={(type, message) => showNotification(type as NotificationType, message)}
              />
              
            </div>
          </div>

          {/* Toggle pour les statistiques */}
          <div className="signals-page-stats-toggle">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`signals-page-toggle-btn ${showStats ? 'active' : ''}`}
            >
              <i className={`fas ${showStats ? 'fa-chart-bar' : 'fa-chart-line'}`}></i>
              {showStats ? 'Masquer les statistiques' : 'Afficher les statistiques'}
              <i className={`fas fa-chevron-${showStats ? 'up' : 'down'}`}></i>
            </button>
          </div>

          {/* Statistiques */}
          {showStats && (
            <div style={{ marginBottom: '1.5rem' }}>
              {statsLoading ? (
                <div className="signals-page-loading">
                  <div className="signals-page-spinner"></div>
                  <p>Chargement des statistiques...</p>
                </div>
              ) : statsError ? (
                <div className="signals-page-error">
                  <h3>Erreur de chargement des statistiques</h3>
                  <p>{statsError}</p>
                  <button
                    onClick={fetchStats}
                    className="signals-page-btn signals-page-btn-primary"
                  >
                    <i className="fas fa-redo"></i>
                    Réessayer
                  </button>
                </div>
              ) : stats ? (
                <WeakSignalStatsDashboard stats={stats} />
              ) : null}
            </div>
          )}

          {/* Liste des signaux */}
          <WeakSignalList
            signals={filteredSignals}
            isLoading={false}
            error={null}
            onRefresh={() => fetchSignals(false)}
            isRefreshing={isRefreshing}
            onViewDetails={handleViewDetails}
            onEdit={handleEditSignal}
            onDelete={handleDeleteClick}
          />
        </div>

        {/* Modal de confirmation de suppression */}
        <Modal
          isOpen={showDeleteModal}
          onClose={cancelDelete}
          title="Confirmer la suppression"
          size="small"
        >
          <DeleteConfirmation
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
            isLoading={isDeleting}
            signalType={type}
            beneficiaryName={beneficiary}
          />
        </Modal>

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

export default function SignalsPage() {
  return (
    <UserProvider>
      <SignalsContent />
    </UserProvider>
  );
}