// utils/encodingUtils.ts
/**
 * Utilitaires pour gérer l'encodage des caractères spéciaux côté frontend
 */

/**
 * Détecte et corrige l'encodage d'un nom de fichier côté frontend
 */
export function fixFileNameEncoding(filename: string): string {
    if (!filename) return filename;
    
    try {
      // Cas 1: Fichier déjà en UTF-8 correct
      if (isValidUTF8Display(filename)) {
        return filename;
      }
      
      // Cas 2: Décodage URL si nécessaire
      let decoded = filename;
      try {
        decoded = decodeURIComponent(filename);
      } catch (e) {
        // Ignore si le décodage URL échoue
      }
      
      // Cas 3: Corrections manuelles des caractères mal encodés
      const corrections: Record<string, string> = {
        'Ã©': 'é', 'Ã¨': 'è', 'Ã ': 'à', 'Ã¢': 'â',
        'Ã´': 'ô', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã®': 'î',
        'Ã¯': 'ï', 'Ã§': 'ç', 'Ã«': 'ë', 'Ã¿': 'ÿ',
        'â‚¬': '€', 'â€™': "'", 'â€œ': '"', 'â€': '"',
        'â€"': '–', 'â€"': '—', 'â€¦': '…',
        'Â°': '°', 'Â»': '»', 'Â«': '«', 'Âº': 'º', 'Âª': 'ª'
      };
      
      let corrected = decoded;
      Object.entries(corrections).forEach(([wrong, right]) => {
        corrected = corrected.replace(new RegExp(wrong, 'g'), right);
      });
      
      if (corrected !== filename) {
        return corrected;
      }
      
      return filename; // Retourner l'original si rien ne fonctionne
      
    } catch (error) {
      console.error('Erreur lors de la correction d\'encodage frontend:', error);
      return filename;
    }
  }
  
  /**
   * Vérifie si une chaîne semble avoir des problèmes d'encodage
   */
  export function hasEncodingIssues(str: string): boolean {
    if (!str) return false;
    
    // Détecter les patterns de caractères mal encodés
    const badPatterns = [
      /Ã[©¨ ¢´¹»®¯§«¿]/g, // Caractères français mal encodés
      /â[‚¬€™œ]/g, // Caractères spéciaux mal encodés
      /Â[°»«ºª]/g // Autres caractères mal encodés
    ];
    
    return badPatterns.some(pattern => pattern.test(str));
  }
  
  /**
   * Vérifie si une chaîne est affichable correctement en UTF-8
   */
  function isValidUTF8Display(str: string): boolean {
    try {
      // Vérifier s'il n'y a pas de caractères suspects
      return !hasEncodingIssues(str);
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Obtient le nom d'affichage correct d'un fichier importé
   * Compatible avec le système backend
   */
  export function getDisplayFileName(file: any): string {
    // Si le backend a déjà corrigé le nom
    if (file.encoding?.correctedName) {
      return file.encoding.correctedName;
    }
    
    // Sinon, appliquer la correction côté frontend
    return fixFileNameEncoding(file.originalName);
  }
  
  /**
   * Obtient les informations d'encodage d'un fichier
   */
  export function getEncodingInfo(file: any): {
    hasSpecialChars: boolean;
    needsCorrection: boolean;
    correctionApplied: boolean;
    displayName: string;
  } {
    const displayName = getDisplayFileName(file);
    
    return {
      hasSpecialChars: file.encoding?.hasSpecialChars || /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(displayName),
      needsCorrection: file.encoding?.needsCorrection || hasEncodingIssues(file.originalName),
      correctionApplied: file.encoding?.originalEncoding === 'corrected',
      displayName
    };
  }
  
  /**
   * Prépare les headers pour téléchargement avec support UTF-8
   */
  export function prepareDownloadHeaders(filename: string): HeadersInit {
    const correctedName = fixFileNameEncoding(filename);
    
    // Encoder pour RFC 5987 (UTF-8)
    const encoded = encodeURIComponent(correctedName)
      .replace(/['()]/g, escape)
      .replace(/\*/g, '%2A');
    
    return {
      'Content-Disposition': `attachment; filename="${correctedName}"; filename*=UTF-8''${encoded}`
    };
  }
  
  /**
   * Améliore la fonction de téléchargement avec gestion UTF-8
   */
  export function downloadFileWithEncoding(
    url: string, 
    filename: string, 
    token: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.responseType = 'blob';
      
      xhr.onload = function() {
        if (this.status === 200) {
          const blob = new Blob([xhr.response]);
          const objectUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objectUrl;
          
          // Utiliser le nom corrigé pour le téléchargement
          a.download = fixFileNameEncoding(filename);
          
          // Forcer l'encodage UTF-8 pour le nom de fichier
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(objectUrl);
          resolve();
        } else {
          reject(new Error(`Erreur de téléchargement: ${this.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Erreur réseau lors du téléchargement'));
      };
      
      xhr.send();
    });
  }