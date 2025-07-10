// components/ImportUploadForm/ImportUploadForm.tsx
'use client';
import { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import axios from 'axios';
import { fixFileNameEncoding, hasEncodingIssues } from '@/utils/encodingUtils';
import './ImportUploadForm.css';

interface Experimentation {
  _id: string;
  name: string;
  code: string;
}

interface ImportUploadFormProps {
  onSubmit: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  isAdmin?: boolean;
  onClose?: () => void;
}

export default function ImportUploadForm({ 
  onSubmit, 
  isAdmin = false, 
  onClose 
}: ImportUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [experimentation, setExperimentation] = useState<string>('');
  const [experimentations, setExperimentations] = useState<Experimentation[]>([]);
  const [dragging, setDragging] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingExperimentations, setIsLoadingExperimentations] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [autoValidate, setAutoValidate] = useState<boolean>(true);
  
  // Nouveaux états pour l'encodage
  const [fileDisplayName, setFileDisplayName] = useState<string>('');
  const [fileHasEncodingIssues, setFileHasEncodingIssues] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Récupérer les expérimentations au chargement du composant
  useEffect(() => {
    const fetchExperimentations = async () => {
      try {
        setIsLoadingExperimentations(true);
        
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          setError('Authentification requise');
          return;
        }
        
        const response = await axios.get(
          'http://localhost:5000/api/experimentations',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setExperimentations(response.data);
      } catch (err) {
        console.error("Erreur lors du chargement des expérimentations:", err);
        setError("Impossible de charger les expérimentations");
      } finally {
        setIsLoadingExperimentations(false);
      }
    };
    
    fetchExperimentations();
  }, []);
  
  const processFile = (selectedFile: File) => {
    const correctedName = fixFileNameEncoding(selectedFile.name);
    const hasIssues = hasEncodingIssues(selectedFile.name);
    
    setFile(selectedFile);
    setFileDisplayName(correctedName);
    setFileHasEncodingIssues(hasIssues);
    setError(null);
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleExperimentationChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setExperimentation(e.target.value);
    setError(null);
  };
  
  const resetForm = () => {
    setFile(null);
    setFileDisplayName('');
    setFileHasEncodingIssues(false);
    setExperimentation('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }
    
    if (!experimentation) {
      setError('Veuillez sélectionner une expérimentation');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('experimentation', experimentation);
      
      // Ajouter l'option d'auto-validation si l'utilisateur est admin
      if (isAdmin) {
        formData.append('autoValidate', autoValidate ? 'true' : 'false');
      }
      
      const result = await onSubmit(formData);
      
      if (result.success) {
        setSuccess(true);
        resetForm();
        
        // Fermer automatiquement après succès si une fonction de fermeture est fournie
        if (onClose) {
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } else {
        setError(result.error || 'Une erreur est survenue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Composant pour afficher les informations du fichier sélectionné
  const FileInfoDisplay = () => {
    if (!file) return null;
    
    return (
      <div className="upload-file-info">
        <div className="upload-file-icon">
          <i className="fas fa-file"></i>
        </div>
        <div className="upload-file-details">
          <div className="upload-file-name">
            {fileDisplayName}
            {fileHasEncodingIssues && (
              <span 
                className="encoding-warning-badge"
                title="Le nom de fichier contient des caractères spéciaux qui ont été corrigés"
              >
                <i className="fas fa-language"></i>
              </span>
            )}
          </div>
          <div className="upload-file-size">{(file.size / 1024).toFixed(2)} KB</div>
          
          {/* Affichage du nom original si différent */}
          {fileHasEncodingIssues && file.name !== fileDisplayName && (
            <div className="upload-file-original">
              <small>Nom original : <code>{file.name}</code></small>
            </div>
          )}
        </div>
        <button
          type="button"
          className="upload-file-remove"
          onClick={resetForm}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    );
  };
  
  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <div 
        className={`upload-dropzone ${dragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="upload-icon">
          <i className="fas fa-cloud-upload-alt"></i>
        </div>
        <div className="upload-text">
          <p>Glissez-déposez votre fichier ici ou</p>
          <button type="button" className="upload-browse-btn">
            Parcourir
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="upload-input"
        />
      </div>
      
      <FileInfoDisplay />
      
      <div className="upload-form-group">
        <label htmlFor="experimentation" className="upload-label">
          Expérimentation <span className="upload-required">*</span>
        </label>
        <select
          id="experimentation"
          value={experimentation}
          onChange={handleExperimentationChange}
          className="upload-select"
          required
          disabled={isLoadingExperimentations}
        >
          <option value="">
            {isLoadingExperimentations 
              ? "Chargement des expérimentations..." 
              : "Sélectionner une expérimentation"}
          </option>
          {experimentations.map((exp) => (
            <option key={exp._id} value={exp.name}>
              {exp.name} ({exp.code})
            </option>
          ))}
        </select>
        {experimentations.length === 0 && !isLoadingExperimentations && (
          <div className="upload-info">
            <i className="fas fa-info-circle"></i>
            Aucune expérimentation trouvée. Veuillez contacter l'administrateur.
          </div>
        )}
      </div>
      
      {/* Option d'auto-validation pour les admins uniquement */}
      {isAdmin && (
        <div className="upload-form-group">
          <div className="upload-checkbox-container">
            <input
              type="checkbox"
              id="autoValidate"
              checked={autoValidate}
              onChange={(e) => setAutoValidate(e.target.checked)}
              className="upload-checkbox"
            />
            <label htmlFor="autoValidate" className="upload-checkbox-label">
              Valider automatiquement ce fichier après l'import
            </label>
          </div>
          <small className="upload-help-text">
            <i className="fas fa-info-circle"></i>
            En tant qu'administrateur, vous pouvez valider automatiquement le fichier pour accélérer le processus.
          </small>
        </div>
      )}
      
      {/* Informations sur l'encodage si nécessaire */}
      {fileHasEncodingIssues && (
        <div className="upload-encoding-info">
          <div className="upload-encoding-header">
            <i className="fas fa-language"></i>
            <strong>Caractères spéciaux détectés</strong>
          </div>
          <p>
            Le nom de votre fichier contient des caractères spéciaux (accents, etc.) qui ont été 
            automatiquement corrigés pour assurer une bonne compatibilité. Le fichier sera sauvegardé 
            avec le nom corrigé : <strong>{fileDisplayName}</strong>
          </p>
        </div>
      )}
      
      {error && <div className="upload-error">{error}</div>}
      {success && (
        <div className="upload-success">
          <i className="fas fa-check-circle"></i>
          Fichier importé avec succès
          {onClose && <span> - Fermeture automatique...</span>}
        </div>
      )}
      
      <div className="upload-actions">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="upload-cancel-btn"
            disabled={isSubmitting}
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          className="upload-submit-btn"
          disabled={isSubmitting || !file || !experimentation}
        >
          {isSubmitting ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Importation...
            </>
          ) : (
            <>
              <i className="fas fa-cloud-upload-alt"></i>
              Importer le fichier
            </>
          )}
        </button>
      </div>
      
      <style jsx>{`
        .encoding-warning-badge {
          display: inline-flex;
          align-items: center;
          margin-left: 0.5rem;
          padding: 0.125rem 0.25rem;
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fbbf24;
          border-radius: 0.25rem;
          font-size: 0.7rem;
        }
        
        .upload-file-original {
          margin-top: 0.25rem;
          color: #64748b;
        }
        
        .upload-file-original code {
          background-color: #f1f5f9;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.8em;
        }
        
        .upload-encoding-info {
          padding: 1rem;
          background-color: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        
        .upload-encoding-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          color: #92400e;
        }
        
        .upload-encoding-info p {
          margin: 0;
          color: #92400e;
          font-size: 0.9rem;
        }
        
        .upload-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: #64748b;
          background-color: #f8fafc;
          padding: 0.75rem;
          border-radius: 0.375rem;
          border: 1px solid #e2e8f0;
        }
        
        .upload-checkbox-container {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .upload-checkbox {
          margin-right: 0.5rem;
        }
        
        .upload-checkbox-label {
          font-size: 0.95rem;
          color: #334155;
        }
        
        .upload-help-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.85rem;
        }
        
        .upload-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }
        
        .upload-cancel-btn {
          padding: 0.75rem 1.5rem;
          background-color: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .upload-cancel-btn:hover:not(:disabled) {
          background-color: #f1f5f9;
          border-color: #cbd5e1;
        }
        
        .upload-submit-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
      `}</style>
    </form>
  );
}