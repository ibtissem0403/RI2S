// components/UsagerRI2SStats/UsagerRI2SStatsDashboard.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { UsagerRI2SStats } from '@/types/models';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Enregistrement des composants ChartJS
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

// CSS avec support pour les couleurs dynamiques
const styles = `
  .ri2s-stats-dashboard {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #dee2e6;
    overflow: hidden;
  }

  .ri2s-stats-header {
    background-color: #f8f9fa;
    padding: 1.5rem;
    border-bottom: 1px solid #dee2e6;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ri2s-stats-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .ri2s-stats-header h2 i {
    color: #4a9540;
  }

  .ri2s-stats-total {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background-color: #4a9540;
    color: white;
    padding: 0.75rem 1.25rem;
    border-radius: 25px;
    transition: transform 0.2s ease;
  }

  .ri2s-stats-total:hover {
    transform: translateY(-2px);
  }

  .ri2s-stats-label {
    font-size: 0.875rem;
    opacity: 0.9;
    font-weight: 500;
  }

  .ri2s-stats-value {
    font-size: 1.5rem;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.75rem;
    border-radius: 15px;
  }

  .ri2s-stats-tabs {
    display: flex;
    background-color: #f8f9fa;
    padding: 0 1rem;
    gap: 0.25rem;
    border-bottom: 1px solid #dee2e6;
    overflow-x: auto;
  }

  .ri2s-stats-tab {
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

  .ri2s-stats-tab:hover:not(.active) {
    background-color: #e9ecef;
    color: #495057;
  }

  .ri2s-stats-tab.active {
    background-color: white;
    color: #4a9540;
    font-weight: 600;
    border-bottom: 2px solid #4a9540;
  }

  .ri2s-stats-tab-count {
    background-color: rgba(74, 149, 64, 0.1);
    color: #4a9540;
    padding: 0.2rem 0.5rem;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .ri2s-stats-tab.active .ri2s-stats-tab-count {
    background-color: #4a9540;
    color: white;
  }

  .ri2s-stats-content {
    padding: 2rem;
  }

  .ri2s-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .ri2s-stats-card {
    background-color: white;
    border: 1px solid #dee2e6;
    border-radius: 0.5rem;
    padding: 1.5rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .ri2s-stats-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #4a9540, #22577a);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  .ri2s-stats-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border-color: #4a9540;
  }

  .ri2s-stats-card:hover::before {
    transform: scaleX(1);
  }

  .ri2s-stats-card-wide {
    grid-column: 1 / -1;
  }

  .ri2s-stats-card h3 {
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

  .ri2s-stats-card h3 i {
    color: #4a9540;
  }

  /* Métriques principales */
  .ri2s-stats-metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .ri2s-stats-metric-item {
    text-align: center;
    padding: 1rem;
    border-radius: 0.5rem;
    transition: all 0.3s ease;
    cursor: pointer;
    border: 1px solid #dee2e6;
    background: #f8f9fa;
  }

  .ri2s-stats-metric-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .ri2s-stats-metric-item.pro {
    background: linear-gradient(135deg, #d1fae5, #a7f3d0);
    color: #10b981;
    border-color: #a7f3d0;
  }

  .ri2s-stats-metric-item.non-pro {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    color: #3b82f6;
    border-color: #bfdbfe;
  }

  .ri2s-stats-metric-count {
    font-size: 2rem;
    font-weight: 700;
    display: block;
    margin-bottom: 0.25rem;
    animation: countUp 1s ease-out;
  }

  .ri2s-stats-metric-label {
    font-size: 0.875rem;
    font-weight: 600;
    opacity: 0.8;
  }

  .ri2s-stats-metric-percentage {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-top: 0.25rem;
  }

  /* Graphiques */
  .ri2s-stats-chart-container {
    height: 250px;
    position: relative;
    margin-top: 1rem;
  }

  /* Liste de types */
  .ri2s-stats-type-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .ri2s-stats-type-item {
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
    transition: all 0.3s ease;
    cursor: pointer;
    background: #f8f9fa;
  }

  .ri2s-stats-type-item:hover {
    transform: translateX(3px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    border-color: #4a9540;
    background: white;
  }

  .ri2s-stats-type-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .ri2s-stats-type-badge {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: capitalize;
  }

  .ri2s-stats-type-count {
    font-weight: 700;
    font-size: 1.125rem;
    color: #4a9540;
    padding: 0.25rem 0.75rem;
    background: rgba(74, 149, 64, 0.1);
    border-radius: 15px;
  }

  .ri2s-stats-type-bar-container {
    width: 100%;
    height: 0.5rem;
    background: #f8f9fa;
    border-radius: 25px;
    overflow: hidden;
    border: 1px solid #dee2e6;
  }

  .ri2s-stats-type-bar {
    height: 100%;
    border-radius: 25px;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Tendance mensuelle */
  .ri2s-stats-month-chart {
    position: relative;
    padding: 1rem 0;
    height: 300px;
  }

  /* Expérimentations */
  .ri2s-stats-exp-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .ri2s-stats-exp-item {
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

  .ri2s-stats-exp-item:hover {
    transform: translateX(3px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    border-color: #4a9540;
    background: white;
  }

  .ri2s-stats-exp-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4a9540, #22577a);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  .ri2s-stats-exp-info {
    flex: 1;
  }

  .ri2s-stats-exp-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }

  .ri2s-stats-exp-bar-container {
    width: 100%;
    height: 0.375rem;
    background: #f8f9fa;
    border-radius: 25px;
    overflow: hidden;
    border: 1px solid #dee2e6;
  }

  .ri2s-stats-exp-bar {
    height: 100%;
    background: linear-gradient(90deg, #4a9540, #22577a);
    border-radius: 25px;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .ri2s-stats-exp-count {
    font-weight: 700;
    font-size: 1rem;
    color: #4a9540;
    padding: 0.25rem 0.75rem;
    background: rgba(74, 149, 64, 0.1);
    border-radius: 15px;
    flex-shrink: 0;
  }

  /* États vides et erreur */
  .ri2s-stats-empty,
  .ri2s-stats-error {
    text-align: center;
    padding: 3rem 1.5rem;
    color: #6c757d;
  }

  .ri2s-stats-empty i,
  .ri2s-stats-error i {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .ri2s-stats-error {
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
    .ri2s-stats-grid {
      grid-template-columns: 1fr;
    }
    
    .ri2s-stats-metrics {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
  }

  @media (max-width: 768px) {
    .ri2s-stats-header {
      flex-direction: column;
      gap: 1rem;
    }

    .ri2s-stats-tabs {
      padding: 0 0.5rem;
    }

    .ri2s-stats-tab {
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
    }
    
    .ri2s-stats-content {
      padding: 1rem;
    }
    
    .ri2s-stats-card {
      padding: 1rem;
    }
    
    .ri2s-stats-chart-container {
      height: 200px;
    }
    
    .ri2s-stats-exp-item {
      flex-direction: column;
      text-align: center;
    }
  }
`;

