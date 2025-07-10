const path = require('path');
const fs = require('fs');
const ImportedData = require('../models/ImportedData');
const Experimentation = require('../models/Experimentation');
const RealBeneficiary = require('../models/RealBeneficiary');
const PseudonymizedBeneficiary = require('../models/PseudonymizedBeneficiary');
const Cohort = require('../models/Cohort');
const { parseFile, validateData } = require('../utils/fileParser');
const generatePseudonym = require('../utils/pseudoGenerator');
const generateDossierNumber = require('../utils/dossierGenerator');
// AJOUT : Import des utilitaires d'encodage
const { fixFileNameEncoding, prepareDownloadFileName } = require('../utils/encodingUtils');

/**
 * Importe un fichier de données pour une expérimentation
 */
exports.importFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été téléchargé' });
    }

    const { experimentation, autoValidate } = req.body;
    
    if (!experimentation) {
      return res.status(400).json({ message: 'L\'expérimentation est requise' });
    }

    // Vérifier que l'expérimentation existe
    const experimentationExists = await Experimentation.findOne({ name: experimentation });
    if (!experimentationExists) {
      return res.status(404).json({ message: 'Expérimentation non trouvée' });
    }

    // MODIFICATION : Corriger l'encodage du nom de fichier original
    const correctedOriginalName = req.file.originalNameUTF8 || fixFileNameEncoding(req.file.originalname);

    // Obtenir l'extension du fichier
    const fileExtension = path.extname(correctedOriginalName).toLowerCase().substring(1);
    
    // Déterminer le statut initial du fichier
    let initialStatus = 'En attente';
    let validatedBy = null;
    let validationDate = null;
    let validationNotes = null;
    
    // Auto-validation si l'utilisateur est admin et a demandé l'auto-validation
    if (req.user.role === 'admin' && autoValidate === 'true') {
      initialStatus = 'Validé';
      validatedBy = req.user._id;
      validationDate = new Date();
      validationNotes = 'Validation automatique par l\'administrateur';
    }
    
    // Créer une entrée dans la base de données pour le fichier importé
    const importedData = await ImportedData.create({
      fileName: req.file.filename,
      originalName: correctedOriginalName, // MODIFICATION : Utiliser le nom corrigé
      experimentation,
      filePath: req.file.path,
      fileType: fileExtension,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
      status: initialStatus,
      validatedBy,
      validationDate,
      validationNotes,
      // AJOUT : Métadonnées pour l'encodage
      encoding: {
        originalEncoding: req.file.originalname !== correctedOriginalName ? 'corrected' : 'utf8',
        correctedName: correctedOriginalName,
        hasSpecialChars: req.file.hasSpecialChars || false
      }
    });

    // Si le fichier est auto-validé, effectuer l'analyse du fichier comme dans validateImportedFile
    if (initialStatus === 'Validé') {
      try {
        const { canContainStructuredData } = require('../utils/fileParser');
        
        if (canContainStructuredData(fileExtension)) {
          const fileData = await parseFile(req.file.path, fileExtension);
          const validation = validateData(fileData.data, experimentation);
          
          // Mettre à jour le document avec les résultats de la validation
          await ImportedData.findByIdAndUpdate(importedData._id, {
            recordCount: fileData.data.length,
            errors: validation.errors,
            summary: {
              ...validation.summary,
              fileType: fileExtension,
              isStructuredData: true,
              detectedFormat: fileData.detectedFormat || 'structured'
            }
          });
        } else {
          // Pour les fichiers non structurés (PDF, images, etc.)
          await ImportedData.findByIdAndUpdate(importedData._id, {
            recordCount: 0,
            errors: [],
            summary: {
              totalRows: 0,
              errorCount: 0,
              isValid: true,
              fileType: fileExtension,
              isStructuredData: false
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors de l\'analyse du fichier auto-validé:', error);
        // On continue quand même car le fichier est déjà créé
      }
    }

    res.status(201).json({
      message: initialStatus === 'Validé' 
        ? 'Fichier importé et validé automatiquement avec succès' 
        : 'Fichier importé avec succès, en attente de validation',
      data: importedData
    });
  } catch (error) {
    console.error('Erreur lors de l\'importation du fichier:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'importation du fichier',
      error: error.message 
    });
  }
};

/**
 * Liste tous les fichiers importés
 */
