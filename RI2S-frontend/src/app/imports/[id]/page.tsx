'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import DashboardLayout from '@/components/DashboardLayout';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import ImportDetailHeader from '@/components/ImportDetail/ImportDetailHeader';
import ImportPreviewTable from '@/components/ImportDetail/ImportPreviewTable';
import ImportValidationForm from '@/components/ImportDetail/ImportValidationForm';
import Modal from '@/components/Modal/Modal';
import FileViewer from '@/components/FileViewer/FileViewer';
import { usePermissions } from '@/hooks/usePermissions';
import { getDisplayFileName, downloadFileWithEncoding } from '@/utils/encodingUtils';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './import-detail.css';

export default function ImportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [file, setFile] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showIntegrateModal, setShowIntegrateModal] = useState(false);
  const [showFullPreviewModal, setShowFullPreviewModal] = useState(false);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [fullPreview, setFullPreview] = useState<any>(null);
  const [isFullPreviewLoading, setIsFullPreviewLoading] = useState(false);
  const [downloadInProgress, setDownloadInProgress] = useState(false);
  const { isAdmin } = usePermissions();
  
  const breadcrumbItems = [
    { label: 'Accueil', href: '/index' },
    { label: 'Importation de données', href: '/import' },
    { label: 'Détails', isCurrentPage: true }
  ];

  useEffect(() => {
    fetchFileDetails();
  }, [params.id]);
  
  const fetchFileDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');
      
      const response = await axios.get(
        `http://localhost:5000/api/import/${params.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setFile(response.data);
      
      // Load preview only if file is structured data
      if (response.data && response.data.summary?.isStructuredData) {
        fetchPreview();
      } else {
        setIsPreviewLoading(false);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchPreview = async (limit = 20) => {
    try {
      setIsPreviewLoading(true);
      setPreviewError(null);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');
      
      const response = await axios.get(
        `http://localhost:5000/api/import/${params.id}/preview?limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPreview(response.data);
    } catch (err: any) {
      console.error("Preview error:", err);
      setPreviewError(err instanceof Error ? err.message : "Erreur lors de la prévisualisation");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const fetchFullPreview = async () => {
    try {
      setIsFullPreviewLoading(true);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');
      
      const response = await axios.get(
        `http://localhost:5000/api/import/${params.id}/preview?limit=1000`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setFullPreview(response.data);
      setShowFullPreviewModal(true);
    } catch (err: any) {
      console.error("Full preview error:", err);
      setError("Erreur lors du chargement de la prévisualisation complète");
    } finally {
      setIsFullPreviewLoading(false);
    }
  };
  
  const handleValidateFile = async (data: any) => {
    try {
      setIsUpdating(true);
      setUpdateMessage({ type: '', text: '' });
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');
      
      await axios.put(
        `http://localhost:5000/api/import/${params.id}/validate`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUpdateMessage({
        type: 'success',
        text: `Fichier ${data.action === 'Validé' ? 'validé' : 'rejeté'} avec succès`
      });
      
      fetchFileDetails();
      setShowValidateModal(false);
      
      setTimeout(() => {
        router.push('/import');
      }, 2000);
      
      return true;
    } catch (err: any) {
      console.error("Validation error:", err);
      setUpdateMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || "Erreur lors de la validation"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleIntegrateFile = async () => {
    try {
      setIsUpdating(true);
      setUpdateMessage({ type: '', text: '' });
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');
      
      await axios.post(
        `http://localhost:5000/api/import/${params.id}/integrate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUpdateMessage({
        type: 'success',
        text: 'Données intégrées avec succès'
      });
      
      fetchFileDetails();
      setShowIntegrateModal(false);
      
      setTimeout(() => {
        router.push('/import');
      }, 2000);
      
      return true;
    } catch (err: any) {
      console.error("Integration error:", err);
      setUpdateMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || "Erreur lors de l'intégration"
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Fonction améliorée de téléchargement avec gestion UTF-8
  const handleDownloadFile = async () => {
    if (!file || downloadInProgress) return;
    
    try {
      setDownloadInProgress(true);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Authentification requise');
        return;
      }
      
      const displayName = getDisplayFileName(file);
      await downloadFileWithEncoding(
        `http://localhost:5000/api/import/${params.id}/download`,
        displayName,
        token
      );
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      setError('Erreur lors du téléchargement du fichier');
    } finally {
      setDownloadInProgress(false);
    }
  };
  
  // Fonction améliorée de téléchargement des erreurs avec gestion UTF-8
  const handleDownloadErrors = async () => {
    if (!file || downloadInProgress) return;
    
    try {
      setDownloadInProgress(true);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setError('Authentification requise');
        return;
      }
      
      const displayName = getDisplayFileName(file);
      const errorFileName = `erreurs_${displayName}.csv`;
      
      await downloadFileWithEncoding(
        `http://localhost:5000/api/import/${params.id}/errors`,
        errorFileName,
        token
      );
    } catch (error) {
      console.error('Erreur lors du téléchargement des erreurs:', error);
      setError('Erreur lors du téléchargement du fichier d\'erreurs');
    } finally {
      setDownloadInProgress(false);
    }
  };
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="import-detail-loading">
          <div className="import-detail-spinner"></div>
          <p>Chargement des détails du fichier...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error || !file) {
    return (
      <DashboardLayout>
        <div className="import-detail-error">
          <h3>Erreur de chargement</h3>
          <p>{error || "Fichier non trouvé"}</p>
          <button onClick={() => router.push('/import')} className="import-detail-back-btn">
            Retour à la liste
          </button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="import-detail-container">
        <div className="breadcrumbs-container">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        
        {updateMessage.text && (
          <div className={`import-detail-message ${updateMessage.type}`}>
            <p>{updateMessage.text}</p>
          </div>
        )}
        
        <ImportDetailHeader 
          file={file}
          isAdmin={isAdmin}
          onValidate={() => setShowValidateModal(true)}
          onIntegrate={() => setShowIntegrateModal(true)}
          onDownloadFile={handleDownloadFile}
          onDownloadErrors={handleDownloadErrors}
          hasErrors={file.errors && file.errors.length > 0}
        />
        
        <div className="import-detail-preview">
          <div className="preview-header">
            <h2 className="import-detail-section-title">Aperçu du fichier</h2>
            <div className="preview-actions">
              <button
                onClick={() => setShowFileViewer(true)}
                className="preview-file-btn"
              >
                <i className="fas fa-eye"></i>
                Visualiser le fichier
              </button>
              
              {file.summary?.isStructuredData && (
                <>
                  <button
                    onClick={fetchFullPreview}
                    className="preview-full-btn"
                    disabled={isFullPreviewLoading}
                  >
                    <i className={`fas fa-table ${isFullPreviewLoading ? 'fa-spin' : ''}`}></i>
                    {isFullPreviewLoading ? 'Chargement...' : 'Voir les données'}
                  </button>
                  <button
                    onClick={() => fetchPreview(100)}
                    className="preview-medium-btn"
                  >
                    <i className="fas fa-list"></i>
                    Voir 100 lignes
                  </button>
                </>
              )}
              
              <button
                onClick={handleDownloadFile}
                className="preview-download-btn"
                disabled={downloadInProgress}
              >
                <i className={`fas fa-download ${downloadInProgress ? 'fa-spin' : ''}`}></i>
                {downloadInProgress ? 'Téléchargement...' : 'Télécharger'}
              </button>
            </div>
          </div>
          
          {/* Contenu différent selon le type de fichier */}
          {file.summary?.isStructuredData ? (
            <>
              <ImportPreviewTable 
                preview={preview}
                isLoading={isPreviewLoading}
                error={previewError}
              />
              
              {preview && preview.data && (
                <div className="preview-info">
                  <p className="preview-count">
                    Affichage de {preview.data.length} lignes sur {file.recordCount} total
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="non-structured-preview">
              <div className="non-structured-icon">
                <i className="fas fa-file"></i>
              </div>
              <h3>Fichier non structuré</h3>
              <p>Ce type de fichier ({file.fileType.toUpperCase()}) ne contient pas de données structurées qui peuvent être prévisualisées sous forme de tableau.</p>
              <p>Utilisez le bouton "Visualiser le fichier" pour voir son contenu ou téléchargez-le pour l'ouvrir avec l'application appropriée.</p>
            </div>
          )}
        </div>
        
        {/* Modal de validation */}
        {file.status === 'En attente' && isAdmin && (
          <Modal
            isOpen={showValidateModal}
            onClose={() => !isUpdating && setShowValidateModal(false)}
            title="Valider ou rejeter le fichier"
            size="medium"
          >
            <ImportValidationForm 
              onSubmit={handleValidateFile}
              isSubmitting={isUpdating}
            />
          </Modal>
        )}
        
        {/* Modal d'intégration */}
        {file.status === 'Validé' && isAdmin && (
          <Modal
            isOpen={showIntegrateModal}
            onClose={() => !isUpdating && setShowIntegrateModal(false)}
            title="Intégrer les données"
            size="small"
          >
            <div className="import-integrate-modal">
              <p>Êtes-vous sûr de vouloir intégrer les données de ce fichier ?</p>
              <p className="import-integrate-warning">
                Cette action va créer ou mettre à jour des bénéficiaires dans le système.
              </p>
              <div className="import-integrate-actions">
                <button
                  onClick={() => setShowIntegrateModal(false)}
                  className="import-cancel-btn"
                  disabled={isUpdating}
                >
                  Annuler
                </button>
                <button
                  onClick={handleIntegrateFile}
                  className="import-confirm-btn"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Intégration..." : "Intégrer les données"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal de prévisualisation complète pour données structurées */}
        {file.summary?.isStructuredData && (
          <Modal
            isOpen={showFullPreviewModal}
            onClose={() => setShowFullPreviewModal(false)}
            title="Prévisualisation complète du fichier"
            size="large"
          >
            <div className="full-preview-modal">
              <div className="full-preview-info">
                <p>Affichage détaillé de {fullPreview?.data?.length || 0} lignes</p>
                <button
                  onClick={handleDownloadFile}
                  className="download-full-file-btn"
                  disabled={downloadInProgress}
                >
                  <i className={`fas fa-download ${downloadInProgress ? 'fa-spin' : ''}`}></i>
                  {downloadInProgress ? 'Téléchargement...' : 'Télécharger le fichier complet'}
                </button>
              </div>
              <ImportPreviewTable 
                preview={fullPreview}
                isLoading={isFullPreviewLoading}
                error={null}
                showPagination={true}
                maxHeight="60vh"
              />
            </div>
          </Modal>
        )}

        {/* FileViewer universel */}
        {showFileViewer && (
          <FileViewer
            fileId={params.id as string}
            fileName={getDisplayFileName(file)}
            fileType={file.fileType}
            fileSize={file.fileSize}
            onDownload={handleDownloadFile}
            onClose={() => setShowFileViewer(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}