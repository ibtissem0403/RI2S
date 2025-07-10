// components/ImportDetail/ImportDetailHeader.tsx
import { formatFileSize, formatDate } from '@/utils/formatters';
import './ImportDetail.css';

interface ImportDetailHeaderProps {
  file: any;
  isAdmin: boolean;
  onValidate: () => void;
  onIntegrate: () => void;
  onDownloadErrors: () => void;
  hasErrors: boolean;
}

export default function ImportDetailHeader({
  file,
  isAdmin,
  onValidate,
  onIntegrate,
  onDownloadErrors,
  hasErrors
}: ImportDetailHeaderProps) {
  const getStatusBadge = () => {
    let className = '';
    
    switch(file.status) {
      case 'En attente':
        className = 'status-pending';
        break;
      case 'Validé':
        className = 'status-validated';
        break;
      case 'Rejeté':
        className = 'status-rejected';
        break;
      case 'Intégré':
        className = 'status-integrated';
        break;
      default:
        className = '';
    }
    
    return (
      <span className={`detail-status-badge ${className}`}>
        {file.status}
      </span>
    );
  };
  
  const getStatusActions = () => {
    if (!isAdmin) return null;
    
    if (file.status === 'En attente') {
      return (
        <button onClick={onValidate} className="detail-validate-btn">
          <i className="fas fa-check-circle"></i>
          Valider / Rejeter
        </button>
      );
    }
    
    if (file.status === 'Validé') {
      return (
        <button onClick={onIntegrate} className="detail-integrate-btn">
          <i className="fas fa-database"></i>
          Intégrer les données
        </button>
      );
    }
    
    return null;
  };
  
  const getFileTypeIcon = (fileType: string) => {
    const fileExtension = fileType.toLowerCase();
    
    if (['xlsx', 'xls'].includes(fileExtension)) {
      return 'fas fa-file-excel';
    } else if (['csv', 'tsv'].includes(fileExtension)) {
      return 'fas fa-file-csv';
    } else if (['pdf'].includes(fileExtension)) {
      return 'fas fa-file-pdf';
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      return 'fas fa-file-image';
    } else if (['doc', 'docx'].includes(fileExtension)) {
      return 'fas fa-file-word';
    } else {
      return 'fas fa-file';
    }
  };
  
  return (
    <div className="detail-header">
      <div className="detail-header-main">
        <div className="detail-file-info">
          <div className="detail-file-icon">
            <i className={getFileTypeIcon(file.fileType)}></i>
          </div>
          <div className="detail-file-meta">
            <h1 className="detail-file-name">{file.originalName}</h1>
            <div className="detail-file-attributes">
              <span className="detail-file-type">{file.fileType.toUpperCase()}</span>
              <span className="detail-file-size">{formatFileSize(file.fileSize)}</span>
              <span className="detail-file-date">Importé le {formatDate(file.importDate)}</span>
            </div>
          </div>
        </div>
        
        <div className="detail-header-actions">
          {getStatusBadge()}
          {getStatusActions()}
          {hasErrors && (
            <button onClick={onDownloadErrors} className="detail-download-errors-btn">
              <i className="fas fa-download"></i>
              Télécharger les erreurs
            </button>
          )}
        </div>
      </div>
      
      <div className="detail-metadata">
        <div className="detail-metadata-section">
          <h3 className="detail-metadata-title">Informations du fichier</h3>
          <div className="detail-metadata-grid">
            <div className="detail-metadata-item">
              <span className="detail-metadata-label">Expérimentation</span>
              <span className="detail-metadata-value">
                <span className="experimentation-badge">
                  {file.experimentation}
                </span>
              </span>
            </div>
            <div className="detail-metadata-item">
              <span className="detail-metadata-label">Importé par</span>
              <span className="detail-metadata-value">
                {file.uploadedBy?.fullName || 'N/A'}
              </span>
            </div>
            <div className="detail-metadata-item">
              <span className="detail-metadata-label">Nombre d'enregistrements</span>
              <span className="detail-metadata-value">
                {file.recordCount || 'N/A'}
              </span>
            </div>
            <div className="detail-metadata-item">
              <span className="detail-metadata-label">Format détecté</span>
              <span className="detail-metadata-value">
                {file.summary?.detectedFormat || file.fileType}
              </span>
            </div>
          </div>
        </div>
        
        {(file.status === 'Validé' || file.status === 'Rejeté' || file.status === 'Intégré') && (
          <div className="detail-metadata-section">
            <h3 className="detail-metadata-title">Validation</h3>
            <div className="detail-metadata-grid">
              <div className="detail-metadata-item">
                <span className="detail-metadata-label">Validé par</span>
                <span className="detail-metadata-value">
                  {file.validatedBy?.fullName || 'N/A'}
                </span>
              </div>
              <div className="detail-metadata-item">
                <span className="detail-metadata-label">Date de validation</span>
                <span className="detail-metadata-value">
                  {file.validationDate ? formatDate(file.validationDate) : 'N/A'}
                </span>
              </div>
              <div className="detail-metadata-item">
                <span className="detail-metadata-label">Notes de validation</span>
                <span className="detail-metadata-value">
                  {file.validationNotes || 'Aucune note'}
                </span>
              </div>
              {file.errors && file.errors.length > 0 && (
                <div className="detail-metadata-item">
                  <span className="detail-metadata-label">Erreurs détectées</span>
                  <span className="detail-metadata-value error">
                    {file.errors.length} erreur(s)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {file.status === 'Intégré' && file.summary?.integration && (
          <div className="detail-metadata-section">
            <h3 className="detail-metadata-title">Intégration</h3>
            <div className="detail-metadata-grid">
              <div className="detail-metadata-item">
                <span className="detail-metadata-label">Enregistrements traités</span>
                <span className="detail-metadata-value">
                  {file.summary.integration.totalProcessed || 0}
                </span>
              </div>
              <div className="detail-metadata-item">
                <span className="detail-metadata-label">Nouveaux bénéficiaires</span>
                <span className="detail-metadata-value success">
                  {file.summary.integration.created || 0}
                </span>
              </div>
              <div className="detail-metadata-item">
                <span className="detail-metadata-label">Bénéficiaires mis à jour</span>
                <span className="detail-metadata-value info">
                  {file.summary.integration.updated || 0}
                </span>
              </div>
              <div className="detail-metadata-item">
                <span className="detail-metadata-label">Erreurs d'intégration</span>
                <span className="detail-metadata-value error">
                  {file.summary.integration.errors?.length || 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}