// components/WeakSignalStats/WeakSignalStatsDashboard.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { WeakSignalStats } from '@/types/models';
import '@fortawesome/fontawesome-free/css/all.min.css';

// CSS avec support pour les couleurs dynamiques
const styles = `
  .ws-stats-dashboard {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #dee2e6;
    overflow: hidden;
  }

  .ws-stats-header {
    background-color: #f8f9fa;
    padding: 1.5rem;
    border-bottom: 1px solid #dee2e6;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ws-stats-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .ws-stats-header h2 i {
    color: #22577a;
  }

  .ws-stats-total {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background-color: #22577a;
    color: white;
    padding: 0.75rem 1.25rem;
    border-radius: 25px;
    transition: transform 0.2s ease;
  }

  .ws-stats-total:hover {
    transform: translateY(-2px);
  }

  .ws-stats-label {
    font-size: 0.875rem;
    opacity: 0.9;
    font-weight: 500;
  }

  .ws-stats-value {
    font-size: 1.5rem;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.75rem;
    border-radius: 15px;
  }

  .ws-stats-tabs {
    display: flex;
    background-color: #f8f9fa;
    padding: 0 1rem;
    gap: 0.25rem;
    border-bottom: 1px solid #dee2e6;
    overflow-x: auto;
  }

  .ws-stats-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border: none;
    background: transparent;
    color: #6c757d;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    border-radius: 0.375rem 0.375rem 0 0;
    position: relative;
  }

  .ws-stats-tab:hover:not(.active) {
    background-color: #e9ecef;
    color: #495057;
  }

  .ws-stats-tab.active {
    background-color: white;
    color: #22577a;
    font-weight: 600;
    border-bottom: 2px solid #22577a;
  }

  .ws-stats-tab-count {
    background-color: rgba(34, 87, 122, 0.1);
    color: #22577a;
    padding: 0.2rem 0.5rem;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .ws-stats-tab.active .ws-stats-tab-count {
    background-color: #22577a;
    color: white;
  }

  .ws-stats-content {
    padding: 2rem;
  }

  .ws-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .ws-stats-card {
    background-color: white;
    border: 1px solid #dee2e6;
    border-radius: 0.5rem;
    padding: 1.5rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .ws-stats-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #22577a, #4a9540);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  .ws-stats-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border-color: #22577a;
  }

  .ws-stats-card:hover::before {
    transform: scaleX(1);
  }

  .ws-stats-card-wide {
    grid-column: 1 / -1;
  }

  .ws-stats-card h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 1rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #dee2e6;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .ws-stats-card h3 i {
    color: #22577a;
  }

  /* Graphique de statut */
  .ws-stats-status-overview {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .ws-stats-status-item {
    text-align: center;
    padding: 1rem;
    border-radius: 0.5rem;
    transition: all 0.3s ease;
    cursor: pointer;
    border: 1px solid #dee2e6;
  }

  .ws-stats-status-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .ws-stats-status-item.status-new {
    background: linear-gradient(135deg, #f8d7da, #f5c6cb);
    color: #721c24;
    border-color: #f5c6cb;
  }

  .ws-stats-status-item.status-in-progress {
    background: linear-gradient(135deg, #fff3cd, #ffeaa7);
    color: #856404;
    border-color: #ffeaa7;
  }

  .ws-stats-status-item.status-closed {
    background: linear-gradient(135deg, #d4edda, #c3e6cb);
    color: #155724;
    border-color: #c3e6cb;
  }

  .ws-stats-status-count {
    font-size: 2rem;
    font-weight: 700;
    display: block;
    margin-bottom: 0.25rem;
    animation: countUp 1s ease-out;
  }

  .ws-stats-status-label {
    font-size: 0.875rem;
    font-weight: 600;
    opacity: 0.8;
  }

  .ws-stats-status-percentage {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-top: 0.25rem;
  }

  .ws-stats-bars {
    display: flex;
    width: 100%;
    height: 1rem;
    border-radius: 0.5rem;
    overflow: hidden;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
  }

  .ws-stats-bar {
    height: 100%;
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .ws-stats-bar.status-new {
    background: linear-gradient(90deg, #dc3545, #c82333);
  }

  .ws-stats-bar.status-in-progress {
    background: linear-gradient(90deg, #ffc107, #e0a800);
  }

  .ws-stats-bar.status-closed {
    background: linear-gradient(90deg, #28a745, #218838);
  }

  /* Temps moyen de clôture */
  .ws-stats-time {
    text-align: center;
    padding: 2rem;
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
    position: relative;
  }

  .ws-stats-time::before {
    content: '⏱️';
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.5rem;
    opacity: 0.3;
  }

  .ws-stats-time-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #22577a;
    line-height: 1;
    margin-bottom: 0.5rem;
    animation: countUp 1s ease-out;
  }

  .ws-stats-time-label {
    font-size: 1rem;
    color: #6c757d;
    font-weight: 500;
  }

  /* Répartition par type */
  .ws-stats-type-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .ws-stats-type-item {
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
    transition: all 0.3s ease;
    cursor: pointer;
    background: #f8f9fa;
  }

  .ws-stats-type-item:hover {
    transform: translateX(3px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    border-color: #22577a;
    background: white;
  }

  .ws-stats-type-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .ws-stats-type-badge {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .ws-stats-type-count {
    font-weight: 700;
    font-size: 1.125rem;
    color: #22577a;
    padding: 0.25rem 0.75rem;
    background: rgba(34, 87, 122, 0.1);
    border-radius: 15px;
  }

  .ws-stats-type-bar-container {
    width: 100%;
    height: 0.5rem;
    background: #f8f9fa;
    border-radius: 25px;
    overflow: hidden;
    border: 1px solid #dee2e6;
  }

  .ws-stats-type-bar {
    height: 100%;
    border-radius: 25px;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Sources des signaux */
  .ws-stats-source-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .ws-stats-source-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 0.5rem;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .ws-stats-source-item:hover {
    transform: translateX(3px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    border-color: #22577a;
    background: white;
  }

  .ws-stats-source-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #22577a, #4a9540);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .ws-stats-source-info {
    flex: 1;
  }

  .ws-stats-source-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }

  .ws-stats-source-bar-container {
    width: 100%;
    height: 0.375rem;
    background: #f8f9fa;
    border-radius: 25px;
    overflow: hidden;
    border: 1px solid #dee2e6;
  }

  .ws-stats-source-bar {
    height: 100%;
    background: linear-gradient(90deg, #22577a, #4a9540);
    border-radius: 25px;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .ws-stats-source-count {
    font-weight: 700;
    font-size: 1rem;
    color: #22577a;
    padding: 0.25rem 0.75rem;
    background: rgba(34, 87, 122, 0.1);
    border-radius: 15px;
    flex-shrink: 0;
  }

  /* Tendance mensuelle */
  .ws-stats-month-chart {
    position: relative;
    padding: 1rem 0;
  }

  .ws-stats-month-bars {
    display: flex;
    align-items: end;
    gap: 0.5rem;
    height: 180px;
    padding: 1rem 0;
    border-bottom: 1px solid #dee2e6;
  }

  .ws-stats-month-bar {
    flex: 1;
    background: linear-gradient(180deg, #22577a, #4a9540);
    border-radius: 0.25rem 0.25rem 0 0;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    min-height: 4px;
  }

  .ws-stats-month-bar:hover {
    background: linear-gradient(180deg, #1a4b6d, #3a8a32);
    transform: scale(1.05);
    box-shadow: 0 3px 10px rgba(34, 87, 122, 0.3);
  }

  .ws-stats-month-bar::after {
    content: attr(data-count);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.7rem;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
    margin-bottom: 0.25rem;
  }

  .ws-stats-month-bar:hover::after {
    opacity: 1;
  }

  .ws-stats-month-labels {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .ws-stats-month-label {
    flex: 1;
    text-align: center;
    font-size: 0.7rem;
    color: #6c757d;
    font-weight: 500;
  }

  /* Statistiques par contacts */
  .ws-stats-contact-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .ws-stats-contact-item {
    padding: 1.25rem;
    border-radius: 0.5rem;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .ws-stats-contact-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 15px rgba(34, 87, 122, 0.15);
    border-color: #22577a;
    background: white;
  }

  .ws-stats-contact-icon {
    width: 45px;
    height: 45px;
    margin: 0 auto 1rem;
    border-radius: 50%;
    background: linear-gradient(135deg, #22577a, #4a9540);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.125rem;
  }

  .ws-stats-contact-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.5rem;
  }

  .ws-stats-contact-count {
    font-size: 1.25rem;
    font-weight: 700;
    color: #22577a;
  }

  /* États vides et erreur */
  .ws-stats-empty,
  .ws-stats-error {
    text-align: center;
    padding: 3rem 1.5rem;
    color: #6c757d;
  }

  .ws-stats-empty i,
  .ws-stats-error i {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .ws-stats-error {
    color: #721c24;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 0.375rem;
  }

  @keyframes countUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Responsive design */
  @media (max-width: 1024px) {
    .ws-stats-grid {
      grid-template-columns: 1fr;
    }
    
    .ws-stats-status-overview {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    
    .ws-stats-contact-list {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }
  }

  @media (max-width: 768px) {
    .ws-stats-header {
      flex-direction: column;
      gap: 1rem;
    }

    .ws-stats-tabs {
      padding: 0 0.5rem;
    }

    .ws-stats-tab {
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
    }
    
    .ws-stats-content {
      padding: 1rem;
    }
    
    .ws-stats-card {
      padding: 1rem;
    }
    
    .ws-stats-time-value {
      font-size: 2rem;
    }
    
    .ws-stats-month-bars {
      height: 120px;
    }
    
    .ws-stats-source-item {
      flex-direction: column;
      text-align: center;
    }
    
    .ws-stats-source-bar-container {
      width: 100%;
    }
  }
`;

