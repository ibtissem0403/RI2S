// hooks/useFileEncoding.ts
import { useState, useCallback, useMemo } from 'react';
import { 
  fixFileNameEncoding, 
  hasEncodingIssues, 
  getDisplayFileName, 
  getEncodingInfo,
  downloadFileWithEncoding 
} from '@/utils/encodingUtils';

export interface FileEncodingInfo {
  originalName: string;
  displayName: string;
  hasSpecialChars: boolean;
  needsCorrection: boolean;
  correctionApplied: boolean;
  encodingType: 'utf8' | 'corrected' | 'unknown';
}

export interface UseFileEncodingReturn {
  // Fonctions de traitement
  processFileName: (filename: string) => FileEncodingInfo;
  processFile: (file: any) => FileEncodingInfo;
  
  // Fonctions de téléchargement
  downloadFile: (url: string, filename: string, token: string) => Promise<void>;
  downloadFileFromAPI: (fileId: string, filename: string, token: string) => Promise<void>;
  
  // États
  isDownloading: boolean;
  downloadError: string | null;
  
  // Utilitaires
  getEncodingBadgeProps: (encodingInfo: FileEncodingInfo) => {
    type: 'corrected' | 'special-chars' | 'warning' | null;
    text: string;
    tooltip: string;
  } | null;
}

export function useFileEncoding(): UseFileEncodingReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Traitement d'un nom de fichier simple
  const processFileName = useCallback((filename: string): FileEncodingInfo => {
    const displayName = fixFileNameEncoding(filename);
    const hasIssues = hasEncodingIssues(filename);
    const correctionApplied = displayName !== filename;
    
    return {
      originalName: filename,
      displayName,
      hasSpecialChars: /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(displayName),
      needsCorrection: hasIssues,
      correctionApplied,
      encodingType: correctionApplied ? 'corrected' : 'utf8'
    };
  }, []);

  // Traitement d'un objet fichier complet (avec métadonnées backend)
  const processFile = useCallback((file: any): FileEncodingInfo => {
    const backendEncoding = getEncodingInfo(file);
    const displayName = getDisplayFileName(file);
    
    return {
      originalName: file.originalName,
      displayName,
      hasSpecialChars: backendEncoding.hasSpecialChars,
      needsCorrection: backendEncoding.needsCorrection,
      correctionApplied: backendEncoding.correctionApplied,
      encodingType: file.encoding?.originalEncoding || 'utf8'
    };
  }, []);

  // Téléchargement d'un fichier avec gestion d'encodage
  const downloadFile = useCallback(async (
    url: string, 
    filename: string, 
    token: string
  ): Promise<void> => {
    try {
      setIsDownloading(true);
      setDownloadError(null);
      
      await downloadFileWithEncoding(url, filename, token);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du téléchargement';
      setDownloadError(errorMessage);
      throw error;
    } finally {
      setIsDownloading(false);
    }
  }, []);

  // Téléchargement spécifique pour l'API d'import
  const downloadFileFromAPI = useCallback(async (
    fileId: string, 
    filename: string, 
    token: string
  ): Promise<void> => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/import/${fileId}/download`;
    return downloadFile(url, filename, token);
  }, [downloadFile]);

  // Génération des propriétés pour le badge d'encodage
  const getEncodingBadgeProps = useCallback((
    encodingInfo: FileEncodingInfo
  ): {
    type: 'corrected' | 'special-chars' | 'warning' | null;
    text: string;
    tooltip: string;
  } | null => {
    if (encodingInfo.correctionApplied) {
      return {
        type: 'corrected',
        text: 'Encodage corrigé',
        tooltip: 'Le nom de fichier a été automatiquement corrigé pour l\'affichage'
      };
    }
    
    if (encodingInfo.needsCorrection) {
      return {
        type: 'warning',
        text: 'Encodage détecté',
        tooltip: 'Le nom de fichier peut avoir des problèmes d\'encodage'
      };
    }
    
    if (encodingInfo.hasSpecialChars) {
      return {
        type: 'special-chars',
        text: 'Caractères spéciaux',
        tooltip: 'Ce fichier contient des caractères spéciaux (accents, etc.)'
      };
    }
    
    return null;
  }, []);

  // Réinitialisation des erreurs
  const clearDownloadError = useCallback(() => {
    setDownloadError(null);
  }, []);

  return {
    processFileName,
    processFile,
    downloadFile,
    downloadFileFromAPI,
    isDownloading,
    downloadError,
    getEncodingBadgeProps,
    clearDownloadError
  } as UseFileEncodingReturn & { clearDownloadError: () => void };
}

// Hook pour un fichier spécifique
export function useFileEncodingForFile(file: any) {
  const { processFile, getEncodingBadgeProps } = useFileEncoding();
  
  const encodingInfo = useMemo(() => {
    if (!file) return null;
    return processFile(file);
  }, [file, processFile]);
  
  const badgeProps = useMemo(() => {
    if (!encodingInfo) return null;
    return getEncodingBadgeProps(encodingInfo);
  }, [encodingInfo, getEncodingBadgeProps]);
  
  return {
    encodingInfo,
    badgeProps,
    displayName: encodingInfo?.displayName || file?.originalName || '',
    hasEncodingIssues: encodingInfo?.needsCorrection || false,
    isEncodingCorrected: encodingInfo?.correctionApplied || false
  };
}

// Hook pour la gestion des téléchargements multiples
export function useMultipleFileDownloads() {
  const [downloads, setDownloads] = useState<Map<string, {
    isDownloading: boolean;
    error: string | null;
  }>>(new Map());
  
  const { downloadFile } = useFileEncoding();
  
  const downloadFileById = useCallback(async (
    fileId: string,
    url: string,
    filename: string,
    token: string
  ) => {
    // Mettre à jour l'état pour ce fichier spécifique
    setDownloads(prev => new Map(prev.set(fileId, {
      isDownloading: true,
      error: null
    })));
    
    try {
      await downloadFile(url, filename, token);
      
      // Succès - retirer de la liste des téléchargements
      setDownloads(prev => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de téléchargement';
      
      // Erreur - mettre à jour l'état
      setDownloads(prev => new Map(prev.set(fileId, {
        isDownloading: false,
        error: errorMessage
      })));
      
      throw error;
    }
  }, [downloadFile]);
  
  const getDownloadState = useCallback((fileId: string) => {
    return downloads.get(fileId) || { isDownloading: false, error: null };
  }, [downloads]);
  
  const clearDownloadError = useCallback((fileId: string) => {
    setDownloads(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(fileId);
      if (current) {
        newMap.set(fileId, { ...current, error: null });
      }
      return newMap;
    });
  }, []);
  
  return {
    downloadFileById,
    getDownloadState,
    clearDownloadError,
    hasActiveDownloads: Array.from(downloads.values()).some(state => state.isDownloading)
  };
}