'use client';
import { useState, useEffect } from 'react';
import './FileViewer.css';

interface FileViewerProps {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  onDownload: () => void;
  onClose: () => void;
}

export default function FileViewer({ 
  fileId, 
  fileName, 
  fileType, 
  fileSize, 
  onDownload, 
  onClose 
}: FileViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    generateFileUrl();
  }, [fileId]);

  const generateFileUrl = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        setError('Authentification requise');
        return;
      }
      
      // Créer une URL avec token pour l'affichage
      const url = `http://localhost:5000/api/import/${fileId}/view?token=${token}`;
      setFileUrl(url);
      setIsLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement du fichier');
      setIsLoading(false);
    }
  };

  const renderFileContent = () => {
    if (isLoading) {
      return (
        <div className="file-viewer-loading">
          <div className="spinner"></div>
          <p>Chargement du fichier...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="file-viewer-error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={onDownload} className="download-anyway-btn">
            Télécharger le fichier
          </button>
        </div>
      );
    }

    const lowerFileType = fileType.toLowerCase();

    // PDF
    if (lowerFileType === 'pdf') {
      return (
        <div className="pdf-viewer">
          <iframe
            src={`${fileUrl}#view=FitH`}
            width="100%"
            height="600px"
            title={fileName}
            frameBorder="0"
            onError={() => setError('Impossible d\'afficher le PDF')}
          />
        </div>
      );
    }

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(lowerFileType)) {
      return (
        <div className="image-viewer">
          <img
            src={fileUrl}
            alt={fileName}
            style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }}
            onError={() => setError('Impossible d\'afficher l\'image')}
          />
        </div>
      );
    }

    // Fichiers texte
    if (['txt', 'csv', 'json', 'xml', 'log'].includes(lowerFileType)) {
      return (
        <div className="text-viewer">
          <iframe
            src={fileUrl}
            width="100%"
            height="600px"
            title={fileName}
            frameBorder="0"
            style={{ backgroundColor: 'white' }}
            onError={() => setError('Impossible d\'afficher le fichier texte')}
          />
        </div>
      );
    }

    // Documents Office (Word, Excel, PowerPoint)
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(lowerFileType)) {
      return (
        <div className="office-viewer">
          <div className="office-preview-info">
            <i className="fas fa-info-circle"></i>
            <p>Prévisualisation des documents Office</p>
          </div>
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl || '')}`}
            width="100%"
            height="600px"
            title={fileName}
            frameBorder="0"
            onError={() => setError('Impossible d\'afficher le document Office')}
          />
          <div className="office-fallback">
            <p>Si la prévisualisation ne fonctionne pas, téléchargez le fichier pour l'ouvrir.</p>
          </div>
        </div>
      );
    }

    // Fichiers vidéo
    if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(lowerFileType)) {
      return (
        <div className="video-viewer">
          <video
            src={fileUrl}
            controls
            style={{ maxWidth: '100%', maxHeight: '600px' }}
            onError={() => setError('Impossible de lire la vidéo')}
          >
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        </div>
      );
    }

    // Fichiers audio
    if (['mp3', 'wav', 'ogg', 'aac'].includes(lowerFileType)) {
      return (
        <div className="audio-viewer">
          <div className="audio-icon">
            <i className="fas fa-music"></i>
          </div>
          <audio 
            src={fileUrl} 
            controls 
            style={{ width: '100%' }}
            onError={() => setError('Impossible de lire le fichier audio')}
          >
            Votre navigateur ne supporte pas la lecture audio.
          </audio>
        </div>
      );
    }

    // Autres types de fichiers
    return (
      <div className="file-viewer-unsupported">
        <div className="unsupported-icon">
          <i className="fas fa-file"></i>
        </div>
        <h3>Aperçu non disponible</h3>
        <p>Ce type de fichier ({fileType.toUpperCase()}) ne peut pas être prévisualisé.</p>
        <button onClick={onDownload} className="download-btn">
          <i className="fas fa-download"></i>
          Télécharger pour ouvrir
        </button>
      </div>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string): string => {
    const type = fileType.toLowerCase();
    if (type === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(type)) return 'word';
    if (['xls', 'xlsx'].includes(type)) return 'excel';
    if (['ppt', 'pptx'].includes(type)) return 'powerpoint';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(type)) return 'image';
    if (['mp4', 'avi', 'mov'].includes(type)) return 'video';
    if (['mp3', 'wav'].includes(type)) return 'audio';
    if (type === 'csv') return 'csv';
    return 'alt';
  };

  return (
    <div className="file-viewer-overlay" onClick={onClose}>
      <div className="file-viewer-container" onClick={(e) => e.stopPropagation()}>
        <div className="file-viewer-header">
          <div className="file-info">
            <i className={`fas fa-file-${getFileIcon(fileType)} file-icon`}></i>
            <div className="file-details">
              <h3>{fileName}</h3>
              <span className="file-meta">
                {fileType.toUpperCase()} • {formatFileSize(fileSize)}
              </span>
            </div>
          </div>
          <div className="file-actions">
            <button
              onClick={onDownload}
              className="download-btn"
              title="Télécharger"
            >
              <i className="fas fa-download"></i>
            </button>
            <button
              onClick={onClose}
              className="close-btn"
              title="Fermer"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        <div className="file-viewer-content">
          {renderFileContent()}
        </div>
      </div>
    </div>
  );
}