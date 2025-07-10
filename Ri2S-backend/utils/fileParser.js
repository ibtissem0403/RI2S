const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { fixFileNameEncoding } = require('./encodingUtils');

/**
 * Parse un fichier CSV avec support UTF-8
 * @param {string} filePath - Chemin du fichier
 */
exports.parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    // Détecter l'encodage et lire le fichier
    const encoding = detectFileEncoding(filePath);
    console.log(`[CSV Parser] Encodage détecté: ${encoding}`);
    
    fs.createReadStream(filePath, { encoding })
      .pipe(csv({
        separator: detectCSVSeparator(filePath),
        skipLines: 0,
        headers: true,
        mapValues: ({ value }) => {
          // Corriger l'encodage des valeurs si nécessaire
          if (typeof value === 'string') {
            return fixStringEncoding(value);
          }
          return value;
        }
      }))
      .on('data', (data) => {
        // Corriger l'encodage des clés (headers) si nécessaire
        const correctedData = {};
        Object.keys(data).forEach(key => {
          const correctedKey = fixStringEncoding(key);
          correctedData[correctedKey] = data[key];
        });
        results.push(correctedData);
      })
      .on('end', () => {
        resolve({
          data: results,
          headers: results.length > 0 ? Object.keys(results[0]) : [],
          rowCount: results.length,
          encoding: encoding
        });
      })
      .on('error', (error) => {
        // En cas d'erreur d'encodage, essayer avec latin1
        if (encoding !== 'latin1') {
          console.log('[CSV Parser] Retry avec latin1...');
          exports.parseCSV(filePath, 'latin1').then(resolve).catch(reject);
        } else {
          reject(error);
        }
      });
  });
};

/**
 * Parse un fichier Excel (XLSX/XLS) avec support UTF-8
 * @param {string} filePath - Chemin du fichier
 */
