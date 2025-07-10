"use client";
import { useState, useMemo } from "react";
import { WeakSignal } from "@/types/models";
import { useUser } from "@/contexts/UserContext";
import "@fortawesome/fontawesome-free/css/all.min.css";

// CSS harmonisé avec la plateforme
const styles = `
  .ws-list-container {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    border: 1px solid #dee2e6;
  }

  .ws-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
    font-size: 0.9rem;
    color: #6c757d;
    font-weight: 500;
  }

  .ws-refresh-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: #6366f1; /* Changé: Indigo au lieu de vert */
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ws-refresh-btn:hover:not(:disabled) {
    background-color: #4f46e5; /* Changé: Indigo plus foncé */
  }

  .ws-refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .ws-refresh-icon {
    font-size: 0.8rem;
  }

  .ws-refresh-icon.spinning {
    animation: spin 1s linear infinite;
  }

  .ws-table-container {
    overflow-x: auto;
  }

  .ws-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .ws-table th,
  .ws-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
    vertical-align: middle;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 150px;
  }

  .ws-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #495057;
    font-size: 0.8rem;
    letter-spacing: 0.025em;
    position: sticky;
    top: 0;
    z-index: 10;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
  }

  .ws-table th:hover {
    background-color: #e9ecef;
  }

  .ws-table th .ws-sort-header {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    justify-content: space-between;
  }

  .ws-table th .ws-sort-icon {
    opacity: 0.5;
    font-size: 0.7rem;
    transition: all 0.2s;
  }

  .ws-table th .ws-sort-icon.active {
    opacity: 1;
    color: #475569; /* Changé: Gris foncé au lieu de bleu */
  }

  .ws-table tbody tr {
    transition: background-color 0.15s;
    background-color: white;
  }

  .ws-table tbody tr:hover {
    background-color: #f8f9fa;
  }

  .ws-col-beneficiary {
    min-width: 150px;
    max-width: 200px;
  }

  .ws-col-type {
    min-width: 100px;
    max-width: 120px;
  }

  .ws-col-status {
    min-width: 90px;
    max-width: 100px;
  }

  .ws-col-coordinator {
    min-width: 130px;
  }

  .ws-col-contacts {
    min-width: 100px;
    width: 100px;
  }

  .ws-col-date {
    min-width: 90px;
    max-width: 100px;
  }

  .ws-col-actions {
    min-width: 180px;
    width: 180px;
  }

  .ws-type-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: capitalize;
    white-space: nowrap;
  }

  .ws-status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .status-new {
    background-color: #f8d7da;
    color: #721c24;
  }

  .status-in-progress {
    background-color: #fff3cd;
    color: #856404;
  }

  .status-closed {
    background-color: #d4edda;
    color: #155724;
  }

  .ws-contact-summary {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .ws-contact-count,
  .ws-response-count {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.7rem;
  }

  .ws-contact-count {
    color: #22577a;
    font-weight: 500;
  }

  .ws-response-count {
    color: #28a745;
    font-weight: 500;
  }

  .ws-no-contacts {
    color: #6c757d;
    font-size: 0.75rem;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .ws-coordinator {
    color: #495057;
    font-size: 0.8rem;
  }

  .ws-current-user {
    background-color: #64748b; /* Changé: Slate au lieu de bleu */
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.7rem;
  }

  .ws-actions {
    display: flex;
    gap: 0.25rem;
    flex-wrap: nowrap;
    justify-content: flex-start;
  }

  .ws-view-btn,
  .ws-edit-btn,
  .ws-delete-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    border: none;
    border-radius: 0.25rem;
    font-size: 0.7rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    text-decoration: none;
  }

  .ws-view-btn {
    background-color: #3b82f6; /* Changé: Bleu ciel au lieu de bleu foncé */
    color: white;
  }

  .ws-view-btn:hover {
    background-color: #2563eb; /* Changé: Bleu ciel plus foncé */
  }

  .ws-edit-btn {
    background-color: #f59e0b; /* Changé: Ambre au lieu de vert */
    color: white;
  }

  .ws-edit-btn:hover {
    background-color: #d97706; /* Changé: Ambre plus foncé */
  }
  
  .ws-delete-btn {
    background-color: #ef4444; /* Rouge */
    color: white;
  }

  .ws-delete-btn:hover {
    background-color: #dc2626; /* Rouge plus foncé */
  }

  .ws-loading,
  .ws-error,
  .ws-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
    text-align: center;
  }

  .ws-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #dee2e6;
    border-top: 3px solid #64748b; /* Changé: Slate au lieu de bleu */
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .ws-error {
    color: #721c24;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 0.375rem;
  }

  .ws-error h3 {
    margin: 0 0 0.5rem 0;
    color: #721c24;
  }

  .ws-retry-btn {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .ws-retry-btn:hover {
    background-color: #c82333;
  }

  .ws-empty-icon {
    font-size: 3rem;
    color: #dee2e6;
    margin-bottom: 1rem;
  }

  .ws-empty h3 {
    margin: 0 0 0.5rem 0;
    color: #6c757d;
  }

  .ws-empty p {
    margin: 0 0 1rem 0;
    color: #6c757d;
  }

  .ws-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-top: 1px solid #dee2e6;
    background-color: #f8f9fa;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .ws-pagination-info {
    color: #6c757d;
    font-size: 0.8rem;
  }

  .ws-pagination-controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .ws-page-btn {
    min-width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #dee2e6;
    background-color: white;
    color: #6c757d;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.8rem;
    text-decoration: none;
  }

  .ws-page-btn:hover:not(.ws-page-btn-disabled):not(.ws-page-btn-active) {
    background-color: #e9ecef;
    border-color: #adb5bd;
  }

  .ws-page-btn-active {
    background-color: #64748b; /* Changé: Slate au lieu de bleu */
    color: white;
    border-color: #64748b; /* Changé: Slate au lieu de bleu */
  }

  .ws-page-btn-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ws-items-per-page {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: #6c757d;
  }

  .ws-items-select {
    padding: 0.25rem 0.5rem;
    border: 1px solid #dee2e6;
    border-radius: 0.25rem;
    font-size: 0.8rem;
    background-color: white;
  }

  @media (max-width: 1024px) {
    .ws-table th,
    .ws-table td {
      padding: 0.5rem;
      font-size: 0.8rem;
    }
    
    .ws-col-actions {
      min-width: 180px;
      width: 180px;
    }

    .ws-view-btn,
    .ws-edit-btn,
    .ws-delete-btn {
      padding: 0.25rem 0.5rem;
      font-size: 0.65rem;
    }
  }

  @media (max-width: 768px) {
    .ws-table-container {
      font-size: 0.75rem;
    }
    
    .ws-actions {
      flex-direction: column;
      gap: 0.25rem;
      min-width: 80px;
    }
    
    .ws-pagination {
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .ws-pagination-controls {
      order: -1;
    }
  }

  @media (max-width: 640px) {
    .ws-summary {
      flex-direction: column;
      gap: 0.75rem;
      text-align: center;
    }
    
    .ws-contact-summary {
      align-items: flex-start;
    }
  }
`;