exports.listImportedFiles = async (req, res) => {
  try {
    const { status, experimentation } = req.query;
    
    // Construire le filtre
    const filter = {};
    if (status) filter.status = status;
    if (experimentation) filter.experimentation = experimentation;
    
    // Récupérer les fichiers importés
    const importedFiles = await ImportedData.find(filter)
      .populate('uploadedBy', 'fullName email')
      .populate('validatedBy', 'fullName email')
      .sort({ importDate: -1 });
    
    res.json(importedFiles);
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers importés:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des fichiers importés',
      error: error.message 
    });
  }
};

/**
 * Récupère les détails d'un fichier importé
 */
exports.getImportedFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const importedFile = await ImportedData.findById(id)
      .populate('uploadedBy', 'fullName email')
      .populate('validatedBy', 'fullName email');
    
    if (!importedFile) {
      return res.status(404).json({ message: 'Fichier importé non trouvé' });
    }
    
    res.json(importedFile);
  } catch (error) {
    console.error('Erreur lors de la récupération du fichier importé:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération du fichier importé',
      error: error.message 
    });
  }
};

/**
 * Valide ou rejette un fichier importé
 */
exports.validateImportedFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;
    
    if (!['Validé', 'Rejeté'].includes(action)) {
      return res.status(400).json({ message: 'Action invalide. Actions possibles: Validé, Rejeté' });
    }
    
    const importedFile = await ImportedData.findById(id);
    
    if (!importedFile) {
      return res.status(404).json({ message: 'Fichier importé non trouvé' });
    }
    
    if (importedFile.status !== 'En attente') {
      return res.status(400).json({ 
        message: 'Le fichier a déjà été validé ou rejeté' 
      });
    }
    
    // Analyser le fichier pour validation
    try {
      const { canContainStructuredData } = require('../utils/fileParser');
      
      // Vérifier si le type de fichier peut contenir des données structurées
      if (!canContainStructuredData(importedFile.fileType)) {
        // Si c'est un type de fichier qui ne peut pas être analysé pour des données structurées
        // (comme images, vidéos, etc.)
        await ImportedData.findByIdAndUpdate(id, {
          status: action,
          validatedBy: req.user._id,
          validationDate: new Date(),
          validationNotes: notes || "Fichier accepté sans validation structurelle",
          recordCount: 0,
          errors: [],
          summary: {
            totalRows: 0,
            errorCount: 0,
            isValid: action === 'Validé',
            fileType: importedFile.fileType,
            isStructuredData: false
          }
        });
        
        return res.json({
          message: `Fichier ${action === 'Validé' ? 'validé' : 'rejeté'} avec succès`,
          data: {
            ...importedFile.toObject(),
            status: action,
            validationNotes: notes || "Fichier accepté sans validation structurelle"
          }
        });
      }
      
      const fileData = await parseFile(importedFile.filePath, importedFile.fileType);
      const validation = validateData(fileData.data, importedFile.experimentation);
      
      // Mettre à jour le document avec les résultats de la validation
      const update = {
        status: action,
        validatedBy: req.user._id,
        validationDate: new Date(),
        validationNotes: notes,
        recordCount: fileData.data.length,
        errors: validation.errors,
        summary: {
          ...validation.summary,
          fileType: importedFile.fileType,
          isStructuredData: true,
          detectedFormat: fileData.detectedFormat || 'structured'
        }
      };
      
      const updatedFile = await ImportedData.findByIdAndUpdate(id, update, { new: true })
        .populate('uploadedBy', 'fullName email')
        .populate('validatedBy', 'fullName email');
      
      res.json({
        message: `Fichier ${action === 'Validé' ? 'validé' : 'rejeté'} avec succès`,
        data: updatedFile
      });
    } catch (error) {
      console.error('Erreur lors de l\'analyse du fichier:', error);
      res.status(500).json({ 
        message: 'Erreur lors de l\'analyse du fichier',
        error: error.message 
      });
    }
  } catch (error) {
    console.error('Erreur lors de la validation du fichier importé:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la validation du fichier importé',
      error: error.message 
    });
  }
};

/**
 * Intègre les données d'un fichier validé dans le système
 */
