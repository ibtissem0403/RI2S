const CibleExperimentation = require('../models/CibleExperimentation');
const Experimentation = require('../models/Experimentation');

// Créer une nouvelle cible pour une expérimentation
exports.createCible = async (req, res) => {
  try {
    const { experimentation, nom_cible, code_cible, description } = req.body;

    // Vérifier si l'expérimentation existe
    const experimentationExists = await Experimentation.findById(experimentation);
    if (!experimentationExists) {
      return res.status(404).json({
        message: 'Expérimentation non trouvée'
      });
    }

    // Vérifier si la cible existe déjà pour cette expérimentation
    const existingCible = await CibleExperimentation.findOne({
      experimentation,
      nom_cible
    });

    if (existingCible) {
      return res.status(400).json({
        message: 'Une cible avec ce nom existe déjà pour cette expérimentation'
      });
    }

    // Créer la cible
    const cible = await CibleExperimentation.create({
      experimentation,
      nom_cible,
      code_cible,
      description
    });

    res.status(201).json({
      message: 'Cible créée avec succès',
      data: cible
    });
  } catch (error) {
    console.error('Erreur lors de la création de la cible:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de la cible',
      error: error.message
    });
  }
};

// Récupérer toutes les cibles d'une expérimentation
exports.getCiblesExperimentation = async (req, res) => {
  try {
    const { experimentationId } = req.params;
    
    const cibles = await CibleExperimentation.find({ 
      experimentation: experimentationId 
    });
    
    res.status(200).json(cibles);
  } catch (error) {
    console.error('Erreur lors de la récupération des cibles:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des cibles',
      error: error.message
    });
  }
};

// Récupérer une cible par ID
exports.getCibleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cible = await CibleExperimentation.findById(id);
    
    if (!cible) {
      return res.status(404).json({
        message: 'Cible non trouvée'
      });
    }
    
    res.status(200).json(cible);
  } catch (error) {
    console.error('Erreur lors de la récupération de la cible:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la cible',
      error: error.message
    });
  }
};

// Mettre à jour une cible
exports.updateCible = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_cible, code_cible, description } = req.body;
    
    const cible = await CibleExperimentation.findById(id);
    
    if (!cible) {
      return res.status(404).json({
        message: 'Cible non trouvée'
      });
    }
    
    // Vérifier si le nouveau nom de cible existe déjà (sauf pour la cible courante)
    if (nom_cible && nom_cible !== cible.nom_cible) {
      const existingCible = await CibleExperimentation.findOne({
        experimentation: cible.experimentation,
        nom_cible,
        _id: { $ne: id }
      });
      
      if (existingCible) {
        return res.status(400).json({
          message: 'Une cible avec ce nom existe déjà pour cette expérimentation'
        });
      }
    }
    
    // Mettre à jour la cible
    const updatedCible = await CibleExperimentation.findByIdAndUpdate(
      id,
      { nom_cible, code_cible, description },
      { new: true }
    );
    
    res.status(200).json({
      message: 'Cible mise à jour avec succès',
      data: updatedCible
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la cible:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de la cible',
      error: error.message
    });
  }
};

// Supprimer une cible
exports.deleteCible = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cible = await CibleExperimentation.findById(id);
    
    if (!cible) {
      return res.status(404).json({
        message: 'Cible non trouvée'
      });
    }
    
    await CibleExperimentation.findByIdAndDelete(id);
    
    res.status(200).json({
      message: 'Cible supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la cible:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de la cible',
      error: error.message
    });
  }
};