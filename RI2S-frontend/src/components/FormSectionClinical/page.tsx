import React, { useRef, useState } from 'react';
import './FormSectionClinical.css';

// Définition du type ClinicalDocument
type ClinicalDocument = {
  _id: string;
  fileName: string;
  fileUrl: string;
  examType?: string;
  examDate?: string;
  fileMimeType?: string;
};

type Props = {
  handleFileChange: (files: File[]) => void;
  existingDocuments?: ClinicalDocument[];
  onDeleteDocument?: (documentId: string) => Promise<boolean>;
};

export default function FormSectionClinical({ 
  handleFileChange, 
  existingDocuments = [],
  onDeleteDocument
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const newFiles = Array.from(e.target.files);
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      handleFileChange(updatedFiles);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      const newFiles = Array.from(e.dataTransfer.files);
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      handleFileChange(updatedFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    handleFileChange(updatedFiles);
  };

  const handleDeleteExistingFile = async (docId: string) => {
    if (!onDeleteDocument) return;
    
    setIsDeleting(docId);
    try {
      const success = await onDeleteDocument(docId);
      if (!success) {
        alert('Erreur lors de la suppression du document');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du document');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="clinical-card">
      <div className="clinical-card-header">
        <h2><i className="fas fa-file-medical"></i> Les données cliniques</h2>
      </div>
      <div className="clinical-card-body">
        {/* Documents existants en premier */}
        {existingDocuments && existingDocuments.length > 0 && (
          <div className="clinical-existing-files">
            <h3 className="clinical-section-title">
              <i className="fas fa-folder-open"></i> Documents existants
            </h3>
            <ul className="clinical-file-list">
              {existingDocuments.map((doc) => (
                <li key={doc._id} className="clinical-file-item">
                  <div className="clinical-file-info">
                    <span className="clinical-file-icon">
                      <i className={`fas ${
                        doc.fileMimeType?.includes('pdf') ? 'fa-file-pdf' :
                        doc.fileMimeType?.includes('image') ? 'fa-file-image' :
                        doc.fileMimeType?.includes('word') ? 'fa-file-word' :
                        'fa-file-alt'
                      }`}></i>
                    </span>
                    <span className="clinical-file-name">{doc.fileName}</span>
                  </div>
                  <div className="clinical-file-actions">
                    <a 
                      href={doc.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="clinical-view-btn"
                    >
                      <i className="fas fa-eye"></i> Voir
                    </a>
                    {onDeleteDocument && (
                      <button
                        onClick={() => handleDeleteExistingFile(doc._id)}
                        className="clinical-delete-icon"
                        disabled={isDeleting === doc._id}
                        title="Supprimer ce document"
                      >
                        {isDeleting === doc._id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Zone d'upload pour nouveaux fichiers */}
        <div className="clinical-new-files">
          <h3 className="clinical-section-title">
            <i className="fas fa-upload"></i> Ajouter de nouveaux documents
          </h3>
          <div
            className="clinical-dropzone"
            onClick={openFileDialog}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="clinical-icon">
              <i className="fas fa-cloud-upload-alt"></i>
            </div>
            <p className="clinical-text">
              <strong>Glissez-déposez vos fichiers ici</strong><br />
              ou cliquez pour en sélectionner
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="clinical-file-input"
              multiple
            />
          </div>
          
          {files.length > 0 && (
            <ul className="clinical-file-list">
              {files.map((file, index) => (
                <li key={`new-${index}`} className="clinical-file-item">
                  <div className="clinical-file-info">
                    <span className="clinical-file-icon">
                      <i className={`fas ${
                        file.type.includes('pdf') ? 'fa-file-pdf' :
                        file.type.includes('image') ? 'fa-file-image' :
                        file.type.includes('word') ? 'fa-file-word' :
                        'fa-file-alt'
                      }`}></i>
                    </span>
                    <span className="clinical-file-name">{file.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                    className="clinical-remove-btn"
                    title="Supprimer"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .clinical-card-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .clinical-card-header h2 i,
        .clinical-section-title i {
          color: #22577a;
        }
        
        .clinical-section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .clinical-icon {
          font-size: 2.5rem;
          color: #64748b;
          margin-bottom: 1rem;
        }
        
        .clinical-file-icon {
          color: #64748b;
          font-size: 1.25rem;
          margin-right: 0.75rem;
          display: flex;
          align-items: center;
        }
        
        .clinical-view-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        
        .clinical-delete-icon,
        .clinical-remove-btn {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}