exports.integrateData = async (req, res) => {
  try {
    const { id } = req.params;
    
    const importedFile = await ImportedData.findById(id);
    
    if (!importedFile) {
      return res.status(404).json({ message: 'Fichier importé non trouvé' });
    }
    
    if (importedFile.status !== 'Validé') {
      return res.status(400).json({ 
        message: 'Le fichier doit être validé avant d\'être intégré' 
      });
    }
    
    // Récupérer les données du fichier
    const fileData = await parseFile(importedFile.filePath, importedFile.fileType);
    
    // Récupérer l'expérimentation et son code
    const experimentation = await Experimentation.findOne({ name: importedFile.experimentation });
    
    if (!experimentation) {
      return res.status(404).json({ message: 'Expérimentation non trouvée' });
    }
    
    // Récupérer la cohorte par défaut de l'expérimentation
    const defaultCohort = await Cohort.findOne({ experimentation: experimentation._id });
    
    if (!defaultCohort) {
      return res.status(404).json({ message: 'Aucune cohorte trouvée pour cette expérimentation' });
    }
    
    // Intégrer les données en fonction du type d'expérimentation
    const integrationResults = {
      totalProcessed: fileData.data.length,
      created: 0,
      updated: 0,
      errors: []
    };
    
    // Traiter chaque ligne du fichier
    for (const row of fileData.data) {
      try {
        if (importedFile.experimentation === 'Presage') {
          await integratePresageData(row, experimentation, defaultCohort, req.user._id, integrationResults);
        } else if (importedFile.experimentation === 'Telegrafik') {
          await integrateTelegraphikData(row, experimentation, defaultCohort, req.user._id, integrationResults);
        }
      } catch (error) {
        integrationResults.errors.push({
          data: row,
          error: error.message
        });
      }
    }
    
    // Mettre à jour le statut du fichier importé
    await ImportedData.findByIdAndUpdate(id, {
      status: 'Intégré',
      summary: {
        ...importedFile.summary,
        integration: integrationResults
      }
    });
    
    res.json({
      message: 'Données intégrées avec succès',
      results: integrationResults
    });
  } catch (error) {
    console.error('Erreur lors de l\'intégration des données:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'intégration des données',
      error: error.message 
    });
  }
};

/**
 * Intègre une ligne de données Presage
 */
async function integratePresageData(data, experimentation, cohort, userId, results) {
  // Vérifier si le bénéficiaire existe déjà (par id_patient)
  let realBeneficiary = await RealBeneficiary.findOne({ 
    'caregiver.name': data.id_patient 
  });
  
  const birthDate = parseDate(data.date_naissance);
  
  if (realBeneficiary) {
    // Mettre à jour le bénéficiaire existant
    realBeneficiary = await RealBeneficiary.findByIdAndUpdate(
      realBeneficiary._id,
      {
        fullName: data.nom,
        firstName: data.prenom,
        birthDate,
        sex: data.sexe,
        address: data.adresse,
        phone: data.telephone,
        'caregiver.name': data.id_patient,
        cohort: cohort._id,
        status: 'Actif'
      },
      { new: true }
    );
    
    results.updated++;
  } else {
    // Générer un numéro de dossier
    const dossierNumber = await generateDossierNumber(experimentation.code);
    
    // Créer un nouveau bénéficiaire
    realBeneficiary = await RealBeneficiary.create({
      fullName: data.nom,
      firstName: data.prenom,
      birthDate,
      sex: data.sexe,
      address: data.adresse,
      phone: data.telephone,
      'caregiver.name': data.id_patient,
      cohort: cohort._id,
      dossierNumber,
      recruiter: userId,
      status: 'Actif',
      inclusionDate: new Date()
    });
    
    // Générer le pseudonyme
    const { pseudoId, pseudoName } = await generatePseudonym(
      experimentation.name,
      data.nom,
      data.prenom
    );
    
    // Créer le bénéficiaire pseudonymisé
    await PseudonymizedBeneficiary.create({
      pseudoId,
      pseudoName,
      status: 'Actif',
      dossierNumber,
      inclusionDate: new Date(),
      realBeneficiary: realBeneficiary._id
    });
    
    results.created++;
  }
}

/**
 * Intègre une ligne de données Telegrafik
 */
