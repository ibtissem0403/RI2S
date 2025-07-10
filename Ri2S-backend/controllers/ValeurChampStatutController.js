const ValeurChampStatut = require('../models/ValeurChampStatut');
const BeneficiaireExperimentation = require('../models/BeneficiaireExperimentation');
const ChampStatut = require('../models/ChampStatut');
const ChampCommun = require('../models/ChampCommun');

// Récupérer toutes les valeurs de champs d'un bénéficiaire
exports.getValeursBeneficiaire = async (req, res) => {
  try {
    const { beneficiaireId } = req.params;
    
    // Vérifier que le bénéficiaire existe
    const beneficiaire = await BeneficiaireExperimentation.findById(beneficiaireId);
    if (!beneficiaire) {
      return res.status(404).json({ message: 'Bénéficiaire non trouvé' });
    }
    
    // Récupérer les valeurs des champs statut
    const valeursChampStatut = await ValeurChampStatut.find({
      beneficiaire: beneficiaireId,
      champ: { $exists: true, $ne: null }
    }).populate({
      path: 'champ',
      select: 'nom_champ type_champ options obligatoire'
    });
    
    // Récupérer les valeurs des champs communs
    const valeursChampCommun = await ValeurChampStatut.find({
      beneficiaire: beneficiaireId,
      champ_commun: { $exists: true, $ne: null }
    }).populate({
      path: 'champ_commun',
      select: 'nom_champ type_champ options obligatoire'
    });
    
    res.status(200).json({
      valeursChampStatut,
      valeursChampCommun
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des valeurs de champs:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des valeurs de champs',
      error: error.message
    });
  }
};

// Mettre à jour une valeur de champ
exports.updateValeurChamp = async (req, res) => {
  try {
    const { valeurId } = req.params;
    const { valeur } = req.body;
    
    // Vérifier que la valeur existe
    const valeurChamp = await ValeurChampStatut.findById(valeurId);
    if (!valeurChamp) {
      return res.status(404).json({ message: 'Valeur de champ non trouvée' });
    }
    
    // Vérifier le type de valeur selon le type du champ
    if (valeurChamp.champ) {
      const champ = await ChampStatut.findById(valeurChamp.champ);
      if (champ) {
        // Valider selon le type
        if (!validateValeur(valeur, champ.type_champ, champ.options)) {
          return res.status(400).json({ 
            message: `Valeur invalide pour le type ${champ.type_champ}` 
          });
        }
      }
    } else if (valeurChamp.champ_commun) {
      const champCommun = await ChampCommun.findById(valeurChamp.champ_commun);
      if (champCommun) {
        // Valider selon le type
        if (!validateValeur(valeur, champCommun.type_champ, champCommun.options)) {
          return res.status(400).json({ 
            message: `Valeur invalide pour le type ${champCommun.type_champ}` 
          });
        }
      }
    }
    
    // Mettre à jour la valeur
    valeurChamp.valeur = valeur;
    await valeurChamp.save();
    
    res.status(200).json({
      message: 'Valeur mise à jour avec succès',
      data: valeurChamp
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la valeur:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de la valeur',
      error: error.message
    });
  }
};

// Fonction utilitaire pour valider une valeur selon son type
function validateValeur(valeur, type, options = []) {
  switch(type) {
    case 'texte':
      return typeof valeur === 'string';
      
    case 'nombre':
      return !isNaN(Number(valeur));
      
    case 'date':
      return !isNaN(Date.parse(valeur));
      
    case 'liste':
      return Array.isArray(options) && options.includes(valeur);
      
    case 'fichier':
      return typeof valeur === 'string' && valeur.length > 0;
      
    default:
      return true;
  }
}