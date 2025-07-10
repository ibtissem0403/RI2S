const BeneficiaireExperimentation = require('../models/BeneficiaireExperimentation');
const ValeurChampStatut = require('../models/ValeurChampStatut');
const StatutCible = require('../models/StatutCible');
const CibleExperimentation = require('../models/CibleExperimentation');
const Experimentation = require('../models/Experimentation');
const UsagerRI2S = require('../models/UsagerRI2S');
const PseudonymizedBeneficiary = require('../models/PseudonymizedBeneficiary');
const ChampStatut = require('../models/ChampStatut');
const ChampCommun = require('../models/ChampCommun');
const mongoose = require('mongoose');

// Fonction utilitaire pour valider les valeurs selon le type de champ
const validateValue = (valeur, type, options = []) => {
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
      return typeof valeur === 'string' && valeur.trim().length > 0;
    default:
      return true;
  }
};

// 1) Rattacher un bénéficiaire à une expérimentation
exports.rattacherBeneficiaire = async (req, res) => {
  try {
    const { 
      usagerId, 
      usagerModel = 'UsagerRI2S', // Par défaut on utilise le nouveau modèle
      experimentationId, 
      cibleId, 
      statutId,
      valeurs_champs,
      valeurs_champs_communs
    } = req.body;

    // Vérifications préalables selon le modèle d'usager
    let usager;
    // Utiliser UsagerRI2S à la place de RealBeneficiary
    usager = await UsagerRI2S.findById(usagerId);

    if (!usager) {
      return res.status(404).json({ message: 'Usager non trouvé' });
    }

    const experimentation = await Experimentation.findById(experimentationId);
    if (!experimentation) {
      return res.status(404).json({ message: 'Expérimentation non trouvée' });
    }

    const cible = await CibleExperimentation.findOne({ 
      _id: cibleId,
      experimentation: experimentationId 
    });
    if (!cible) {
      return res.status(404).json({ message: 'Cible non trouvée ou n\'appartient pas à cette expérimentation' });
    }

    const statut = await StatutCible.findOne({ 
      _id: statutId,
      cible: cibleId 
    });
    if (!statut) {
      return res.status(404).json({ message: 'Statut non trouvé ou n\'appartient pas à cette cible' });
    }

    // Vérifier si l'usager est déjà rattaché à cette expérimentation avec cette cible
    const existingBeneficiaire = await BeneficiaireExperimentation.findOne({
      usager: usagerId,
      usagerModel,
      experimentation: experimentationId,
      cible: cibleId
    });

    if (existingBeneficiaire) {
      return res.status(400).json({
        message: 'Cet usager est déjà rattaché à cette expérimentation avec cette cible'
      });
    }

    // Validation des valeurs des champs si nécessaire
    if (valeurs_champs) {
      for (const champId of Object.keys(valeurs_champs)) {
        const champ = await ChampStatut.findById(champId);
        if (champ && !validateValue(valeurs_champs[champId], champ.type_champ, champ.options)) {
          return res.status(400).json({
            message: `Valeur invalide pour le champ "${champ.nom_champ}" de type ${champ.type_champ}`
          });
        }
      }
    }
    
    if (valeurs_champs_communs) {
      for (const champId of Object.keys(valeurs_champs_communs)) {
        const champCommun = await ChampCommun.findById(champId);
        if (champCommun && !validateValue(valeurs_champs_communs[champId], champCommun.type_champ, champCommun.options)) {
          return res.status(400).json({
            message: `Valeur invalide pour le champ commun "${champCommun.nom_champ}" de type ${champCommun.type_champ}`
          });
        }
      }
    }

    // Créer le rattachement
    const beneficiaire = await BeneficiaireExperimentation.create({
      usager: usagerId,
      usagerModel,
      experimentation: experimentationId,
      cible: cibleId,
      statut: statutId,
      historique_statuts: [{
        statut: statutId,
        date_changement: new Date(),
        note: 'Rattachement initial'
      }]
    });

    // Traiter les valeurs des champs
    if (valeurs_champs && Object.keys(valeurs_champs).length > 0) {
      for (const champId of Object.keys(valeurs_champs)) {
        const champ = await ChampStatut.findById(champId);
        if (champ) {
          await ValeurChampStatut.create({
            beneficiaire: beneficiaire._id,
            champ: champId,
            valeur: valeurs_champs[champId]
          });
        }
      }
    }
    
    // Traiter les valeurs des champs communs
    if (valeurs_champs_communs && Object.keys(valeurs_champs_communs).length > 0) {
      for (const champId of Object.keys(valeurs_champs_communs)) {
        const champCommun = await ChampCommun.findById(champId);
        if (champCommun) {
          await ValeurChampStatut.create({
            beneficiaire: beneficiaire._id,
            champ_commun: champId,
            valeur: valeurs_champs_communs[champId]
          });
        }
      }
    }

    // Récupérer le bénéficiaire complet
    const beneficiaireComplet = await BeneficiaireExperimentation.findById(beneficiaire._id)
      .populate({
        path: 'usager', 
        model: usagerModel
      })
      .populate('experimentation')
      .populate('cible')
      .populate('statut');

    // Mettre à jour le PseudonymizedBeneficiary pour ajouter cette expérimentation
    if (usagerModel === 'UsagerRI2S') {
      const pseudo = await PseudonymizedBeneficiary.findOne({ usagerRI2S: usagerId });
      if (pseudo && !pseudo.experiments.includes(experimentation.name)) {
        pseudo.experiments.push(experimentation.name);
        await pseudo.save();
      }
    }

    res.status(201).json({
      message: 'Bénéficiaire rattaché avec succès',
      data: beneficiaireComplet
    });
  } catch (error) {
    console.error('Erreur lors du rattachement du bénéficiaire:', error);
    res.status(500).json({
      message: 'Erreur lors du rattachement du bénéficiaire',
      error: error.message
    });
  }
};

