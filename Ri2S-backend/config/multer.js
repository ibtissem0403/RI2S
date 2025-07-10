const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    console.log('[Multer] Tentative de création du dossier :', uploadDir);

    try {
      // Création récursive synchrone
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('[Multer] Dossier créé avec succès ✅');
      cb(null, uploadDir);
    } catch (err) {
      console.error('[Multer] ERREUR Critique:', err.message);
      cb(err); // Envoyer l'erreur à Multer
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'file-' + uniqueSuffix + ext);
  }
});

// Filtrage des fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
    'text/csv'
  ];  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Formats acceptés : JPEG, PNG, PDF ❌'), false);
  }
};

// Configuration finale
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

console.log('Chemin absolu du dossier uploads:', path.resolve(__dirname, '../uploads'));

module.exports = upload;