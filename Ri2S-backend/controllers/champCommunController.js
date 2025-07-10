const ChampCommun = require('../models/ChampCommun');
const Experimentation = require('../models/Experimentation');

// Créer un nouveau champ commun pour une expérimentation
exports.createChampCommun = async (req, res) => {
  try {
    const { experimentation, nom_champ, type_champ, options, obligatoire, description } = req.body;

    // Vérifier si l'expérimentation existe
    const experimentationExists = await Experimentation.findById(experimentation);
    if (!experimentationExists) {
      return res.status(404).json({
        message: 'Expérimentation non trouvée'
      });
    }

    // Vérifier si le champ commun existe déjà pour cette expérimentation
    const existingChamp = await ChampCommun.findOne({
      experimentation,
      nom_champ
    });

    if (existingChamp) {
      return res.status(400).json({
        message: 'Un champ commun avec ce nom existe déjà pour cette expérimentation'
      });
    }

    // Créer le champ commun
    const champCommun = await ChampCommun.create({
      experimentation,
      nom_champ,
      type_champ,
      options: type_champ === 'liste' ? options : [],
      obligatoire: !!obligatoire,
      description
    });

    res.status(201).json({
      message: 'Champ commun créé avec succès',
      data: champCommun
    });
  } catch (error) {
    console.error('Erreur lors de la création du champ commun:', error);
    res.status(500).json({
      message: 'Erreur lors de la création du champ commun',
      error: error.message
    });
  }
};

// Récupérer tous les champs communs d'une expérimentation
exports.getChampsCommuns = async (req, res) => {
  try {
    const { experimentationId } = req.params;
    
    const champsCommuns = await ChampCommun.find({ 
      experimentation: experimentationId 
    });
    
    res.status(200).json(champsCommuns);
  } catch (error) {
    console.error('Erreur lors de la récupération des champs communs:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des champs communs',
      error: error.message
    });
  }
};

// Récupérer un champ commun par ID
exports.getChampCommunById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const champCommun = await ChampCommun.findById(id);
    
    if (!champCommun) {
      return res.status(404).json({
        message: 'Champ commun non trouvé'
      });
    }
    
    res.status(200).json(champCommun);
  } catch (error) {
    console.error('Erreur lors de la récupération du champ commun:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du champ commun',
      error: error.message
    });
  }
};

// Mettre à jour un champ commun
exports.updateChampCommun = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_champ, type_champ, options, obligatoire, description } = req.body;
    
    const champCommun = await ChampCommun.findById(id);
    
    if (!champCommun) {
      return res.status(404).json({
        message: 'Champ commun non trouvé'
      });
    }
    
    // Vérifier si le nouveau nom de champ existe déjà (sauf pour le champ courant)
    if (nom_champ && nom_champ !== champCommun.nom_champ) {
      const existingChamp = await ChampCommun.findOne({
        experimentation: champCommun.experimentation,
        nom_champ,
        _id: { $ne: id }
      });
      
      if (existingChamp) {
        return res.status(400).json({
          message: 'Un champ commun avec ce nom existe déjà pour cette expérimentation'
        });
      }
    }
    
    // Mettre à jour le champ commun
    const updatedChampCommun = await ChampCommun.findByIdAndUpdate(
      id,
      { 
        nom_champ, 
        type_champ, 
        options: type_champ === 'liste' ? options : [], 
        obligatoire: !!obligatoire, 
        description 
      },
      { new: true }
    );
    
    res.status(200).json({
      message: 'Champ commun mis à jour avec succès',
      data: updatedChampCommun
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du champ commun:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du champ commun',
      error: error.message
    });
  }
};

// Supprimer un champ commun
exports.deleteChampCommun = async (req, res) => {
  try {
    const { id } = req.params;
    
    const champCommun = await ChampCommun.findById(id);
    
    if (!champCommun) {
      return res.status(404).json({
        message: 'Champ commun non trouvé'
      });
    }
    
    await ChampCommun.findByIdAndDelete(id);
    
    res.status(200).json({
      message: 'Champ commun supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du champ commun:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression du champ commun',
      error: error.message
    });
  }
};