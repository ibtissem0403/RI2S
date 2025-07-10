'use client';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useState } from 'react';
import { formatFileSize, formatDate } from '@/utils/formatters';
import Modal from '@/components/Modal/Modal';
import FileViewer from '@/components/FileViewer/FileViewer';
import './ImportFileList.css';

interface ImportedFile {
  _id: string;
  originalName: string;
  experimentation: string;
  fileType: string;
  fileSize: number;
  importDate: string;
  status: string;
  recordCount: number;
  uploadedBy: {
    fullName: string;
    email: string;
  };
  validatedBy?: {
    fullName: string;
    email: string;
  };
  validationDate?: string;
}

interface ImportFileListProps {
  files: ImportedFile[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onPreview: (id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  canDelete: boolean;
  canEdit: boolean;
}

export default function ImportFileList({
  files,
  isLoading,
  error,
  onRefresh,
  onPreview,
  onDelete,
  canDelete,
  canEdit
}: ImportFileListProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ImportedFile | null>(null);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = files.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(files.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  const confirmDelete = (id: string) => {
    if (!canDelete) {
      return;
    }
    
    setFileToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    
    setIsDeleting(true);
    const success = await onDelete(fileToDelete);
    setIsDeleting(false);
    
    if (success) {
      setShowDeleteModal(false);
      setFileToDelete(null);
    }
  };

  const handleViewFile = (file: ImportedFile) => {
    setSelectedFile(file);
    setShowFileViewer(true);
  };

  const handleDownloadFromViewer = () => {
    if (!selectedFile) return;
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;
    
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `http://localhost:5000/api/import/${selectedFile._id}/download`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.responseType = 'blob';
    
    xhr.onload = function() {
      if (this.status === 200) {
        const blob = new Blob([xhr.response]);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedFile.originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    };
    
    xhr.send();
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'csv': return 'fas fa-file-csv';
      case 'xlsx': case 'xls': return 'fas fa-file-excel';
      case 'pdf': return 'fas fa-file-pdf';
      case 'doc': case 'docx': return 'fas fa-file-word';
      case 'ppt': case 'pptx': return 'fas fa-file-powerpoint';
      case 'txt': return 'fas fa-file-alt';
      case 'json': return 'fas fa-file-code';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return 'fas fa-file-image';
      case 'mp4': case 'avi': case 'mov': return 'fas fa-file-video';
      case 'mp3': case 'wav': return 'fas fa-file-audio';
      default: return 'fas fa-file';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Validé': return 'status-validated';
      case 'Rejeté': return 'status-rejected';
      case 'Intégré': return 'status-integrated';
      case 'Erreur': return 'status-error';
      default: return 'status-pending';
    }
  };

  if (isLoading) {
    return (
      <div className="import-loading">
        <div className="import-spinner"></div>
        <p>Chargement des fichiers importés...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="import-error">
        <div className="import-error-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h3>Erreur de chargement</h3>
        <p>{error}</p>
        <button
          onClick={onRefresh}
          className="import-retry-btn"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="import-empty">
        <div className="import-empty-icon">
          <i className="fas fa-file-upload"></i>
        </div>
        <h3>Aucun fichier importé</h3>
        <p>Commencez par importer un fichier en cliquant sur le bouton "Importer un fichier".</p>
      </div>
    );
  }

  return (
    <>
      <div className="import-list-container">
        <div className="import-table-container">
          <table className="import-table">
            <thead>
              <tr>
                <th className="file-col">Fichier</th>
                <th className="exp-col">Expérimentation</th>
                <th className="date-col">Date d'import</th>
                <th className="size-col">Taille</th>
                <th className="user-col">Importé par</th>
                <th className="status-col">Statut</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((file) => (
                <tr key={file._id} className="import-row">
                  <td className="file-cell">
                    <div className="file-info">
                      <i className={`${getFileTypeIcon(file.fileType)} file-icon`}></i>
                      <span className="file-name">{file.originalName}</span>
                      <span className="file-type">.{file.fileType}</span>
                    </div>
                  </td>
                  <td>
                    <span className="experimentation-badge">
                      {file.experimentation}
                    </span>
                  </td>
                  <td>{formatDate(file.importDate)}</td>
                  <td>{formatFileSize(file.fileSize)}</td>
                  <td>{file.uploadedBy?.fullName || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(file.status)}`}>
                      {file.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleViewFile(file)}
                      className="import-view-btn"
                      title="Visualiser le fichier"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    
                    <button
                      onClick={() => onPreview(file._id)}
                      className="import-details-btn"
                      title="Voir les détails"
                    >
                      <i className="fas fa-info-circle"></i>
                    </button>
                    
                    {canDelete && (
                      <button
                        onClick={() => confirmDelete(file._id)}
                        className="import-delete-btn"
                        title="Supprimer"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
              >
                {pageNum}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
      
      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        title="Confirmer la suppression"
        size="small"
      >
        <div className="delete-confirmation">
          <p>Êtes-vous sûr de vouloir supprimer ce fichier ?</p>
          <p className="delete-warning">Cette action est irréversible.</p>
          <div className="delete-actions">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="delete-cancel-btn"
              disabled={isDeleting}
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="delete-confirm-btn"
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        </div>
      </Modal>

      {/* FileViewer universel */}
      {showFileViewer && selectedFile && (
        <FileViewer
          fileId={selectedFile._id}
          fileName={selectedFile.originalName}
          fileType={selectedFile.fileType}
          fileSize={selectedFile.fileSize}
          onDownload={handleDownloadFromViewer}
          onClose={() => {
            setShowFileViewer(false);
            setSelectedFile(null);
          }}
        />
      )}
    </>
  );
}