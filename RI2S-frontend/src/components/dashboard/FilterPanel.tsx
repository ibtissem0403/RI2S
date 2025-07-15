import React, { useState, useEffect } from 'react';

interface Experimentation {
  _id: string;
  name: string;
  code: string;
}

interface Cible {
  _id: string;
  nom_cible: string;
  code_cible: string;
}

interface FilterPanelProps {
  onFilterChange: (filters: FilterState) => void;
}

interface FilterState {
  experimentationId: string;
  cibleId: string;
  dateDebut: string;
  dateFin: string;
  periode: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onFilterChange }) => {
  const [experimentations, setExperimentations] = useState<Experimentation[]>([]);
  const [cibles, setCibles] = useState<Cible[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    experimentationId: '',
    cibleId: '',
    dateDebut: '',
    dateFin: '',
    periode: '30'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Charger les expérimentations et cibles
    fetchExperimentations();
  }, []);

  useEffect(() => {
    // Si une expérimentation est sélectionnée, charger ses cibles
    if (filters.experimentationId) {
      fetchCiblesForExperimentation(filters.experimentationId);
    } else {
      setCibles([]);
    }
  }, [filters.experimentationId]);

  const fetchExperimentations = async () => {
    try {
      setLoading(true);
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api` || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/experimentations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setExperimentations(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des expérimentations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCiblesForExperimentation = async (experimentationId: string) => {
    try {
      setLoading(true);
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api` || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/experimentations/${experimentationId}/cibles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCibles(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des cibles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Si l'expérimentation change, réinitialiser la cible
    if (name === 'experimentationId') {
      setFilters({
        ...filters,
        experimentationId: value,
        cibleId: ''
      });
    } else {
      setFilters({
        ...filters,
        [name]: value
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      experimentationId: '',
      cibleId: '',
      dateDebut: '',
      dateFin: '',
      periode: '30'
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="filter-panel">
      <form onSubmit={handleSubmit}>
        <div className="filter-grid">
          <div className="filter-group">
            <label htmlFor="experimentationId">Expérimentation</label>
            <select 
              id="experimentationId" 
              name="experimentationId" 
              value={filters.experimentationId}
              onChange={handleInputChange}
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
            <label htmlFor="cibleId">Cible</label>
            <select 
              id="cibleId" 
              name="cibleId" 
              value={filters.cibleId}
              onChange={handleInputChange}
              disabled={!filters.experimentationId || cibles.length === 0}
            >
              <option value="">Toutes les cibles</option>
              {cibles.map(cible => (
                <option key={cible._id} value={cible._id}>
                  {cible.nom_cible} ({cible.code_cible})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="dateDebut">Date début</label>
            <input 
              type="date" 
              id="dateDebut" 
              name="dateDebut" 
              value={filters.dateDebut}
              onChange={handleInputChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="dateFin">Date fin</label>
            <input 
              type="date" 
              id="dateFin" 
              name="dateFin" 
              value={filters.dateFin}
              onChange={handleInputChange}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="periode">Période (jours)</label>
            <select 
              id="periode" 
              name="periode" 
              value={filters.periode}
              onChange={handleInputChange}
            >
              <option value="7">7 jours</option>
              <option value="30">30 jours</option>
              <option value="90">90 jours</option>
              <option value="180">6 mois</option>
              <option value="365">1 an</option>
            </select>
          </div>

          <div className="filter-buttons">
            <button type="submit" className="btn-apply">
              <i className="fas fa-filter"></i> Appliquer
            </button>
            <button type="button" className="btn-reset" onClick={handleReset}>
              <i className="fas fa-undo"></i> Réinitialiser
            </button>
          </div>
        </div>
      </form>

      <style jsx>{`
        .filter-panel {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 20px;
          margin-bottom: 30px;
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
        
        .filter-group select, .filter-group input {
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
        
        @media (max-width: 768px) {
          .filter-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default FilterPanel;