async function integrateTelegraphikData(data, experimentation, cohort, userId, results) {
  // Vérifier si le bénéficiaire existe déjà (par code_patient)
  let realBeneficiary = await RealBeneficiary.findOne({ 
    'caregiver.name': data.code_patient 
  });
  
  const inclusionDate = parseDate(data.date_inclusion);
  
  if (realBeneficiary) {
    // Mettre à jour le bénéficiaire existant
    realBeneficiary = await RealBeneficiary.findByIdAndUpdate(
      realBeneficiary._id,
      {
        fullName: data.nom,
        firstName: data.prenom,
        'caregiver.name': data.code_patient,
        cohort: cohort._id,
        randomizationGroup: data.groupe,
        inclusionDate,
        status: 'Actif'
      },
      { new: true }
    );
    
    results.updated++;
  } else {
    // Générer un numéro de dossier
    const dossierNumber = await generateDossierNumber(experimentation.code);
    
    // Créer un nouveau bénéficiaire avec des données par défaut pour les champs obligatoires manquants
    realBeneficiary = await RealBeneficiary.create({
      fullName: data.nom,
      firstName: data.prenom,
      birthDate: new Date('1900-01-01'), // Date par défaut
      sex: 'Other', // Sexe par défaut
      address: 'À compléter', // Adresse par défaut
      phone: 'À compléter', // Téléphone par défaut
      'caregiver.name': data.code_patient,
      cohort: cohort._id,
      dossierNumber,
      recruiter: userId,
      randomizationGroup: data.groupe,
      inclusionDate,
      status: 'Actif'
    });
    
    // Générer le pseudonyme
    const { pseudoId, pseudoName } = await generatePseudonym(
      experimentation.name,
      data.nom,
      data.prenom
    );
    
    // Créer le bénéficiaire pseudonymisé
    await PseudonymizedBeneficiary.create({
      pseudoId,
      pseudoName,
      status: 'Actif',
      dossierNumber,
      inclusionDate,
      realBeneficiary: realBeneficiary._id
    });
    
    results.created++;
  }
}

/**
 * Parse une date au format JJ/MM/AAAA
 */
function parseDate(dateString) {
  if (!dateString) return new Date();
  
  const parts = dateString.split('/');
  if (parts.length !== 3) return new Date();
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Les mois commencent à 0 en JavaScript
  const year = parseInt(parts[2], 10);
  
  return new Date(year, month, day);
}

/**
 * Télécharge le fichier original importé
 */
exports.downloadOriginalFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const importedFile = await ImportedData.findById(id);
    
    if (!importedFile) {
      return res.status(404).json({ message: 'Fichier importé non trouvé' });
    }
    
    // Vérifier que le fichier existe sur le disque
    if (!fs.existsSync(importedFile.filePath)) {
      return res.status(404).json({ message: 'Fichier physique non trouvé' });
    }
    
    // MODIFICATION : Préparer le nom de fichier pour le téléchargement avec caractères spéciaux
    const downloadNames = prepareDownloadFileName(importedFile.originalName);
    
    // MODIFICATION : Déterminer le type MIME avec charset UTF-8 pour les fichiers texte
    const mimeTypes = {
      'csv': 'text/csv; charset=utf-8',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain; charset=utf-8',
      'json': 'application/json; charset=utf-8'
    };
    
    const mimeType = mimeTypes[importedFile.fileType.toLowerCase()] || 'application/octet-stream';
    
    // MODIFICATION : Définir les en-têtes pour le téléchargement avec support UTF-8
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', importedFile.fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadNames.simple}"; filename*=${downloadNames.rfc5987}`);
    
    // AJOUT : Headers additionnels pour l'UTF-8
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    
    // Créer un stream de lecture et l'envoyer en réponse
    const fileStream = fs.createReadStream(importedFile.filePath);
    
    fileStream.on('error', (error) => {
      console.error('Erreur lors de la lecture du fichier:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Erreur lors de la lecture du fichier',
          error: error.message 
        });
      }
    });
    
    // Envoyer le fichier
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier original:', error);
    res.status(500).json({ 
      message: 'Erreur lors du téléchargement du fichier original',
      error: error.message 
    });
  }
};

/**
 * Affiche le contenu d'un fichier importé pour visualisation
 */
