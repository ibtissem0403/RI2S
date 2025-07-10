const StatutCible = require('../models/StatutCible');
const CibleExperimentation = require('../models/CibleExperimentation');

// Créer un nouveau statut pour une cible
exports.createStatut = async (req, res) => {
  try {
    const { cible, nom_statut, ordre, description } = req.body;

    // Vérifier si la cible existe
    const cibleExists = await CibleExperimentation.findById(cible);
    if (!cibleExists) {
      return res.status(404).json({
        message: 'Cible non trouvée'
      });
    }

    // Vérifier si le statut existe déjà pour cette cible
    const existingStatut = await StatutCible.findOne({
      cible,
      nom_statut
    });

    if (existingStatut) {
      return res.status(400).json({
        message: 'Un statut avec ce nom existe déjà pour cette cible'
      });
    }

    // Déterminer l'ordre si non spécifié
    let statutOrdre = ordre;
    if (statutOrdre === undefined) {
      const lastStatut = await StatutCible.findOne({ cible }).sort('-ordre');
      statutOrdre = lastStatut ? lastStatut.ordre + 1 : 0;
    }

    // Créer le statut
    const statut = await StatutCible.create({
      cible,
      nom_statut,
      ordre: statutOrdre,
      description
    });

    res.status(201).json({
      message: 'Statut créé avec succès',
      data: statut
    });
  } catch (error) {
    console.error('Erreur lors de la création du statut:', error);
    res.status(500).json({
      message: 'Erreur lors de la création du statut',
      error: error.message
    });
  }
};

// Récupérer tous les statuts d'une cible
exports.getStatutsCible = async (req, res) => {
  try {
    const { cibleId } = req.params;
    
    const statuts = await StatutCible.find({ 
      cible: cibleId 
    }).sort('ordre');
    
    res.status(200).json(statuts);
  } catch (error) {
    console.error('Erreur lors de la récupération des statuts:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des statuts',
      error: error.message
    });
  }
};

// Récupérer un statut par ID
exports.getStatutById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const statut = await StatutCible.findById(id);
    
    if (!statut) {
      return res.status(404).json({
        message: 'Statut non trouvé'
      });
    }
    
    res.status(200).json(statut);
  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du statut',
      error: error.message
    });
  }
};

// Mettre à jour un statut
exports.updateStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_statut, ordre, description } = req.body;
    
    const statut = await StatutCible.findById(id);
    
    if (!statut) {
      return res.status(404).json({
        message: 'Statut non trouvé'
      });
    }
    
    // Vérifier si le nouveau nom de statut existe déjà (sauf pour le statut courant)
    if (nom_statut && nom_statut !== statut.nom_statut) {
      const existingStatut = await StatutCible.findOne({
        cible: statut.cible,
        nom_statut,
        _id: { $ne: id }
      });
      
      if (existingStatut) {
        return res.status(400).json({
          message: 'Un statut avec ce nom existe déjà pour cette cible'
        });
      }
    }
    
    // Mettre à jour le statut
    const updatedStatut = await StatutCible.findByIdAndUpdate(
      id,
      { nom_statut, ordre, description },
      { new: true }
    );
    
    res.status(200).json({
      message: 'Statut mis à jour avec succès',
      data: updatedStatut
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
};

// Supprimer un statut
exports.deleteStatut = async (req, res) => {
  try {
    const { id } = req.params;
    
    const statut = await StatutCible.findById(id);
    
    if (!statut) {
      return res.status(404).json({
        message: 'Statut non trouvé'
      });
    }
    
    await StatutCible.findByIdAndDelete(id);
    
    res.status(200).json({
      message: 'Statut supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du statut:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression du statut',
      error: error.message
    });
  }
};