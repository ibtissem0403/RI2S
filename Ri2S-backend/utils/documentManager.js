const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Dossier de base pour les documents
const BASE_DOCUMENT_DIR = path.join(__dirname, '../uploads/documents');

// Assurer que le dossier existe
if (!fs.existsSync(BASE_DOCUMENT_DIR)) {
  fs.mkdirSync(BASE_DOCUMENT_DIR, { recursive: true });
}

// Fonction pour créer un dossier spécifique à une expérimentation
const createExperimentationFolder = (experimentationId) => {
  const folderPath = path.join(BASE_DOCUMENT_DIR, experimentationId.toString());
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  return folderPath;
};

// Fonction pour créer un dossier spécifique à un bénéficiaire
const createBeneficiaryFolder = (experimentationId, beneficiaryId) => {
  const folderPath = path.join(
    BASE_DOCUMENT_DIR, 
    experimentationId.toString(),
    beneficiaryId.toString()
  );
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  return folderPath;
};

// Sauvegarder un document pour une action spécifique
const saveDocumentForAction = (file, experimentationId, beneficiaryId, actionId) => {
  return new Promise((resolve, reject) => {
    try {
      // Créer les dossiers nécessaires
      const beneficiaryFolder = createBeneficiaryFolder(experimentationId, beneficiaryId);
      
      // Générer un nom de fichier unique
      const uniqueFileName = `${actionId}_${uuidv4()}${path.extname(file.originalname)}`;
      const filePath = path.join(beneficiaryFolder, uniqueFileName);
      
      // Écrire le fichier
      fs.writeFileSync(filePath, file.buffer);
      
      // Retourner les informations sur le document
      resolve({
        nom: file.originalname,
        chemin: filePath.replace(BASE_DOCUMENT_DIR, ''),
        type: file.mimetype,
        taille: file.size
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Récupérer un document
const getDocument = (relativePath) => {
  const fullPath = path.join(BASE_DOCUMENT_DIR, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error('Document non trouvé');
  }
  return fullPath;
};

// Supprimer un document
const deleteDocument = (relativePath) => {
  const fullPath = path.join(BASE_DOCUMENT_DIR, relativePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
};

module.exports = {
  saveDocumentForAction,
  getDocument,
  deleteDocument
};