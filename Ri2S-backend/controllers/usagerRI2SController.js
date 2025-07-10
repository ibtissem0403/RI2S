// controllers/usagerRI2SController.js
const UsagerRI2S = require('../models/UsagerRI2S');
const PseudonymizedBeneficiary = require('../models/PseudonymizedBeneficiary');
const generatePseudonym = require('../utils/pseudoGenerator');
const generateDossierNumber = require('../utils/dossierGenerator');
const mongoose = require('mongoose');

// Créer un nouvel usager RI2S avec pseudonymisation directe
exports.createUsagerRI2S = async (req, res) => {
  try {
    const {
      fullName,
      firstName,
      email,
      phone,
      type_usager,
      role,
      // Champs spécifiques au type pro
      specialite,
      villeExercice,
      zoneGeographiquePatients,
      milieuExercice,
      nomStructure,
      // Champs spécifiques au type senior
      codePostal,
      dateNaissance,
      horairePrefere,
      // Champs spécifiques au type aidant
      lien_avec_senior,
      // Informations complémentaires
      notes,
      // Champs pour l'expérimentation (optionnels)
      experimentation
    } = req.body;

    // Vérifications selon le type d'usager
    if (type_usager === 'pro' && !specialite) {
      return res.status(400).json({ 
        message: 'La spécialité est requise pour un professionnel de santé' 
      });
    }

    if (type_usager === 'non_pro' && role === 'aidant' && !lien_avec_senior) {
      return res.status(400).json({ 
        message: 'Le lien avec le senior est requis pour un aidant' 
      });
    }

    // Vérifier si l'usager existe déjà
    const existingUsager = await UsagerRI2S.findOne({
      email
    });

    if (existingUsager) {
      return res.status(409).json({ 
        message: 'Un usager avec cet email existe déjà',
        usager: existingUsager
      });
    }

    // Créer le nouvel usager
    const usagerData = {
      fullName,
      firstName,
      email,
      phone,
      type_usager,
      role,
      createdBy: req.user._id
    };

    // Ajouter les champs spécifiques selon le type
    if (type_usager === 'pro') {
      usagerData.specialite = specialite;
      usagerData.villeExercice = villeExercice;
      usagerData.zoneGeographiquePatients = zoneGeographiquePatients;
      usagerData.milieuExercice = milieuExercice;
      usagerData.nomStructure = nomStructure;
    } else if (type_usager === 'non_pro') {
      if (role === 'senior') {
        usagerData.codePostal = codePostal;
        usagerData.dateNaissance = dateNaissance;
        usagerData.horairePrefere = horairePrefere;
      } else if (role === 'aidant') {
        // Vérifier que le senior existe
        const senior = await UsagerRI2S.findById(lien_avec_senior);
        if (!senior) {
          return res.status(404).json({ message: 'Senior non trouvé' });
        }
        if (senior.role !== 'senior') {
          return res.status(400).json({ message: 'L\'ID fourni ne correspond pas à un senior' });
        }
        
        usagerData.lien_avec_senior = lien_avec_senior;
      }
    }

    // Créer l'usager RI2S
    const usager = await UsagerRI2S.create(usagerData);

    // Génération d'un numéro de dossier
    let dossierNumber;
    
    // Si une expérimentation est spécifiée, utiliser son code
    if (experimentation) {
      const Experimentation = require('../models/Experimentation');
      const expData = await Experimentation.findById(experimentation);
      if (expData && expData.code) {
        dossierNumber = await generateDossierNumber(expData.code);
      } else {
        // Sinon, utiliser un code générique basé sur le type d'utilisateur
        const typeCode = type_usager === 'pro' ? 'PRO' : (role === 'senior' ? 'SEN' : 'AID');
        dossierNumber = await generateDossierNumber(typeCode);
      }
    } else {
      // Code par défaut si pas d'expérimentation
      const typeCode = type_usager === 'pro' ? 'PRO' : (role === 'senior' ? 'SEN' : 'AID');
      dossierNumber = await generateDossierNumber(typeCode);
    }
    
    console.log(`Dossier généré: ${dossierNumber} pour ${fullName} ${firstName} (${type_usager}, ${role})`);

    // Générer un pseudonyme
    const expName = experimentation ? 'RI2S_' + type_usager.toUpperCase() : 'RI2S';
    const { pseudoId, pseudoName } = await generatePseudonym(
      expName,
      fullName,
      firstName
    );

    // Créer le bénéficiaire pseudonymisé directement lié à l'usager RI2S
    const pseudo = await PseudonymizedBeneficiary.create({
      pseudoId,
      pseudoName,
      status: 'Actif',
      category: type_usager === 'pro' ? role : type_usager + '_' + role,
      experiments: experimentation ? [expName] : ['RI2S_System'],
      dossierNumber,
      inclusionDate: new Date(),
      notes: notes || '',
      usagerRI2S: usager._id
    });

    // Mettre à jour l'usager avec l'ID du pseudonyme
    usager.pseudoId = pseudo.pseudoId;
    await usager.save();

    res.status(201).json({
      message: 'Usager RI2S créé avec succès et pseudonymisé',
      data: {
        usager,
        pseudo: {
          pseudoId: pseudo.pseudoId,
          pseudoName: pseudo.pseudoName,
          dossierNumber: pseudo.dossierNumber
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'usager RI2S:', error);
    res.status(500).json({ error: error.message });
  }
};

// Récupérer tous les usagers RI2S
exports.getAllUsagersRI2S = async (req, res) => {
  try {
    const { type, role, search } = req.query;
    
    // Construire le filtre de recherche
    const filter = {};
    
    if (type) {
      filter.type_usager = type;
    }
    
    if (role) {
      filter.role = role;
    }
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Obtenir les usagers
    const usagers = await UsagerRI2S.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'fullName email')
      .populate('lien_avec_senior', 'fullName firstName');
      
    // Récupérer les informations pseudonymisées pour chaque usager
    const usagersWithPseudo = await Promise.all(usagers.map(async (usager) => {
      const usagerObj = usager.toObject();
      
      // Trouver le bénéficiaire pseudonymisé correspondant
      const pseudo = await PseudonymizedBeneficiary.findOne({ usagerRI2S: usager._id });
      
      if (pseudo) {
        usagerObj.pseudo = {
          pseudoId: pseudo.pseudoId,
          pseudoName: pseudo.pseudoName,
          dossierNumber: pseudo.dossierNumber,
          inclusionDate: pseudo.inclusionDate,
          status: pseudo.status
        };
      }
      
      return usagerObj;
    }));
    
    res.json(usagersWithPseudo);
  } catch (error) {
    console.error('Erreur lors de la récupération des usagers RI2S:', error);
    res.status(500).json({ error: error.message });
  }
};

// Récupérer un usager RI2S par ID
exports.getUsagerRI2SById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usager = await UsagerRI2S.findById(id)
      .populate('createdBy', 'fullName email')
      .populate('lien_avec_senior', 'fullName firstName');
    
    if (!usager) {
      return res.status(404).json({ message: 'Usager RI2S non trouvé' });
    }
    
    // Récupérer les informations pseudonymisées
    const pseudo = await PseudonymizedBeneficiary.findOne({ usagerRI2S: usager._id });
    
    const usagerObj = usager.toObject();
    if (pseudo) {
      usagerObj.pseudo = {
        pseudoId: pseudo.pseudoId,
        pseudoName: pseudo.pseudoName,
        dossierNumber: pseudo.dossierNumber,
        inclusionDate: pseudo.inclusionDate,
        status: pseudo.status,
        category: pseudo.category,
        experiments: pseudo.experiments
      };
    }
    
    res.json(usagerObj);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'usager RI2S:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour un usager RI2S
exports.updateUsagerRI2S = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validation selon le type d'usager
    if (updates.type_usager === 'pro' && !updates.specialite) {
      return res.status(400).json({ 
        message: 'La spécialité est requise pour un professionnel de santé' 
      });
    }

    if (updates.type_usager === 'non_pro' && updates.role === 'aidant' && !updates.lien_avec_senior) {
      return res.status(400).json({ 
        message: 'Le lien avec le senior est requis pour un aidant' 
      });
    }
    
    // Récupérer l'usager avant la mise à jour
    const usager = await UsagerRI2S.findById(id);
    if (!usager) {
      return res.status(404).json({ message: 'Usager RI2S non trouvé' });
    }
    
    // Mise à jour de l'usager
    const updatedUsager = await UsagerRI2S.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    // Rechercher le bénéficiaire pseudonymisé associé
    const pseudo = await PseudonymizedBeneficiary.findOne({ usagerRI2S: id });
    
    if (pseudo && (updates.fullName !== usager.fullName || updates.firstName !== usager.firstName)) {
      // Si le nom a changé, générer un nouveau pseudonyme
      const { pseudoName } = await generatePseudonym(
        pseudo.experiments[0] || 'RI2S',
        updates.fullName || usager.fullName,
        updates.firstName || usager.firstName
      );
      
      // Mettre à jour le pseudonyme
      const updatedPseudo = await PseudonymizedBeneficiary.findByIdAndUpdate(
        pseudo._id,
        {
          pseudoName,
          status: updates.status || pseudo.status,
          category: updates.type_usager === 'pro' ? updates.role : updates.type_usager + '_' + updates.role,
          notes: updates.notes || pseudo.notes,
          lastUpdated: new Date()
        },
        { new: true }
      );
      
      res.json({
        message: 'Usager RI2S et pseudonyme mis à jour avec succès',
        data: {
          usager: updatedUsager,
          pseudo: {
            pseudoId: updatedPseudo.pseudoId,
            pseudoName: updatedPseudo.pseudoName,
            dossierNumber: updatedPseudo.dossierNumber,
            status: updatedPseudo.status
          }
        }
      });
    } else if (pseudo) {
      // Mise à jour du pseudonyme sans changer le pseudoName
      const updatedPseudo = await PseudonymizedBeneficiary.findByIdAndUpdate(
        pseudo._id,
        {
          status: updates.status || pseudo.status,
          category: updates.type_usager === 'pro' ? updates.role : updates.type_usager + '_' + updates.role,
          notes: updates.notes || pseudo.notes,
          lastUpdated: new Date()
        },
        { new: true }
      );
      
      res.json({
        message: 'Usager RI2S et pseudonyme mis à jour avec succès',
        data: {
          usager: updatedUsager,
          pseudo: {
            pseudoId: updatedPseudo.pseudoId,
            pseudoName: updatedPseudo.pseudoName,
            dossierNumber: updatedPseudo.dossierNumber,
            status: updatedPseudo.status
          }
        }
      });
    } else {
      // Si pas de pseudonyme, créer un nouveau pseudonyme
      const typeCode = updates.type_usager === 'pro' ? 'PRO' : (updates.role === 'senior' ? 'SEN' : 'AID');
      const dossierNumber = await generateDossierNumber(typeCode);
      
      const { pseudoId, pseudoName } = await generatePseudonym(
        'RI2S',
        updates.fullName || usager.fullName,
        updates.firstName || usager.firstName
      );
      
      const newPseudo = await PseudonymizedBeneficiary.create({
        pseudoId,
        pseudoName,
        status: 'Actif',
        category: updates.type_usager === 'pro' ? updates.role : updates.type_usager + '_' + updates.role,
        experiments: ['RI2S_System'],
        dossierNumber,
        inclusionDate: new Date(),
        notes: updates.notes || '',
        usagerRI2S: usager._id
      });
      
      // Mettre à jour l'usager avec l'ID du pseudonyme
      updatedUsager.pseudoId = newPseudo.pseudoId;
      await updatedUsager.save();
      
      res.json({
        message: 'Usager RI2S mis à jour et nouveau pseudonyme créé',
        data: {
          usager: updatedUsager,
          pseudo: {
            pseudoId: newPseudo.pseudoId,
            pseudoName: newPseudo.pseudoName,
            dossierNumber: newPseudo.dossierNumber,
            status: newPseudo.status
          }
        }
      });
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'usager RI2S:', error);
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un usager RI2S
exports.deleteUsagerRI2S = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Trouver l'usager RI2S
      const usager = await UsagerRI2S.findById(id).session(session);
      if (!usager) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Usager RI2S non trouvé' });
      }
      
      // Trouver et supprimer le pseudonyme associé
      const pseudo = await PseudonymizedBeneficiary.findOne({ usagerRI2S: id }).session(session);
      if (pseudo) {
        await PseudonymizedBeneficiary.deleteOne({ _id: pseudo._id }).session(session);
      }
      
      // Vérifier s'il existe des associations avec des expérimentations
      const BeneficiaireExperimentation = require('../models/BeneficiaireExperimentation');
      const experimentations = await BeneficiaireExperimentation.find({ 
        usager: id,
        usagerModel: 'UsagerRI2S'
      }).session(session);
      
      if (experimentations.length > 0) {
        await session.abortTransaction();
        return res.status(400).json({ 
          message: 'Impossible de supprimer cet usager car il est associé à des expérimentations',
          experimentationsCount: experimentations.length
        });
      }
      
      // Supprimer l'usager RI2S
      await UsagerRI2S.deleteOne({ _id: id }).session(session);
      
      await session.commitTransaction();
      
      res.json({ 
        message: 'Usager RI2S et pseudonyme supprimés avec succès',
        deletedPseudo: pseudo ? pseudo.pseudoId : null
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'usager RI2S:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rechercher des usagers RI2S
exports.searchUsagersRI2S = async (req, res) => {
  try {
    const { query, type, role } = req.query;
    
    // Construire le filtre de recherche
    const filter = {};
    
    if (query) {
      filter.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (type) {
      filter.type_usager = type;
    }
    
    if (role) {
      filter.role = role;
    }
    
    const usagers = await UsagerRI2S.find(filter)
      .limit(20)
      .sort({ fullName: 1, firstName: 1 });
    
    // Ajouter les informations pseudonymisées
    const usagersWithPseudo = await Promise.all(usagers.map(async (usager) => {
      const usagerObj = usager.toObject();
      
      // Trouver le bénéficiaire pseudonymisé correspondant
      const pseudo = await PseudonymizedBeneficiary.findOne({ usagerRI2S: usager._id });
      
      if (pseudo) {
        usagerObj.pseudo = {
          pseudoId: pseudo.pseudoId,
          pseudoName: pseudo.pseudoName,
          dossierNumber: pseudo.dossierNumber
        };
      }
      
      return usagerObj;
    }));
    
    res.json(usagersWithPseudo);
  } catch (error) {
    console.error('Erreur lors de la recherche des usagers RI2S:', error);
    res.status(500).json({ error: error.message });
  }
};

// Rattacher un usager RI2S à une expérimentation
exports.rattacherUsagerAExperimentation = async (req, res) => {
  try {
    const { usagerId } = req.params;
    const { 
      experimentationId, 
      cibleId, 
      statutId,
      valeurs_champs,
      valeurs_champs_communs
    } = req.body;
    
    // Vérifier que l'usager existe
    const usager = await UsagerRI2S.findById(usagerId);
    if (!usager) {
      return res.status(404).json({ message: 'Usager RI2S non trouvé' });
    }
    
    // Trouver le pseudonyme associé
    const pseudo = await PseudonymizedBeneficiary.findOne({ usagerRI2S: usagerId });
    if (!pseudo) {
      return res.status(404).json({ message: 'Pseudonyme associé non trouvé' });
    }
    
    // Vérifier que l'expérimentation existe
    const Experimentation = require('../models/Experimentation');
    const experimentation = await Experimentation.findById(experimentationId);
    if (!experimentation) {
      return res.status(404).json({ message: 'Expérimentation non trouvée' });
    }
    
    // Vérifier que la cible existe pour cette expérimentation
    const CibleExperimentation = require('../models/CibleExperimentation');
    const cible = await CibleExperimentation.findOne({ 
      _id: cibleId,
      experimentation: experimentationId 
    });
    if (!cible) {
      return res.status(404).json({ message: 'Cible non trouvée ou n\'appartient pas à cette expérimentation' });
    }
    
    // Vérifier que le statut existe pour cette cible
    const StatutCible = require('../models/StatutCible');
    const statut = await StatutCible.findOne({ 
      _id: statutId,
      cible: cibleId 
    });
    if (!statut) {
      return res.status(404).json({ message: 'Statut non trouvé ou n\'appartient pas à cette cible' });
    }
    
    // Vérifier si déjà rattaché
    const BeneficiaireExperimentation = require('../models/BeneficiaireExperimentation');
    const existingRattachement = await BeneficiaireExperimentation.findOne({
      usager: usagerId,
      usagerModel: 'UsagerRI2S',
      experimentation: experimentationId,
      cible: cibleId
    });
    
    if (existingRattachement) {
      return res.status(400).json({ 
        message: 'Cet usager est déjà rattaché à cette expérimentation avec cette cible' 
      });
    }
    
    // Créer le rattachement
    const beneficiaire = await BeneficiaireExperimentation.create({
      usager: usagerId,
      usagerModel: 'UsagerRI2S',
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
      const ValeurChampStatut = require('../models/ValeurChampStatut');
      const ChampStatut = require('../models/ChampStatut');
      
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
      const ValeurChampStatut = require('../models/ValeurChampStatut');
      const ChampCommun = require('../models/ChampCommun');
      
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
    
    // Ajouter l'expérimentation à la liste des expérimentations du bénéficiaire pseudonymisé
    if (experimentation && !pseudo.experiments.includes(experimentation.name)) {
      pseudo.experiments.push(experimentation.name);
      await pseudo.save();
    }
    
    // Récupérer le bénéficiaire complet
    const beneficiaireComplet = await BeneficiaireExperimentation.findById(beneficiaire._id)
      .populate({
        path: 'usager',
        model: 'UsagerRI2S'
      })
      .populate('experimentation')
      .populate('cible')
      .populate('statut');
    
    res.status(201).json({
      message: 'Usager rattaché avec succès à l\'expérimentation',
      data: beneficiaireComplet
    });
  } catch (error) {
    console.error('Erreur lors du rattachement à l\'expérimentation:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir les seniors disponibles pour association avec un aidant
exports.getSeniorsDisponibles = async (req, res) => {
  try {
    // Récupérer tous les seniors
    const seniors = await UsagerRI2S.find({
      type_usager: 'non_pro',
      role: 'senior'
    }).select('_id fullName firstName email phone');
    
    // Ajouter les informations pseudonymisées
    const seniorsWithPseudo = await Promise.all(seniors.map(async (senior) => {
      const seniorObj = senior.toObject();
      
      // Trouver le bénéficiaire pseudonymisé correspondant
      const pseudo = await PseudonymizedBeneficiary.findOne({ usagerRI2S: senior._id });
      
      if (pseudo) {
        seniorObj.pseudo = {
          pseudoId: pseudo.pseudoId,
          pseudoName: pseudo.pseudoName
        };
      }
      
      return seniorObj;
    }));
    
    res.json(seniorsWithPseudo);
  } catch (error) {
    console.error('Erreur lors de la récupération des seniors:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir les usagers par type et rôle
exports.getUsagersByTypeAndRole = async (req, res) => {
  try {
    const { type, role } = req.params;
    
    const usagers = await UsagerRI2S.find({
      type_usager: type,
      role: role
    }).sort({ fullName: 1, firstName: 1 });
    
    // Ajouter les informations pseudonymisées
    const usagersWithPseudo = await Promise.all(usagers.map(async (usager) => {
      const usagerObj = usager.toObject();
      
      // Trouver le bénéficiaire pseudonymisé correspondant
      const pseudo = await PseudonymizedBeneficiary.findOne({ usagerRI2S: usager._id });
      
      if (pseudo) {
        usagerObj.pseudo = {
          pseudoId: pseudo.pseudoId,
          pseudoName: pseudo.pseudoName,
          dossierNumber: pseudo.dossierNumber
        };
      }
      
      return usagerObj;
    }));
    
    res.json(usagersWithPseudo);
  } catch (error) {
    console.error('Erreur lors de la récupération des usagers par type et rôle:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtenir un usager par pseudoId
exports.getUsagerByPseudoId = async (req, res) => {
  try {
    const { pseudoId } = req.params;
    
    // Trouver le bénéficiaire pseudonymisé
    const pseudo = await PseudonymizedBeneficiary.findOne({ pseudoId });
    if (!pseudo) {
      return res.status(404).json({ message: 'Pseudonyme non trouvé' });
    }
    
    // Trouver l'usager RI2S associé
    const usager = await UsagerRI2S.findById(pseudo.usagerRI2S)
      .populate('createdBy', 'fullName email')
      .populate('lien_avec_senior', 'fullName firstName');
    
    if (!usager) {
      return res.status(404).json({ message: 'Usager RI2S associé non trouvé' });
    }
    
    const usagerObj = usager.toObject();
    usagerObj.pseudo = {
      pseudoId: pseudo.pseudoId,
      pseudoName: pseudo.pseudoName,
      dossierNumber: pseudo.dossierNumber,
      inclusionDate: pseudo.inclusionDate,
      status: pseudo.status,
      category: pseudo.category,
      experiments: pseudo.experiments
    };
    
    res.json(usagerObj);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'usager par pseudoId:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;