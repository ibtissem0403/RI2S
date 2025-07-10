const RealBeneficiary = require("../models/RealBeneficiary");
const PseudonymizedBeneficiary = require("../models/PseudonymizedBeneficiary");
const generatePseudonym = require("../utils/pseudoGenerator");
const ClinicalData = require("../models/ClinicalData");
const BeneficiaryClinicalLink = require("../models/BeneficiaryClinicalLink");
const generateDossierNumber = require("../utils/dossierGenerator");
const Cohort = require("../models/Cohort");
const BeneficiaireExperimentation = require('../models/BeneficiaireExperimentation');
const ValeurChampStatut = require('../models/ValeurChampStatut');
const ChampStatut = require('../models/ChampStatut');
const ChampCommun = require('../models/ChampCommun');
const StatutCible = require('../models/StatutCible');
const CibleExperimentation = require('../models/CibleExperimentation');
const Experimentation = require('../models/Experimentation');
const mongoose = require("mongoose");


const upload = require("../config/multer");

// 1) CRÉER UN BÉNÉFICIAIRE avec recopie de l'expérimentation
exports.createBeneficiary = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Authentification requise" });
    }

    // Récupération de l'utilisateur authentifié
    const currentUser = req.user;

    // Extraction des champs du body
    const {
      fullName,
      firstName,
      birthDate,
      sex,
      address,
      phone,
      status,
      caregiver,
      cohort: cohortId,
      inclusionDate,
      recruitmentMethod,
      recruiter: recruiterFromBody,
    } = req.body;

    const cohort = await Cohort.findById(cohortId)
      .populate("experimentation")
      .lean();

    // Début des vérifications (à ajouter)
    console.log("[DEBUG] Cohorte complète:", JSON.stringify(cohort, null, 2));

    if (!cohort) {
      console.error("[ERREUR] Aucune cohorte trouvée pour ID:", cohortId);
      return res.status(400).json({ error: "Cohorte introuvable" });
    }

    if (!cohort.experimentation) {
      console.error(
        "[ERREUR] Pas d'expérimentation liée à la cohorte:",
        cohortId
      );
      return res.status(400).json({ error: "Aucune expérimentation liée" });
    }

    if (!cohort.experimentation.code) {
      console.error(
        "[ERREUR] Code manquant pour l'expérimentation:",
        cohort.experimentation
      );
      return res
        .status(500)
        .json({ error: "Code d'expérimentation non configuré" });
    }
    // 5. Génération du numéro de dossier
    const dossierNumber = await generateDossierNumber(
      cohort.experimentation.code
    );

    // Détermination du recruiter
    const recruiter = recruiterFromBody || (currentUser && currentUser._id);
    if (!recruiter) {
      return res.status(400).json({ error: "Le champ recruiter est requis" });
    }

    // Création du bénéficiaire réel
    let real = await RealBeneficiary.create({
      fullName,
      firstName,
      birthDate,
      sex,
      address,
      phone,
      status,
      caregiver,
      recruiter,
      cohort: cohortId,
      dossierNumber,
      inclusionDate,
      recruitmentMethod,
    });

    if (req.files && req.files.length > 0) {
      const populatedReal = await RealBeneficiary.findById(real._id).populate({
        path: "cohort",
        populate: { path: "experimentation" },
      });
      await Promise.all(
        req.files.map(async (file) => {
          // Création de la donnée clinique
          const clinicalData = await ClinicalData.create({
            realBeneficiary: real._id,
            experimentation: real.cohort?.experimentation?.name || "Presage",
            examType: "Document",
            examDate: new Date(),
            result: "Fichier joint",
            fileUrl: `/uploads/${file.filename}`,
            fileName: file.originalname,
            fileMimeType: file.mimetype,
            recordedBy: req.user._id,
          });
          // Création du lien avec vérification des doublons
          await BeneficiaryClinicalLink.create({
            beneficiary: real._id,
            clinicalData: clinicalData._id,
            createdBy: req.user._id,
            relationType: "Principal",
          });

          // Mise à jour du bénéficiaire réel
          await RealBeneficiary.findByIdAndUpdate(real._id, {
            $push: { clinicalData: clinicalData._id },
          });
        })
      );
    }

    // Re-fetch avec populate pour cohort et expérimentation
    real = await RealBeneficiary.findById(real._id).populate({
      path: "cohort",
      populate: { path: "experimentation" },
    });

    // Générer le pseudoId et pseudoName
    const { pseudoId, pseudoName } = await generatePseudonym(
      real.cohort.experimentation.name,
      real.fullName,
      real.firstName
    );

    // Construire automatiquement la liste des expérimentations
    const experiments =
      real.cohort && real.cohort.experimentation.name
        ? [real.cohort.experimentation.name]
        : [];

    // Enregistrer les données pseudonymisées
    const pseudo = await PseudonymizedBeneficiary.create({
      pseudoId,
      pseudoName,
      status: req.body.status,
      category: req.body.category,
      experiments,
      dossierNumber,
      inclusionDate: new Date(inclusionDate),
      realBeneficiary: real._id,
    });

    return res.status(201).json({
      message: "Bénéficiaire créé avec succès",
      data: pseudo,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};

// 2) AFFICHER TOUS LES BÉNÉFICIAIRES pseudonymisés
exports.getAllBeneficiaries = async (req, res) => {
  try {
    const list = await PseudonymizedBeneficiary.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "realBeneficiary",
        populate: {
          path: "cohort",
          populate: { path: "experimentation" },
        },
      });

    const formatted = list.map((p) => ({
      dossierNumber: p.dossierNumber,
      id: p.pseudoId,
      pseudonymizedName: p.pseudoName,
      status: p.status,
      cohort: p.realBeneficiary?.cohort?.name || "N/A",
      inclusionDate: p.inclusionDate?.toISOString() || null, // Ajout explicite
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3) AFFICHER un bénéficiaire par ID (pseudo)
// controllers/beneficiaryController.js
exports.getBeneficiary = async (req, res) => {
  try {
    const { pseudoId } = req.params;

    const beneficiary = await PseudonymizedBeneficiary.findOne({
      pseudoId,
    }).populate({
      path: "realBeneficiary",
      populate: [
        {
          path: "cohort",
          model: "Cohort",
          select: "_id name experimentation", // Spécifiez explicitement les champs
        },
        {
          path: "recruiter",
          model: "User",
          select: "_id fullName email", // Spécifiez explicitement les champs
        },
      ],
    });

    if (!beneficiary) {
      return res.status(404).json({ message: "Bénéficiaire introuvable" });
    }

    // Formatez la réponse pour inclure toutes les données nécessaires
    const response = {
      ...beneficiary.toObject(),
      realBeneficiary: {
        ...beneficiary.realBeneficiary.toObject(),
        cohort: beneficiary.realBeneficiary.cohort
          ? {
              _id: beneficiary.realBeneficiary.cohort._id,
              name: beneficiary.realBeneficiary.cohort.name,
              experimentation:
                beneficiary.realBeneficiary.cohort.experimentation,
            }
          : null,
        recruiter: beneficiary.realBeneficiary.recruiter
          ? {
              _id: beneficiary.realBeneficiary.recruiter._id,
              fullName: beneficiary.realBeneficiary.recruiter.fullName,
              email: beneficiary.realBeneficiary.recruiter.email,
            }
          : null,
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// 4) MODIFIER un bénéficiaire par ID (pseudo)
// exports.updateBeneficiary = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, category, notes, experiments } = req.body;

//     const updatedPseudo = await PseudonymizedBeneficiary.findByIdAndUpdate(
//       id,
//       { status, category, notes, experiments },
//       { new: true }
//     );

//     if (!updatedPseudo) {
//       return res.status(404).json({ message: 'Bénéficiaire introuvable' });
//     }

//     res.json({
//       message: 'Bénéficiaire mis à jour avec succès',
//       data: updatedPseudo
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

exports.updateBeneficiary = async (req, res) => {
  try {
    const { pseudoId } = req.params;
    const updateData = req.body;

    // 1. Trouver le bénéficiaire pseudonymisé avec les relations peuplées
    const pseudoBeneficiary = await PseudonymizedBeneficiary.findOne({ pseudoId })
      .populate({
        path: 'realBeneficiary',
        populate: {
          path: 'cohort',
          populate: { path: 'experimentation' }
        }
      });

    if (!pseudoBeneficiary) {
      return res.status(404).json({ message: 'Bénéficiaire introuvable' });
    }

    // Vérifier que tous les objets nécessaires existent avant d'y accéder
    const experimentationName = 
      pseudoBeneficiary?.realBeneficiary?.cohort?.experimentation?.name || 'UNKN';
    
    // 2. Générer le nouveau pseudonyme si le nom a changé
    const { pseudoName } = await generatePseudonym(
      experimentationName,
      updateData.fullName || '',
      updateData.firstName || ''
    );

    // 3. Mise à jour synchronisée des deux modèles
    try {
      // Préparation des données pour le bénéficiaire réel
      const realBeneficiaryData = {
        fullName: updateData.fullName || '',
        firstName: updateData.firstName || '',
        birthDate: updateData.birthDate || new Date(),
        sex: updateData.sex || 'M',
        address: updateData.address || '',
        phone: updateData.phone || '',
        status: updateData.status || 'Actif',
        'caregiver.name': updateData.caregiverName || '',
        'caregiver.firstName': updateData.caregiverFirstName || '',
        'caregiver.relation': updateData.caregiverRelation || '',
        'caregiver.phone': updateData.caregiverPhone || '',
        recruitmentMethod: updateData.recruitmentMethod || 'Domicile',
        inclusionDate: updateData.inclusionDate || new Date(),
      };

      // Ajouter les champs optionnels seulement s'ils sont définis
      if (updateData.cohort) realBeneficiaryData.cohort = updateData.cohort;
      if (updateData.recruiter) realBeneficiaryData.recruiter = updateData.recruiter;

      // Mise à jour des deux modèles avec gestion des erreurs individuelle
      const [updatedReal, updatedPseudo] = await Promise.all([
        // Mise à jour des données réelles
        RealBeneficiary.findByIdAndUpdate(
          pseudoBeneficiary.realBeneficiary._id,
          realBeneficiaryData,
          { new: true }
        ).catch(err => {
          console.error("Erreur lors de la mise à jour du bénéficiaire réel:", err);
          return null;
        }),

        // Mise à jour des données pseudonymisées
        PseudonymizedBeneficiary.findOneAndUpdate(
          { pseudoId },
          {
            pseudoName, // Nouveau pseudonyme généré
            status: updateData.status || 'Actif',
            inclusionDate: updateData.inclusionDate || new Date(),
            category: updateData.category,
            notes: updateData.notes,
            lastUpdated: new Date()
          },
          { new: true }
        ).catch(err => {
          console.error("Erreur lors de la mise à jour du pseudonyme:", err);
          return null;
        })
      ]);

      // Vérifier si l'une des mises à jour a échoué
      if (!updatedReal || !updatedPseudo) {
        throw new Error("Échec lors de la mise à jour synchronisée");
      }

      res.json({
        message: 'Mise à jour synchronisée réussie',
        real: updatedReal,
        pseudo: updatedPseudo
      });
    } catch (syncError) {
      console.error('Erreur de synchronisation:', syncError);
      throw new Error(`Échec de la synchronisation: ${syncError.message}`);
    }

  } catch (error) {
    console.error('Erreur complète:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// 5) SUPPRIMER les données cliniques par bénéficiaire
exports.deleteClinicalDataByBeneficiary = async (req, res) => {
  try {
    const { beneficiaryId } = req.params;

    const deleted = await ClinicalData.deleteMany({
      realBeneficiary: beneficiaryId,
    });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: "Aucune donnée trouvée" });
    }

    res.json({
      message: "Données cliniques supprimées",
      count: deleted.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// MODIFIER LA FONCTION deleteBeneficiary
exports.deleteBeneficiary = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    // 1. Trouver l'entrée pseudonymisée
    const pseudo = await PseudonymizedBeneficiary.findById(id).session(session);
    if (!pseudo) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Bénéficiaire introuvable" });
    }

    // 2. Récupérer l'ID réel
    const realId = pseudo.realBeneficiary;

    let clinicalCount = 0;
    if (realId) {
      // 3. Supprimer les données cliniques liées
      const links = await BeneficiaryClinicalLink.find({
        beneficiary: realId,
      }).session(session);
      clinicalCount = links.length;

      const clinicalIds = links.map((l) => l.clinicalData);
      await ClinicalData.deleteMany({ _id: { $in: clinicalIds } }).session(
        session
      );

      // 4. Supprimer les liens
      await BeneficiaryClinicalLink.deleteMany({ beneficiary: realId }).session(
        session
      );

      // 5. Supprimer le bénéficiaire réel
      await RealBeneficiary.findByIdAndDelete(realId).session(session);
    }

    // 6. Supprimer le pseudonyme
    await PseudonymizedBeneficiary.findByIdAndDelete(id).session(session);

    await session.commitTransaction();

    res.json({
      message: "Suppression complète réussie",
      details: {
        pseudoDeleted: id,
        realDeleted: realId,
        clinicalDataDeleted: clinicalCount,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Erreur transaction:", error);
    res.status(500).json({
      message: "Erreur lors de la suppression transactionnelle",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.getBeneficiaryClinicalData = async (req, res) => {
  try {
    const { beneficiaryId } = req.params;

    // Récupération via la table de jointure
    const links = await BeneficiaryClinicalLink.find({
      beneficiary: beneficiaryId,
    })
      .populate("clinicalData")
      .populate("createdBy", "name email");

    res.json(
      links.map((link) => ({
        document: link.clinicalData,
        relationType: link.relationType,
        uploadedBy: link.createdBy,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dans controllers/beneficiaryController.js
exports.convertPseudoIdToRealId = async (req, res) => {
  try {
    const { pseudoId } = req.params;
    
    // Trouver le bénéficiaire pseudonymisé par son pseudoId
    const pseudoBeneficiary = await PseudonymizedBeneficiary.findOne({ pseudoId });
    
    if (!pseudoBeneficiary) {
      return res.status(404).json({ message: 'Bénéficiaire non trouvé' });
    }
    
    // Renvoyer l'ID réel
    res.json({ 
      pseudoId: pseudoBeneficiary.pseudoId,
      realId: pseudoBeneficiary.realBeneficiaryId 
    });
  } catch (error) {
    console.error('Erreur conversion ID:', error);
    res.status(500).json({ error: error.message });
  }
};



