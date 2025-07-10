const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({

  fullName: { 
    type: String,
    required: true,
    trim: true
  },
  email: {  
    type: String,
    required: true,
    unique: true,
    trim: true,
    // Ajout optionnel pour normaliser les emails
    lowercase: true, // <-- Convertit en minuscules
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  password: { 
    type: String, 
    required: true,
    // select: false // <-- Optionnel: Masque le mot de passe par défaut
  },
  role: {
    type: String,
    enum: ['admin', 'coordinateur', 'assistant_coordinateur', 'gestionnaire','médecin','infirmier de coordination','psychologue','autre'],
    default: 'coordinateur'
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});


userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);