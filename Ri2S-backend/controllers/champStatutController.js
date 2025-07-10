const ChampStatut = require('../models/ChampStatut');
const StatutCible = require('../models/StatutCible');

// Créer un nouveau champ pour un statut
exports.createChamp = async (req, res) => {
  try {
    const { statut, nom_champ, type_champ, options, obligatoire, description } = req.body;

    // Vérifier si le statut existe
    const statutExists = await StatutCible.findById(statut);
    if (!statutExists) {
      return res.status(404).json({
        message: 'Statut non trouvé'
      });
    }

    // Vérifier si le champ existe déjà pour ce statut
    const existingChamp = await ChampStatut.findOne({
      statut,
      nom_champ
    });

    if (existingChamp) {
      return res.status(400).json({
        message: 'Un champ avec ce nom existe déjà pour ce statut'
      });
    }

    // Créer le champ
    const champ = await ChampStatut.create({
      statut,
      nom_champ,
      type_champ,
      options: type_champ === 'liste' ? options : [],
      obligatoire: !!obligatoire,
      description
    });

    res.status(201).json({
      message: 'Champ créé avec succès',
      data: champ
    });
  } catch (error) {
    console.error('Erreur lors de la création du champ:', error);
    res.status(500).json({
      message: 'Erreur lors de la création du champ',
      error: error.message
    });
  }
};

// Récupérer tous les champs d'un statut
exports.getChampsStatut = async (req, res) => {
  try {
    const { statutId } = req.params;
    
    const champs = await ChampStatut.find({ 
      statut: statutId 
    });
    
    res.status(200).json(champs);
  } catch (error) {
    console.error('Erreur lors de la récupération des champs:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des champs',
      error: error.message
    });
  }
};

// Récupérer un champ par ID
exports.getChampById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const champ = await ChampStatut.findById(id);
    
    if (!champ) {
      return res.status(404).json({
        message: 'Champ non trouvé'
      });
    }
    
    res.status(200).json(champ);
  } catch (error) {
    console.error('Erreur lors de la récupération du champ:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du champ',
      error: error.message
    });
  }
};

// Mettre à jour un champ
exports.updateChamp = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_champ, type_champ, options, obligatoire, description } = req.body;
    
    const champ = await ChampStatut.findById(id);
    
    if (!champ) {
      return res.status(404).json({
        message: 'Champ non trouvé'
      });
    }
    
    // Vérifier si le nouveau nom de champ existe déjà (sauf pour le champ courant)
    if (nom_champ && nom_champ !== champ.nom_champ) {
      const existingChamp = await ChampStatut.findOne({
        statut: champ.statut,
        nom_champ,
        _id: { $ne: id }
      });
      
      if (existingChamp) {
        return res.status(400).json({
          message: 'Un champ avec ce nom existe déjà pour ce statut'
        });
      }
    }
    
    // Mettre à jour le champ
    const updatedChamp = await ChampStatut.findByIdAndUpdate(
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
      message: 'Champ mis à jour avec succès',
      data: updatedChamp
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du champ:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du champ',
      error: error.message
    });
  }
};

// Supprimer un champ
exports.deleteChamp = async (req, res) => {
  try {
    const { id } = req.params;
    
    const champ = await ChampStatut.findById(id);
    
    if (!champ) {
      return res.status(404).json({
        message: 'Champ non trouvé'
      });
    }
    
    await ChampStatut.findByIdAndDelete(id);
    
    res.status(200).json({
      message: 'Champ supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du champ:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression du champ',
      error: error.message
    });
  }
};