interface WeakSignalStatsDashboardProps {
  stats: WeakSignalStats;
}

export default function WeakSignalStatsDashboard({ stats }: WeakSignalStatsDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'types' | 'sources' | 'contacts' | 'trends'>('overview');
  const [animationComplete, setAnimationComplete] = useState(false);

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

  // Animation des compteurs
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Vérification des données et valeurs par défaut
  if (!stats || typeof stats !== 'object') {
    return (
      <>
        <style>{styles}</style>
        <div className="ws-stats-dashboard">
          <div className="ws-stats-header">
            <h2>
              <i className="fas fa-chart-bar"></i>
              Tableau de bord des signaux faibles
            </h2>
            <div className="ws-stats-total">
              <span className="ws-stats-label">Erreur:</span>
              <span className="ws-stats-value">Données invalides</span>
            </div>
          </div>
          <div className="ws-stats-error">
            <i className="fas fa-exclamation-triangle"></i>
            <p>Les données statistiques sont dans un format invalide.</p>
          </div>
        </div>
      </>
    );
  }

  // Définir des valeurs par défaut pour éviter les erreurs
  const totalCount = stats.totalCount || 0;
  const byStatus = stats.byStatus || { new: 0, inProgress: 0, closed: 0 };
  const byType = Array.isArray(stats.byType) ? stats.byType : [];
  const bySource = Array.isArray(stats.bySource) ? stats.bySource : [];
  const byContactType = Array.isArray(stats.byContactType) ? stats.byContactType : [];
  const byMonth = Array.isArray(stats.byMonth) ? stats.byMonth : [];
  const avgClosureTime = typeof stats.avgClosureTime === 'number' ? stats.avgClosureTime : 0;

  // Formatter pour les mois en français
  const formatMonth = (month: number) => {
    const months = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
    ];
    return months[(month - 1) % 12] || 'Inconnu';
  };
  
  // Calculer le pourcentage pour chaque statut de façon sécurisée
  const calculatePercentage = (value: number) => {
    if (totalCount === 0) return '0.0';
    return ((value / totalCount) * 100).toFixed(1);
  };
  
  // Calculer la hauteur maximale des barres du graphique mensuel
  const maxMonthCount = byMonth.length > 0 
    ? Math.max(...byMonth.map(m => (m._id && typeof m.count === 'number') ? m.count : 0))
    : 1;

  // Données pour les onglets
  const tabData = {
    overview: {
      icon: 'fas fa-chart-pie',
      label: 'Vue d\'ensemble',
      count: totalCount
    },
    types: {
      icon: 'fas fa-tags',
      label: 'Types',
      count: byType.length
    },
    sources: {
      icon: 'fas fa-satellite',
      label: 'Sources',
      count: bySource.length
    },
    contacts: {
      icon: 'fas fa-phone',
      label: 'Contacts',
      count: byContactType.length
    },
    trends: {
      icon: 'fas fa-chart-line',
      label: 'Tendances',
      count: byMonth.length
    }
  };

  // Fonction pour obtenir l'icône selon le type de contact
  const getContactIcon = (contactType: string) => {
    const type = contactType.toLowerCase();
    if (type.includes('téléphone')) return 'fas fa-phone';
    if (type.includes('email')) return 'fas fa-envelope';
    if (type.includes('sms')) return 'fas fa-sms';
    if (type.includes('visite')) return 'fas fa-home';
    if (type.includes('courrier')) return 'fas fa-mail-bulk';
    return 'fas fa-comment';
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ws-stats-dashboard">
        {/* En-tête */}
        <div className="ws-stats-header">
          <h2>
            <i className="fas fa-chart-bar"></i>
            Tableau de bord des signaux faibles
          </h2>
          <div className="ws-stats-total">
            <span className="ws-stats-label">Total:</span>
            <span className="ws-stats-value">{totalCount}</span>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="ws-stats-tabs">
          {Object.entries(tabData).map(([key, data]) => (
            <button
              key={key}
              onClick={() => setSelectedTab(key as typeof selectedTab)}
              className={`ws-stats-tab ${selectedTab === key ? 'active' : ''}`}
            >
              <i className={data.icon}></i>
              {data.label}
              <span className="ws-stats-tab-count">
                {data.count}
              </span>
            </button>
          ))}
        </div>

        <div className="ws-stats-content">
          {selectedTab === 'overview' && (
            <div className="ws-stats-grid">
              {/* Statistiques par statut */}
              <div className="ws-stats-card">
                <h3>
                  <i className="fas fa-flag"></i>
                  Répartition par statut
                </h3>
                <div className="ws-stats-status-overview">
                  
                  <div className="ws-stats-status-item status-in-progress">
                    <span className="ws-stats-status-count">{byStatus.inProgress || 0}</span>
                    <span className="ws-stats-status-label">En cours</span>
                    <div className="ws-stats-status-percentage">
                      {calculatePercentage(byStatus.inProgress || 0)}%
                    </div>
                  </div>
                  
                  <div className="ws-stats-status-item status-closed">
                    <span className="ws-stats-status-count">{byStatus.closed || 0}</span>
                    <span className="ws-stats-status-label">Clôturés</span>
                    <div className="ws-stats-status-percentage">
                      {calculatePercentage(byStatus.closed || 0)}%
                    </div>
                  </div>
                </div>
                
                <div className="ws-stats-bars">
                  <div 
                    className="ws-stats-bar status-new"
                    style={{ 
                      width: animationComplete ? `${calculatePercentage(byStatus.new || 0)}%` : '0%',
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
                    }}
                  ></div>
                  <div 
                    className="ws-stats-bar status-in-progress"
                    style={{ 
                      width: animationComplete ? `${calculatePercentage(byStatus.inProgress || 0)}%` : '0%',
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1) 0.4s'
                    }}
                  ></div>
                  <div 
                    className="ws-stats-bar status-closed"
                    style={{ 
                      width: animationComplete ? `${calculatePercentage(byStatus.closed || 0)}%` : '0%',
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s'
                    }}
                  ></div>
                </div>
              </div>

              {/* Temps moyen de clôture */}
              <div className="ws-stats-card">
                <h3>
                  <i className="fas fa-clock"></i>
                  Temps moyen de clôture
                </h3>
                <div className="ws-stats-time">
                  <div className="ws-stats-time-value">
                    {animationComplete ? avgClosureTime.toFixed(1) : '0.0'}
                  </div>
                  <div className="ws-stats-time-label">jours</div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'types' && (
            <div className="ws-stats-grid">
              <div className="ws-stats-card ws-stats-card-wide">
                <h3>
                  <i className="fas fa-tags"></i>
                  Répartition par type de signal
                </h3>
                <div className="ws-stats-type-list">
                  {byType.map((item, index) => {
                    const typeId = item._id || 'Inconnu';
                    const typeColor = getTypeColor(typeId);
                    
                    return (
                      <div 
                        key={typeId} 
                        className="ws-stats-type-item"
                        style={{
                          animationDelay: `${index * 0.1}s`,
                          opacity: animationComplete ? 1 : 0,
                          transform: animationComplete ? 'translateX(0)' : 'translateX(-20px)',
                          transition: 'all 0.5s ease'
                        }}
                      >
                        <div className="ws-stats-type-info">
                          <span 
                            className="ws-stats-type-badge"
                            style={{ 
                              backgroundColor: typeColor.bg,
                              color: typeColor.text
                            }}
                          >
                            {typeId}
                          </span>
                          <span className="ws-stats-type-count">{item.count || 0}</span>
                        </div>
                        <div className="ws-stats-type-bar-container">
                          <div 
                            className="ws-stats-type-bar"
                            style={{ 
                              width: animationComplete && totalCount > 0 
                                ? `${((item.count || 0) / totalCount) * 100}%` 
                                : '0%',
                              transition: `width 1s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1 + 0.5}s`,
                              background: `linear-gradient(90deg, ${typeColor.text}, ${typeColor.text})`
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                  {byType.length === 0 && (
                    <div className="ws-stats-empty">
                      <i className="fas fa-tags"></i>
                      <p>Aucune donnée de type disponible</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'sources' && (
            <div className="ws-stats-grid">
              <div className="ws-stats-card ws-stats-card-wide">
                <h3>
                  <i className="fas fa-satellite"></i>
                  Sources des signaux
                </h3>
                <div className="ws-stats-source-list">
                  {bySource.map((item, index) => (
                    <div 
                      key={item._id} 
                      className="ws-stats-source-item"
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        opacity: animationComplete ? 1 : 0,
                        transform: animationComplete ? 'translateX(0)' : 'translateX(-20px)',
                        transition: 'all 0.5s ease'
                      }}
                    >
                      <div className="ws-stats-source-icon">
                        {(item._id || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="ws-stats-source-info">
                        <div className="ws-stats-source-name">{item._id || 'Inconnu'}</div>
                        <div className="ws-stats-source-bar-container">
                          <div 
                            className="ws-stats-source-bar"
                            style={{ 
                              width: animationComplete && totalCount > 0 
                                ? `${((item.count || 0) / totalCount) * 100}%` 
                                : '0%',
                              transition: `width 1s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1 + 0.5}s`
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="ws-stats-source-count">{item.count || 0}</div>
                    </div>
                  ))}
                  {bySource.length === 0 && (
                    <div className="ws-stats-empty">
                      <i className="fas fa-satellite"></i>
                      <p>Aucune donnée de source disponible</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'contacts' && (
            <div className="ws-stats-grid">
              <div className="ws-stats-card ws-stats-card-wide">
                <h3>
                  <i className="fas fa-phone"></i>
                  Statistiques des contacts
                </h3>
                {byContactType.length > 0 ? (
                  <div className="ws-stats-contact-list">
                    {byContactType.map((item, index) => (
                      <div 
                        key={item._id} 
                        className="ws-stats-contact-item"
                        style={{
                          animationDelay: `${index * 0.1}s`,
                          opacity: animationComplete ? 1 : 0,
                          transform: animationComplete ? 'translateY(0)' : 'translateY(20px)',
                          transition: 'all 0.5s ease'
                        }}
                      >
                        <div className="ws-stats-contact-icon">
                          <i className={getContactIcon(item._id || '')}></i>
                        </div>
                        <div className="ws-stats-contact-name">{item._id || 'Inconnu'}</div>
                        <div className="ws-stats-contact-count">{item.count || 0}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ws-stats-empty">
                    <i className="fas fa-phone-slash"></i>
                    <p>Aucune donnée de contact disponible</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedTab === 'trends' && (
            <div className="ws-stats-grid">
              <div className="ws-stats-card ws-stats-card-wide">
                <h3>
                  <i className="fas fa-chart-line"></i>
                  Tendance mensuelle
                </h3>
                {byMonth.length > 0 ? (
                  <div className="ws-stats-month-chart">
                    <div className="ws-stats-month-bars">
                      {byMonth.map((item, index) => {
                        const height = maxMonthCount > 0 ? ((item.count || 0) / maxMonthCount) * 100 : 0;
                        return (
                          <div 
                            key={`${item._id?.year}-${item._id?.month}`}
                            className="ws-stats-month-bar"
                            data-count={item.count || 0}
                            style={{ 
                              height: animationComplete ? `${height}%` : '4px',
                              transition: `height 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1 + 0.3}s`
                            }}
                            title={`${formatMonth(item._id?.month || 1)} ${item._id?.year}: ${item.count || 0} signaux`}
                          />
                        );
                      })}
                    </div>
                    <div className="ws-stats-month-labels">
                      {byMonth.map((item) => (
                        <div 
                          key={`${item._id?.year}-${item._id?.month}-label`}
                          className="ws-stats-month-label"
                        >
                          {formatMonth(item._id?.month || 1)} {item._id?.year}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="ws-stats-empty">
                    <i className="fas fa-chart-line"></i>
                    <p>Aucune donnée de tendance disponible</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}