// 2) Changer le statut d'un bénéficiaire
exports.changerStatut = async (req, res) => {
  try {
    const { beneficiaireId } = req.params;
    const { 
      nouveauStatutId, 
      note,
      valeurs_champs
    } = req.body;

    // Vérifications préalables
    const beneficiaire = await BeneficiaireExperimentation.findById(beneficiaireId);
    if (!beneficiaire) {
      return res.status(404).json({ message: 'Bénéficiaire non trouvé' });
    }

    const nouveauStatut = await StatutCible.findById(nouveauStatutId);
    if (!nouveauStatut) {
      return res.status(404).json({ message: 'Nouveau statut non trouvé' });
    }

    // Vérifier que le nouveau statut appartient à la même cible
    if (nouveauStatut.cible.toString() !== beneficiaire.cible.toString()) {
      return res.status(400).json({
        message: 'Le nouveau statut doit appartenir à la même cible que le bénéficiaire'
      });
    }

    // Validation des valeurs des champs
    if (valeurs_champs) {
      for (const champId of Object.keys(valeurs_champs)) {
        const champ = await ChampStatut.findOne({
          _id: champId,
          statut: nouveauStatutId
        });
        
        if (champ && !validateValue(valeurs_champs[champId], champ.type_champ, champ.options)) {
          return res.status(400).json({
            message: `Valeur invalide pour le champ "${champ.nom_champ}" de type ${champ.type_champ}`
          });
        }
      }
    }

    // Mettre à jour le statut
    beneficiaire.statut = nouveauStatutId;
    beneficiaire.historique_statuts.push({
      statut: nouveauStatutId,
      date_changement: new Date(),
      note: note || 'Changement de statut'
    });

    await beneficiaire.save();

    // Traiter les valeurs des champs
    if (valeurs_champs && Object.keys(valeurs_champs).length > 0) {
      const updatePromises = Object.keys(valeurs_champs).map(async (champId) => {
        // Vérifier que le champ appartient au nouveau statut
        const champ = await ChampStatut.findOne({
          _id: champId,
          statut: nouveauStatutId
        });

        if (champ) {
          // Vérifier si une valeur existe déjà
          const existingValeur = await ValeurChampStatut.findOne({
            beneficiaire: beneficiaireId,
            champ: champId
          });

          if (existingValeur) {
            // Mettre à jour la valeur existante
            existingValeur.valeur = valeurs_champs[champId];
            return existingValeur.save();
          } else {
            // Créer une nouvelle valeur
            return ValeurChampStatut.create({
              beneficiaire: beneficiaireId,
              champ: champId,
              valeur: valeurs_champs[champId]
            });
          }
        }
      });
      
      await Promise.all(updatePromises.filter(p => p !== undefined));
    }

    res.status(200).json({
      message: 'Statut changé avec succès',
      data: await BeneficiaireExperimentation.findById(beneficiaireId)
        .populate('usager')
        .populate('experimentation')
        .populate('cible')
        .populate('statut')
    });
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({
      message: 'Erreur lors du changement de statut',
      error: error.message
    });
  }
};