exports.viewFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier l'authentification via token dans query ou header
    let token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Token d\'authentification requis' });
    }
    
    // Vous devrez vérifier le token ici selon votre logique d'auth
    // const user = await verifyToken(token);
    
    const importedFile = await ImportedData.findById(id);
    
    if (!importedFile) {
      return res.status(404).json({ message: 'Fichier importé non trouvé' });
    }
    
    // Vérifier que le fichier existe sur le disque
    if (!fs.existsSync(importedFile.filePath)) {
      return res.status(404).json({ message: 'Fichier physique non trouvé' });
    }
    
    // MODIFICATION : Déterminer le type MIME avec charset UTF-8 pour les fichiers texte
    const mimeTypes = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'svg': 'image/svg+xml; charset=utf-8',
      'txt': 'text/plain; charset=utf-8',
      'csv': 'text/csv; charset=utf-8',
      'json': 'application/json; charset=utf-8',
      'xml': 'application/xml; charset=utf-8',
      'html': 'text/html; charset=utf-8',
      'htm': 'text/html; charset=utf-8',
      'css': 'text/css; charset=utf-8',
      'js': 'application/javascript; charset=utf-8',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'webm': 'video/webm',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'aac': 'audio/aac',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
    
    const mimeType = mimeTypes[importedFile.fileType.toLowerCase()] || 'application/octet-stream';
    
    // Headers pour l'affichage (pas de téléchargement)
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', importedFile.fileSize);
    
    // AJOUT : Support pour les caractères spéciaux dans les fichiers texte
    if (['txt', 'csv', 'json', 'xml', 'html', 'htm'].includes(importedFile.fileType.toLowerCase())) {
      res.setHeader('Content-Transfer-Encoding', 'utf-8');
    }
    
    // Pour certains types de fichiers, ajouter des headers spécifiques
    if (importedFile.fileType.toLowerCase() === 'pdf') {
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    }
    
    // Headers de cache pour améliorer les performances
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('ETag', `"${importedFile._id}-${importedFile.fileSize}"`);
    
    // Vérifier si le client a déjà une version en cache
    const clientETag = req.headers['if-none-match'];
    if (clientETag === `"${importedFile._id}-${importedFile.fileSize}"`) {
      return res.status(304).end();
    }
    
    // Créer un stream de lecture et l'envoyer en réponse
    const fileStream = fs.createReadStream(importedFile.filePath);
    
    fileStream.on('error', (error) => {
      console.error('Erreur lors de la lecture du fichier:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Erreur lors de la lecture du fichier',
          error: error.message 
        });
      }
    });
    
    // Envoyer le fichier
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Erreur lors de l\'affichage du fichier:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'affichage du fichier',
      error: error.message 
    });
  }
};

/**
 * Supprime un fichier importé
 */
exports.deleteImportedFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const importedFile = await ImportedData.findById(id);
    
    if (!importedFile) {
      return res.status(404).json({ message: 'Fichier importé non trouvé' });
    }
    
    // Supprimer le fichier physique
    if (fs.existsSync(importedFile.filePath)) {
      fs.unlinkSync(importedFile.filePath);
    }
    
    // Supprimer l'entrée de la base de données
    await ImportedData.findByIdAndDelete(id);
    
    res.json({ message: 'Fichier supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la suppression du fichier',
      error: error.message 
    });
  }
};

/**
 * Prévisualise les données d'un fichier importé
 */
exports.previewFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;
    
    const importedFile = await ImportedData.findById(id);
    
    if (!importedFile) {
      return res.status(404).json({ message: 'Fichier importé non trouvé' });
    }
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(importedFile.filePath)) {
      return res.status(404).json({ message: 'Fichier physique non trouvé' });
    }
    
    // Analyser le fichier
    try {
      const fileData = await parseFile(importedFile.filePath, importedFile.fileType);
      
      // Limiter le nombre de lignes retournées
      const previewData = fileData.data.slice(0, parseInt(limit, 10));
      
      res.json({
        fileName: importedFile.originalName,
        fileType: importedFile.fileType,
        headers: fileData.headers,
        rowCount: fileData.rowCount,
        data: previewData, // MODIFICATION : Changer 'preview' en 'data'
        detectedFormat: fileData.detectedFormat || 'structured',
        originalFormat: importedFile.fileType
      });
    } catch (error) {
      console.error('Erreur lors de la prévisualisation du fichier:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la prévisualisation du fichier',
        error: error.message 
      });
    }
  } catch (error) {
    console.error('Erreur lors de la prévisualisation du fichier:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la prévisualisation du fichier',
      error: error.message 
    });
  }
};

/**
 * Télécharge le fichier d'erreurs généré lors de la validation
 */
exports.downloadErrorsFile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const importedFile = await ImportedData.findById(id);
    
    if (!importedFile) {
      return res.status(404).json({ message: 'Fichier importé non trouvé' });
    }
    
    if (!importedFile.errors || importedFile.errors.length === 0) {
      return res.status(404).json({ message: 'Aucune erreur trouvée pour ce fichier' });
    }
    
    // Générer un fichier CSV avec les erreurs
    const errorsCSV = 'Ligne,Colonne,Message\n' + 
      importedFile.errors.map(err => `${err.line},${err.column},"${err.message}"`).join('\n');
    
    // MODIFICATION : Préparer le nom du fichier d'erreurs avec caractères spéciaux
    const errorFileName = `erreurs_${importedFile.originalName}.csv`;
    const downloadNames = prepareDownloadFileName(errorFileName);
    
    // MODIFICATION : Définir les en-têtes pour le téléchargement avec support UTF-8
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadNames.simple}"; filename*=${downloadNames.rfc5987}`);
    
    res.send(errorsCSV);
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier d\'erreurs:', error);
    res.status(500).json({ 
      message: 'Erreur lors du téléchargement du fichier d\'erreurs',
      error: error.message 
    });
  }
};