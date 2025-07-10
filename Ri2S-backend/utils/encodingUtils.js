/**
 * Utilitaires pour gérer l'encodage des caractères spéciaux côté backend
 */

/**
 * Détecte et corrige l'encodage d'un nom de fichier
 */
function fixFileNameEncoding(filename) {
  if (!filename) return filename;
  
  try {
    // Cas 1: Fichier déjà en UTF-8 correct
    if (isValidUTF8(filename)) {
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
    const corrections = {
      'Ã©': 'é', 'Ã¨': 'è', 'Ã ': 'à', 'Ã¢': 'â',
      'Ã´': 'ô', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã®': 'î',
      'Ã¯': 'ï', 'Ã§': 'ç', 'Ã«': 'ë', 'Ã¿': 'ÿ',
      'â‚¬': '€', 'â€™': "'", 'â€œ': '"', 'â€': '"',
      'â€"': '–', 'â€"': '—', 'â€¦': '…',
      'Â°': '°', 'Â»': '»', 'Â«': '«', 'Âº': 'º', 'Âª': 'ª'
    };
    
    let corrected = filename;
    Object.entries(corrections).forEach(([wrong, right]) => {
      corrected = corrected.replace(new RegExp(wrong, 'g'), right);
    });
    
    if (corrected !== filename) {
      return corrected;
    }
    
    return filename; // Retourner l'original si rien ne fonctionne
    
  } catch (error) {
    console.error('Erreur lors de la correction d\'encodage:', error);
    return filename;
  }
}

/**
 * Vérifie si une chaîne est en UTF-8 valide
 */
function isValidUTF8(str) {
  try {
    return Buffer.from(str, 'utf8').toString('utf8') === str;
  } catch (e) {
    return false;
  }
}

/**
 * Prépare un nom de fichier pour le téléchargement
 */
function prepareDownloadFileName(filename) {
  try {
    // Encoder correctement pour les headers HTTP
    const corrected = fixFileNameEncoding(filename);
    
    // Encoder pour RFC 5987 (UTF-8)
    const encoded = encodeURIComponent(corrected)
      .replace(/['()]/g, escape)
      .replace(/\*/g, '%2A');
    
    return {
      simple: corrected,
      encoded: encoded,
      rfc5987: `UTF-8''${encoded}`
    };
  } catch (error) {
    console.error('Erreur préparation nom téléchargement:', error);
    return {
      simple: filename,
      encoded: encodeURIComponent(filename),
      rfc5987: `UTF-8''${encodeURIComponent(filename)}`
    };
  }
}

module.exports = {
  fixFileNameEncoding,
  prepareDownloadFileName
};