'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardCard from '@/components/dashboard/DashboardCard';
import ChartComponent from '@/components/dashboard/ChartComponent';
import TableComponent from '@/components/dashboard/TableComponent';
import ExportButtons from '@/components/dashboard/ExportButtons';
import DashboardNav from '@/components/DashboardNav';
import { ComparaisonExperimentations } from '@/types/models';
import DashboardLayout from '@/components/DashboardLayout';

const ComparaisonPage = () => {
  const router = useRouter();
  
  const [rapport, setRapport] = useState<ComparaisonExperimentations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [experimentations, setExperimentations] = useState<any[]>([]);
  const [selectedExperimentations, setSelectedExperimentations] = useState<string[]>([]);

  useEffect(() => {
    // Charger la liste des expérimentations
    fetchExperimentations();
  }, []);

  const fetchExperimentations = async () => {
    try {
      setLoading(true);
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
      setError('Impossible de charger la liste des expérimentations.');
    } finally {
      setLoading(false);
    }
  };

  const handleComparer = async () => {
    if (selectedExperimentations.length < 2) {
      setError('Veuillez sélectionner au moins 2 expérimentations à comparer.');
      return;
    }
  
    try {
      setLoading(true);
      
      // Récupérer le token depuis localStorage ou sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Vous devez être connecté pour accéder à ces données.');
        return;
      }
      
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api` || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/statistiques/comparer-experimentations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ experimentationIds: selectedExperimentations })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setRapport(data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la comparaison:', err);
      setError('Impossible de générer le rapport de comparaison. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const handleExperimentationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const value: string[] = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    setSelectedExperimentations(value);
  };

  // Préparation des données pour les graphiques
  const prepareBeneficiairesData = () => {
    if (!rapport) return { labels: [], data: [] };
    
    return {
      labels: rapport.comparaison.map(item => item.nom),
      data: rapport.comparaison.map(item => item.totalBeneficiaires)
    };
  };

  const prepareTauxCompletionData = () => {
    if (!rapport) return { labels: [], data: [] };
    
    return {
      labels: rapport.comparaison.map(item => item.nom),
      data: rapport.comparaison.map(item => item.tauxCompletion)
    };
  };

  const prepareTempsProcessusData = () => {
    if (!rapport) return { labels: [], data: [] };
    
    return {
      labels: rapport.comparaison.map(item => item.nom),
      data: rapport.comparaison.map(item => item.tempsMoyenProcessus)
    };
  };

  // Colonnes pour le tableau
  const colonnesComparaison = [
    { header: 'Expérimentation', accessor: 'nom' },
    { header: 'Code', accessor: 'code' },
    { header: 'Total bénéficiaires', accessor: 'totalBeneficiaires' },
    { 
      header: 'Identifier', 
      accessor: 'etapesProcessus',
      render: (value) => value?.IDENTIFIER || 0
    },
    { 
      header: 'Recontacter', 
      accessor: 'etapesProcessus',
      render: (value) => value?.RECONTACTER || 0
    },
    { 
      header: 'Visiter', 
      accessor: 'etapesProcessus',
      render: (value) => value?.VISITER || 0
    },
    { 
      header: 'Mettre en place', 
      accessor: 'etapesProcessus',
      render: (value) => value?.METTRE_EN_PLACE || 0
    },
    { 
      header: 'Désinstaller', 
      accessor: 'etapesProcessus',
      render: (value) => value?.DESINSTALLER || 0
    },
    { 
      header: 'Taux de complétion', 
      accessor: 'tauxCompletion',
      render: (value) => `${value}%`
    },
    { 
      header: 'Temps moyen (jours)', 
      accessor: 'tempsMoyenProcessus',
      render: (value) => Math.round(value * 10) / 10
    }
  ];

  // Rendu conditionnel pendant le chargement
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement en cours...</p>
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

  return (
<DashboardLayout>
    <div className="comparaison-container">
      <div className="comparaison-header">
        <h1 className="comparaison-title">
          <i className="fas fa-exchange-alt me-2"></i> Comparaison d'Expérimentations
        </h1>
        
        <button 
          onClick={() => router.push('/dashboard')} 
          className="btn-back"
        >
          <i className="fas fa-arrow-left"></i> Retour au tableau de bord
        </button>
      </div>

      <DashboardNav />

      <DashboardCard title="Sélectionner les expérimentations à comparer">
        <div className="selection-container">
          <div className="selection-guide">
            <p>
              <i className="fas fa-info-circle me-2"></i>
              Sélectionnez au moins 2 expérimentations pour les comparer.
              Maintenez la touche Ctrl (ou Cmd sur Mac) pour sélectionner plusieurs éléments.
            </p>
          </div>
          
          <div className="selection-form">
            <div className="form-group">
              <label htmlFor="experimentations">Expérimentations</label>
              <select 
                id="experimentations" 
                multiple 
                size={Math.min(10, experimentations.length)}
                value={selectedExperimentations}
                onChange={handleExperimentationChange}
                className="form-control"
              >
                {experimentations.map(exp => (
                  <option key={exp._id} value={exp._id}>
                    {exp.name} ({exp.code})
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={handleComparer} 
              disabled={selectedExperimentations.length < 2}
              className="btn-comparer"
            >
              <i className="fas fa-chart-bar me-2"></i> Comparer
            </button>
          </div>
          
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}
        </div>
      </DashboardCard>

      {rapport && (
        <>
          <div className="benchmark-summary">
            <div className="benchmark-card">
              <h3>{rapport.benchmark.moyenneBeneficiaires}</h3>
              <p>Moyenne de bénéficiaires</p>
            </div>
            <div className="benchmark-card">
              <h3>{rapport.benchmark.moyenneTauxCompletion}%</h3>
              <p>Taux de complétion moyen</p>
            </div>
            <div className="benchmark-card">
              <h3>{Math.round(rapport.benchmark.moyenneTempsMoyenProcessus * 10) / 10} jours</h3>
              <p>Temps moyen de processus</p>
            </div>
          </div>

          <div className="grid-2-col">
            <DashboardCard title="Nombre de bénéficiaires par expérimentation">
              <ChartComponent 
                type="bar"
                data={{
                  labels: prepareBeneficiairesData().labels,
                  datasets: [{
                    label: 'Nombre de bénéficiaires',
                    data: prepareBeneficiairesData().data,
                    backgroundColor: '#4e73df'
                  }]
                }}
                options={{
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </DashboardCard>

            <DashboardCard title="Taux de complétion (%)">
              <ChartComponent 
                type="bar"
                data={{
                  labels: prepareTauxCompletionData().labels,
                  datasets: [{
                    label: 'Taux de complétion (%)',
                    data: prepareTauxCompletionData().data,
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

          <DashboardCard title="Temps moyen de processus (jours)">
            <ChartComponent 
              type="bar"
              data={{
                labels: prepareTempsProcessusData().labels,
                datasets: [{
                  label: 'Temps moyen (jours)',
                  data: prepareTempsProcessusData().data,
                  backgroundColor: '#f6c23e'
                }]
              }}
              options={{
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
              height={300}
            />
          </DashboardCard>

          <DashboardCard title="Tableau comparatif détaillé">
            <TableComponent 
              columns={colonnesComparaison} 
              data={rapport.comparaison} 
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
        .comparaison-container {
          padding: 20px;
        }
        
        .comparaison-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .comparaison-title {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          color: #333;
          display: flex;
          align-items: center;
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
        
        .selection-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .selection-guide {
          background-color: #e8f4fd;
          border-left: 4px solid #4e73df;
          padding: 15px;
          border-radius: 4px;
        }
        
        .selection-guide p {
          margin: 0;
          color: #2c3e50;
          display: flex;
          align-items: center;
        }
        
        .selection-form {
          display: flex;
          gap: 20px;
          align-items: flex-end;
        }
        
        .form-group {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .form-group label {
          margin-bottom: 8px;
          font-weight: 500;
          color: #495057;
        }
        
        .form-control {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .btn-comparer {
          padding: 10px 20px;
          background-color: #4e73df;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-comparer:hover {
          background-color: #2e59d9;
        }
        
        .btn-comparer:disabled {
          background-color: #b7c0d7;
          cursor: not-allowed;
        }
        
        .error-message {
          background-color: #f8d7da;
          color: #721c24;
          padding: 10px 15px;
          border-radius: 4px;
          display: flex;
          align-items: center;
        }
        
        .benchmark-summary {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .benchmark-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 20px;
          text-align: center;
        }
        
        .benchmark-card h3 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 10px 0;
          color: #4e73df;
        }
        
        .benchmark-card p {
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
          .comparaison-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .selection-form {
            flex-direction: column;
            align-items: stretch;
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

export default ComparaisonPage;