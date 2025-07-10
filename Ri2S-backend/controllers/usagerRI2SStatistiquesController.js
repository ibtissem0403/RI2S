// controllers/usagerRI2SStatistiquesController.js
const UsagerRI2S = require('../models/UsagerRI2S');
const PseudonymizedBeneficiary = require('../models/PseudonymizedBeneficiary');
const BeneficiaireExperimentation = require('../models/BeneficiaireExperimentation');
const Experimentation = require('../models/Experimentation');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

/**
 * Obtenir des statistiques générales sur les usagers RI2S
 */
exports.getStatistiquesGenerales = async (req, res) => {
  try {
    // Statistiques de base
    const totalUsagers = await UsagerRI2S.countDocuments();
    const totalPseudonymises = await PseudonymizedBeneficiary.countDocuments({ usagerRI2S: { $exists: true, $ne: null } });
    
    // Distribution par type d'usager
    const typesDistribution = await UsagerRI2S.aggregate([
      { $group: { _id: '$type_usager', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Distribution par rôle
    const rolesDistribution = await UsagerRI2S.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Statistiques par type et rôle (combinaison)
    const typeRoleDistribution = await UsagerRI2S.aggregate([
      { 
        $group: { 
          _id: { type: '$type_usager', role: '$role' }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } }
    ]);
    
    // Usagers par expérimentation (Top 5)
    const usagersParExperimentation = await BeneficiaireExperimentation.aggregate([
      {
        $match: { usagerModel: 'UsagerRI2S' }
      },
      {
        $lookup: {
          from: 'experimentations',
          localField: 'experimentation',
          foreignField: '_id',
          as: 'experimentationInfo'
        }
      },
      {
        $group: {
          _id: '$experimentation',
          nomExperimentation: { $first: { $arrayElemAt: ['$experimentationInfo.name', 0] } },
          codeExperimentation: { $first: { $arrayElemAt: ['$experimentationInfo.code', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Création par mois (12 derniers mois)
    const dateDebutAnnee = new Date();
    dateDebutAnnee.setMonth(dateDebutAnnee.getMonth() - 11);
    dateDebutAnnee.setDate(1);
    dateDebutAnnee.setHours(0, 0, 0, 0);
    
    const creationParMois = await UsagerRI2S.aggregate([
      {
        $match: {
          createdAt: { $gte: dateDebutAnnee }
        }
      },
      {
        $group: {
          _id: {
            mois: { $month: '$createdAt' },
            annee: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.annee': 1, '_id.mois': 1 }
      }
    ]);
    
    // Formater les résultats pour la création par mois
    const moisComplets = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(dateDebutAnnee);
      date.setMonth(date.getMonth() + i);
      
      const mois = date.getMonth() + 1;
      const annee = date.getFullYear();
      
      const existingData = creationParMois.find(item => 
        item._id.mois === mois && item._id.annee === annee
      );
      
      moisComplets.push({
        mois: mois,
        annee: annee,
        nom: date.toLocaleString('fr-FR', { month: 'long' }),
        count: existingData ? existingData.count : 0
      });
    }
    
    // Taux de rattachement aux expérimentations
    const usagersRattaches = await BeneficiaireExperimentation.aggregate([
      {
        $match: { usagerModel: 'UsagerRI2S' }
      },
      {
        $group: {
          _id: '$usager',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const nbUsagersRattaches = usagersRattaches.length;
    const tauxRattachement = totalUsagers > 0 ? (nbUsagersRattaches / totalUsagers) * 100 : 0;
    
    // Spécialités des professionnels (top 10)
    const specialitesPro = await UsagerRI2S.aggregate([
      {
        $match: { 
          type_usager: 'pro',
          specialite: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$specialite',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Statistiques seniors/aidants
    const nbSeniors = await UsagerRI2S.countDocuments({ 
      type_usager: 'non_pro',
      role: 'senior'
    });
    
    const nbAidants = await UsagerRI2S.countDocuments({ 
      type_usager: 'non_pro',
      role: 'aidant'
    });
    
    const nbAidantsRattaches = await UsagerRI2S.countDocuments({
      type_usager: 'non_pro',
      role: 'aidant',
      lien_avec_senior: { $exists: true, $ne: null }
    });
    
    const ratioAidantSenior = nbSeniors > 0 ? nbAidants / nbSeniors : 0;
    const pourcentageAidantsRattaches = nbAidants > 0 ? (nbAidantsRattaches / nbAidants) * 100 : 0;
    
    res.json({
      usagers: {
        total: totalUsagers,
        pseudonymises: totalPseudonymises,
        tauxPseudonymisation: totalUsagers > 0 ? (totalPseudonymises / totalUsagers) * 100 : 0
      },
      distribution: {
        parType: typesDistribution,
        parRole: rolesDistribution,
        parTypeEtRole: typeRoleDistribution
      },
      experimentations: {
        usagersParExperimentation,
        tauxRattachement,
        nbUsagersRattaches
      },
      tendances: {
        creationParMois: moisComplets
      },
      professionnels: {
        specialites: specialitesPro,
        total: await UsagerRI2S.countDocuments({ type_usager: 'pro' })
      },
      seniors: {
        total: nbSeniors
      },
      aidants: {
        total: nbAidants,
        rattachesASenior: nbAidantsRattaches,
        pourcentageRattaches: pourcentageAidantsRattaches,
        ratioAidantSenior
      },
      dateGeneration: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de la génération des statistiques:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtenir des statistiques sur une expérimentation spécifique
 */
exports.getStatistiquesExperimentation = async (req, res) => {
  try {
    const { experimentationId } = req.params;
    
    // Vérifier que l'expérimentation existe
    const experimentation = await Experimentation.findById(experimentationId);
    if (!experimentation) {
      return res.status(404).json({ message: 'Expérimentation non trouvée' });
    }
    
    // Nombre total d'usagers dans cette expérimentation
    const totalUsagers = await BeneficiaireExperimentation.countDocuments({
      experimentation: experimentationId,
      usagerModel: 'UsagerRI2S'
    });
    
    // Distribution par cible
    const distributionParCible = await BeneficiaireExperimentation.aggregate([
      {
        $match: {
          experimentation: mongoose.Types.ObjectId(experimentationId),
          usagerModel: 'UsagerRI2S'
        }
      },
      {
        $lookup: {
          from: 'cibleexperimentations',
          localField: 'cible',
          foreignField: '_id',
          as: 'cibleInfo'
        }
      },
      {
        $group: {
          _id: '$cible',
          nomCible: { $first: { $arrayElemAt: ['$cibleInfo.nom_cible', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Distribution par statut
    const distributionParStatut = await BeneficiaireExperimentation.aggregate([
      {
        $match: {
          experimentation: mongoose.Types.ObjectId(experimentationId),
          usagerModel: 'UsagerRI2S'
        }
      },
      {
        $lookup: {
          from: 'statutcibles',
          localField: 'statut',
          foreignField: '_id',
          as: 'statutInfo'
        }
      },
      {
        $group: {
          _id: '$statut',
          nomStatut: { $first: { $arrayElemAt: ['$statutInfo.nom_statut', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Évolution des inclusions par mois
    const dateDebut = experimentation.startDate || new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    
    const inclusionsParMois = await BeneficiaireExperimentation.aggregate([
      {
        $match: {
          experimentation: mongoose.Types.ObjectId(experimentationId),
          usagerModel: 'UsagerRI2S',
          createdAt: { $gte: dateDebut }
        }
      },
      {
        $group: {
          _id: {
            mois: { $month: '$createdAt' },
            annee: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.annee': 1, '_id.mois': 1 }
      }
    ]);
    
    // Formater les résultats pour la création par mois
    const moisDebut = new Date(dateDebut);
    const maintenant = new Date();
    const nbMois = (maintenant.getFullYear() - moisDebut.getFullYear()) * 12 + 
                  maintenant.getMonth() - moisDebut.getMonth() + 1;
    
    const moisComplets = [];
    for (let i = 0; i < nbMois; i++) {
      const date = new Date(moisDebut);
      date.setMonth(date.getMonth() + i);
      
      const mois = date.getMonth() + 1;
      const annee = date.getFullYear();
      
      const existingData = inclusionsParMois.find(item => 
        item._id.mois === mois && item._id.annee === annee
      );
      
      moisComplets.push({
        mois: mois,
        annee: annee,
        nom: date.toLocaleString('fr-FR', { month: 'long' }),
        count: existingData ? existingData.count : 0
      });
    }
    
    // Distribution par type d'usager
    const distributionParType = await BeneficiaireExperimentation.aggregate([
      {
        $match: {
          experimentation: mongoose.Types.ObjectId(experimentationId),
          usagerModel: 'UsagerRI2S'
        }
      },
      {
        $lookup: {
          from: 'usagerri2s',
          localField: 'usager',
          foreignField: '_id',
          as: 'usagerInfo'
        }
      },
      {
        $group: {
          _id: { 
            type: { $arrayElemAt: ['$usagerInfo.type_usager', 0] },
            role: { $arrayElemAt: ['$usagerInfo.role', 0] }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      experimentation: {
        _id: experimentation._id,
        name: experimentation.name,
        code: experimentation.code,
        startDate: experimentation.startDate,
        endDate: experimentation.endDate
      },
      usagers: {
        total: totalUsagers
      },
      distribution: {
        parCible: distributionParCible,
        parStatut: distributionParStatut,
        parType: distributionParType
      },
      tendances: {
        inclusionsParMois: moisComplets
      },
      dateGeneration: new Date()
    });
  } catch (error) {
    console.error('Erreur lors de la génération des statistiques de l\'expérimentation:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Exporter les données des usagers au format Excel
 */
exports.exporterExcel = async (req, res) => {
  try {
    const { type, role, experimentation } = req.query;
    
    // Construire le filtre
    const filter = {};
    if (type) filter.type_usager = type;
    if (role) filter.role = role;
    
    // Récupérer les usagers avec une requête populée
    let usagers = await UsagerRI2S.find(filter)
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });
    
    // Si un ID d'expérimentation est fourni, filtrer les usagers qui y participent
    if (experimentation) {
      const beneficiaires = await BeneficiaireExperimentation.find({
        experimentation,
        usagerModel: 'UsagerRI2S'
      }).distinct('usager');
      
      usagers = usagers.filter(usager => 
        beneficiaires.some(id => id.toString() === usager._id.toString())
      );
    }
    
    // Récupérer les pseudonymes et expérimentations
    const usagersEnhanced = await Promise.all(usagers.map(async (usager) => {
      const usagerObj = usager.toObject();
      
      // Récupérer le pseudonyme
      const pseudo = await PseudonymizedBeneficiary.findOne({ usagerRI2S: usager._id });
      if (pseudo) {
        usagerObj.pseudo = {
          pseudoId: pseudo.pseudoId,
          pseudoName: pseudo.pseudoName,
          dossierNumber: pseudo.dossierNumber,
          inclusionDate: pseudo.inclusionDate
        };
      }
      
      // Récupérer les expérimentations
      const experimentations = await BeneficiaireExperimentation.find({ 
        usager: usager._id,
        usagerModel: 'UsagerRI2S'
      })
      .populate('experimentation', 'name code')
      .populate('cible', 'nom_cible')
      .populate('statut', 'nom_statut');
      
      usagerObj.experimentations = experimentations.map(exp => ({
        nom: exp.experimentation ? exp.experimentation.name : 'Inconnue',
        code: exp.experimentation ? exp.experimentation.code : '',
        cible: exp.cible ? exp.cible.nom_cible : '',
        statut: exp.statut ? exp.statut.nom_statut : '',
        dateRattachement: exp.createdAt
      }));
      
      return usagerObj;
    }));
    
    // Créer un workbook Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RI2S System';
    workbook.lastModifiedBy = req.user ? req.user.fullName : 'Système';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Créer une feuille pour les usagers
    const sheetUsagers = workbook.addWorksheet('Usagers');
    
    // Définir les colonnes
    sheetUsagers.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Pseudonyme ID', key: 'pseudoId', width: 20 },
      { header: 'Pseudonyme', key: 'pseudoName', width: 15 },
      { header: 'N° Dossier', key: 'dossierNumber', width: 15 },
      { header: 'Nom', key: 'fullName', width: 20 },
      { header: 'Prénom', key: 'firstName', width: 20 },
      { header: 'Type', key: 'type_usager', width: 15 },
      { header: 'Rôle', key: 'role', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Téléphone', key: 'phone', width: 15 },
      { header: 'Date de création', key: 'createdAt', width: 20 },
      { header: 'Créé par', key: 'createdBy', width: 25 },
      { header: 'Nb. Expérimentations', key: 'nbExperimentations', width: 20 }
    ];
    
    // Formater l'en-tête
    sheetUsagers.getRow(1).font = { bold: true, size: 12 };
    sheetUsagers.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4A9540' } // Couleur verte RI2S
    };
    sheetUsagers.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    
    // Ajouter les données
    usagersEnhanced.forEach(usager => {
      sheetUsagers.addRow({
        id: usager._id.toString(),
        pseudoId: usager.pseudo ? usager.pseudo.pseudoId : '',
        pseudoName: usager.pseudo ? usager.pseudo.pseudoName : '',
        dossierNumber: usager.pseudo ? usager.pseudo.dossierNumber : '',
        fullName: usager.fullName,
        firstName: usager.firstName,
        type_usager: usager.type_usager === 'pro' ? 'Professionnel' : 'Non professionnel',
        role: usager.role,
        email: usager.email,
        phone: usager.phone,
        createdAt: usager.createdAt ? moment(usager.createdAt).format('DD/MM/YYYY') : '',
        createdBy: usager.createdBy ? `${usager.createdBy.fullName || ''} (${usager.createdBy.email || ''})` : '',
        nbExperimentations: usager.experimentations ? usager.experimentations.length : 0
      });
    });
    
    // Créer une feuille pour les expérimentations
    if (usagersEnhanced.some(u => u.experimentations && u.experimentations.length > 0)) {
      const sheetExperimentations = workbook.addWorksheet('Expérimentations');
      
      // Définir les colonnes
      sheetExperimentations.columns = [
        { header: 'ID Usager', key: 'idUsager', width: 30 },
        { header: 'Pseudonyme', key: 'pseudoName', width: 15 },
        { header: 'Nom', key: 'fullName', width: 20 },
        { header: 'Prénom', key: 'firstName', width: 20 },
        { header: 'Expérimentation', key: 'experimentation', width: 30 },
        { header: 'Code', key: 'code', width: 15 },
        { header: 'Cible', key: 'cible', width: 20 },
        { header: 'Statut', key: 'statut', width: 20 },
        { header: 'Date de rattachement', key: 'dateRattachement', width: 20 }
      ];
      
      // Formater l'en-tête
      sheetExperimentations.getRow(1).font = { bold: true, size: 12 };
      sheetExperimentations.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '22577A' } // Couleur bleue RI2S
      };
      sheetExperimentations.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      
      // Ajouter les données
      usagersEnhanced.forEach(usager => {
        if (usager.experimentations && usager.experimentations.length > 0) {
          usager.experimentations.forEach(exp => {
            sheetExperimentations.addRow({
              idUsager: usager._id.toString(),
              pseudoName: usager.pseudo ? usager.pseudo.pseudoName : '',
              fullName: usager.fullName,
              firstName: usager.firstName,
              experimentation: exp.nom,
              code: exp.code,
              cible: exp.cible,
              statut: exp.statut,
              dateRattachement: exp.dateRattachement ? moment(exp.dateRattachement).format('DD/MM/YYYY') : ''
            });
          });
        }
      });
    }
    
    // Créer une feuille pour les statistiques
    const sheetStats = workbook.addWorksheet('Statistiques');
    
    // Ajouter un titre
    sheetStats.mergeCells('A1:E1');
    sheetStats.getCell('A1').value = 'Statistiques des usagers RI2S';
    sheetStats.getCell('A1').font = { bold: true, size: 16 };
    sheetStats.getCell('A1').alignment = { horizontal: 'center' };
    
    // Ajouter la date de génération
    sheetStats.mergeCells('A2:E2');
    sheetStats.getCell('A2').value = `Rapport généré le ${moment().format('DD/MM/YYYY à HH:mm')}`;
    sheetStats.getCell('A2').font = { italic: true, size: 12 };
    sheetStats.getCell('A2').alignment = { horizontal: 'center' };
    
    // Espacement
    sheetStats.addRow([]);
    
    // Répartition par type
    sheetStats.mergeCells('A4:E4');
    sheetStats.getCell('A4').value = 'Répartition par type d\'usager';
    sheetStats.getCell('A4').font = { bold: true, size: 14 };
    
    sheetStats.addRow(['Type', 'Nombre', 'Pourcentage']);
    sheetStats.getRow(5).font = { bold: true };
    
    const typesCount = {};
    usagersEnhanced.forEach(usager => {
      typesCount[usager.type_usager] = (typesCount[usager.type_usager] || 0) + 1;
    });
    
    Object.entries(typesCount).forEach(([type, count]) => {
      const percentage = (count / usagersEnhanced.length * 100).toFixed(2);
      sheetStats.addRow([
        type === 'pro' ? 'Professionnel' : 'Non professionnel', 
        count, 
        `${percentage}%`
      ]);
    });
    
    // Espacement
    sheetStats.addRow([]);
    
    // Répartition par rôle
    sheetStats.mergeCells('A9:E9');
    sheetStats.getCell('A9').value = 'Répartition par rôle';
    sheetStats.getCell('A9').font = { bold: true, size: 14 };
    
    sheetStats.addRow(['Rôle', 'Nombre', 'Pourcentage']);
    sheetStats.getRow(11).font = { bold: true };
    
    const rolesCount = {};
    usagersEnhanced.forEach(usager => {
      rolesCount[usager.role] = (rolesCount[usager.role] || 0) + 1;
    });
    
    Object.entries(rolesCount).forEach(([role, count]) => {
      const percentage = (count / usagersEnhanced.length * 100).toFixed(2);
      sheetStats.addRow([role, count, `${percentage}%`]);
    });
    
    // Espacement
    sheetStats.addRow([]);
    sheetStats.addRow([]);
    
    // Répartition par expérimentation
    sheetStats.mergeCells('A15:E15');
    sheetStats.getCell('A15').value = 'Participation aux expérimentations';
    sheetStats.getCell('A15').font = { bold: true, size: 14 };
    
    sheetStats.addRow(['Expérimentation', 'Nombre d\'usagers', 'Pourcentage']);
    sheetStats.getRow(17).font = { bold: true };
    
    const expCount = {};
    usagersEnhanced.forEach(usager => {
      if (usager.experimentations) {
        usager.experimentations.forEach(exp => {
          expCount[exp.nom] = (expCount[exp.nom] || 0) + 1;
        });
      }
    });
    
    Object.entries(expCount).forEach(([exp, count]) => {
      const percentage = (count / usagersEnhanced.length * 100).toFixed(2);
      sheetStats.addRow([exp, count, `${percentage}%`]);
    });
    
    // Définir les en-têtes de réponse
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=usagers_ri2s_${moment().format('YYYY-MM-DD')}.xlsx`);
    
    // Envoyer le workbook
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Exporter les données des usagers au format PDF
 */
exports.exporterPDF = async (req, res) => {
  try {
    const { type, role, experimentation } = req.query;
    
    // Construire le filtre
    const filter = {};
    if (type) filter.type_usager = type;
    if (role) filter.role = role;
    
    // Récupérer les usagers avec une requête populée
    let usagers = await UsagerRI2S.find(filter)
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });
    
    // Si un ID d'expérimentation est fourni, filtrer les usagers qui y participent
    if (experimentation) {
      const experimentationInfo = await Experimentation.findById(experimentation);
      const beneficiaires = await BeneficiaireExperimentation.find({
        experimentation,
        usagerModel: 'UsagerRI2S'
      }).distinct('usager');
      
      usagers = usagers.filter(usager => 
        beneficiaires.some(id => id.toString() === usager._id.toString())
      );
    }
    
    // Récupérer les pseudonymes
    const usagersEnhanced = await Promise.all(usagers.map(async (usager) => {
      const usagerObj = usager.toObject();
      
      // Récupérer le pseudonyme
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
    
    // Créer un document PDF
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: `Liste des usagers RI2S`,
        Author: 'Système RI2S',
        Subject: 'Export des usagers RI2S',
        Keywords: 'usagers, ri2s, export',
        Creator: req.user ? req.user.fullName : 'Système',
        Producer: 'PDFKit'
      }
    });
    
    // Définir les en-têtes de réponse
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=usagers_ri2s_${moment().format('YYYY-MM-DD')}.pdf`);
    
    // Pipe le document vers la réponse
    doc.pipe(res);
    
    // Titre
    doc.fontSize(20).font('Helvetica-Bold').text('Liste des usagers RI2S', { align: 'center' });
    doc.moveDown();
    
 // Date de génération
 doc.fontSize(12).font('Helvetica').text(`Rapport généré le ${moment().format('DD/MM/YYYY à HH:mm')}`, { align: 'right' });
 doc.moveDown();
 
 // Filtres appliqués
 let filtresTexte = 'Filtres appliqués: ';
 if (type) filtresTexte += `Type: ${type === 'pro' ? 'Professionnel' : 'Non professionnel'}, `;
 if (role) filtresTexte += `Rôle: ${role}, `;
 if (experimentation) {
   const experimentationInfo = await Experimentation.findById(experimentation);
   filtresTexte += `Expérimentation: ${experimentationInfo ? experimentationInfo.name : experimentation}, `;
 }
 
 if (filtresTexte !== 'Filtres appliqués: ') {
   filtresTexte = filtresTexte.slice(0, -2); // Enlever la dernière virgule et espace
   doc.fontSize(10).font('Helvetica-Oblique').text(filtresTexte);
   doc.moveDown();
 }
 
 // Informations générales
 doc.fontSize(14).font('Helvetica-Bold').text('Informations générales');
 doc.moveDown(0.5);
 
 doc.fontSize(10).font('Helvetica').text(`Nombre total d'usagers: ${usagersEnhanced.length}`);
 
 const typesPro = usagersEnhanced.filter(u => u.type_usager === 'pro').length;
 const typesNonPro = usagersEnhanced.filter(u => u.type_usager === 'non_pro').length;
 
 doc.text(`Professionnels: ${typesPro} (${Math.round(typesPro / usagersEnhanced.length * 100) || 0}%)`);
 doc.text(`Non professionnels: ${typesNonPro} (${Math.round(typesNonPro / usagersEnhanced.length * 100) || 0}%)`);
 
 const nbPseudonymises = usagersEnhanced.filter(u => u.pseudo).length;
 doc.text(`Usagers pseudonymisés: ${nbPseudonymises} (${Math.round(nbPseudonymises / usagersEnhanced.length * 100) || 0}%)`);
 
 doc.moveDown();
 
 // Répartition par rôle
 doc.fontSize(14).font('Helvetica-Bold').text('Répartition par rôle');
 doc.moveDown(0.5);
 
 const rolesCount = {};
 usagersEnhanced.forEach(usager => {
   rolesCount[usager.role] = (rolesCount[usager.role] || 0) + 1;
 });
 
 Object.entries(rolesCount).sort((a, b) => b[1] - a[1]).forEach(([role, count]) => {
   const percentage = Math.round(count / usagersEnhanced.length * 100) || 0;
   doc.fontSize(10).font('Helvetica').text(`${role}: ${count} (${percentage}%)`);
 });
 
 doc.moveDown();
 
 // Tableau des usagers (limité aux 50 premiers pour éviter un PDF trop volumineux)
 doc.fontSize(14).font('Helvetica-Bold').text('Liste des usagers');
 doc.moveDown(0.5);
 
 // Fonction pour dessiner un tableau
 const drawTable = (doc, headers, rows, startY) => {
   const pageWidth = doc.page.width - 100; // Largeur de page moins marges
   const colWidths = [
     pageWidth * 0.25, // Pseudonyme
     pageWidth * 0.25, // Nom complet
     pageWidth * 0.25, // Type/Rôle
     pageWidth * 0.25  // Contact
   ];
   
   // En-tête du tableau
   doc.fontSize(10).font('Helvetica-Bold');
   let x = 50;
   let y = startY;
   
   headers.forEach((header, i) => {
     doc.text(header, x, y, { width: colWidths[i], align: 'left' });
     x += colWidths[i];
   });
   
   y += 20;
   
   // Ligne de séparation
   doc.moveTo(50, y - 5).lineTo(doc.page.width - 50, y - 5).stroke();
   
   // Contenu du tableau
   doc.fontSize(9).font('Helvetica');
   
   rows.forEach((row, rowIndex) => {
     // Vérifier si on doit passer à une nouvelle page
     if (y > doc.page.height - 100) {
       doc.addPage();
       y = 50;
       
       // Redessiner l'en-tête sur la nouvelle page
       x = 50;
       doc.fontSize(10).font('Helvetica-Bold');
       
       headers.forEach((header, i) => {
         doc.text(header, x, y, { width: colWidths[i], align: 'left' });
         x += colWidths[i];
       });
       
       y += 20;
       
       // Ligne de séparation
       doc.moveTo(50, y - 5).lineTo(doc.page.width - 50, y - 5).stroke();
       
       doc.fontSize(9).font('Helvetica');
     }
     
     // Lignes alternées
     if (rowIndex % 2 === 0) {
       doc.rect(50, y - 3, pageWidth, 20).fill('#f9f9f9');
     }
     
     x = 50;
     row.forEach((cell, i) => {
       doc.fillColor('black').text(cell, x, y, { width: colWidths[i], align: 'left' });
       x += colWidths[i];
     });
     
     y += 20;
   });
 };
 
 // Limiter à 50 usagers pour éviter un PDF trop volumineux
 const usagersAffichage = usagersEnhanced.slice(0, 50);
 
 // Préparer les données du tableau
 const headers = ['Pseudonyme', 'Nom complet', 'Type / Rôle', 'Contact'];
 const rows = usagersAffichage.map(usager => [
   usager.pseudo ? usager.pseudo.pseudoName : 'Non pseudonymisé',
   `${usager.fullName} ${usager.firstName}`,
   `${usager.type_usager === 'pro' ? 'Pro' : 'Non-pro'} / ${usager.role}`,
   `${usager.email}\n${usager.phone || ''}`
 ]);
 
 // Dessiner le tableau
 drawTable(doc, headers, rows, doc.y);
 
 // Ajouter un message si la liste est tronquée
 if (usagersEnhanced.length > 50) {
   doc.moveDown();
   doc.fontSize(10).font('Helvetica-Oblique').text(
     `Note: Ce document affiche uniquement les 50 premiers usagers sur un total de ${usagersEnhanced.length}.`,
     { align: 'center' }
   );
 }
 
 // Pied de page
 const pages = doc.bufferedPageRange();
 for (let i = 0; i < pages.count; i++) {
   doc.switchToPage(i);
   
   // Ajouter le numéro de page
   const pageNumber = `Page ${i + 1} sur ${pages.count}`;
   
   doc.fontSize(8).font('Helvetica')
     .text(
       pageNumber,
       0,
       doc.page.height - 50,
       { align: 'center', width: doc.page.width }
     );
 }
 
 // Finaliser le document
 doc.end();
} catch (error) {
 console.error('Erreur lors de l\'export PDF:', error);
 res.status(500).json({ error: error.message });
}
};

/**
* Obtenir des données pour le tableau de bord
*/
exports.getTableauDeBord = async (req, res) => {
try {
 // Nombre total d'usagers
 const totalUsagers = await UsagerRI2S.countDocuments();
 
 // Usagers créés récemment (7 derniers jours)
 const dateRecente = new Date();
 dateRecente.setDate(dateRecente.getDate() - 7);
 
 const nouveauxUsagers = await UsagerRI2S.countDocuments({
   createdAt: { $gte: dateRecente }
 });
 
 // Distribution par type d'usager (pour graphique)
 const typeDistribution = await UsagerRI2S.aggregate([
   {
     $group: {
       _id: '$type_usager',
       count: { $sum: 1 }
     }
   }
 ]);
 
 // Distribution par rôle (pour graphique)
 const roleDistribution = await UsagerRI2S.aggregate([
   {
     $group: {
       _id: '$role',
       count: { $sum: 1 }
     }
   },
   { $sort: { count: -1 } }
 ]);
 
 // Évolution des créations (30 derniers jours)
 const date30JoursAvant = new Date();
 date30JoursAvant.setDate(date30JoursAvant.getDate() - 30);
 
 const creationParJour = await UsagerRI2S.aggregate([
   {
     $match: {
       createdAt: { $gte: date30JoursAvant }
     }
   },
   {
     $group: {
       _id: { 
         $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } 
       },
       count: { $sum: 1 }
     }
   },
   { $sort: { '_id': 1 } }
 ]);
 
 // Usagers par expérimentation (Top 5)
 const usagersParExperimentation = await BeneficiaireExperimentation.aggregate([
   {
     $match: { usagerModel: 'UsagerRI2S' }
   },
   {
     $lookup: {
       from: 'experimentations',
       localField: 'experimentation',
       foreignField: '_id',
       as: 'experimentationInfo'
     }
   },
   {
     $group: {
       _id: '$experimentation',
       nomExperimentation: { $first: { $arrayElemAt: ['$experimentationInfo.name', 0] } },
       count: { $sum: 1 }
     }
   },
   { $sort: { count: -1 } },
   { $limit: 5 }
 ]);
 
 // Top créateurs d'usagers
 const topCreateurs = await UsagerRI2S.aggregate([
   {
     $group: {
       _id: '$createdBy',
       count: { $sum: 1 }
     }
   },
   { $sort: { count: -1 } },
   { $limit: 5 }
 ]);
 
 // Récupérer les détails des créateurs
 const createursDetails = await Promise.all(topCreateurs.map(async (createur) => {
   if (!createur._id) return { nom: 'Système/Inconnu', count: createur.count };
   
   const user = await User.findById(createur._id).select('fullName email');
   return {
     _id: createur._id,
     nom: user ? user.fullName : 'Utilisateur inconnu',
     email: user ? user.email : '',
     count: createur.count
   };
 }));
 
 // Derniers usagers créés
 const derniersUsagers = await UsagerRI2S.find()
   .sort({ createdAt: -1 })
   .limit(5)
   .populate('createdBy', 'fullName email');
 
 // Récupérer les pseudonymes des derniers usagers
 const derniersUsagersAvecPseudo = await Promise.all(derniersUsagers.map(async (usager) => {
   const usagerObj = usager.toObject();
   const pseudo = await PseudonymizedBeneficiary.findOne({ usagerRI2S: usager._id });
   
   if (pseudo) {
     usagerObj.pseudo = {
       pseudoId: pseudo.pseudoId,
       pseudoName: pseudo.pseudoName
     };
   }
   
   return usagerObj;
 }));
 
 res.json({
   resume: {
     totalUsagers,
     nouveauxUsagers,
     pourcentageNouveau: totalUsagers > 0 ? (nouveauxUsagers / totalUsagers * 100).toFixed(1) : 0
   },
   distribution: {
     parType: typeDistribution,
     parRole: roleDistribution
   },
   tendances: {
     creationParJour
   },
   experimentations: {
     top: usagersParExperimentation
   },
   utilisateurs: {
     topCreateurs: createursDetails
   },
   derniers: {
     usagers: derniersUsagersAvecPseudo
   },
   dateGeneration: new Date()
 });
} catch (error) {
 console.error('Erreur lors de la génération du tableau de bord:', error);
 res.status(500).json({ error: error.message });
}
};

module.exports = exports;