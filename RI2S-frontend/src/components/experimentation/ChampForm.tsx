import React, { useState } from 'react';
import { ChampFormData } from '../../types/models';
import FormField from '../common/FormField';
import Button from '../common/Button';
import './ChampForm.css';

interface ChampFormProps {
  champ: ChampFormData;
  onChange: (updatedChamp: ChampFormData) => void;
  onRemove?: () => void;
}

const ChampForm: React.FC<ChampFormProps> = ({ champ, onChange, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [optionValue, setOptionValue] = useState('');

  // Mettre à jour les champs du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    
    onChange({
      ...champ,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Ajouter une option à la liste
  const addOption = () => {
    if (optionValue.trim() === '') return;
    
    onChange({
      ...champ,
      options: [...(champ.options || []), optionValue.trim()]
    });
    
    setOptionValue('');
  };

  // Supprimer une option de la liste
  const removeOption = (index: number) => {
    onChange({
      ...champ,
      options: champ.options?.filter((_, i) => i !== index)
    });
  };

  // Affichage en mode visualisation
  if (!isEditing) {
    return (
      <div className="p-3 border border-gray-200 rounded-md hover:bg-gray-50">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{champ.nom_champ}</h4>
              {champ.obligatoire && (
                <span className="bg-danger-light text-danger-color px-2 py-0.5 rounded-full text-xs">
                  Obligatoire
                </span>
              )}
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                {champ.type_champ}
              </span>
            </div>
            
            {champ.description && (
              <p className="text-sm text-gray-500 mt-1">{champ.description}</p>
            )}
            
            {champ.type_champ === 'liste' && champ.options && champ.options.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-500">Options:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {champ.options.map((option, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 rounded-md text-xs">
                      {option}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-primary-color hover:text-primary-dark"
              title="Modifier"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-danger-color hover:text-danger-color/80"
                title="Supprimer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Affichage en mode édition
  return (
    <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Nom du champ"
          name="nom_champ"
          value={champ.nom_champ}
          onChange={handleChange}
          required
        />
        
        <FormField
          label="Type de champ"
          type="select"
          name="type_champ"
          value={champ.type_champ}
          onChange={handleChange}
          options={[
            { value: 'texte', label: 'Texte' },
            { value: 'date', label: 'Date' },
            { value: 'nombre', label: 'Nombre' },
            { value: 'liste', label: 'Liste à choix' },
            { value: 'fichier', label: 'Fichier' }
          ]}
          required
        />
        
        <div className="md:col-span-2">
          <FormField
            label="Description"
            type="textarea"
            name="description"
            value={champ.description || ''}
            onChange={handleChange}
          />
        </div>
        
        <div className="md:col-span-2">
          <FormField
            type="checkbox"
            label="Champ obligatoire"
            name="obligatoire"
            checked={champ.obligatoire}
            onChange={handleChange}
          />
        </div>
      </div>
      
      {/* Options pour les listes */}
      {champ.type_champ === 'liste' && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Options de la liste</h4>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={optionValue}
              onChange={(e) => setOptionValue(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Nouvelle option..."
            />
            <Button
              variant="primary"
              onClick={addOption}
              size="sm"
            >
              Ajouter
            </Button>
          </div>
          
          {champ.options && champ.options.length > 0 ? (
            <div className="mt-2 space-y-2">
              {champ.options.map((option, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded-md">
                  <span>{option}</span>
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-danger-color hover:text-danger-color/80"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-2">Aucune option ajoutée</p>
          )}
        </div>
      )}
      
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={() => setIsEditing(false)}
        >
          Annuler
        </Button>
        
        <Button
          variant="primary"
          onClick={() => setIsEditing(false)}
          disabled={!champ.nom_champ}
        >
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default ChampForm;