const mongoose = require('mongoose');

const importedDataSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  experimentation: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  importDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['En attente', 'Validé', 'Rejeté', 'Intégré', 'Erreur'],
    default: 'En attente'
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validationDate: {
    type: Date
  },
  validationNotes: {
    type: String
  },
  recordCount: {
    type: Number,
    default: 0
  },
  errors: [{
    line: Number,
    column: String,
    message: String,
    value: String
  }],
  summary: {
    totalRows: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    isValid: { type: Boolean, default: true },
    fileType: String,
    isStructuredData: { type: Boolean, default: false },
    detectedFormat: String,
    integration: {
      totalProcessed: Number,
      created: Number,
      updated: Number,
      errors: Array
    }
  },
  // Nouvelles métadonnées pour l'encodage des caractères spéciaux
  encoding: {
    originalEncoding: {
      type: String,
      default: 'utf8'
    },
    correctedName: String,
    detectedEncoding: String,
    hasSpecialChars: {
      type: Boolean,
      default: false
    },
    needsCorrection: {
      type: Boolean,
      default: false
    }
  },
  // Métadonnées supplémentaires pour le fichier
  metadata: {
    charset: String,
    language: String,
    contentType: String,
    lastModified: Date,
    uploadIP: String,
    userAgent: String
  }
}, {
  timestamps: true,
  // Assurer l'UTF-8 pour MongoDB
  collection: 'importeddata'
});

// Index pour recherche avec caractères spéciaux
importedDataSchema.index({ 
  originalName: 'text', 
  experimentation: 1,
  status: 1,
  uploadedBy: 1
});

// Index pour performance
importedDataSchema.index({ importDate: -1 });
importedDataSchema.index({ status: 1, experimentation: 1 });

// Middleware pour détecter les caractères spéciaux avant sauvegarde
importedDataSchema.pre('save', function(next) {
  if (this.originalName) {
    // Détecter la présence de caractères spéciaux français/européens
    const hasSpecialChars = /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]|[ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ]/.test(this.originalName);
    
    // Détecter les caractères mal encodés - REGEX CORRIGÉE
    const hasBadEncoding = this.originalName.includes('Ã©') || 
                          this.originalName.includes('Ã¨') || 
                          this.originalName.includes('Ã ') ||
                          this.originalName.includes('â€') ||
                          this.originalName.includes('Â°') ||
                          this.originalName.includes('Â»') ||
                          this.originalName.includes('Â«');
    
    if (!this.encoding) {
      this.encoding = {};
    }
    
    this.encoding.hasSpecialChars = hasSpecialChars;
    this.encoding.needsCorrection = hasBadEncoding;
    
    // Corriger automatiquement si nécessaire
    if (!this.encoding.correctedName && (hasSpecialChars || hasBadEncoding)) {
      this.encoding.correctedName = this.originalName;
    }
  }
  
  next();
});

// Méthode pour obtenir le nom d'affichage correct
importedDataSchema.methods.getDisplayName = function() {
  return this.encoding?.correctedName || this.originalName;
};

// Méthode pour obtenir des infos sur l'encodage
importedDataSchema.methods.getEncodingInfo = function() {
  return {
    hasSpecialChars: this.encoding?.hasSpecialChars || false,
    needsCorrection: this.encoding?.needsCorrection || false,
    originalEncoding: this.encoding?.originalEncoding || 'utf8',
    correctionApplied: this.encoding?.originalEncoding === 'corrected'
  };
};

// Méthode pour corriger l'encodage si nécessaire
importedDataSchema.methods.fixEncoding = function() {
  if (this.encoding?.needsCorrection) {
    // Correction des caractères mal encodés
    const corrections = {
      'Ã©': 'é', 'Ã¨': 'è', 'Ã ': 'à', 'Ã¢': 'â',
      'Ã´': 'ô', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã®': 'î',
      'Ã¯': 'ï', 'Ã§': 'ç', 'Ã«': 'ë', 'Ã¿': 'ÿ',
      'â‚¬': '€', 'â€™': "'", 'â€œ': '"', 'â€': '"',
      'Â°': '°', 'Â»': '»', 'Â«': '«'
    };
    
    let corrected = this.originalName;
    Object.entries(corrections).forEach(([wrong, right]) => {
      corrected = corrected.replace(new RegExp(wrong, 'g'), right);
    });
    
    this.encoding.correctedName = corrected;
    this.encoding.originalEncoding = 'corrected';
    return corrected;
  }
  
  return this.originalName;
};

// Méthode statique pour rechercher avec support des caractères spéciaux
importedDataSchema.statics.searchWithEncoding = function(searchTerm, filters = {}) {
  const searchRegex = new RegExp(searchTerm, 'i');
  
  return this.find({
    ...filters,
    $or: [
      { originalName: searchRegex },
      { 'encoding.correctedName': searchRegex },
      { experimentation: searchRegex }
    ]
  });
};

module.exports = mongoose.model('ImportedData', importedDataSchema);