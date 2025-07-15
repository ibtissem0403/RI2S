'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardCard from '@/components/dashboard/DashboardCard';
import ChartComponent from '@/components/dashboard/ChartComponent';
import TableComponent from '@/components/dashboard/TableComponent';
import ExportButtons from '@/components/dashboard/ExportButtons';
import DashboardNav from '@/components/DashboardNav';
import { RapportExperimentation } from '@/types/models';
import DashboardLayout from '@/components/DashboardLayout';

const ExperimentationReport = () => {
  const params = useParams();
  const router = useRouter();
  const experimentationId = params.id as string;
  
  const [rapport, setRapport] = useState<RapportExperimentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inclureBeneficiaires, setInclureBeneficiaires] = useState(false);

  useEffect(() => {
    fetchRapport();
  }, [experimentationId, inclureBeneficiaires]);

  const fetchRapport = async () => {
    try {
      setLoading(true);
      
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api` || 'http://localhost:5000/api';
      const url = `${baseUrl}/statistiques/experimentation/${experimentationId}?inclureBeneficiaires=${inclureBeneficiaires}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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

  // Préparation des données pour les graphiques
  const prepareStatutsData = () => {
    if (!rapport) return { labels: [], data: [] };
    
    const stats = rapport.statsParStatut;
    return {
      labels: stats.map(item => item.nom_statut || 'Non défini'),
      data: stats.map(item => item.count)
    };
  };

  const prepareCiblesData = () => {
    if (!rapport) return { labels: [], data: [] };
    
    const stats = rapport.statsParCible;
    return {
      labels: stats.map(item => item.nom_cible || 'Non défini'),
      data: stats.map(item => item.totalBeneficiaires)
    };
  };

  const prepareEvolutionData = () => {
    if (!rapport) return { labels: [], datasets: [] };
    
    const evolution = rapport.evolutionMensuelle;
    const labels = evolution.map(item => 
      `${item._id.mois}/${item._id.annee}`
    );
    
    return {
      labels,
      datasets: [
        {
          label: 'Nouveaux bénéficiaires',
          data: evolution.map(item => item.count),
          borderColor: '#4e73df',
          backgroundColor: 'rgba(78, 115, 223, 0.1)',
          fill: true
        }
      ]
    };
  };

  const prepareEtapesData = () => {
    if (!rapport) return { labels: [], data: [] };
    
    const etapes = rapport.resume.etapesProcessus;
    const labels = Object.keys(etapes);
    const data = Object.values(etapes);
    
    return { labels, data };
  };

  // Colonnes pour les tableaux
  const colonnesBeneficiaires = [
    { 
      header: 'Nom', 
      accessor: 'usager',
      render: (value) => value?.fullName || 'N/A'
    },
    { 
      header: 'Cible', 
      accessor: 'cible',
      render: (value) => value?.nom_cible || 'N/A'
    },
    { 
      header: 'Statut', 
      accessor: 'statut',
      render: (value) => value?.nom_statut || 'N/A'
    },
    { 
      header: 'Date de rattachement', 
      accessor: 'date_rattachement',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

  // Rendu conditionnel pendant le chargement
  if (loading && !rapport) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement du rapport d'expérimentation...</p>
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
      {rapport && (
        <>
          <div className="report-header">
            <div>
              <h1 className="report-title">
                {rapport.experimentation.name}
              </h1>
              <p className="report-subtitle">
                Code: {rapport.experimentation.code} | 
                Période: {new Date(rapport.experimentation.startDate).toLocaleDateString()} - 
                {rapport.experimentation.endDate ? 
                  new Date(rapport.experimentation.endDate).toLocaleDateString() : 
                  'En cours'}
              </p>
            </div>
            <div className="report-actions">
              <button 
                className="btn-back"
                onClick={() => router.push('/dashboard')}
              >
                <i className="fas fa-arrow-left"></i> Retour au tableau de bord
              </button>
              <ExportButtons experimentationId={experimentationId} />
            </div>
          </div>

          <DashboardNav />

          <div className="stats-summary">
            <div className="stat-card">
              <h3>{rapport.resume.totalBeneficiaires}</h3>
              <p>Total Bénéficiaires</p>
            </div>
            <div className="stat-card">
              <h3>{rapport.experimentation.nombreCibles}</h3>
              <p>Nombre de Cibles</p>
            </div>
            <div className="stat-card">
              <h3>
                {rapport.metriquesTemps.duree_moyenne ? 
                  `${Math.round(rapport.metriquesTemps.duree_moyenne)} jours` : 
                  'N/A'}
              </h3>
              <p>Durée moyenne</p>
            </div>
          </div>

          <div className="grid-2-col">
            <DashboardCard title="Répartition par cible">
              <ChartComponent 
                type="bar"
                data={{
                  labels: prepareCiblesData().labels,
                  datasets: [{
                    label: 'Bénéficiaires',
                    data: prepareCiblesData().data,
                    backgroundColor: '#4e73df'
                  }]
                }}
                options={{
                  indexAxis: 'y',
                  scales: {
                    x: {
                      beginAtZero: true
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

          <div className="grid-2-col">
            <DashboardCard title="Étapes du processus">
              <ChartComponent 
                type="doughnut"
                data={{
                  labels: prepareEtapesData().labels,
                  datasets: [{
                    label: 'Bénéficiaires',
                    data: prepareEtapesData().data,
                    backgroundColor: [
                      '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'
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

            <DashboardCard title="Évolution mensuelle des inclusions">
              <ChartComponent 
                type="line"
                data={{
                  labels: prepareEvolutionData().labels,
                  datasets: prepareEvolutionData().datasets
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
              />
            </DashboardCard>
          </div>

          <DashboardCard title="Bénéficiaires">
            <div className="beneficiaires-header">
              <h3>Liste des bénéficiaires</h3>
              <div className="form-check">
                <input 
                  type="checkbox"
                  id="inclureBeneficiaires"
                  checked={inclureBeneficiaires}
                  onChange={() => setInclureBeneficiaires(!inclureBeneficiaires)}
                  className="form-check-input"
                />
                <label htmlFor="inclureBeneficiaires" className="form-check-label">
                  Inclure tous les bénéficiaires
                </label>
              </div>
            </div>
            <TableComponent 
              columns={colonnesBeneficiaires} 
              data={rapport.detailsBeneficiaires} 
            />
          </DashboardCard>

          <div className="report-footer">
            <p>
              <i className="fas fa-info-circle me-2"></i>
              Données générées le {new Date(rapport.dateGeneration).toLocaleString()}
            </p>
          </div>
        </>
      )}

      <style jsx>{`
        .report-container {
          padding: 20px;
        }
        
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .report-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 5px;
          color: #333;
        }
        
        .report-subtitle {
          color: #6c757d;
          margin: 0;
        }
        
        .report-actions {
          display: flex;
          gap: 10px;
        }
        
        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #f8f9fa;
          color: #6c757d;
          border: 1px solid #ced4da;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-back:hover {
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
        
        .beneficiaires-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .beneficiaires-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .form-check {
          display: flex;
          align-items: center;
        }
        
        .form-check-input {
          margin-right: 8px;
        }
        
        .form-check-label {
          font-size: 14px;
          color: #6c757d;
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
          .report-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .report-actions {
            width: 100%;
            flex-wrap: wrap;
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

export default ExperimentationReport;