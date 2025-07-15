'use client';

import React, { useState, useEffect } from 'react';
import DashboardCard from '@/components/dashboard/DashboardCard';
import StatsSummary from '@/components/dashboard/StatsSummary';
import ChartComponent from '@/components/dashboard/ChartComponent';
import TableComponent from '@/components/dashboard/TableComponent';
import FilterPanel from '@/components/dashboard/FilterPanel';
import ExportButtons from '@/components/dashboard/ExportButtons';
import DashboardNav from '@/components/DashboardNav';
import { TableauDeBord } from '@/types/models';
import DashboardLayout from '@/components/DashboardLayout';

interface FilterState {
  experimentationId: string;
  cibleId: string;
  dateDebut: string;
  dateFin: string;
  periode: string;
}

const Dashboard = () => {
  const [tableauDeBord, setTableauDeBord] = useState<TableauDeBord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    experimentationId: '',
    cibleId: '',
    dateDebut: '',
    dateFin: '',
    periode: '30'
  });

  useEffect(() => {
    fetchTableauDeBord();
  }, [filters]);

  const fetchTableauDeBord = async () => {
    try {
      setLoading(true);
      
      // Récupérer le token depuis localStorage ou sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour accéder à ces données.');
        return;
      }
      
      // Construire l'URL avec les filtres
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api` || 'http://localhost:5000/api';
      let url = `${baseUrl}/statistiques/tableau-de-bord?`;
      
      if (filters.experimentationId) {
        url += `experimentationId=${filters.experimentationId}&`;
      }
      
      if (filters.cibleId) {
        url += `cibleId=${filters.cibleId}&`;
      }
      
      if (filters.dateDebut) {
        url += `dateDebut=${filters.dateDebut}&`;
      }
      
      if (filters.dateFin) {
        url += `dateFin=${filters.dateFin}&`;
      }
      
      url += `periode=${filters.periode}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setTableauDeBord(data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement du tableau de bord:', err);
      setError('Impossible de charger les données du tableau de bord. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // Préparation des données pour les graphiques
  const prepareEtapesData = () => {
    if (!tableauDeBord) return { labels: [], data: [] };
    
    const stats = tableauDeBord.statistiques.parEtape;
    return {
      labels: stats.map(item => item._id || 'Non défini'),
      data: stats.map(item => item.count)
    };
  };

  const prepareStatutsData = () => {
    if (!tableauDeBord) return { labels: [], data: [] };
    
    const stats = tableauDeBord.statistiques.parStatut;
    return {
      labels: stats.map(item => item.nom_statut || 'Non défini'),
      data: stats.map(item => item.count)
    };
  };

  const prepareTendancesData = () => {
    if (!tableauDeBord) return { labels: [], datasets: [] };
    
    const tendances = tableauDeBord.tendances;
    return {
      labels: tendances.map(item => item._id),
      datasets: [
        {
          label: 'Identifications',
          data: tendances.map(item => item.identifications),
          borderColor: '#4e73df',
          backgroundColor: 'rgba(78, 115, 223, 0.1)',
          fill: true
        },
        {
          label: 'Recontacts',
          data: tendances.map(item => item.recontacts),
          borderColor: '#1cc88a',
          backgroundColor: 'rgba(28, 200, 138, 0.1)',
          fill: true
        },
        {
          label: 'Visites',
          data: tendances.map(item => item.visites),
          borderColor: '#f6c23e',
          backgroundColor: 'rgba(246, 194, 62, 0.1)',
          fill: true
        },
        {
          label: 'Installations',
          data: tendances.map(item => item.installations),
          borderColor: '#e74a3b',
          backgroundColor: 'rgba(231, 74, 59, 0.1)',
          fill: true
        }
      ]
    };
  };

  // Colonnes pour les tableaux
  const colonnesExperimentations = [
    { header: 'Expérimentation', accessor: 'nom' },
    { header: 'Code', accessor: 'code' },
    { header: 'Bénéficiaires', accessor: 'totalBeneficiaires' },
    { 
      header: 'Taux actifs', 
      accessor: 'activeCount',
      render: (value, row) => `${Math.round((value / row.totalBeneficiaires) * 100)}%`
    }
  ];

  const colonnesCoordinateurs = [
    { header: 'Coordinateur', accessor: 'coordinateurNom' },
    { header: 'Processus', accessor: 'totalProcessus' },
    { header: 'Terminés', accessor: 'processusTermines' },
    { 
      header: 'Taux', 
      accessor: 'tauxAchevement',
      render: (value) => `${Math.round(value)}%`
    }
  ];

  const colonnesActions = [
    { 
      header: 'Bénéficiaire', 
      accessor: 'beneficiaire',
      render: (value) => value?.usager?.fullName || 'N/A'
    },
    { header: 'Type', accessor: 'type_action' },
    { header: 'Statut', accessor: 'statut' },
    { 
      header: 'Responsable', 
      accessor: 'responsable',
      render: (value) => value?.fullName || 'N/A'
    },
    { 
      header: 'Date', 
      accessor: 'date_creation',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

  // Rendu conditionnel pendant le chargement
  if (loading && !tableauDeBord) {
    return (
        
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement du tableau de bord...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 400px;
          }
          
          .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top: 4px solid #4e73df;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Affichage des erreurs
  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={fetchTableauDeBord} className="retry-button">
          <i className="fas fa-redo"></i> Réessayer
        </button>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 400px;
            text-align: center;
          }
          
          .error-icon {
            font-size: 48px;
            color: #e74a3b;
            margin-bottom: 20px;
          }
          
          .retry-button {
            margin-top: 20px;
            padding: 8px 16px;
            background-color: #4e73df;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          
          .retry-button:hover {
            background-color: #2e59d9;
          }
        `}</style>
      </div>
    );
  }

  // Rendu principal du tableau de bord
  return (
    <DashboardLayout>
    <div className="dashboard-container">
      <h1 className="dashboard-title">
        <i className="fas fa-tachometer-alt me-2"></i> Tableau de Bord
      </h1>
      
      <DashboardNav />
      
      <FilterPanel onFilterChange={handleFilterChange} />
      
      <ExportButtons experimentationId={filters.experimentationId} />

      {tableauDeBord && (
        <>
          <StatsSummary 
            totalBeneficiaires={tableauDeBord.resume.totalBeneficiaires} 
            actionsEnAttente={tableauDeBord.resume.actionsEnAttente} 
            tauxConversionGlobal={tableauDeBord.statistiques.tauxConversion.global} 
          />

          <div className="grid-2-col">
            <DashboardCard title="Répartition par étape du processus">
              <ChartComponent 
                type="doughnut"
                data={{
                  labels: prepareEtapesData().labels,
                  datasets: [{
                    label: 'Bénéficiaires',
                    data: prepareEtapesData().data,
                    backgroundColor: [
                      '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'
                    ]
                  }]
                }}
                options={{
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </DashboardCard>

            <DashboardCard title="Répartition par statut">
              <ChartComponent 
                type="pie"
                data={{
                  labels: prepareStatutsData().labels,
                  datasets: [{
                    label: 'Bénéficiaires',
                    data: prepareStatutsData().data,
                    backgroundColor: [
                      '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'
                    ]
                  }]
                }}
                options={{
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </DashboardCard>
          </div>

          <DashboardCard title="Tendances temporelles">
            <ChartComponent 
              type="line"
              data={{
                labels: prepareTendancesData().labels,
                datasets: prepareTendancesData().datasets
              }}
              options={{
                scales: {
                  x: {
                    grid: {
                      display: false
                    }
                  },
                  y: {
                    beginAtZero: true
                  }
                }
              }}
              height={350}
            />
          </DashboardCard>

          <div className="grid-2-col">
            <DashboardCard title="Expérimentations">
              <TableComponent 
                columns={colonnesExperimentations} 
                data={tableauDeBord.parExperimentation} 
              />
            </DashboardCard>

            <DashboardCard title="Performance des coordinateurs">
              <TableComponent 
                columns={colonnesCoordinateurs} 
                data={tableauDeBord.performanceCoordinateurs} 
              />
            </DashboardCard>
          </div>

          <DashboardCard title="Dernières actions">
            <TableComponent 
              columns={colonnesActions} 
              data={tableauDeBord.dernieresActions} 
            />
          </DashboardCard>

          <div className="dashboard-footer">
            <p>
              <i className="fas fa-info-circle me-2"></i>
              Données générées le {new Date(tableauDeBord.dateGeneration).toLocaleString()}
            </p>
          </div>
        </>
      )}

      <style jsx>{`
        .dashboard-container {
          padding: 20px;
        }
        
        .dashboard-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 30px;
          color: #333;
          display: flex;
          align-items: center;
        }
        
        .grid-2-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .dashboard-footer {
          font-size: 14px;
          color: #6c757d;
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }
        
        .me-2 {
          margin-right: 0.5rem;
        }
        
        @media (max-width: 992px) {
          .grid-2-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
    </DashboardLayout>
  );
};

export default Dashboard;