exports.parseExcel = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const workbook = XLSX.readFile(filePath, {
        cellDates: true,
        cellNF: false,
        cellText: false,
        codepage: 65001 // UTF-8 pour Excel
      });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir en JSON
      const results = XLSX.utils.sheet_to_json(worksheet, { 
        header: 'A', 
        defval: '',
        raw: false,
        dateNF: 'DD/MM/YYYY'
      });
      
      // Extraire les en-têtes (première ligne) et corriger l'encodage
      const rawHeaders = results.length > 0 ? Object.keys(results[0]).map(key => results[0][key]) : [];
      const headers = rawHeaders.map(header => fixStringEncoding(String(header)));
      
      // Supprimer la ligne d'en-tête et corriger l'encodage des données
      const data = results.slice(1).map(row => {
        const formattedRow = {};
        Object.keys(row).forEach((key, index) => {
          const headerName = headers[index] || key;
          const cellValue = row[key];
          // Corriger l'encodage si c'est une chaîne
          formattedRow[headerName] = typeof cellValue === 'string' ? 
            fixStringEncoding(cellValue) : cellValue;
        });
        return formattedRow;
      });
      
      resolve({
        data,
        headers,
        rowCount: data.length,
        encoding: 'utf8', // Excel gère nativement l'UTF-8
        sheetName: sheetName
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Traite un fichier JSON avec support UTF-8
 * @param {string} filePath - Chemin du fichier
 */
exports.parseJSON = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      // Détecter l'encodage du fichier
      const encoding = detectFileEncoding(filePath);
      console.log(`[JSON Parser] Encodage détecté: ${encoding}`);
      
      const fileContent = fs.readFileSync(filePath, { encoding });
      const correctedContent = fixStringEncoding(fileContent);
      
      const jsonData = JSON.parse(correctedContent);
      
      // Fonction récursive pour corriger l'encodage dans les objets JSON
      const fixJSONEncoding = (obj) => {
        if (typeof obj === 'string') {
          return fixStringEncoding(obj);
        } else if (Array.isArray(obj)) {
          return obj.map(fixJSONEncoding);
        } else if (obj && typeof obj === 'object') {
          const corrected = {};
          Object.keys(obj).forEach(key => {
            const correctedKey = fixStringEncoding(key);
            corrected[correctedKey] = fixJSONEncoding(obj[key]);
          });
          return corrected;
        }
        return obj;
      };
      
      const correctedData = fixJSONEncoding(jsonData);
      
      // Si le JSON est un tableau d'objets
      if (Array.isArray(correctedData)) {
        const headers = correctedData.length > 0 ? Object.keys(correctedData[0]) : [];
        
        resolve({
          data: correctedData,
          headers,
          rowCount: correctedData.length,
          encoding: encoding
        });
      } 
      // Si le JSON est un objet avec un tableau de données
      else if (correctedData.data && Array.isArray(correctedData.data)) {
        const headers = correctedData.data.length > 0 ? Object.keys(correctedData.data[0]) : [];
        
        resolve({
          data: correctedData.data,
          headers,
          rowCount: correctedData.data.length,
          encoding: encoding
        });
      } 
      // Si le JSON est un simple objet
      else {
        resolve({
          data: [correctedData], // Convertir en tableau pour cohérence
          headers: Object.keys(correctedData),
          rowCount: 1,
          encoding: encoding
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Traite un fichier XML avec support UTF-8
 * @param {string} filePath - Chemin du fichier
 */
exports.parseXML = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const xml2js = require('xml2js');
      const parser = new xml2js.Parser({ explicitArray: false });
      
      // Détecter l'encodage du fichier
      const encoding = detectFileEncoding(filePath);
      console.log(`[XML Parser] Encodage détecté: ${encoding}`);
      
      const fileContent = fs.readFileSync(filePath, { encoding });
      const correctedContent = fixStringEncoding(fileContent);
      
      parser.parseString(correctedContent, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Fonction récursive pour corriger l'encodage dans les objets XML
        const fixXMLEncoding = (obj) => {
          if (typeof obj === 'string') {
            return fixStringEncoding(obj);
          } else if (Array.isArray(obj)) {
            return obj.map(fixXMLEncoding);
          } else if (obj && typeof obj === 'object') {
            const corrected = {};
            Object.keys(obj).forEach(key => {
              const correctedKey = fixStringEncoding(key);
              corrected[correctedKey] = fixXMLEncoding(obj[key]);
            });
            return corrected;
          }
          return obj;
        };
        
        const correctedResult = fixXMLEncoding(result);
        
        // Essayons de trouver la structure principale des données
        let dataArray = [];
        let rootElement = '';
        
        // Recherche d'un tableau de données dans la structure XML
        for (const key in correctedResult) {
          const element = correctedResult[key];
          if (element && typeof element === 'object') {
            for (const subKey in element) {
              if (Array.isArray(element[subKey])) {
                dataArray = element[subKey];
                rootElement = subKey;
                break;
              }
            }
            if (dataArray.length > 0) break;
          }
        }
        
        // Si aucun tableau n'est trouvé, essayons de traiter les données comme un seul élément
        if (dataArray.length === 0) {
          for (const key in correctedResult) {
            if (typeof correctedResult[key] === 'object' && !Array.isArray(correctedResult[key])) {
              dataArray = [correctedResult[key]];
              rootElement = key;
              break;
            }
          }
        }
        
        const headers = dataArray.length > 0 ? Object.keys(dataArray[0]) : [];
        
        resolve({
          data: dataArray,
          headers,
          rowCount: dataArray.length,
          rootElement,
          encoding: encoding
        });
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Traiter un fichier texte avec support UTF-8
 * @param {string} filePath - Chemin du fichier
 */
exports.parseText = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      // Détecter l'encodage du fichier
      const encoding = detectFileEncoding(filePath);
      console.log(`[Text Parser] Encodage détecté: ${encoding}`);
      
      const fileContent = fs.readFileSync(filePath, { encoding });
      
      // Corriger l'encodage du contenu si nécessaire
      const correctedContent = fixStringEncoding(fileContent);
      const lines = correctedContent.split('\n').filter(line => line.trim() !== '');
      
      // Essayer de détecter le format (si c'est un CSV non reconnu ou un autre format délimité)
      const possibleDelimiters = ['\t', '|', ';', ','];
      let bestDelimiter = '';
      let maxCount = 0;
      
      // Prendre les 10 premières lignes pour la détection
      const sampleLines = lines.slice(0, Math.min(10, lines.length));
      
      for (const delimiter of possibleDelimiters) {
        const counts = sampleLines.map(line => (line.match(new RegExp(delimiter, 'g')) || []).length);
        const avgCount = counts.reduce((sum, count) => sum + count, 0) / counts.length;
        
        if (avgCount > maxCount) {
          maxCount = avgCount;
          bestDelimiter = delimiter;
        }
      }
      
      // Si on a trouvé un délimiteur potentiel
      if (maxCount > 0) {
        const data = [];
        const headerLine = lines[0];
        const headers = headerLine.split(bestDelimiter).map(h => fixStringEncoding(h.trim()));
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(bestDelimiter);
          if (values.length === headers.length) {
            const rowData = {};
            headers.forEach((header, index) => {
              rowData[header] = fixStringEncoding(values[index].trim());
            });
            data.push(rowData);
          }
        }
        
        resolve({
          data,
          headers,
          rowCount: data.length,
          detectedFormat: 'delimited',
          delimiter: bestDelimiter,
          encoding: encoding
        });
      } else {
        // Si aucun format structuré n'est détecté, retourner le contenu brut
        resolve({
          data: [{ content: correctedContent }],
          headers: ['content'],
          rowCount: 1,
          detectedFormat: 'raw text',
          encoding: encoding
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Détecte l'encodage d'un fichier
 * @param {string} filePath - Chemin du fichier
 * @returns {string} - Encodage détecté
 */
function detectFileEncoding(filePath) {
  try {
    // Lire les premiers 1000 octets du fichier
    const buffer = fs.readFileSync(filePath, { flag: 'r' });
    const sample = buffer.slice(0, Math.min(1000, buffer.length));
    
    // Vérifier la présence de BOM UTF-8
    if (sample.length >= 3 && sample[0] === 0xEF && sample[1] === 0xBB && sample[2] === 0xBF) {
      return 'utf8';
    }
    
    // Vérifier la présence de BOM UTF-16
    if (sample.length >= 2 && ((sample[0] === 0xFF && sample[1] === 0xFE) || (sample[0] === 0xFE && sample[1] === 0xFF))) {
      return 'utf16le';
    }
    
    // Essayer de décoder en UTF-8
    try {
      const utf8String = sample.toString('utf8');
      // Vérifier s'il y a des caractères de remplacement (indique un mauvais encodage)
      if (utf8String.includes('\uFFFD')) {
        throw new Error('Invalid UTF-8');
      }
      return 'utf8';
    } catch (e) {
      // Si UTF-8 échoue, essayer latin1 (Windows-1252/ISO-8859-1)
      return 'latin1';
    }
  } catch (error) {
    console.error('Erreur lors de la détection d\'encodage:', error);
    return 'utf8'; // Par défaut
  }
}

/**
 * Corrige l'encodage d'une chaîne de caractères
 * @param {string} str - Chaîne à corriger
 * @returns {string} - Chaîne corrigée
 */
function fixStringEncoding(str) {
  if (!str || typeof str !== 'string') return str;
  
  try {
    // Corrections manuelles des caractères mal encodés courants
    const corrections = {
      'Ã©': 'é', 'Ã¨': 'è', 'Ã ': 'à', 'Ã¢': 'â',
      'Ã´': 'ô', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã®': 'î',
      'Ã¯': 'ï', 'Ã§': 'ç', 'Ã«': 'ë', 'Ã¿': 'ÿ',
      'Ã¶': 'ö', 'Ã¼': 'ü', 'Ã±': 'ñ', 'Ã¡': 'á',
      'Ã³': 'ó', 'Ãº': 'ú', 'Ã­': 'í', 'Ã½': 'ý',
      
      // Majuscules
      'Ã‰': 'É', 'Ãˆ': 'È', 'Ã€': 'À', 'Ã‚': 'Â',
      'Ã"': 'Ô', 'Ã™': 'Ù', 'Ã›': 'Û', 'ÃŽ': 'Î',
      'Ã': 'Ï', 'Ã‡': 'Ç', 'Ã‹': 'Ë', 
      
      // Caractères spéciaux
      'â‚¬': '€', 'â€™': "'", 'â€œ': '"', 'â€': '"',
      'â€"': '–', 'â€"': '—', 'â€¦': '…',
      'Â°': '°', 'Â»': '»', 'Â«': '«', 'Âº': 'º', 'Âª': 'ª'
    };
    
    let corrected = str;
    Object.entries(corrections).forEach(([wrong, right]) => {
      corrected = corrected.replace(new RegExp(wrong, 'g'), right);
    });
    
    return corrected;
  } catch (error) {
    console.error('Erreur lors de la correction d\'encodage:', error);
    return str;
  }
}

/**
 * Détecte le séparateur d'un fichier CSV avec support UTF-8
 * @param {string} filePath - Chemin du fichier
 * @returns {string} - Séparateur détecté (virgule, point-virgule, etc.)
 */
function detectCSVSeparator(filePath) {
  try {
    // Détecter l'encodage du fichier
    const encoding = detectFileEncoding(filePath);
    
    // Lire les 1000 premiers caractères du fichier avec le bon encodage
    const sample = fs.readFileSync(filePath, { encoding, flag: 'r' }).substring(0, 1000);
    
    // Compter les occurrences des séparateurs courants
    const separators = [';', ',', '\t', '|']; // Point-virgule en premier pour les fichiers français
    const counts = {};
    
    separators.forEach(sep => {
      counts[sep] = (sample.match(new RegExp(sep, 'g')) || []).length;
    });
    
    // Trouver le séparateur le plus fréquent
    let maxCount = 0;
    let detectedSep = ';'; // Par défaut pour les fichiers français
    
    separators.forEach(sep => {
      if (counts[sep] > maxCount) {
        maxCount = counts[sep];
        detectedSep = sep;
      }
    });
    
    console.log(`[CSV Separator] Séparateur détecté: "${detectedSep}" (${maxCount} occurrences)`);
    return detectedSep;
  } catch (error) {
    console.error('Erreur lors de la détection du séparateur:', error);
    return ';'; // Séparateur par défaut pour les fichiers français
  }
}

/**
 * Valide les données importées selon le type d'expérimentation
 * @param {Array} data - Données à valider
 * @param {string} experimentation - Type d'expérimentation (Presage ou Telegrafik)
 * @returns {Object} - Résultat de la validation
 */
exports.validateData = (data, experimentation) => {
  const errors = [];
  let isValid = true;
  
  // Définition des champs requis par type d'expérimentation
  const requiredFields = {
    Presage: ['id_patient', 'nom', 'prenom', 'date_naissance', 'sexe', 'adresse', 'telephone'],
    Telegrafik: ['code_patient', 'nom', 'prenom', 'date_inclusion', 'groupe']
  };
  
  // Si aucune donnée n'est disponible
  if (!data || data.length === 0) {
    errors.push({
      line: 0,
      column: 'data',
      message: 'Aucune donnée trouvée dans le fichier'
    });
    return { isValid: false, errors, summary: { totalRows: 0, errorCount: 1, isValid: false } };
  }
  
  // Vérifier que tous les champs requis sont présents
  const headers = Object.keys(data[0]);
  const missingFields = requiredFields[experimentation].filter(field => !headers.includes(field));
  
  if (missingFields.length > 0) {
    errors.push({
      line: 0,
      column: 'headers',
      message: `Champs requis manquants: ${missingFields.join(', ')}`
    });
    isValid = false;
  }
  
  // Vérifier chaque ligne de données
  data.forEach((row, index) => {
    requiredFields[experimentation].forEach(field => {
      if (headers.includes(field) && (!row[field] || row[field].toString().trim() === '')) {
        errors.push({
          line: index + 1,
          column: field,
          message: `Valeur manquante pour le champ "${field}"`
        });
        isValid = false;
      }
    });
    
    // Vérifications spécifiques par type d'expérimentation
    if (experimentation === 'Presage') {
      // Vérifier le format de la date de naissance
      if (row['date_naissance']) {
        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(row['date_naissance'])) {
          errors.push({
            line: index + 1,
            column: 'date_naissance',
            message: 'Format de date invalide (format attendu: JJ/MM/AAAA)'
          });
          isValid = false;
        }
      }
      
      // Vérifier le sexe
      if (row['sexe'] && !['M', 'F', 'Other'].includes(row['sexe'])) {
        errors.push({
          line: index + 1,
          column: 'sexe',
          message: 'Valeur invalide pour le sexe (valeurs acceptées: M, F, Other)'
        });
        isValid = false;
      }
    }
    
    if (experimentation === 'Telegrafik') {
      // Vérifier le format de la date d'inclusion
      if (row['date_inclusion']) {
        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(row['date_inclusion'])) {
          errors.push({
            line: index + 1,
            column: 'date_inclusion',
            message: 'Format de date invalide (format attendu: JJ/MM/AAAA)'
          });
          isValid = false;
        }
      }
      
      // Vérifier le groupe
      if (row['groupe'] && !['Intervention', 'Contrôle'].includes(row['groupe'])) {
        errors.push({
          line: index + 1,
          column: 'groupe',
          message: 'Valeur invalide pour le groupe (valeurs acceptées: Intervention, Contrôle)'
        });
        isValid = false;
      }
    }
  });
  
  // Générer un résumé des données
  const summary = {
    totalRows: data.length,
    errorCount: errors.length,
    isValid
  };
  
  return {
    isValid,
    errors,
    summary
  };
};

/**
 * Analyse un fichier en fonction de son extension
 * @param {string} filePath - Chemin du fichier
 * @param {string} fileType - Type de fichier
 */
exports.parseFile = async (filePath, fileType) => {
  // Normaliser le type de fichier en minuscules
  const fileTypeNormalized = fileType.toLowerCase();
  
  try {
    if (fileTypeNormalized === 'csv') {
      return await exports.parseCSV(filePath);
    } else if (['xlsx', 'xls'].includes(fileTypeNormalized)) {
      return await exports.parseExcel(filePath);
    } else if (fileTypeNormalized === 'json') {
      return await exports.parseJSON(filePath);
    } else if (['xml', 'rdf', 'rss'].includes(fileTypeNormalized)) {
      return await exports.parseXML(filePath);
    } else {
      // Pour tout autre type de fichier, essayons de le traiter comme du texte
      return await exports.parseText(filePath);
    }
  } catch (error) {
    console.error(`Erreur lors de l'analyse du fichier ${filePath}:`, error);
    throw new Error(`Type de fichier '${fileType}' non pris en charge ou erreur lors de l'analyse: ${error.message}`);
  }
};

/**
 * Détermine si un fichier peut contenir des données structurées
 * @param {string} fileType - Type de fichier
 * @returns {boolean} - True si le fichier peut contenir des données structurées
 */
exports.canContainStructuredData = (fileType) => {
  if (!fileType) return false;
  
  const structuredFormats = ['csv', 'xlsx', 'xls', 'json', 'xml', 'txt', 'rdf', 'rss'];
  return structuredFormats.includes(fileType.toLowerCase());
};