interface WeakSignalListProps {
  signals: WeakSignal[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onViewDetails: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function WeakSignalList({
  signals,
  isLoading,
  error,
  onRefresh,
  isRefreshing,
  onViewDetails,
  onEdit,
  onDelete,
}: WeakSignalListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof WeakSignal>('receptionDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { user } = useUser();

  // Palette de couleurs prédéfinies pour les différents types
  const colorPalette = [
    { bg: '#e0f2fe', text: '#0369a1' }, // Bleu (Technique)
    { bg: '#fef3c7', text: '#d97706' }, // Jaune (Santé)
    { bg: '#f3e8ff', text: '#7e22ce' }, // Violet (Comportement)
    { bg: '#f3f4f6', text: '#4b5563' }, // Gris (Autre)
    { bg: '#dcfce7', text: '#16a34a' }, // Vert
    { bg: '#ffedd5', text: '#ea580c' }, // Orange
    { bg: '#ffe4e6', text: '#e11d48' }, // Rouge
    { bg: '#dbeafe', text: '#2563eb' }, // Bleu foncé
    { bg: '#fae8ff', text: '#c026d3' }, // Rose
    { bg: '#f5f5f4', text: '#44403c' }, // Gris foncé
    { bg: '#cffafe', text: '#06b6d4' }, // Cyan
    { bg: '#d8b4fe', text: '#9333ea' }  // Violet foncé
  ];

  // Création d'un map pour les types connus (conserve leur couleur originale)
  const knownTypes = {
    'technique': 0,
    'santé': 1, 'health': 1, 'sante': 1,
    'comportement': 2, 'behavior': 2,
    'autre': 3, 'other': 3
  };

  // Fonction pour générer une couleur cohérente pour chaque type de signal
  const getTypeColor = useMemo(() => {
    // Map pour stocker les associations type -> couleur
    const typeColorMap = new Map();
    let nextColorIndex = Object.keys(knownTypes).length;

    return (type: string) => {
      const lowerType = type.toLowerCase();
      
      // Si c'est un type connu, utiliser sa couleur prédéfinie
      if (knownTypes[lowerType] !== undefined) {
        return colorPalette[knownTypes[lowerType]];
      }
      
      // Si ce type a déjà reçu une couleur, la réutiliser
      if (typeColorMap.has(lowerType)) {
        return typeColorMap.get(lowerType);
      }
      
      // Sinon, attribuer une nouvelle couleur de la palette
      const colorIndex = nextColorIndex % colorPalette.length;
      typeColorMap.set(lowerType, colorPalette[colorIndex]);
      nextColorIndex++;
      
      return colorPalette[colorIndex];
    };
  }, []);

  // Fonction de tri
  const handleSort = (field: keyof WeakSignal) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Trier les signaux
  const sortedSignals = [...signals].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Gestion spéciale pour les dates
    if (sortField === 'receptionDate' || sortField === 'createdAt' || sortField === 'updatedAt') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }

    // Gestion spéciale pour les objets
    if (sortField === 'beneficiary') {
      aValue = `${(a.beneficiary as any)?.fullName || ''} ${(a.beneficiary as any)?.firstName || ''}`;
      bValue = `${(b.beneficiary as any)?.fullName || ''} ${(b.beneficiary as any)?.firstName || ''}`;
    }

    if (sortField === 'coordinator') {
      aValue = (a.coordinator as any)?.fullName || '';
      bValue = (b.coordinator as any)?.fullName || '';
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedSignals.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedSignals.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Nouveau":
        return "status-new";
      case "En cours":
        return "status-in-progress";
      case "Clôturé":
        return "status-closed";
      default:
        return "";
    }
  };

  // Fonction pour déterminer le style du badge de type selon le contenu
  const getTypeStyle = (type: string) => {
    const typeColor = getTypeColor(type);
    return {
      backgroundColor: typeColor.bg,
      color: typeColor.text
    };
  };

  // Fonction pour afficher le coordinateur
  const renderCoordinator = (signal: WeakSignal) => {
    if (user && signal.coordinator._id === user._id) {
      return <span className="ws-current-user">Vous</span>;
    }
    return <span className="ws-coordinator">{signal.coordinator.fullName}</span>;
  };

  // Fonction pour afficher les informations de contact (version compacte)
  const renderContactInfo = (signal: WeakSignal) => {
    if (!signal.contacts || signal.contacts.length === 0) {
      return (
        <span className="ws-no-contacts" title="Aucun contact">
          <i className="fas fa-phone-slash" style={{ color: '#dc3545', fontSize: '0.85rem' }}></i>
          <span>Aucun</span>
        </span>
      );
    }

    const totalContacts = signal.contacts.length;
    const contactsWithResponse = signal.contacts.filter(
      contact => contact.response && contact.response.hasResponse
    ).length;

    return (
      <div className="ws-contact-summary">
        <span className="ws-contact-count">
          <i className="fas fa-phone"></i> 
          {totalContacts} contact{totalContacts > 1 ? 's' : ''}
        </span>
        {contactsWithResponse > 0 && (
          <span className="ws-response-count">
            <i className="fas fa-reply"></i> 
            {contactsWithResponse} réponse{contactsWithResponse > 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  };

  // Fonction pour obtenir l'icône de tri
  const getSortIcon = (field: keyof WeakSignal) => {
    if (sortField !== field) {
      return <i className="fas fa-sort ws-sort-icon"></i>;
    }
    return sortDirection === 'asc' 
      ? <i className="fas fa-sort-up ws-sort-icon active"></i>
      : <i className="fas fa-sort-down ws-sort-icon active"></i>;
  };

  if (isLoading) {
    return (
      <>
        <style>{styles}</style>
        <div className="ws-loading">
          <div className="ws-spinner"></div>
          <p>Chargement des signaux...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{styles}</style>
        <div className="ws-error">
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <button onClick={onRefresh} className="ws-retry-btn">
            <i className="fas fa-redo-alt"></i> Réessayer
          </button>
        </div>
      </>
    );
  }

  if (sortedSignals.length === 0) {
    return (
      <>
        <style>{styles}</style>
        <div className="ws-empty">
          <div className="ws-empty-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <h3>Aucun signal trouvé</h3>
          <p>Aucun signal ne correspond aux critères de recherche.</p>
          <button onClick={onRefresh} className="ws-refresh-btn">
            <i className="fas fa-sync"></i> Actualiser
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="ws-list-container">
        <div className="ws-summary">
          <span>
            <i className="fas fa-list" style={{ marginRight: '0.5rem' }}></i>
            {sortedSignals.length} signal{sortedSignals.length > 1 ? 's' : ''} trouvé{sortedSignals.length > 1 ? 's' : ''}
            {currentItems.length !== sortedSignals.length && (
              <span style={{ color: '#6c757d', marginLeft: '0.5rem' }}>
                (page {currentPage}/{totalPages})
              </span>
            )}
          </span>
          <button
            onClick={onRefresh}
            className="ws-refresh-btn"
            disabled={isRefreshing}
          >
            <i className={`fas fa-sync ws-refresh-icon ${isRefreshing ? "spinning" : ""}`}></i>
            {isRefreshing ? "Actualisation..." : "Actualiser"}
          </button>
        </div>

        <div className="ws-table-container">
          <table className="ws-table">
            <thead>
              <tr>
                <th 
                  className="ws-col-beneficiary"
                  onClick={() => handleSort('beneficiary')}
                >
                  <div className="ws-sort-header">
                    <span>
                      <i className="fas fa-user" style={{ marginRight: '0.25rem' }}></i>
                      Bénéficiaire
                    </span>
                    {getSortIcon('beneficiary')}
                  </div>
                </th>
                <th 
                  className="ws-col-type"
                  onClick={() => handleSort('signalType')}
                >
                  <div className="ws-sort-header">
                    <span>
                      <i className="fas fa-tag" style={{ marginRight: '0.25rem' }}></i>
                      Type
                    </span>
                    {getSortIcon('signalType')}
                  </div>
                </th>
                <th 
                  className="ws-col-status"
                  onClick={() => handleSort('status')}
                >
                  <div className="ws-sort-header">
                    <span>
                      <i className="fas fa-flag" style={{ marginRight: '0.25rem' }}></i>
                      Statut
                    </span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="ws-col-coordinator"
                  onClick={() => handleSort('coordinator')}
                >
                  <div className="ws-sort-header">
                    <span>
                      <i className="fas fa-user-tie" style={{ marginRight: '0.25rem' }}></i>
                      Coordinateur
                    </span>
                    {getSortIcon('coordinator')}
                  </div>
                </th>
                <th className="ws-col-contacts">
                  <span>
                    <i className="fas fa-phone" style={{ marginRight: '0.25rem' }}></i>
                    Contacts
                  </span>
                </th>
                <th 
                  className="ws-col-date"
                  onClick={() => handleSort('receptionDate')}
                >
                  <div className="ws-sort-header">
                    <span>
                      <i className="fas fa-calendar" style={{ marginRight: '0.25rem' }}></i>
                      Date
                    </span>
                    {getSortIcon('receptionDate')}
                  </div>
                </th>
                <th className="ws-col-actions">
                  <span>
                    <i className="fas fa-cogs" style={{ marginRight: '0.25rem' }}></i>
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((signal) => (
                <tr key={signal._id}>
                  <td className="ws-col-beneficiary">
                    <div style={{ fontWeight: '500' }}>
                      {signal.beneficiary?.fullName} {signal.beneficiary?.firstName}
                    </div>
                  </td>
                  <td className="ws-col-type">
                    <span 
                      className="ws-type-badge"
                      style={getTypeStyle(signal.signalType)}
                    >
                      {signal.signalType}
                    </span>
                  </td>
                  <td className="ws-col-status">
                    <span className={`ws-status-badge ${getStatusClass(signal.status)}`}>
                      {signal.status}
                    </span>
                  </td>
                  <td className="ws-col-coordinator">
                    {renderCoordinator(signal)}
                  </td>
                  <td className="ws-col-contacts">
                    {renderContactInfo(signal)}
                  </td>
                  <td className="ws-col-date">
                    <div style={{ fontSize: '0.8rem' }}>
                      {formatDate(signal.receptionDate)}
                    </div>
                  </td>
                  <td className="ws-col-actions">
                    <div className="ws-actions">
                      <button
                        onClick={() => onViewDetails(signal._id)}
                        className="ws-view-btn"
                        title="Voir les détails"
                      >
                        <i className="fas fa-eye"></i>
                        
                      </button>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(signal._id)}
                          className="ws-edit-btn"
                          title="Modifier le signal"
                        >
                          <i className="fas fa-edit"></i>
                          
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(signal._id)}
                          className="ws-delete-btn"
                          title="Supprimer le signal"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="ws-pagination">
            <div className="ws-pagination-info">
              Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, sortedSignals.length)} sur {sortedSignals.length} résultats
            </div>

            <div className="ws-items-per-page">
              <label htmlFor="itemsPerPage">Éléments par page:</label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="ws-items-select"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="ws-pagination-controls">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`ws-page-btn ${currentPage === 1 ? 'ws-page-btn-disabled' : ''}`}
                title="Première page"
              >
                <i className="fas fa-angle-double-left"></i>
              </button>
              
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`ws-page-btn ${currentPage === 1 ? 'ws-page-btn-disabled' : ''}`}
                title="Page précédente"
              >
                <i className="fas fa-angle-left"></i>
              </button>

              {/* Pages numériques */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`ws-page-btn ${currentPage === pageNum ? 'ws-page-btn-active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`ws-page-btn ${currentPage === totalPages ? 'ws-page-btn-disabled' : ''}`}
                title="Page suivante"
              >
                <i className="fas fa-angle-right"></i>
              </button>
              
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`ws-page-btn ${currentPage === totalPages ? 'ws-page-btn-disabled' : ''}`}
                title="Dernière page"
              >
                <i className="fas fa-angle-double-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}