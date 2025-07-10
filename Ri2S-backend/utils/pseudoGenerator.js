const Counter = require('../models/Counter');

// Map des abréviations
const expAbbreviations = {
  Telegrafik: 'TELG',
  Presage: 'PRES'
};

async function generatePseudonym(experimentationName, fullName, firstName) {
  const year = new Date().getFullYear();
  
  // Obtenir l'abréviation
  const abbr = expAbbreviations[experimentationName] || 
               experimentationName.slice(0, 4).toUpperCase();
  
  // Clé de compteur basée sur l'expérimentation et l'année
  const counterKey = `${abbr}-${year}`;
  
  // Incrémenter le compteur de manière atomique
  const counter = await Counter.findOneAndUpdate(
    { _id: counterKey },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  
  // Construire pseudoId et pseudoName
  const pseudoId = `${abbr}-${year}-${counter.seq}`;
  const initials = `${fullName.charAt(0).toUpperCase()}${firstName.charAt(0).toUpperCase()}`;
  const pseudoName = `${initials}-${counter.seq}`;
  
  return { pseudoId, pseudoName };
}

module.exports = generatePseudonym;