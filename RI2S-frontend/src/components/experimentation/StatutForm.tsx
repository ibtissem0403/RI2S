import React, { useState } from 'react';
import { StatutFormData, ChampFormData, ChampType } from '../../types/models';
import ChampForm from './ChampForm';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './StatutForm.css';

interface StatutFormProps {
  statut: StatutFormData;
  onChange: (updatedStatut: StatutFormData) => void;
  onRemove?: () => void;
}

const StatutForm: React.FC<StatutFormProps> = ({ statut, onChange, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingChamp, setIsAddingChamp] = useState(false);
  const [newChamp, setNewChamp] = useState<ChampFormData>({
    nom_champ: '',
    type_champ: 'texte',
    obligatoire: false,
    description: '',
    options: []
  });
  const [optionValue, setOptionValue] = useState('');

  // Mettre à jour les champs du statut
  const handleStatutChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange({
      ...statut,
      [name]: value
    });
  };

  // Mettre à jour les champs du nouveau champ
  const handleChampChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    
    setNewChamp(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Ajouter une option à la liste
  const addOption = () => {
    if (optionValue.trim() === '') return;
    
    setNewChamp(prev => ({
      ...prev,
      options: [...(prev.options || []), optionValue.trim()]
    }));
    
    setOptionValue('');
  };

  // Supprimer une option de la liste
  const removeOption = (index: number) => {
    setNewChamp(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index)
    }));
  };

  // Ajouter un nouveau champ
  const handleAddChamp = () => {
    if (!newChamp.nom_champ) return;
    
    // Mettre à jour le statut avec le nouveau champ
    onChange({
      ...statut,
      champs: [...statut.champs, { ...newChamp }]
    });
    
    // Réinitialiser le formulaire et fermer le panneau d'ajout
    setNewChamp({
      nom_champ: '',
      type_champ: 'texte',
      obligatoire: false,
      description: '',
      options: []
    });
    setIsAddingChamp(false);
  };

  // Mettre à jour un champ existant
  const handleUpdateChamp = (index: number, updatedChamp: ChampFormData) => {
    const updatedChamps = [...statut.champs];
    updatedChamps[index] = updatedChamp;
    
    onChange({
      ...statut,
      champs: updatedChamps
    });
  };

  // Supprimer un champ
  const handleRemoveChamp = (index: number) => {
    onChange({
      ...statut,
      champs: statut.champs.filter((_, i) => i !== index)
    });
  };

  // Fonction d'aide pour obtenir l'icône correspondant au type de champ
  const getIconForFieldType = (type: string): string => {
    switch (type) {
      case 'texte':
        return 'fas fa-font';
      case 'date':
        return 'fas fa-calendar-alt';
      case 'nombre':
        return 'fas fa-hashtag';
      case 'liste':
        return 'fas fa-list-ul';
      case 'fichier':
        return 'fas fa-file-alt';
      default:
        return 'fas fa-question-circle';
    }
  };

  return (
    <div className="statut-container">
      {/* En-tête du statut */}
      <div 
        className={`statut-header ${isExpanded ? 'statut-header-active' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="statut-header-left">
          <div className="statut-header-number">
            {statut.ordre + 1}
          </div>
          <div className="statut-header-info">
            <div className="statut-header-title">
              <i className="fas fa-flag"></i>
              {statut.nom_statut}
            </div>
            {statut.description && (
              <div className="statut-header-description">
                {statut.description}
              </div>
            )}
          </div>
        </div>
        <div className="statut-header-right">
          <div className="statut-header-badge">
            <i className="fas fa-puzzle-piece"></i>
            {statut.champs.length} champ(s)
          </div>
          <i className={`fas fa-chevron-down statut-toggle-icon ${isExpanded ? 'statut-toggle-icon-open' : ''}`}></i>
        </div>
      </div>
      
      {/* Contenu détaillé du statut (visible si développé) */}
      {isExpanded && (
        <div className="statut-body statut-fade-in">
          {/* Formulaire du statut */}
          <div className="statut-form-grid">
            <div className="statut-form-field">
              <label className="statut-form-label">
                <i className="fas fa-tag"></i>
                Nom du statut
                <span className="text-danger-color">*</span>
              </label>
              <input
                type="text"
                name="nom_statut"
                value={statut.nom_statut}
                onChange={handleStatutChange}
                required
                className="statut-form-input"
              />
            </div>
            
            <div className="statut-form-field">
              <label className="statut-form-label">
                <i className="fas fa-sort-numeric-down"></i>
                Ordre d'affichage
              </label>
              <input
                type="number"
                name="ordre"
                value={statut.ordre.toString()}
                onChange={(e) => onChange({
                  ...statut,
                  ordre: parseInt(e.target.value, 10) || 0
                })}
                className="statut-form-input"
              />
              <div className="statut-hint-text">Position dans le processus (0, 1, 2...)</div>
            </div>
            
            <div className="statut-form-field statut-form-full">
              <label className="statut-form-label">
                <i className="fas fa-info-circle"></i>
                Description
              </label>
              <textarea
                name="description"
                value={statut.description || ''}
                onChange={handleStatutChange}
                className="statut-form-textarea"
              ></textarea>
            </div>
          </div>
          
          {/* Section des champs */}
          <div className="statut-champs-section">
            <div className="statut-champs-header">
              <h3 className="statut-champs-title">
                <i className="fas fa-th-list"></i>
                Champs ({statut.champs.length})
              </h3>
              
              {!isAddingChamp && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsAddingChamp(true)}
                >
                  <i className="fas fa-plus"></i>
                  Ajouter un champ
                </button>
              )}
            </div>
            
            {/* Formulaire d'ajout de champ */}
            {isAddingChamp && (
              <div className="statut-new-champ-form">
                <h4 className="statut-new-champ-title">
                  <i className="fas fa-puzzle-piece"></i>
                  Nouveau champ
                </h4>
                <div className="statut-form-grid">
                  <div className="statut-form-field">
                    <label className="statut-form-label">
                      <i className="fas fa-tag"></i>
                      Nom du champ
                      <span className="text-danger-color">*</span>
                    </label>
                    <input
                      type="text"
                      name="nom_champ"
                      value={newChamp.nom_champ}
                      onChange={handleChampChange}
                      required
                      className="statut-form-input"
                    />
                  </div>
                  
                  <div className="statut-form-field">
                    <label className="statut-form-label">
                      <i className="fas fa-th-list"></i>
                      Type de champ
                      <span className="text-danger-color">*</span>
                    </label>
                    <select
                      name="type_champ"
                      value={newChamp.type_champ}
                      onChange={handleChampChange}
                      required
                      className="statut-form-select"
                    >
                      <option value="texte">Texte</option>
                      <option value="date">Date</option>
                      <option value="nombre">Nombre</option>
                      <option value="liste">Liste à choix</option>
                      <option value="fichier">Fichier</option>
                    </select>
                  </div>
                  
                  <div className="statut-form-field statut-form-full">
                    <label className="statut-form-label">
                      <i className="fas fa-info-circle"></i>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={newChamp.description || ''}
                      onChange={handleChampChange}
                      className="statut-form-textarea"
                    ></textarea>
                  </div>
                  
                  <div className="statut-form-field statut-form-full">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        id="champ-obligatoire"
                        name="obligatoire"
                        checked={newChamp.obligatoire}
                        onChange={handleChampChange}
                        style={{ width: 'auto', marginRight: '0.5rem' }}
                      />
                      <label htmlFor="champ-obligatoire" className="statut-form-label" style={{ margin: 0 }}>
                        <i className="fas fa-exclamation-circle"></i>
                        Champ obligatoire
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Options pour les listes */}
                {newChamp.type_champ === 'liste' && (
                  <div style={{ marginTop: '1rem' }}>
                    <h5 style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <i className="fas fa-list-ul"></i>
                      Options de la liste
                    </h5>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <input
                        type="text"
                        value={optionValue}
                        onChange={(e) => setOptionValue(e.target.value)}
                        placeholder="Nouvelle option..."
                        className="statut-form-input"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={addOption}
                      >
                        <i className="fas fa-plus"></i>
                        Ajouter
                      </button>
                    </div>
                    
                    {newChamp.options && newChamp.options.length > 0 ? (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.5rem'
                      }}>
                        {newChamp.options.map((option, index) => (
                          <div key={index} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '0.5rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '0.375rem'
                          }}>
                            <span>
                              <i className="fas fa-check-circle" style={{ color: '#2a7d4f', marginRight: '0.5rem' }}></i>
                              {option}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              style={{ 
                                background: 'none',
                                border: 'none',
                                color: '#dc2626',
                                cursor: 'pointer',
                                padding: '0.25rem'
                              }}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '0.25rem' }}></i>
                        Aucune option ajoutée
                      </p>
                    )}
                  </div>
                )}
                
                <div className="statut-actions" style={{ marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setIsAddingChamp(false);
                      setNewChamp({
                        nom_champ: '',
                        type_champ: 'texte',
                        obligatoire: false,
                        description: '',
                        options: []
                      });
                    }}
                  >
                    <i className="fas fa-times"></i>
                    Annuler
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddChamp}
                    disabled={!newChamp.nom_champ}
                    style={{ marginLeft: '0.75rem' }}
                  >
                    <i className="fas fa-plus"></i>
                    Ajouter
                  </button>
                </div>
              </div>
            )}
            
            {/* Liste des champs */}
            <div className="statut-champs-list">
              {statut.champs.length > 0 ? (
                statut.champs.map((champ, index) => (
                  <div key={index} className="pop-in" style={{ 
                    padding: '0.75rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.5rem',
                    backgroundColor: 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h4 style={{ fontWeight: '500', fontSize: '0.95rem', margin: 0 }}>
                            <i className={getIconForFieldType(champ.type_champ)} style={{ marginRight: '0.5rem', color: '#2a7d4f' }}></i>
                            {champ.nom_champ}
                          </h4>
                          {champ.obligatoire && (
                            <span style={{ 
                              backgroundColor: '#fee2e2', 
                              color: '#dc2626', 
                              padding: '0.125rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              <i className="fas fa-exclamation-circle"></i>
                              Obligatoire
                            </span>
                          )}
                          <span style={{ 
                            backgroundColor: '#f3f4f6', 
                            color: '#4b5563', 
                            padding: '0.125rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem'
                          }}>
                            {champ.type_champ}
                          </span>
                        </div>
                        
                        {champ.description && (
                          <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: '0.5rem 0 0 0' }}>
                            {champ.description}
                          </p>
                        )}
                        
                        {champ.type_champ === 'liste' && champ.options && champ.options.length > 0 && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: '500', color: '#4b5563', margin: '0 0 0.375rem 0' }}>
                              <i className="fas fa-list" style={{ marginRight: '0.25rem' }}></i>
                              Options:
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {champ.options.map((option, i) => (
                                <span key={i} style={{ 
                                  padding: '0.125rem 0.5rem', 
                                  backgroundColor: '#f3f4f6', 
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem'
                                }}>
                                  <i className="fas fa-check-circle" style={{ marginRight: '0.25rem', color: '#2a7d4f' }}></i>
                                  {option}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveChamp(index)}
                          style={{ 
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="statut-champs-empty">
                  <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
                  Aucun champ défini pour ce statut.
                  {!isAddingChamp && (
                    <button
                      className="statut-champs-empty-action"
                      onClick={() => setIsAddingChamp(true)}
                    >
                      <i className="fas fa-plus-circle"></i>
                      Ajouter un champ
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          {onRemove && (
            <div className="statut-actions">
              <button
                type="button"
                className="btn btn-danger"
                onClick={onRemove}
              >
                <i className="fas fa-trash-alt"></i>
                Supprimer ce statut
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatutForm;