'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { experimentationService } from '@/services/experimentationServices';
import { Experimentation } from '../../types/models';
import WidgetCard from '@/app/index/components/WidgetCard';
import './experimentationList.css';

const ExperimentationList: React.FC = () => {
  const router = useRouter();
  const [experimentations, setExperimentations] = useState<Experimentation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Charger les expérimentations
  useEffect(() => {
    const fetchExperimentations = async () => {
      try {
        setIsLoading(true);
        const data = await experimentationService.getAll();
        setExperimentations(data);
        setError(null);
      } catch (err: any) {
        setError('Erreur lors du chargement des expérimentations: ' + (err.message || 'Erreur inconnue'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchExperimentations();
  }, []);

  // Filtrer les expérimentations selon le terme de recherche
  const filteredExperimentations = experimentations.filter(exp =>
    exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.entreprise?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtenir le chemin du logo en fonction du nom de l'expérimentation
  const getLogoPath = (name: string): string => {
    if (name.toLowerCase().includes('telegrafik')) {
      return '/Telegrafik.png';
    } else if (name.toLowerCase().includes('presage')) {
      return '/presage.png';
    } 
    return ''; // Retourne une chaîne vide si aucun logo correspondant
  };

  // On garde cette fonction au cas où un logo ne serait pas disponible
  const getIconClass = (name: string): string => {
    if (name.toLowerCase().includes('telegrafik')) {
      return 'fas fa-broadcast-tower';
    } else if (name.toLowerCase().includes('presage')) {
      return 'fas fa-shield-alt';
    } else {
      return 'fas fa-microscope';
    }
  };

  // Obtenir la variante de couleur en fonction du nom de l'expérimentation
  const getVariant = (name: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' => {
    if (name.toLowerCase().includes('telegrafik')) {
      return 'info';
    } else if (name.toLowerCase().includes('presage')) {
      return 'purple';
    } else {
      return 'primary';
    }
  };

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <h2><i className="fas fa-microscope"></i> Expérimentations du projet</h2>
        <p>Gérez toutes vos expérimentations RI2S</p>
      </div>
      
      <div className="search-and-add">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="error-alert">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* État de chargement */}
      {isLoading ? (
        <div className="loading-state">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="widget-grid">
          {/* Liste des expérimentations */}
          {filteredExperimentations.map((exp) => (
            <WidgetCard
              key={exp._id}
              title={exp.name}
              description={exp.description || (exp.name.toLowerCase().includes('telegrafik') ? 'Télésurveillance intelligente' : 'Prévention des chutes')}
              logoPath={getLogoPath(exp.name)}
              iconClass={getIconClass(exp.name)}
              status="En cours"
              variant={getVariant(exp.name)}
              onClick={() => router.push(`/experimentations/${exp._id}`)}
            />
          ))}
          
          {/* Carte d'ajout d'expérimentation */}
          <WidgetCard
            title="Ajouter une expérimentation"
            isAddCard={true}
            onClick={() => router.push('/experimentations/new')}
          />
        </div>
      )}
    </section>
  );
};

export default ExperimentationList;