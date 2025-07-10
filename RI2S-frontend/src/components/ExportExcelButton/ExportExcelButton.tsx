// components/ExportExcelButton/ExportExcelButton.tsx
'use client';
import { useState } from 'react';
import axios from 'axios';

// CSS harmonisé avec la plateforme
const styles = `
  .export-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 0.4rem;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    background-color: #4a9540;
    color: white;
  }

  .export-btn:hover:not(:disabled) {
    background-color: #3a8a32;
  }

  .export-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

interface ExportExcelButtonProps {
  currentFilters?: {
    status?: string;
    signalType?: string;
    source?: string;
    dateRange?: {
      startDate?: string;
      endDate?: string;
    };
    search?: string;
  };
  onNotification?: (type: string, message: string) => void;
}

const ExportExcelButton = ({ currentFilters = {}, onNotification }: ExportExcelButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportClick = async () => {
    try {
      setIsExporting(true);
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('Authentification requise');
      
      // Préparer les paramètres de l'URL
      const params = new URLSearchParams();
      
      if (currentFilters.status && currentFilters.status !== 'all') {
        params.append('status', currentFilters.status);
      }
      
      if (currentFilters.signalType) {
        params.append('signalType', currentFilters.signalType);
      }
      
      if (currentFilters.source) {
        params.append('source', currentFilters.source);
      }
      
      if (currentFilters.dateRange?.startDate) {
        params.append('startDate', currentFilters.dateRange.startDate);
      }
      
      if (currentFilters.dateRange?.endDate) {
        params.append('endDate', currentFilters.dateRange.endDate);
      }
      
      // Faire la requête avec axios pour obtenir le blob
      const response = await axios({
        url: `http://localhost:5000/api/weak-signals/export/excel?${params.toString()}`,
        method: 'GET',
        responseType: 'blob',
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });
      
      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Créer un élément a temporaire pour le téléchargement
      const link = document.createElement('a');
      link.href = url;
      
      // Obtenir la date actuelle formatée pour le nom de fichier
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `signaux_faibles_export_${today}.xlsx`);
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      if (onNotification) {
        onNotification('success', 'Export Excel réalisé avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      if (onNotification) {
        onNotification('error', 'Erreur lors de l\'export Excel');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <button
        onClick={handleExportClick}
        className="export-btn"
        disabled={isExporting}
      >
        <i className={`fas fa-file-excel ${isExporting ? 'fa-spin' : ''}`}></i>
        {isExporting ? 'Export en cours...' : 'Exporter Excel'}
      </button>
    </>
  );
};

export default ExportExcelButton;