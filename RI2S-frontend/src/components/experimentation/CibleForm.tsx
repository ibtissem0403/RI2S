import React, { useState } from 'react';
import { CibleFormData, StatutFormData } from '../../types/models';
import StatutForm from './StatutForm';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './CibleForm.css';

interface CibleFormProps {
  cible: CibleFormData;
  onChange: (updatedCible: CibleFormData) => void;
  onRemove?: () => void;
}

const CibleForm: React.FC<CibleFormProps> = ({ cible, onChange, onRemove }) => {
  const [isAddingStatut, setIsAddingStatut] = useState(false);
  const [newStatut, setNewStatut] = useState<StatutFormData>({
    nom_statut: '',
    ordre: 0,
    description: '',
    champs: []
  });

  // Mettre à jour les champs de la cible
  const handleCibleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({
      ...cible,
      [name]: value
    });
  };

  // Mettre à jour les champs du nouveau statut
  const handleStatutChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewStatut(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Ajouter un nouveau statut
  const handleAddStatut = () => {
    if (!newStatut.nom_statut) return;
    
    // Assigner l'ordre automatiquement
    const updatedStatut = {
      ...newStatut,
      ordre: cible.statuts.length
    };
    
    // Mettre à jour la cible avec le nouveau statut
    onChange({
      ...cible,
      statuts: [...cible.statuts, updatedStatut]
    });
    
    // Réinitialiser le formulaire et fermer le panneau d'ajout
    setNewStatut({
      nom_statut: '',
      ordre: 0,
      description: '',
      champs: []
    });
    setIsAddingStatut(false);
  };

  // Mettre à jour un statut existant
  const handleUpdateStatut = (index: number, updatedStatut: StatutFormData) => {
    const updatedStatuts = [...cible.statuts];
    updatedStatuts[index] = updatedStatut;
    
    onChange({
      ...cible,
      statuts: updatedStatuts
    });
  };

  // Supprimer un statut
  const handleRemoveStatut = (index: number) => {
    const updatedStatuts = cible.statuts.filter((_, i) => i !== index);
    
    // Réordonner les statuts restants
    const reorderedStatuts = updatedStatuts.map((statut, i) => ({
      ...statut,
      ordre: i
    }));
    
    onChange({
      ...cible,
      statuts: reorderedStatuts
    });
  };

  return (
    <div className="cible-container">
      <div className="cible-header">
        <div>
          <h3>
            <i className="fas fa-bullseye"></i>
            Cible: {cible.nom_cible}
          </h3>
          {cible.code_cible && (
            <div className="cible-code">
              <i className="fas fa-hashtag"></i>
              Code: {cible.code_cible}
            </div>
          )}
        </div>
        
        {onRemove && (
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={onRemove}
          >
            <i className="fas fa-trash-alt"></i>
            Supprimer
          </button>
        )}
      </div>
      
      <div className="cible-body">
        {/* Formulaire de la cible */}
        <div className="cible-form-grid">
          <div className="cible-form-field">
            <label className="cible-form-label">
              <i className="fas fa-users"></i>
              Nom de la cible
              <span className="text-danger-color">*</span>
            </label>
            <input
              type="text"
              name="nom_cible"
              value={cible.nom_cible}
              onChange={handleCibleChange}
              required
              className="cible-form-input"
            />
          </div>
          
          <div className="cible-form-field">
            <label className="cible-form-label">
              <i className="fas fa-hashtag"></i>
              Code de la cible
            </label>
            <input
              type="text"
              name="code_cible"
              value={cible.code_cible || ''}
              onChange={handleCibleChange}
              className="cible-form-input"
            />
          </div>
          
          <div className="cible-form-field" style={{ gridColumn: '1 / -1' }}>
            <label className="cible-form-label">
              <i className="fas fa-info-circle"></i>
              Description
            </label>
            <textarea
              name="description"
              value={cible.description || ''}
              onChange={handleCibleChange}
              className="cible-form-textarea"
            ></textarea>
          </div>
        </div>
        
        {/* Section des statuts */}
        <div className="cible-statuts-section">
          <div className="cible-statuts-header">
            <h4 className="cible-statuts-title">
              <i className="fas fa-tasks"></i>
              Statuts ({cible.statuts.length})
            </h4>
            
            {!isAddingStatut && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsAddingStatut(true)}
              >
                <i className="fas fa-plus"></i>
                Ajouter un statut
              </button>
            )}
          </div>
          
          {/* Formulaire d'ajout de statut */}
          {isAddingStatut && (
            <div className="cible-new-statut-form">
              <h5 className="cible-new-statut-title">
                <i className="fas fa-flag"></i>
                Nouveau statut
              </h5>
              <div className="cible-form-grid">
                <div className="cible-form-field">
                  <label className="cible-form-label">
                    <i className="fas fa-tag"></i>
                    Nom du statut
                    <span className="text-danger-color">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom_statut"
                    value={newStatut.nom_statut}
                    onChange={handleStatutChange}
                    required
                    className="cible-form-input"
                  />
                </div>
                
                <div className="cible-form-field">
                  <label className="cible-form-label">
                    <i className="fas fa-sort-numeric-down"></i>
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    name="ordre"
                    value={newStatut.ordre.toString()}
                    onChange={(e) => setNewStatut(prev => ({
                      ...prev,
                      ordre: parseInt(e.target.value, 10) || 0
                    }))}
                    className="cible-form-input"
                  />
                  <div className="cible-hint-text">Position dans le processus (0, 1, 2...)</div>
                </div>
                
                <div className="cible-form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="cible-form-label">
                    <i className="fas fa-info-circle"></i>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newStatut.description || ''}
                    onChange={handleStatutChange}
                    className="cible-form-textarea"
                  ></textarea>
                </div>
              </div>
              
              <div className="cible-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setIsAddingStatut(false);
                    setNewStatut({
                      nom_statut: '',
                      ordre: 0,
                      description: '',
                      champs: []
                    });
                  }}
                >
                  <i className="fas fa-times"></i>
                  Annuler
                </button>
                
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddStatut}
                  disabled={!newStatut.nom_statut}
                >
                  <i className="fas fa-plus"></i>
                  Ajouter
                </button>
              </div>
            </div>
          )}
          
          {/* Liste des statuts */}
          <div className="cible-statuts-list">
            {cible.statuts.length > 0 ? (
              cible.statuts
                .sort((a, b) => a.ordre - b.ordre)
                .map((statut, index) => (
                  <StatutForm
                    key={index}
                    statut={statut}
                    onChange={(updatedStatut) => handleUpdateStatut(index, updatedStatut)}
                    onRemove={() => handleRemoveStatut(index)}
                  />
                ))
            ) : (
              <div className="cible-statuts-empty">
                <i className="fas fa-info-circle"></i>
                Aucun statut défini pour cette cible.
                {!isAddingStatut && (
                  <button
                    className="cible-statuts-empty-action"
                    onClick={() => setIsAddingStatut(true)}
                  >
                    <i className="fas fa-plus-circle"></i>
                    Ajouter un statut
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CibleForm;