interface UsagerRI2SStatsDashboardProps {
stats: UsagerRI2SStats;
}

export default function UsagerRI2SStatsDashboard({ stats, isLoading = false, error = '' }: UsagerRI2SStatsDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'types' | 'experimentations' | 'tendances'>('overview');
  const [animationComplete, setAnimationComplete] = useState(false);

  // Couleurs pour les graphiques
  const chartColors = {
    backgrounds: [
      'rgba(74, 149, 64, 0.7)',
      'rgba(34, 87, 122, 0.7)',
      'rgba(247, 148, 30, 0.7)',
      'rgba(188, 84, 184, 0.7)',
      'rgba(242, 102, 102, 0.7)',
      'rgba(97, 201, 168, 0.7)',
      'rgba(102, 126, 234, 0.7)',
      'rgba(237, 100, 166, 0.7)',
      'rgba(159, 122, 234, 0.7)',
      'rgba(112, 161, 255, 0.7)'
    ],
    borders: [
      'rgba(74, 149, 64, 1)',
      'rgba(34, 87, 122, 1)',
      'rgba(247, 148, 30, 1)',
      'rgba(188, 84, 184, 1)',
      'rgba(242, 102, 102, 1)',
      'rgba(97, 201, 168, 1)',
      'rgba(102, 126, 234, 1)',
      'rgba(237, 100, 166, 1)',
      'rgba(159, 122, 234, 1)',
      'rgba(112, 161, 255, 1)'
    ]
  };

  // Animation des compteurs
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Vérification des données et valeurs par défaut
  if (isLoading) {
    return (
      <>
        <style>{styles}</style>
        <div className="ri2s-stats-dashboard">
          <div className="ri2s-stats-header">
            <h2>
              <i className="fas fa-users"></i>
              Statistiques des Usagers RI2S
            </h2>
          </div>
          <div className="ri2s-stats-content">
            <div className="ri2s-stats-empty">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Chargement des statistiques...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !stats || typeof stats !== 'object') {
    return (
      <>
        <style>{styles}</style>
        <div className="ri2s-stats-dashboard">
          <div className="ri2s-stats-header">
            <h2>
              <i className="fas fa-users"></i>
              Statistiques des Usagers RI2S
            </h2>
            <div className="ri2s-stats-total">
              <span className="ri2s-stats-label">Erreur:</span>
              <span className="ri2s-stats-value">Données invalides</span>
            </div>
          </div>
          <div className="ri2s-stats-error">
            <i className="fas fa-exclamation-triangle"></i>
            <p>{error || 'Les données statistiques sont dans un format invalide.'}</p>
          </div>
        </div>
      </>
    );
  }

  // Définir des valeurs par défaut pour éviter les erreurs
  const usagers = stats.usagers || { total: 0, pseudonymises: 0, tauxPseudonymisation: 0 };
  const distribution = stats.distribution || { parType: [], parRole: [], parTypeEtRole: [] };
  const experimentations = stats.experimentations || { usagersParExperimentation: [], tauxRattachement: 0, nbUsagersRattaches: 0 };
  const tendances = stats.tendances || { creationParMois: [] };
  const professionnels = stats.professionnels || { specialites: [], total: 0 };
  const aidants = stats.aidants || { total: 0, rattachesASenior: 0, pourcentageRattaches: 0, ratioAidantSenior: 0 };
  const seniors = stats.seniors || { total: 0 };

  // Données pour les onglets
  const tabData = {
    overview: {
      icon: 'fas fa-chart-pie',
      label: 'Vue d\'ensemble',
      count: usagers.total
    },
    types: {
      icon: 'fas fa-user-tag',
      label: 'Types & Rôles',
      count: distribution.parType.length + distribution.parRole.length
    },
    experimentations: {
      icon: 'fas fa-vial',
      label: 'Expérimentations',
      count: experimentations.usagersParExperimentation.length
    },
    tendances: {
      icon: 'fas fa-chart-line',
      label: 'Tendances',
      count: tendances.creationParMois.length
    }
  };

  // Préparation des données pour le graphique de distribution par type
  const typeDistributionData = {
    labels: distribution.parType.map(type => type._id === 'pro' ? 'Professionnels' : 'Non-professionnels'),
    datasets: [{
      data: distribution.parType.map(type => type.count),
      backgroundColor: chartColors.backgrounds.slice(0, distribution.parType.length),
      borderColor: chartColors.borders.slice(0, distribution.parType.length),
      borderWidth: 1
    }]
  };

  // Préparation des données pour le graphique de distribution par rôle
  const roleDistributionData = {
    labels: distribution.parRole.map(role => role._id),
    datasets: [{
      data: distribution.parRole.map(role => role.count),
      backgroundColor: chartColors.backgrounds.slice(0, distribution.parRole.length),
      borderColor: chartColors.borders.slice(0, distribution.parRole.length),
      borderWidth: 1
    }]
  };

  // Préparation des données pour le graphique des tendances
  const tendancesData = {
    labels: tendances.creationParMois.map(mois => `${mois.nom} ${mois.annee}`),
    datasets: [{
      label: 'Nouveaux usagers',
      data: tendances.creationParMois.map(mois => mois.count),
      backgroundColor: 'rgba(74, 149, 64, 0.2)',
      borderColor: 'rgba(74, 149, 64, 1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true
    }]
  };

  // Options pour les graphiques
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12
          }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ri2s-stats-dashboard">
        {/* En-tête */}
        <div className="ri2s-stats-header">
          <h2>
            <i className="fas fa-users"></i>
            Statistiques des Usagers RI2S
          </h2>
          <div className="ri2s-stats-total">
            <span className="ri2s-stats-label">Total:</span>
            <span className="ri2s-stats-value">{usagers.total}</span>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="ri2s-stats-tabs">
          {Object.entries(tabData).map(([key, data]) => (
            <button
              key={key}
              onClick={() => setSelectedTab(key as typeof selectedTab)}
              className={`ri2s-stats-tab ${selectedTab === key ? 'active' : ''}`}
            >
              <i className={data.icon}></i>
              {data.label}
              <span className="ri2s-stats-tab-count">
                {data.count}
              </span>
            </button>
          ))}
        </div>

        <div className="ri2s-stats-content">
          {selectedTab === 'overview' && (
            <div className="ri2s-stats-grid">
              {/* Répartition des types d'usagers */}
              <div className="ri2s-stats-card">
                <h3>
                  <i className="fas fa-user-tag"></i>
                  Répartition par type d'usager
                </h3>
                <div className="ri2s-stats-metrics">
                  <div className="ri2s-stats-metric-item pro">
                    <span className="ri2s-stats-metric-count">
                      {professionnels.total}
                    </span>
                    <span className="ri2s-stats-metric-label">Professionnels</span>
                    <div className="ri2s-stats-metric-percentage">
                      {usagers.total > 0 ? Math.round((professionnels.total / usagers.total) * 100) : 0}%
                    </div>
                  </div>
                  
                  <div className="ri2s-stats-metric-item non-pro">
                    <span className="ri2s-stats-metric-count">
                      {usagers.total - professionnels.total}
                    </span>
                    <span className="ri2s-stats-metric-label">Non Professionnels</span>
                    <div className="ri2s-stats-metric-percentage">
                      {usagers.total > 0 ? Math.round(((usagers.total - professionnels.total) / usagers.total) * 100) : 0}%
                    </div>
                  </div>
                </div>
                <div className="ri2s-stats-chart-container">
                  <Pie data={typeDistributionData} options={pieOptions} />
                </div>
              </div>

              {/* Répartition par rôle */}
              <div className="ri2s-stats-card">
                <h3>
                  <i className="fas fa-users-cog"></i>
                  Répartition par rôle
                </h3>
                <div className="ri2s-stats-metrics">
                  <div className="ri2s-stats-metric-item">
                    <span className="ri2s-stats-metric-count">
                      {seniors.total}
                    </span>
                    <span className="ri2s-stats-metric-label">Seniors</span>
                    <div className="ri2s-stats-metric-percentage">
                      {usagers.total > 0 ? Math.round((seniors.total / usagers.total) * 100) : 0}%
                    </div>
                  </div>
                  
                  <div className="ri2s-stats-metric-item">
                    <span className="ri2s-stats-metric-count">
                      {aidants.total}
                    </span>
                    <span className="ri2s-stats-metric-label">Aidants</span>
                    <div className="ri2s-stats-metric-percentage">
                      {usagers.total > 0 ? Math.round((aidants.total / usagers.total) * 100) : 0}%
                    </div>
                  </div>
                </div>
                <div className="ri2s-stats-chart-container">
                  <Bar data={roleDistributionData} options={barOptions} />
                </div>
              </div>

              {/* Expérimentations */}
              <div className="ri2s-stats-card">
                <h3>
                  <i className="fas fa-vial"></i>
                  Rattachement aux expérimentations
                </h3>
                <div className="ri2s-stats-metrics">
                  <div className="ri2s-stats-metric-item">
                    <span className="ri2s-stats-metric-count">
                      {experimentations.nbUsagersRattaches}
                    </span>
                    <span className="ri2s-stats-metric-label">Rattachés</span>
                    <div className="ri2s-stats-metric-percentage">
                      {experimentations.tauxRattachement.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="ri2s-stats-metric-item">
                    <span className="ri2s-stats-metric-count">
                      {usagers.pseudonymises}
                    </span>
                    <span className="ri2s-stats-metric-label">Pseudonymisés</span>
                    <div className="ri2s-stats-metric-percentage">
                      {usagers.tauxPseudonymisation.toFixed(1)}%
                    </div>
                  </div>
                </div>
                {experimentations.usagersParExperimentation.length > 0 ? (
                  <div className="ri2s-stats-exp-list">
                    {experimentations.usagersParExperimentation.slice(0, 3).map((exp, index) => (
                      <div
                        key={exp._id}
                        className="ri2s-stats-exp-item"
                        style={{
                          animationDelay: `${index * 0.1}s`,
                          opacity: animationComplete ? 1 : 0,
                          transform: animationComplete ? 'translateX(0)' : 'translateX(-20px)',
                          transition: 'all 0.5s ease'
                        }}
                      >
                        <div className="ri2s-stats-exp-icon">
                          {(exp.nomExperimentation || '').charAt(0).toUpperCase()}
                        </div>
                        <div className="ri2s-stats-exp-info">
                          <div className="ri2s-stats-exp-name">{exp.nomExperimentation || 'Inconnue'}</div>
                          <div className="ri2s-stats-exp-bar-container">
                            <div
                              className="ri2s-stats-exp-bar"
                              style={{
                                width: animationComplete && usagers.total > 0
                                ? `${((exp.count || 0) / usagers.total) * 100}%`
                                : '0%',
                              transition: `width 1s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1 + 0.5}s`
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="ri2s-stats-exp-count">{exp.count || 0}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ri2s-stats-empty">
                  <i className="fas fa-vial"></i>
                  <p>Aucune expérimentation trouvée</p>
                </div>
              )}
            </div>

            {/* Tendance */}
            <div className="ri2s-stats-card">
              <h3>
                <i className="fas fa-chart-line"></i>
                Tendance de création
              </h3>
              <div className="ri2s-stats-chart-container" style={{ height: '220px' }}>
                {tendances.creationParMois.length > 0 ? (
                  <Line data={tendancesData} options={lineOptions} />
                ) : (
                  <div className="ri2s-stats-empty">
                    <i className="fas fa-chart-line"></i>
                    <p>Aucune donnée de tendance disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'types' && (
          <div className="ri2s-stats-grid">
            {/* Détail des types d'usagers */}
            <div className="ri2s-stats-card">
              <h3>
                <i className="fas fa-user-tag"></i>
                Détail par type d'usager
              </h3>
              <div className="ri2s-stats-chart-container">
                <Pie data={typeDistributionData} options={pieOptions} />
              </div>
              <div className="ri2s-stats-type-list" style={{ marginTop: '1.5rem' }}>
                {distribution.parType.map((type, index) => {
                  const typeName = type._id === 'pro' ? 'Professionnels' : 'Non-professionnels';
                  const bgColor = type._id === 'pro' ? '#d1fae5' : '#dbeafe';
                  const textColor = type._id === 'pro' ? '#10b981' : '#3b82f6';
                  
                  return (
                    <div 
                      key={type._id} 
                      className="ri2s-stats-type-item"
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        opacity: animationComplete ? 1 : 0,
                        transform: animationComplete ? 'translateX(0)' : 'translateX(-20px)',
                        transition: 'all 0.5s ease'
                      }}
                    >
                      <div className="ri2s-stats-type-info">
                        <span 
                          className="ri2s-stats-type-badge"
                          style={{ 
                            backgroundColor: bgColor,
                            color: textColor
                          }}
                        >
                          {typeName}
                        </span>
                        <span className="ri2s-stats-type-count">{type.count || 0}</span>
                      </div>
                      <div className="ri2s-stats-type-bar-container">
                        <div 
                          className="ri2s-stats-type-bar"
                          style={{ 
                            width: animationComplete && usagers.total > 0 
                              ? `${((type.count || 0) / usagers.total) * 100}%` 
                              : '0%',
                            transition: `width 1s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1 + 0.5}s`,
                            background: `linear-gradient(90deg, ${textColor}, ${textColor})`
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Détail des rôles */}
            <div className="ri2s-stats-card">
              <h3>
                <i className="fas fa-users-cog"></i>
                Détail par rôle
              </h3>
              <div className="ri2s-stats-chart-container">
                <Bar data={roleDistributionData} options={barOptions} />
              </div>
              <div className="ri2s-stats-type-list" style={{ marginTop: '1.5rem' }}>
                {distribution.parRole.map((role, index) => {
                  // Définir des couleurs différentes selon le rôle
                  const getColorForRole = (roleName) => {
                    switch(roleName.toLowerCase()) {
                      case 'senior': return { bg: '#fef3c7', text: '#d97706' };
                      case 'aidant': return { bg: '#dbeafe', text: '#3b82f6' };
                      case 'médecin': 
                      case 'medecin': return { bg: '#f3e8ff', text: '#7e22ce' };
                      case 'infirmier': return { bg: '#dcfce7', text: '#16a34a' };
                      default: return { bg: '#f3f4f6', text: '#4b5563' };
                    }
                  };
                  
                  const { bg, text } = getColorForRole(role._id);
                  
                  return (
                    <div 
                      key={role._id} 
                      className="ri2s-stats-type-item"
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        opacity: animationComplete ? 1 : 0,
                        transform: animationComplete ? 'translateX(0)' : 'translateX(-20px)',
                        transition: 'all 0.5s ease'
                      }}
                    >
                      <div className="ri2s-stats-type-info">
                        <span 
                          className="ri2s-stats-type-badge"
                          style={{ 
                            backgroundColor: bg,
                            color: text
                          }}
                        >
                          {role._id || 'Inconnu'}
                        </span>
                        <span className="ri2s-stats-type-count">{role.count || 0}</span>
                      </div>
                      <div className="ri2s-stats-type-bar-container">
                        <div 
                          className="ri2s-stats-type-bar"
                          style={{ 
                            width: animationComplete && usagers.total > 0 
                              ? `${((role.count || 0) / usagers.total) * 100}%` 
                              : '0%',
                            transition: `width 1s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1 + 0.5}s`,
                            background: `linear-gradient(90deg, ${text}, ${text})`
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spécialités des professionnels */}
            <div className="ri2s-stats-card">
              <h3>
                <i className="fas fa-user-md"></i>
                Spécialités des professionnels
              </h3>
              {professionnels.specialites && professionnels.specialites.length > 0 ? (
                <>
                  <div className="ri2s-stats-chart-container">
                    <Pie 
                      data={{
                        labels: professionnels.specialites.map(item => item._id),
                        datasets: [{
                          data: professionnels.specialites.map(item => item.count),
                          backgroundColor: chartColors.backgrounds.slice(0, professionnels.specialites.length),
                          borderColor: chartColors.borders.slice(0, professionnels.specialites.length),
                          borderWidth: 1
                        }]
                      }} 
                      options={pieOptions} 
                    />
                  </div>
                  <div className="ri2s-stats-type-list" style={{ marginTop: '1.5rem' }}>
                    {professionnels.specialites.map((specialite, index) => (
                      <div 
                        key={specialite._id} 
                        className="ri2s-stats-type-item"
                        style={{
                          animationDelay: `${index * 0.1}s`,
                          opacity: animationComplete ? 1 : 0,
                          transform: animationComplete ? 'translateX(0)' : 'translateX(-20px)',
                          transition: 'all 0.5s ease'
                        }}
                      >
                        <div className="ri2s-stats-type-info">
                          <span 
                            className="ri2s-stats-type-badge"
                            style={{ 
                              backgroundColor: `${chartColors.backgrounds[index % chartColors.backgrounds.length]}20`,
                              color: chartColors.borders[index % chartColors.borders.length]
                            }}
                          >
                            {specialite._id || 'Non spécifié'}
                          </span>
                          <span className="ri2s-stats-type-count">{specialite.count || 0}</span>
                        </div>
                        <div className="ri2s-stats-type-bar-container">
                          <div 
                            className="ri2s-stats-type-bar"
                            style={{ 
                              width: animationComplete && professionnels.total > 0 
                                ? `${((specialite.count || 0) / professionnels.total) * 100}%` 
                                : '0%',
                              transition: `width 1s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1 + 0.5}s`,
                              background: chartColors.borders[index % chartColors.borders.length]
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="ri2s-stats-empty">
                  <i className="fas fa-user-md"></i>
                  <p>Aucune donnée de spécialité disponible</p>
                </div>
              )}
            </div>

            {/* Relation aidants/seniors */}
            <div className="ri2s-stats-card">
              <h3>
                <i className="fas fa-hands-helping"></i>
                Relation aidants/seniors
              </h3>
              <div className="ri2s-stats-metrics" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="ri2s-stats-metric-item">
                  <span className="ri2s-stats-metric-count">
                    {aidants.rattachesASenior}
                  </span>
                  <span className="ri2s-stats-metric-label">Aidants rattachés</span>
                  <div className="ri2s-stats-metric-percentage">
                    {aidants.pourcentageRattaches.toFixed(1)}%
                  </div>
                </div>
                
                <div className="ri2s-stats-metric-item">
                  <span className="ri2s-stats-metric-count">
                    {aidants.ratioAidantSenior.toFixed(2)}
                  </span>
                  <span className="ri2s-stats-metric-label">Ratio aidant/senior</span>
                  <div className="ri2s-stats-metric-percentage">
                    {seniors.total} seniors
                  </div>
                </div>
              </div>
              <div className="ri2s-stats-chart-container">
                <Pie 
                  data={{
                    labels: ['Seniors', 'Aidants rattachés', 'Aidants non rattachés'],
                    datasets: [{
                      data: [
                        seniors.total, 
                        aidants.rattachesASenior, 
                        aidants.total - aidants.rattachesASenior
                      ],
                      backgroundColor: ['rgba(217, 119, 6, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(156, 163, 175, 0.7)'],
                      borderColor: ['rgba(217, 119, 6, 1)', 'rgba(59, 130, 246, 1)', 'rgba(156, 163, 175, 1)'],
                      borderWidth: 1
                    }]
                  }} 
                  options={pieOptions} 
                />
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'experimentations' && (
          <div className="ri2s-stats-grid">
            {/* Répartition par expérimentation */}
            <div className="ri2s-stats-card ri2s-stats-card-wide">
              <h3>
                <i className="fas fa-vial"></i>
                Répartition par expérimentation
              </h3>
              {experimentations.usagersParExperimentation.length > 0 ? (
                <>
                  <div className="ri2s-stats-chart-container">
                    <Bar 
                      data={{
                        labels: experimentations.usagersParExperimentation.map(exp => exp.nomExperimentation || 'Inconnue'),
                        datasets: [{
                          data: experimentations.usagersParExperimentation.map(exp => exp.count || 0),
                          backgroundColor: experimentations.usagersParExperimentation.map((_, i) => chartColors.backgrounds[i % chartColors.backgrounds.length]),
                          borderColor: experimentations.usagersParExperimentation.map((_, i) => chartColors.borders[i % chartColors.borders.length]),
                          borderWidth: 1
                        }]
                      }} 
                      options={barOptions} 
                    />
                  </div>
                  <div className="ri2s-stats-exp-list" style={{ marginTop: '1.5rem' }}>
                    {experimentations.usagersParExperimentation.map((exp, index) => (
                      <div
                        key={exp._id}
                        className="ri2s-stats-exp-item"
                        style={{
                          animationDelay: `${index * 0.1}s`,
                          opacity: animationComplete ? 1 : 0,
                          transform: animationComplete ? 'translateX(0)' : 'translateX(-20px)',
                          transition: 'all 0.5s ease'
                        }}
                      >
                        <div className="ri2s-stats-exp-icon" style={{
                          background: `linear-gradient(135deg, ${chartColors.borders[index % chartColors.borders.length]}, ${chartColors.borders[(index + 2) % chartColors.borders.length]})`
                        }}>
                          {(exp.nomExperimentation || '').charAt(0).toUpperCase()}
                        </div>
                        <div className="ri2s-stats-exp-info">
                          <div className="ri2s-stats-exp-name">{exp.nomExperimentation || 'Inconnue'}{exp.codeExperimentation ? ` (${exp.codeExperimentation})` : ''}</div>
                          <div className="ri2s-stats-exp-bar-container">
                            <div
                              className="ri2s-stats-exp-bar"
                              style={{
                                width: animationComplete && usagers.total > 0
                                  ? `${((exp.count || 0) / usagers.total) * 100}%`
                                  : '0%',
                                transition: `width 1s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1 + 0.5}s`,
                                background: `linear-gradient(90deg, ${chartColors.borders[index % chartColors.borders.length]}, ${chartColors.borders[(index + 2) % chartColors.borders.length]})`
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="ri2s-stats-exp-count">{exp.count || 0}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="ri2s-stats-empty">
                  <i className="fas fa-vial"></i>
                  <p>Aucune expérimentation trouvée</p>
                </div>
              )}
            </div>

            {/* Métriques de rattachement */}
            <div className="ri2s-stats-card">
              <h3>
                <i className="fas fa-link"></i>
                Métriques de rattachement
              </h3>
              <div className="ri2s-stats-metrics" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="ri2s-stats-metric-item">
                  <span className="ri2s-stats-metric-count">
                    {experimentations.nbUsagersRattaches}
                  </span>
                  <span className="ri2s-stats-metric-label">Usagers rattachés</span>
                  <div className="ri2s-stats-metric-percentage">
                    {experimentations.tauxRattachement.toFixed(1)}%
                  </div>
                </div>
                
                <div className="ri2s-stats-metric-item">
                  <span className="ri2s-stats-metric-count">
                    {usagers.pseudonymises}
                  </span>
                  <span className="ri2s-stats-metric-label">Pseudonymisés</span>
                  <div className="ri2s-stats-metric-percentage">
                    {usagers.tauxPseudonymisation.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="ri2s-stats-chart-container">
                <Pie 
                  data={{
                    labels: ['Rattachés', 'Non rattachés', 'Pseudonymisés'],
                    datasets: [{
                      data: [
                        experimentations.nbUsagersRattaches,
                        usagers.total - experimentations.nbUsagersRattaches,
                        usagers.pseudonymises
                      ],
                      backgroundColor: ['rgba(74, 149, 64, 0.7)', 'rgba(156, 163, 175, 0.7)', 'rgba(34, 87, 122, 0.7)'],
                      borderColor: ['rgba(74, 149, 64, 1)', 'rgba(156, 163, 175, 1)', 'rgba(34, 87, 122, 1)'],
                      borderWidth: 1
                    }]
                  }} 
                  options={pieOptions} 
                />
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'tendances' && (
          <div className="ri2s-stats-grid">
            {/* Tendance de création mensuelle */}
            <div className="ri2s-stats-card ri2s-stats-card-wide">
              <h3>
                <i className="fas fa-chart-line"></i>
                Tendance de création mensuelle
              </h3>
              <div className="ri2s-stats-month-chart">
                {tendances.creationParMois.length > 0 ? (
                  <Line data={tendancesData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Nombre d\'usagers'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Mois'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top'
                      },
                      tooltip: {
                        callbacks: {
                          title: function(tooltipItems) {
                            return tooltipItems[0].label;
                          },
                          label: function(context) {
                            return `Nouveaux usagers: ${context.raw}`;
                          }
                        }
                      }
                    }
                  }} />
                ) : (
                  <div className="ri2s-stats-empty">
                    <i className="fas fa-chart-line"></i>
                    <p>Aucune donnée de tendance disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comparaison mensuelle */}
            <div className="ri2s-stats-card">
              <h3>
                <i className="fas fa-calendar-alt"></i>
                Création d'usagers par mois
              </h3>
              <div className="ri2s-stats-chart-container" style={{ height: '300px' }}>
                {tendances.creationParMois.length > 0 ? (
                  <Bar 
                    data={{
                      labels: tendances.creationParMois.map(mois => `${mois.nom}`),
                      datasets: [{
                        label: 'Usagers créés',
                        data: tendances.creationParMois.map(mois => mois.count),
                        backgroundColor: tendances.creationParMois.map((_, i) => chartColors.backgrounds[i % chartColors.backgrounds.length]),
                        borderColor: tendances.creationParMois.map((_, i) => chartColors.borders[i % chartColors.borders.length]),
                        borderWidth: 1
                      }]
                    }} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      },
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top'
                        }
                      }
                    }} 
                  />
                ) : (
                  <div className="ri2s-stats-empty">
                    <i className="fas fa-calendar-alt"></i>
                    <p>Aucune donnée mensuelle disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top créateurs */}
            {stats.utilisateurs && stats.utilisateurs.topCreateurs && stats.utilisateurs.topCreateurs.length > 0 && (
              <div className="ri2s-stats-card">
                <h3>
                  <i className="fas fa-user-plus"></i>
                  Top créateurs d'usagers
                </h3>
                <div className="ri2s-stats-chart-container">
                  <Pie 
                    data={{
                      labels: stats.utilisateurs.topCreateurs.map(u => u.nom || 'Inconnu'),
                      datasets: [{
                        data: stats.utilisateurs.topCreateurs.map(u => u.count),
                        backgroundColor: chartColors.backgrounds.slice(0, stats.utilisateurs.topCreateurs.length),
                        borderColor: chartColors.borders.slice(0, stats.utilisateurs.topCreateurs.length),
                        borderWidth: 1
                      }]
                    }} 
                    options={pieOptions} 
                  />
                </div>
                <div className="ri2s-stats-type-list" style={{ marginTop: '1.5rem' }}>
                  {stats.utilisateurs.topCreateurs.map((createur, index) => (
                    <div 
                      key={createur._id || index} 
                      className="ri2s-stats-type-item"
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        opacity: animationComplete ? 1 : 0,
                        transform: animationComplete ? 'translateX(0)' : 'translateX(-20px)',
                        transition: 'all 0.5s ease'
                      }}
                    >
                      <div className="ri2s-stats-type-info">
                        <span 
                          className="ri2s-stats-type-badge"
                          style={{ 
                            backgroundColor: `${chartColors.backgrounds[index % chartColors.backgrounds.length]}20`,
                            color: chartColors.borders[index % chartColors.borders.length]
                          }}
                        >
                          {createur.nom || 'Inconnu'}
                        </span>
                        <span className="ri2s-stats-type-count">{createur.count || 0}</span>
                      </div>
                      <div className="ri2s-stats-type-bar-container">
                        <div 
                          className="ri2s-stats-type-bar"
                          style={{ 
                            width: animationComplete && usagers.total > 0 
                              ? `${((createur.count || 0) / usagers.total) * 100}%` 
                              : '0%',
                            transition: `width 1s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1 + 0.5}s`,
                            background: chartColors.borders[index % chartColors.borders.length]
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </>
);
}                              