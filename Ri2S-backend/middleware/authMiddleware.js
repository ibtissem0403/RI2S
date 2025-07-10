const User = require('../models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "MaCleSecrete123";

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Authentification requise" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id); // Récupération complète de l'utilisateur

    if (!user) {
      return res.status(401).json({ message: "Utilisateur introuvable" });
    }

    req.user = user; // On stocke l'utilisateur complet
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

// Middleware pour vérifier un rôle spécifique (ex: admin)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Accès refusé, rôle requis : ${roles}` });
    }
    next();
  };
};

// middleware/authMiddleware.js
exports.isRecruiter = (req, res, next) => {
  const allowedRoles = ['coordinateur', 'assistant_coordinateur'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      message: "Accès réservé aux coordinateurs et assistants coordinateurs" 
    });
  }
  next();
};