// 3) Récupérer tous les bénéficiaires d'une expérimentation
exports.getBeneficiairesExperimentation = async (req, res) => {
  try {
    const { experimentationId } = req.params;
    
    const beneficiaires = await BeneficiaireExperimentation.find({ experimentation: experimentationId })
      .populate({
        path: 'usager',
        model: 'UsagerRI2S'
      })
      .populate('cible')
      .populate('statut');
    
    res.status(200).json(beneficiaires);
  } catch (error) {
    console.error('Erreur lors de la récupération des bénéficiaires:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des bénéficiaires',
      error: error.message
    });
  }
};

// 4) Récupérer un bénéficiaire par ID avec ses valeurs de champs
exports.getBeneficiaireById = async (req, res) => {
  try {
    const { beneficiaireId } = req.params;
    
    const beneficiaire = await BeneficiaireExperimentation.findById(beneficiaireId)
      .populate({
        path: 'usager',
        model: 'UsagerRI2S'
      })
      .populate('experimentation')
      .populate('cible')
      .populate('statut')
      .populate({
        path: 'historique_statuts.statut',
        model: 'StatutCible'
      });
    
    if (!beneficiaire) {
      return res.status(404).json({
        message: 'Bénéficiaire non trouvé'
      });
    }
    
    // Récupérer les valeurs des champs
    const valeursChamps = await ValeurChampStatut.find({ 
      beneficiaire: beneficiaireId,
      champ: { $exists: true, $ne: null }
    }).populate('champ');
    
    // Récupérer les valeurs des champs communs
    const valeursChampCommuns = await ValeurChampStatut.find({ 
      beneficiaire: beneficiaireId,
      champ_commun: { $exists: true, $ne: null }
    }).populate('champ_commun');
    
    res.status(200).json({
      beneficiaire,
      valeursChamps,
      valeursChampCommuns
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du bénéficiaire:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du bénéficiaire',
      error: error.message
    });
  }
};

// 5) Associer un bénéficiaire existant à une expérimentation avec statut
exports.associateToExperimentation = async (req, res) => {
  try {
    const { pseudoId } = req.params;
    const { 
      experimentationId, 
      cibleId, 
      statutId,
      valeurs_champs,
      valeurs_champs_communs
    } = req.body;

    // Trouver le bénéficiaire pseudonymisé
    const pseudoBeneficiary = await PseudonymizedBeneficiary.findOne({ pseudoId });
    if (!pseudoBeneficiary) {
      return res.status(404).json({ message: 'Bénéficiaire introuvable' });
    }

    // Récupérer l'ID de l'UsagerRI2S
    const usagerId = pseudoBeneficiary.usagerRI2S;
    if (!usagerId) {
      return res.status(404).json({ message: 'Bénéficiaire invalide, pas d\'UsagerRI2S associé' });
    }

    // Vérifications préalables
    const experimentation = await Experimentation.findById(experimentationId);
    if (!experimentation) {
      return res.status(404).json({ message: 'Expérimentation non trouvée' });
    }

    const cible = await CibleExperimentation.findOne({ 
      _id: cibleId,
      experimentation: experimentationId 
    });
    if (!cible) {
      return res.status(404).json({ message: 'Cible non trouvée ou n\'appartient pas à cette expérimentation' });
    }

    const statut = await StatutCible.findOne({ 
      _id: statutId,
      cible: cibleId 
    });
    if (!statut) {
      return res.status(404).json({ message: 'Statut non trouvé ou n\'appartient pas à cette cible' });
    }

    // Vérifier si déjà associé
    const existingAssociation = await BeneficiaireExperimentation.findOne({
      usager: usagerId,
      usagerModel: 'UsagerRI2S',
      experimentation: experimentationId,
      cible: cibleId
    });
    
    if (existingAssociation) {
      return res.status(400).json({ 
        message: 'Ce bénéficiaire est déjà associé à cette expérimentation avec cette cible' 
      });
    }

    // Validation des valeurs des champs
    if (valeurs_champs) {
      for (const champId of Object.keys(valeurs_champs)) {
        const champ = await ChampStatut.findOne({
          _id: champId,
          statut: statutId
        });
        
        if (champ && !validateValue(valeurs_champs[champId], champ.type_champ, champ.options)) {
          return res.status(400).json({
            message: `Valeur invalide pour le champ "${champ.nom_champ}" de type ${champ.type_champ}`
          });
        }
      }
    }

    if (valeurs_champs_communs) {
      for (const champId of Object.keys(valeurs_champs_communs)) {
        const champCommun = await ChampCommun.findOne({
          _id: champId,
          experimentation: experimentationId
        });
        
        if (champCommun && !validateValue(valeurs_champs_communs[champId], champCommun.type_champ, champCommun.options)) {
          return res.status(400).json({
            message: `Valeur invalide pour le champ commun "${champCommun.nom_champ}" de type ${champCommun.type_champ}`
          });
        }
      }
    }

    // Créer l'association
    const beneficiaire = await BeneficiaireExperimentation.create({
      usager: usagerId,
      usagerModel: 'UsagerRI2S',
      experimentation: experimentationId,
      cible: cibleId,
      statut: statutId,
      historique_statuts: [{
        statut: statutId,
        date_changement: new Date(),
        note: 'Association initiale'
      }]
    });

    // Traiter les valeurs des champs
    const promises = [];
    
    if (valeurs_champs && Object.keys(valeurs_champs).length > 0) {
      for (const champId of Object.keys(valeurs_champs)) {
        const champ = await ChampStatut.findOne({
          _id: champId,
          statut: statutId
        });

        if (champ) {
          promises.push(
            ValeurChampStatut.create({
              beneficiaire: beneficiaire._id,
              champ: champId,
              valeur: valeurs_champs[champId]
            })
          );
        }
      }
    }

    if (valeurs_champs_communs && Object.keys(valeurs_champs_communs).length > 0) {
      for (const champId of Object.keys(valeurs_champs_communs)) {
        const champCommun = await ChampCommun.findOne({
          _id: champId,
          experimentation: experimentationId
        });

        if (champCommun) {
          promises.push(
            ValeurChampStatut.create({
              beneficiaire: beneficiaire._id,
              champ_commun: champId,
              valeur: valeurs_champs_communs[champId]
            })
          );
        }
      }
    }
    
    await Promise.all(promises);

    // Ajouter l'expérimentation à la liste des expérimentations du bénéficiaire
    if (experimentation && !pseudoBeneficiary.experiments.includes(experimentation.name)) {
      pseudoBeneficiary.experiments.push(experimentation.name);
      await pseudoBeneficiary.save();
    }

    res.status(200).json({ 
      message: 'Bénéficiaire associé à l\'expérimentation avec succès',
      data: await BeneficiaireExperimentation.findById(beneficiaire._id)
        .populate({
          path: 'usager',
          model: 'UsagerRI2S'
        })
        .populate('experimentation')
        .populate('cible')
        .populate('statut')
    });
  } catch (error) {
    console.error('Erreur d\'association:', error);
    res.status(500).json({ error: error.message });
  }
};

