/**
 * Génère un pseudoId et pseudoName côté frontend (prévisualisation)
 * Note: Le vrai pseudo sera généré côté serveur lors de la sauvegarde
 */
export function generatePreviewPseudonym(
    experimentationName: string,
    fullName: string,
    firstName: string
  ): { pseudoId: string; pseudoName: string } {
    const date = new Date();
    const year = date.getFullYear();
    
    // Abréviations (doivent correspondre au backend)
    const expAbbreviations: Record<string, string> = {
      Telegrafik: 'TELG',
      Presage: 'PRES'
    };
  
    // Compteur basé sur l'heure (approximation frontend)
    const increment = String(Math.floor(Date.now() % 1000)).padStart(3, '0');
    
    const abbr = expAbbreviations[experimentationName] || 
                 experimentationName.slice(0, 4).toUpperCase();
  
    // Construction des pseudos
    const pseudoId = `${abbr}-${year}-${increment}`;
    const initials = `${fullName.charAt(0).toUpperCase()}${firstName.charAt(0).toUpperCase()}`;
    const pseudoName = `${initials}-${increment}`;
  
    return { pseudoId, pseudoName };
  }