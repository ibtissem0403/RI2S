'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardCard from '@/components/dashboard/DashboardCard';
import ChartComponent from '@/components/dashboard/ChartComponent';
import TableComponent from '@/components/dashboard/TableComponent';
import ExportButtons from '@/components/dashboard/ExportButtons';
import DashboardNav from '@/components/DashboardNav';
import { EfficaciteActions } from '@/types/models';
import DashboardLayout from '@/components/DashboardLayout';

const EfficaciteActionsPage = () => {
  const router = useRouter();
  
  const [rapport, setRapport] = useState<EfficaciteActions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [experimentationId, setExperimentationId] = useState<string>('');
  const [etape, setEtape] = useState<string>('');
  const [experimentations, setExperimentations] = useState<any[]>([]);
  
  const etapes = [
    { value: 'IDENTIFIER', label: 'Identifier' },
    { value: 'RECONTACTER', label: 'Recontacter' },
    { value: 'VISITER', label: 'Visiter' },
    { value: 'METTRE_EN_PLACE', label: 'Mettre en place' },
    { value: 'DESINSTALLER', label: 'Désinstaller' }
  ];

  useEffect(() => {
    // Charger la liste des expérimentations
    fetchExperimentations();
    
    // Charger le rapport initial
    fetchRapport();
  }, []);

  useEffect(() => {
    // Recharger le rapport quand les filtres changent
    fetchRapport();
  }, [experimentationId, etape]);

  const fetchExperimentations = async () => {
    try {
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api` || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/experimentations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setExperimentations(data);
    } catch (err) {
      console.error('Erreur lors du chargement des expérimentations:', err);
    }
  };

  const fetchRapport = async () => {
    try {
      setLoading(true);
      
      // Récupérer le token depuis localStorage ou sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour accéder à ces données.');
        return;
      }
      
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api` || 'http://localhost:5000/api';
      let url = `${baseUrl}/statistiques/efficacite-actions?`;
      
      if (experimentationId) {
        url += `experimentationId=${experimentationId}&`;
      }
      
      if (etape) {
        url += `etape=${etape}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setRapport(data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement du rapport:', err);
      setError('Impossible de charger les données du rapport. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };
  const handleFilterChange = () => {
    fetchRapport();
  };

  // Préparation des données pour les graphiques
  const prepareTypeActionData = () => {
    if (!rapport) return { labels: [], data: [] };
    
    const stats = rapport.statsParTypeAction;
    return {
      labels: stats.map(item => item._id || 'Non défini'),
      data: stats.map(item => item.tauxAchevement)
    };
  };

  const prepareEtapeData = () => {
    if (!rapport) return { labels: [], data: [] };
    
    const stats = rapport.statsParEtape;
    return {
      labels: stats.map(item => item._id || 'Non défini'),
      data: stats.map(item => item.tauxAchevement)
    };
  };

  const prepareTendancesData = () => {
    if (!rapport) return { labels: [], datasets: [] };
    
    const tendances = rapport.tendancesMensuelles;
    const labels = tendances.map(item => 
      `${item._id.mois}/${item._id.annee}`
    );
    
    return {
      labels,
      datasets: [
        {
          label: 'Actions totales',
          data: tendances.map(item => item.total),
          borderColor: '#4e73df',
          backgroundColor: 'rgba(78, 115, 223, 0.1)',
          fill: false
        },
        {
          label: 'Actions terminées',
          data: tendances.map(item => item.terminees),
          borderColor: '#1cc88a',
          backgroundColor: 'rgba(28, 200, 138, 0.1)',
          fill: false
        }
      ]
    };
  };

  // Colonnes pour les tableaux
  const colonnesTypeAction = [
    { header: 'Type d\'action', accessor: '_id' },
    { header: 'Total', accessor: 'total' },
    { header: 'Terminées', accessor: 'terminees' },
    { header: 'En cours', accessor: 'enCours' },
    { header: 'À faire', accessor: 'aFaire' },
    { 
      header: 'Taux d\'achèvement', 
      accessor: 'tauxAchevement',
      render: (value) => `${Math.round(value)}%`
    },
    { 
      header: 'Temps moyen (jours)', 
      accessor: 'tempsMoyenRealisation',
      render: (value) => value ? Math.round(value * 10) / 10 : 'N/A'
    }
  ];

  const colonnesCoordinateurs = [
    { header: 'Coordinateur', accessor: 'responsableNom' },
    { header: 'Email', accessor: 'responsableEmail' },
    { header: 'Actions totales', accessor: 'totalActions' },
    { header: 'Actions terminées', accessor: 'actionsTerminees' },
    { 
      header: 'Taux d\'achèvement', 
      accessor: 'tauxAchevement',
      render: (value) => `${Math.round(value)}%`
    },
    { 
      header: 'Temps moyen (jours)', 
      accessor: 'tempsMoyenRealisation',
      render: (value) => value ? Math.round(value * 10) / 10 : 'N/A'
    }
  ];

  // Rendu conditionnel pendant le chargement
  if (loading && !rapport) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement du rapport d'efficacité des actions...</p>
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
        <button onClick={fetchRapport} className="retry-button">
          <i className="fas fa-redo"></i> Réessayer
        </button>
        <button onClick={() => router.push('/dashboard')} className="back-button">
          <i className="fas fa-arrow-left"></i> Retour au tableau de bord
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
          
          .retry-button, .back-button {
            margin-top: 20px;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          
          .retry-button {
            background-color: #4e73df;
            color: white;
            margin-right: 10px;
          }
          
          .retry-button:hover {
            background-color: #2e59d9;
          }
          
          .back-button {
            background-color: #f8f9fa;
            color: #6c757d;
            border: 1px solid #ced4da;
          }
          
          .back-button:hover {
            background-color: #e9ecef;
          }
        `}</style>
      </div>
    );
  }

  // Rendu principal du rapport
  return (
    <DashboardLayout>
    <div className="report-container">
      <div className="report-header">
        <h1 className="report-title">
          <i className="fas fa-chart-line me-2"></i> Efficacité des Actions
        </h1>
      </div>
      
      <DashboardNav />
      
      <div className="filter-panel">
        <div className="filter-grid">
          <div className="filter-group">
            <label htmlFor="experimentationId">Expérimentation</label>
            <select 
              id="experimentationId" 
              value={experimentationId}
              onChange={(e) => setExperimentationId(e.target.value)}
            >
              <option value="">Toutes les expérimentations</option>
              {experimentations.map(exp => (
                <option key={exp._id} value={exp._id}>
                  {exp.name} ({exp.code})
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="etape">Étape</label>
            <select 
              id="etape" 
              value={etape}
              onChange={(e) => setEtape(e.target.value)}
            >
              <option value="">Toutes les étapes</option>
              {etapes.map(etape => (
                <option key={etape.value} value={etape.value}>
                  {etape.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-buttons">
            <button onClick={handleFilterChange} className="btn-apply">
              <i className="fas fa-filter"></i> Appliquer
            </button>
            <button 
              onClick={() => {
                setExperimentationId('');
                setEtape('');
                setTimeout(() => fetchRapport(), 0);
              }} 
              className="btn-reset"
            >
              <i className="fas fa-undo"></i> Réinitialiser
            </button>
          </div>
        </div>
      </div>
      
      <ExportButtons experimentationId={experimentationId} />

      {rapport && (
        <>
          <div className="stats-summary">
            <div className="stat-card">
              <h3>{rapport.resume.totalActions}</h3>
              <p>Actions totales</p>
            </div>
            <div className="stat-card">
              <h3>{rapport.resume.actionsTerminees}</h3>
              <p>Actions terminées</p>
            </div>
            <div className="stat-card">
              <h3>{rapport.resume.tauxGlobalAchevement}%</h3>
              <p>Taux d'achèvement global</p>
            </div>
          </div>

          <div className="grid-2-col">
            <DashboardCard title="Taux d'achèvement par type d'action">
              <ChartComponent 
                type="bar"
                data={{
                  labels: prepareTypeActionData().labels,
                  datasets: [{
                    label: 'Taux d\'achèvement (%)',
                    data: prepareTypeActionData().data,
                    backgroundColor: '#4e73df'
                  }]
                }}
                options={{
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }}
              />
            </DashboardCard>

            <DashboardCard title="Taux d'achèvement par étape">
              <ChartComponent 
                type="bar"
                data={{
                  labels: prepareEtapeData().labels,
                  datasets: [{
                    label: 'Taux d\'achèvement (%)',
                    data: prepareEtapeData().data,
                    backgroundColor: '#1cc88a'
                  }]
                }}
                options={{
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }}
              />
            </DashboardCard>
          </div>

          <DashboardCard title="Tendances mensuelles">
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

          <DashboardCard title="Détails par type d'action">
            <TableComponent 
              columns={colonnesTypeAction} 
              data={rapport.statsParTypeAction} 
            />
          </DashboardCard>

          <DashboardCard title="Performance des coordinateurs">
            <TableComponent 
              columns={colonnesCoordinateurs} 
              data={rapport.efficaciteCoordinateurs} 
            />
          </DashboardCard>

          <div className="report-footer">
            <p>
              <i className="fas fa-info-circle me-2"></i>
              Données générées le {new Date(rapport.dateGeneration).toLocaleDateString()}
            </p>
          </div>
        </>
      )}

      <style jsx>{`
        .report-container {
          padding: 20px;
        }
        
        .report-header {
          margin-bottom: 30px;
        }
        
        .report-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #333;
          display: flex;
          align-items: center;
        }
        
        .filter-panel {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
        }
        
        .filter-group label {
          margin-bottom: 8px;
          font-weight: 500;
          color: #495057;
        }
        
        .filter-group select {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .filter-buttons {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }
        
        .btn-apply, .btn-reset {
          padding: 8px 16px;
          border-radius: 4px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-apply {
          background-color: #4e73df;
          color: white;
        }
        
        .btn-apply:hover {
          background-color: #2e59d9;
        }
        
        .btn-reset {
          background-color: #f8f9fa;
          color: #6c757d;
          border: 1px solid #ced4da;
        }
        
        .btn-reset:hover {
          background-color: #e9ecef;
        }
        
        .stats-summary {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 20px;
          text-align: center;
        }
        
        .stat-card h3 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 10px 0;
          color: #4e73df;
        }
        
        .stat-card p {
          margin: 0;
          color: #6c757d;
        }
        
        .grid-2-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .report-footer {
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
          .filter-grid {
            grid-template-columns: 1fr;
          }
          
          .grid-2-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
    </DashboardLayout>
  );
};

export default EfficaciteActionsPage;