// 6) Récupérer les associations d'un bénéficiaire
exports.getBeneficiaryExperimentations = async (req, res) => {
  try {
    const { pseudoId } = req.params;

    // Trouver le bénéficiaire pseudonymisé
    const pseudoBeneficiary = await PseudonymizedBeneficiary.findOne({ pseudoId });
    if (!pseudoBeneficiary) {
      return res.status(404).json({ message: 'Bénéficiaire introuvable' });
    }

    // Récupérer les associations
    const associations = await BeneficiaireExperimentation.find({
      usager: pseudoBeneficiary.usagerRI2S,
      usagerModel: 'UsagerRI2S'
    })
    .populate('experimentation')
    .populate('cible')
    .populate('statut')
    .populate({
      path: 'historique_statuts.statut',
      model: 'StatutCible'
    });

    res.status(200).json(associations);
  } catch (error) {
    console.error('Erreur lors de la récupération des expérimentations:', error);
    res.status(500).json({ error: error.message });
  }
};

// 7) Gérer les valeurs des champs
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
    console.error('Erreur lors de la récupération des valeurs:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des valeurs',
      error: error.message
    });
  }
};

// 8) Mettre à jour une valeur de champ
exports.updateValeurChamp = async (req, res) => {
  try {
    const { valeurId } = req.params;
    const { valeur } = req.body;
    
    // Trouver la valeur existante
    const valeurChamp = await ValeurChampStatut.findById(valeurId);
    if (!valeurChamp) {
      return res.status(404).json({ message: 'Valeur de champ non trouvée' });
    }
    
    // Valider la nouvelle valeur selon le type du champ
    if (valeurChamp.champ) {
      const champ = await ChampStatut.findById(valeurChamp.champ);
      if (champ && !validateValue(valeur, champ.type_champ, champ.options)) {
        return res.status(400).json({ 
          message: `Valeur invalide pour le champ "${champ.nom_champ}" de type ${champ.type_champ}` 
        });
      }
    } else if (valeurChamp.champ_commun) {
      const champCommun = await ChampCommun.findById(valeurChamp.champ_commun);
      if (champCommun && !validateValue(valeur, champCommun.type_champ, champCommun.options)) {
        return res.status(400).json({ 
          message: `Valeur invalide pour le champ "${champCommun.nom_champ}" de type ${champCommun.type_champ}` 
        });
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