// components/ExportPDFButton/ExportPDFButton.tsx
'use client';
import { useState } from 'react';
import axios from 'axios';
import { NotificationType } from '@/components/Notification/Notification';

interface ExportPDFButtonProps {
  currentFilters: {
    status: string;
    signalType: string;
    source: string;
    dateRange: {
      startDate: string;
      endDate: string;
    };
    search: string;
  };
  onNotification: (type: NotificationType, message: string) => void;
}

const styles = `
  .export-pdf-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: #ef4444;
    color: white;
  }

  .export-pdf-btn:hover:not(:disabled) {
    background-color: #dc2626;
  }

  .export-pdf-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .export-pdf-spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default function ExportPDFButton({ currentFilters, onNotification }: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Construire les paramètres de requête
      const params: any = {};
      
      if (currentFilters.status && currentFilters.status !== 'all') {
        params.status = currentFilters.status;
      }
      
      if (currentFilters.signalType) {
        params.signalType = currentFilters.signalType;
      }
      
      if (currentFilters.source) {
        params.source = currentFilters.source;
      }
      
      if (currentFilters.dateRange.startDate) {
        params.startDate = currentFilters.dateRange.startDate;
      }
      
      if (currentFilters.dateRange.endDate) {
        params.endDate = currentFilters.dateRange.endDate;
      }
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Authentification requise');
      }

      // Faire la requête avec responseType blob pour télécharger le PDF
      const response = await axios({
        url: 'http://localhost:5000/api/weak-signals/export/pdf',
        method: 'GET',
        responseType: 'blob',
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Créer un URL pour le blob et déclencher le téléchargement
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      const fileName = `signals_export_${new Date().toISOString().split('T')[0]}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Notification de succès
      onNotification('success', 'Rapport PDF téléchargé avec succès');
      
    } catch (error: any) {
      console.error('Erreur lors de l\'export PDF:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'export PDF';
      onNotification('error', errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <button 
        onClick={handleExport}
        disabled={isExporting}
        className="export-pdf-btn"
      >
        {isExporting ? (
          <>
            <div className="export-pdf-spinner"></div>
            Export en cours...
          </>
        ) : (
          <>
            <i className="fas fa-file-pdf"></i>
            Exporter PDF
          </>
        )}
      </button>
    </>
  );
}