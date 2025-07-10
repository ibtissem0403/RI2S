const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fixFileNameEncoding } = require('../utils/encodingUtils');

// Configuration du stockage pour les imports
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/imports');
    console.log('[Import Multer] Création du dossier :', uploadDir);

    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('[Import Multer] Dossier créé avec succès ✅');
      cb(null, uploadDir);
    } catch (err) {
      console.error('[Import Multer] ERREUR:', err.message);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    // Corriger l'encodage du nom de fichier original
    const correctedName = fixFileNameEncoding(file.originalname);
    
    // Générer un nom unique tout en préservant l'extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(correctedName);
    const baseName = path.basename(correctedName, ext);
    
    // Nettoyer le nom de base pour éviter les problèmes de système de fichiers
    const cleanBaseName = baseName.replace(/[^\w\s\-_àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/gi, '_');
    
    const finalFileName = `import-${uniqueSuffix}-${cleanBaseName}${ext}`;
    
    // Stocker les informations d'encodage dans l'objet file pour usage ultérieur
    file.originalNameUTF8 = correctedName;
    file.hasSpecialChars = /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(correctedName);
    file.needsEncoding = correctedName !== file.originalname;
    
    console.log('[Import Multer] Nom original:', file.originalname);
    console.log('[Import Multer] Nom corrigé:', correctedName);
    console.log('[Import Multer] Nom final:', finalFileName);
    
    cb(null, finalFileName);
  }
});

// Filtrage des fichiers pour l'import
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Fichiers de données structurées
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'application/vnd.ms-excel', // XLS
    'application/json',
    'text/plain', // TXT
    'application/xml',
    'text/xml',
    
    // Documents
    'application/pdf',
    'application/msword', // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    
    // Images (pour preuves, captures d'écran, etc.)
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`Type de fichier non autorisé: ${file.mimetype}. Types acceptés : CSV, Excel, JSON, PDF, Word, Images`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Configuration finale
const importUpload = multer({
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB pour les gros fichiers d'import
    files: 1 // Un seul fichier à la fois pour les imports
  },
  fileFilter: fileFilter
});

// Middleware de logging pour les uploads d'import
importUpload.logUpload = (req, res, next) => {
  if (req.file) {
    console.log('[Import Upload] Fichier reçu:', {
      originalName: req.file.originalname,
      correctedName: req.file.originalNameUTF8,
      size: req.file.size,
      mimetype: req.file.mimetype,
      hasSpecialChars: req.file.hasSpecialChars,
      needsEncoding: req.file.needsEncoding,
      uploadedBy: req.user ? req.user.email : 'unknown'
    });
  }
  next();
};

// Middleware d'erreur spécifique aux imports
importUpload.handleError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Fichier trop volumineux',
        error: 'La taille maximale autorisée est de 50MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Trop de fichiers',
        error: 'Un seul fichier peut être importé à la fois'
      });
    }
  }
  
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      message: 'Type de fichier non autorisé',
      error: err.message
    });
  }
  
  console.error('[Import Upload Error]:', err);
  res.status(500).json({
    message: 'Erreur lors de l\'upload du fichier',
    error: err.message
  });
};

console.log('Configuration Multer pour imports initialisée avec support UTF-8');

module.exports = importUpload;