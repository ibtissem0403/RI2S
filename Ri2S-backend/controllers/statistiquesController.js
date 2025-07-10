const mongoose = require('mongoose');
const SuiviProcessusInclusion = require('../models/SuiviProcessusInclusion');
const BeneficiaireExperimentation = require('../models/BeneficiaireExperimentation');
const Experimentation = require('../models/Experimentation');
const CibleExperimentation = require('../models/CibleExperimentation');
const StatutCible = require('../models/StatutCible');
const RealBeneficiary = require('../models/RealBeneficiary');
const PseudonymizedBeneficiary = require('../models/PseudonymizedBeneficiary');
const User = require('../models/User');
const ActionProcessus = require('../models/ActionProcessus');

/**
 * Tableau de bord principal
 * Fournit un aperçu global des processus d'inclusion
 */
exports.getTableauDeBord = async (req, res) => {
  try {
    const { 
      experimentationId, 
      cibleId, 
      dateDebut, 
      dateFin,
      periode = '30' // Période en jours pour les tendances
    } = req.query;

    // Construire le filtre de base
    let matchFilter = {};
    if (experimentationId) {
      matchFilter.experimentation = new mongoose.Types.ObjectId(experimentationId);
    }
    if (cibleId) {
      matchFilter.cible = new mongoose.Types.ObjectId(cibleId);
    }

    // Filtre de date sur la date de création du suivi
    if (dateDebut || dateFin) {
      matchFilter.date_creation = {};
      if (dateDebut) matchFilter.date_creation.$gte = new Date(dateDebut);
      if (dateFin) matchFilter.date_creation.$lte = new Date(dateFin);
    }

    // Statistiques par étape du processus
    const statsParEtape = await SuiviProcessusInclusion.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$etape_courante',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Statistiques par statut global
    const statsParStatut = await BeneficiaireExperimentation.aggregate([
      { $match: matchFilter },
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
          nom_statut: { $first: { $arrayElemAt: ['$statutInfo.nom_statut', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Taux de conversion par étape
    const totalBeneficiaires = await BeneficiaireExperimentation.countDocuments(matchFilter);
    
    const tauxConversion = {
      identification: totalBeneficiaires,
      recontact: await SuiviProcessusInclusion.countDocuments({
        ...matchFilter,
        etape_courante: { $in: ['RECONTACTER', 'VISITER', 'METTRE_EN_PLACE', 'DESINSTALLER'] }
      }),
      visite: await SuiviProcessusInclusion.countDocuments({
        ...matchFilter,
        etape_courante: { $in: ['VISITER', 'METTRE_EN_PLACE', 'DESINSTALLER'] }
      }),
      miseEnPlace: await SuiviProcessusInclusion.countDocuments({
        ...matchFilter,
        etape_courante: { $in: ['METTRE_EN_PLACE', 'DESINSTALLER'] }
      }),
      desinstallation: await SuiviProcessusInclusion.countDocuments({
        ...matchFilter,
        etape_courante: 'DESINSTALLER'
      })
    };

    // Calcul des taux de conversion en pourcentage
    const tauxConversionPct = {
      identification_recontact: totalBeneficiaires > 0 ? 
        Math.round((tauxConversion.recontact / totalBeneficiaires) * 100) : 0,
      recontact_visite: tauxConversion.recontact > 0 ? 
        Math.round((tauxConversion.visite / tauxConversion.recontact) * 100) : 0,
      visite_miseEnPlace: tauxConversion.visite > 0 ? 
        Math.round((tauxConversion.miseEnPlace / tauxConversion.visite) * 100) : 0,
      miseEnPlace_desinstallation: tauxConversion.miseEnPlace > 0 ? 
        Math.round((tauxConversion.desinstallation / tauxConversion.miseEnPlace) * 100) : 0,
      global: totalBeneficiaires > 0 ? 
        Math.round((tauxConversion.desinstallation / totalBeneficiaires) * 100) : 0
    };

    // Statistiques par expérimentation
    let statsParExperimentation = [];
    if (!experimentationId) {
      statsParExperimentation = await BeneficiaireExperimentation.aggregate([
        { $match: matchFilter },
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
            nom: { $first: { $arrayElemAt: ['$experimentationInfo.name', 0] } },
            code: { $first: { $arrayElemAt: ['$experimentationInfo.code', 0] } },
            totalBeneficiaires: { $sum: 1 },
            activeCount: {
              $sum: { 
                $cond: [
                  { $eq: [{ $arrayElemAt: ['$historique_statuts.0.statut', 0] }, '$statut'] }, 
                  1, 0
                ] 
              }
            }
          }
        },
        { $sort: { totalBeneficiaires: -1 } }
      ]);
    }

    // Tendances temporelles
    const periodeDays = parseInt(periode);
    const dateDebut2 = new Date();
    dateDebut2.setDate(dateDebut2.getDate() - periodeDays);

    const tendances = await SuiviProcessusInclusion.aggregate([
      { 
        $match: { 
          ...matchFilter,
          date_creation: { $gte: dateDebut2 }
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$date_creation' 
            }
          },
          identifications: { $sum: 1 },
          recontacts: {
            $sum: { 
              $cond: [{ $eq: ['$etape_courante', 'RECONTACTER'] }, 1, 0] 
            }
          },
          visites: {
            $sum: { 
              $cond: [{ $eq: ['$etape_courante', 'VISITER'] }, 1, 0] 
            }
          },
          installations: {
            $sum: { 
              $cond: [{ $eq: ['$etape_courante', 'METTRE_EN_PLACE'] }, 1, 0] 
            }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Temps moyens par étape
    const tempsParEtape = await SuiviProcessusInclusion.aggregate([
      { $match: matchFilter },
      {
        $unwind: '$historique'
      },
      {
        $match: {
          'historique.date_fin': { $ne: null }
        }
      },
      {
        $project: {
          etape: '$historique.etape',
          duree_jours: {
            $divide: [
              { $subtract: ['$historique.date_fin', '$historique.date_debut'] },
              1000 * 60 * 60 * 24 // Conversion en jours
            ]
          }
        }
      },
      {
        $group: {
          _id: '$etape',
          duree_moyenne: { $avg: '$duree_jours' },
          duree_min: { $min: '$duree_jours' },
          duree_max: { $max: '$duree_jours' },
          nombre: { $sum: 1 }
        }
      }
    ]);

    // Performance par coordinateur
    const performanceCoordinateurs = await SuiviProcessusInclusion.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'users',
          localField: 'historique.responsable',
          foreignField: '_id',
          as: 'coordinateurs'
        }
      },
      {
        $unwind: '$historique'
      },
      {
        $group: {
          _id: '$historique.responsable',
          coordinateurNom: { 
            $first: {
              $reduce: {
                input: '$coordinateurs',
                initialValue: 'Inconnu',
                in: {
                  $cond: [
                    { $eq: ['$$this._id', '$historique.responsable'] }, 
                    '$$this.fullName', 
                    '$$value'
                  ]
                }
              }
            }
          },
          totalProcessus: { $sum: 1 },
          processusTermines: {
            $sum: { 
              $cond: [{ $eq: ['$historique.statut', 'COMPLETE'] }, 1, 0] 
            }
          }
        }
      },
      {
        $addFields: {
          tauxAchevement: { 
            $multiply: [{ $divide: ['$processusTermines', '$totalProcessus'] }, 100] 
          }
        }
      },
      { $sort: { totalProcessus: -1 } },
      { $limit: 10 } // Top 10 coordinateurs
    ]);

    // Actions en attente
    const actionsEnAttente = await ActionProcessus.countDocuments({
      statut: { $in: ['A_FAIRE', 'EN_COURS'] }
    });

    // Dernières actions créées
    const dernieresActions = await ActionProcessus.find()
      .sort({ date_creation: -1 })
      .limit(5)
      .populate('beneficiaire', 'usager')
      .populate('responsable', 'fullName email');

    // Synthèse des résultats
    res.json({
      resume: {
        totalBeneficiaires,
        actionsEnAttente,
        tauxConversion: tauxConversionPct
      },
      statistiques: {
        parEtape: statsParEtape,
        parStatut: statsParStatut,
        tauxConversion: tauxConversionPct
      },
      parExperimentation: statsParExperimentation,
      metriquesTemps: tempsParEtape,
      tendances,
      performanceCoordinateurs,
      dernieresActions,
      dateGeneration: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur génération tableau de bord:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la génération du tableau de bord',
      error: error.message 
    });
  }
};

/**
 * Rapport détaillé d'une expérimentation
 */
exports.getRapportExperimentation = async (req, res) => {
  try {
    const { experimentationId } = req.params;
    const { 
      inclureBeneficiaires = 'false',
      format = 'resume' 
    } = req.query;

    // Vérifier que l'expérimentation existe
    const experimentation = await Experimentation.findById(experimentationId)
      .populate('entreprise', 'nom');

    if (!experimentation) {
      return res.status(404).json({ 
        message: 'Expérimentation non trouvée' 
      });
    }

    // Obtenir les cibles de l'expérimentation
    const cibles = await CibleExperimentation.find({ 
      experimentation: experimentationId
    });

    // Statistiques par cible
    const statsParCible = await BeneficiaireExperimentation.aggregate([
      { $match: { experimentation: new mongoose.Types.ObjectId(experimentationId) } },
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
          nom_cible: { $first: { $arrayElemAt: ['$cibleInfo.nom_cible', 0] } },
          code_cible: { $first: { $arrayElemAt: ['$cibleInfo.code_cible', 0] } },
          totalBeneficiaires: { $sum: 1 }
        }
      }
    ]);

    // Statistiques par statut
    const statsParStatut = await BeneficiaireExperimentation.aggregate([
      { $match: { experimentation: new mongoose.Types.ObjectId(experimentationId) } },
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
          nom_statut: { $first: { $arrayElemAt: ['$statutInfo.nom_statut', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Évolution mensuelle des inclusions
    const debutAnnee = new Date();
    debutAnnee.setMonth(debutAnnee.getMonth() - 12);
    
    const evolutionMensuelle = await BeneficiaireExperimentation.aggregate([
      { 
        $match: { 
          experimentation: new mongoose.Types.ObjectId(experimentationId),
          date_rattachement: { $gte: debutAnnee }
        } 
      },
      {
        $group: {
          _id: {
            annee: { $year: '$date_rattachement' },
            mois: { $month: '$date_rattachement' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.annee': 1, '_id.mois': 1 } }
    ]);

    // Temps moyens spécifiques à cette expérimentation
    const metriquesTemps = await SuiviProcessusInclusion.aggregate([
      { 
        $match: { 
          beneficiaire: { 
            $in: await BeneficiaireExperimentation.find(
              { experimentation: experimentationId }
            ).distinct('_id')
          } 
        } 
      },
      {
        $project: {
          duree_totale: {
            $cond: {
              if: { 
                $and: [
                  { $ne: ['$date_creation', null] },
                  { $ne: ['$date_derniere_modification', null] }
                ]
              },
              then: {
                $divide: [
                  { $subtract: ['$date_derniere_modification', '$date_creation'] },
                  1000 * 60 * 60 * 24 // Conversion en jours
                ]
              },
              else: null
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          duree_moyenne: { $avg: '$duree_totale' },
          duree_min: { $min: '$duree_totale' },
          duree_max: { $max: '$duree_totale' }
        }
      }
    ]);

    // Liste détaillée des bénéficiaires (si demandée)
    let detailsBeneficiaires = [];
    if (inclureBeneficiaires === 'true') {
      detailsBeneficiaires = await BeneficiaireExperimentation.find({ 
        experimentation: experimentationId 
      })
      .populate('cible', 'nom_cible code_cible')
      .populate('statut', 'nom_statut')
      .populate({
        path: 'usager',
        populate: {
          path: 'cohort'
        }
      })
      .sort({ date_rattachement: -1 });
    }

    // Calculs globaux
    const totalBeneficiaires = statsParCible.reduce((sum, stat) => sum + stat.totalBeneficiaires, 0);
    
    // Obtenir le nombre de bénéficiaires par étape du processus
    const etapesProcessus = {
      IDENTIFIER: await SuiviProcessusInclusion.countDocuments({
        beneficiaire: { 
          $in: await BeneficiaireExperimentation.find(
            { experimentation: experimentationId }
          ).distinct('_id')
        },
        etape_courante: 'IDENTIFIER'
      }),
      RECONTACTER: await SuiviProcessusInclusion.countDocuments({
        beneficiaire: { 
          $in: await BeneficiaireExperimentation.find(
            { experimentation: experimentationId }
          ).distinct('_id')
        },
        etape_courante: 'RECONTACTER'
      }),
      VISITER: await SuiviProcessusInclusion.countDocuments({
        beneficiaire: { 
          $in: await BeneficiaireExperimentation.find(
            { experimentation: experimentationId }
          ).distinct('_id')
        },
        etape_courante: 'VISITER'
      }),
      METTRE_EN_PLACE: await SuiviProcessusInclusion.countDocuments({
        beneficiaire: { 
          $in: await BeneficiaireExperimentation.find(
            { experimentation: experimentationId }
          ).distinct('_id')
        },
        etape_courante: 'METTRE_EN_PLACE'
      }),
      DESINSTALLER: await SuiviProcessusInclusion.countDocuments({
        beneficiaire: { 
          $in: await BeneficiaireExperimentation.find(
            { experimentation: experimentationId }
          ).distinct('_id')
        },
        etape_courante: 'DESINSTALLER'
      })
    };

    res.json({
      experimentation: {
        ...experimentation.toObject(),
        nombreCibles: cibles.length
      },
      resume: {
        totalBeneficiaires,
        etapesProcessus
      },
      statsParCible,
      statsParStatut,
      metriquesTemps: metriquesTemps[0] || {},
      evolutionMensuelle,
      detailsBeneficiaires: format === 'detaille' ? 
        detailsBeneficiaires : 
        detailsBeneficiaires.slice(0, 20),
      dateGeneration: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur rapport expérimentation:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la génération du rapport d\'expérimentation',
      error: error.message 
    });
  }
};

/**
 * Comparaison entre expérimentations
 */
exports.comparerExperimentations = async (req, res) => {
  try {
    const { experimentationIds } = req.body; // Tableau d'IDs

    if (!experimentationIds || experimentationIds.length < 2) {
      return res.status(400).json({
        message: 'Au moins 2 expérimentations sont requises pour la comparaison'
      });
    }

    const objectIds = experimentationIds.map(id => new mongoose.Types.ObjectId(id));

    // Obtenir les informations des expérimentations
    const experimentations = await Experimentation.find({
      _id: { $in: objectIds }
    }).select('name code startDate endDate');

    // Statistiques comparatives
    const comparaison = await Promise.all(objectIds.map(async (expId) => {
      // Nombre total de bénéficiaires
      const totalBeneficiaires = await BeneficiaireExperimentation.countDocuments({
        experimentation: expId
      });
      
      // Bénéficiaires par étape
      const parEtape = {
        IDENTIFIER: await SuiviProcessusInclusion.countDocuments({
          beneficiaire: { 
            $in: await BeneficiaireExperimentation.find({ experimentation: expId }).distinct('_id')
          },
          etape_courante: 'IDENTIFIER'
        }),
        RECONTACTER: await SuiviProcessusInclusion.countDocuments({
          beneficiaire: { 
            $in: await BeneficiaireExperimentation.find({ experimentation: expId }).distinct('_id')
          },
          etape_courante: 'RECONTACTER'
        }),
        VISITER: await SuiviProcessusInclusion.countDocuments({
          beneficiaire: { 
            $in: await BeneficiaireExperimentation.find({ experimentation: expId }).distinct('_id')
          },
          etape_courante: 'VISITER'
        }),
        METTRE_EN_PLACE: await SuiviProcessusInclusion.countDocuments({
          beneficiaire: { 
            $in: await BeneficiaireExperimentation.find({ experimentation: expId }).distinct('_id')
          },
          etape_courante: 'METTRE_EN_PLACE'
        }),
        DESINSTALLER: await SuiviProcessusInclusion.countDocuments({
          beneficiaire: { 
            $in: await BeneficiaireExperimentation.find({ experimentation: expId }).distinct('_id')
          },
          etape_courante: 'DESINSTALLER'
        })
      };
      
      // Obtenir le temps moyen du processus
      const tempsMoyen = await SuiviProcessusInclusion.aggregate([
        { 
          $match: { 
            beneficiaire: { 
              $in: await BeneficiaireExperimentation.find({ experimentation: expId }).distinct('_id')
            } 
          } 
        },
        {
          $project: {
            duree_totale: {
              $cond: {
                if: { 
                  $and: [
                    { $ne: ['$date_creation', null] },
                    { $ne: ['$date_derniere_modification', null] }
                  ]
                },
                then: {
                  $divide: [
                    { $subtract: ['$date_derniere_modification', '$date_creation'] },
                    1000 * 60 * 60 * 24 // Conversion en jours
                  ]
                },
                else: null
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            duree_moyenne: { $avg: '$duree_totale' }
          }
        }
      ]);
      
      // Expérimentation info
      const exp = await Experimentation.findById(expId);
      
      return {
        _id: expId,
        nom: exp.name,
        code: exp.code,
        totalBeneficiaires,
        etapesProcessus: parEtape,
        tempsMoyenProcessus: tempsMoyen[0]?.duree_moyenne || 0,
        tauxCompletion: totalBeneficiaires > 0 ? 
          Math.round((parEtape.DESINSTALLER / totalBeneficiaires) * 100) : 0
      };
    }));

    // Calculer les moyennes pour benchmark
    const benchmark = {
      moyenneBeneficiaires: Math.round(
        comparaison.reduce((acc, exp) => acc + exp.totalBeneficiaires, 0) / comparaison.length
      ),
      moyenneTauxCompletion: Math.round(
        comparaison.reduce((acc, exp) => acc + exp.tauxCompletion, 0) / comparaison.length
      ),
      moyenneTempsMoyenProcessus: Math.round(
        comparaison.reduce((acc, exp) => acc + exp.tempsMoyenProcessus, 0) / comparaison.length
      )
    };

    res.json({
      experimentations,
      comparaison,
      benchmark,
      dateGeneration: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur comparaison expérimentations:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la comparaison des expérimentations',
      error: error.message 
    });
  }
};

/**
 * Rapport sur l'efficacité des actions du processus
 */
exports.getRapportEfficaciteActions = async (req, res) => {
  try {
    const { experimentationId, etape } = req.query;
    
    // Construire le filtre
    let matchFilter = {};
    if (experimentationId) {
      // Trouver les bénéficiaires de cette expérimentation
      const beneficiaires = await BeneficiaireExperimentation.find({ 
        experimentation: experimentationId 
      }).distinct('_id');
      
      matchFilter.beneficiaire = { $in: beneficiaires };
    }
    if (etape) {
      matchFilter.etape = etape;
    }
    
    // Statistiques par type d'action
    const statsParTypeAction = await ActionProcessus.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$type_action',
          total: { $sum: 1 },
          terminees: {
            $sum: { $cond: [{ $eq: ['$statut', 'TERMINE'] }, 1, 0] }
          },
          annulees: {
            $sum: { $cond: [{ $eq: ['$statut', 'ANNULE'] }, 1, 0] }
          },
          enCours: {
            $sum: { $cond: [{ $eq: ['$statut', 'EN_COURS'] }, 1, 0] }
          },
          aFaire: {
            $sum: { $cond: [{ $eq: ['$statut', 'A_FAIRE'] }, 1, 0] }
          },
          tempsMoyenRealisation: {
            $avg: {
              $cond: {
                if: { 
                  $and: [
                    { $eq: ['$statut', 'TERMINE'] },
                    { $ne: ['$date_realisation', null] }
                  ]
                },
                then: {
                  $divide: [
                    { $subtract: ['$date_realisation', '$date_creation'] },
                    1000 * 60 * 60 * 24 // Conversion en jours
                  ]
                },
                else: null
              }
            }
          }
        }
      },
      {
        $addFields: {
          tauxAchevement: { 
            $multiply: [{ $divide: ['$terminees', '$total'] }, 100] 
          }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    // Statistiques par étape
    const statsParEtape = await ActionProcessus.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$etape',
          total: { $sum: 1 },
          terminees: {
            $sum: { $cond: [{ $eq: ['$statut', 'TERMINE'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          tauxAchevement: { 
            $multiply: [{ $divide: ['$terminees', '$total'] }, 100] 
          }
        }
      },
      { $sort: { tauxAchevement: -1 } }
    ]);
    
    // Efficacité par coordinateur
    const efficaciteCoordinateurs = await ActionProcessus.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'users',
          localField: 'responsable',
          foreignField: '_id',
          as: 'responsableInfo'
        }
      },
      {
        $group: {
          _id: '$responsable',
          responsableNom: { $first: { $arrayElemAt: ['$responsableInfo.fullName', 0] } },
          responsableEmail: { $first: { $arrayElemAt: ['$responsableInfo.email', 0] } },
          totalActions: { $sum: 1 },
          actionsTerminees: {
            $sum: { $cond: [{ $eq: ['$statut', 'TERMINE'] }, 1, 0] }
          },
          tempsMoyenRealisation: {
            $avg: {
              $cond: {
                if: { 
                  $and: [
                    { $eq: ['$statut', 'TERMINE'] },
                    { $ne: ['$date_realisation', null] }
                  ]
                },
                then: {
                  $divide: [
                    { $subtract: ['$date_realisation', '$date_creation'] },
                    1000 * 60 * 60 * 24 // Conversion en jours
                  ]
                },
                else: null
              }
            }
          }
        }
      },
      {
        $addFields: {
          tauxAchevement: { 
            $multiply: [{ $divide: ['$actionsTerminees', '$totalActions'] }, 100] 
          }
        }
      },
      { $sort: { totalActions: -1 } }
    ]);
    
    // Tendances mensuelles
    const tendancesMensuelles = await ActionProcessus.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            annee: { $year: '$date_creation' },
            mois: { $month: '$date_creation' }
          },
          total: { $sum: 1 },
          terminees: {
            $sum: { $cond: [{ $eq: ['$statut', 'TERMINE'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          tauxAchevement: { 
            $multiply: [{ $divide: ['$terminees', '$total'] }, 100] 
          }
        }
      },
      { $sort: { '_id.annee': 1, '_id.mois': 1 } }
    ]);
    
    // Calculs globaux
    const totalActions = statsParTypeAction.reduce((sum, stat) => sum + stat.total, 0);
    const actionsTerminees = statsParTypeAction.reduce((sum, stat) => sum + stat.terminees, 0);
    const tauxGlobalAchevement = totalActions > 0 ? 
      Math.round((actionsTerminees / totalActions) * 100) : 0;
    
    res.json({
      resume: {
        totalActions,
        actionsTerminees,
        tauxGlobalAchevement
      },
      statsParTypeAction,
      statsParEtape,
      efficaciteCoordinateurs,
      tendancesMensuelles,
      dateGeneration: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erreur rapport efficacité actions:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la génération du rapport d\'efficacité des actions',
      error: error.message 
    });
  }
};

/**
 * Exporter les données au format Excel
 */
exports.exporterDonnees = async (req, res) => {
  try {
    const { experimentationId, format = 'beneficiaires' } = req.query;
    
    // Vérifier que l'expérimentation existe si ID fourni
    if (experimentationId) {
      const experimentationExists = await Experimentation.findById(experimentationId);
      if (!experimentationExists) {
        return res.status(404).json({ message: 'Expérimentation non trouvée' });
      }
    }
    
    // Création du classeur Excel
    const Excel = require('exceljs');
    const workbook = new Excel.Workbook();
    workbook.creator = 'RI2S';
    workbook.lastModifiedBy = req.user ? req.user.fullName : 'Système';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    if (format === 'beneficiaires') {
      // Export des bénéficiaires
      await exporterBeneficiaires(workbook, experimentationId);
    } else if (format === 'actions') {
      // Export des actions
      await exporterActions(workbook, experimentationId);
    } else if (format === 'complet') {
      // Export complet (plusieurs feuilles)
      await exporterBeneficiaires(workbook, experimentationId);
      await exporterActions(workbook, experimentationId);
      await exporterStatistiques(workbook, experimentationId);
    }
    
    // Définir les en-têtes pour le téléchargement
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=export_ri2s_${format}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    // Envoyer le fichier
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Erreur export Excel:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'export des données',
      error: error.message 
    });
  }
};

// Fonction utilitaire pour l'export Excel des bénéficiaires
async function exporterBeneficiaires(workbook, experimentationId) {
  // Construire le filtre
  let filter = {};
  if (experimentationId) {
    filter.experimentation = experimentationId;
  }
  
  // Récupérer les données
  const beneficiaires = await BeneficiaireExperimentation.find(filter)
    .populate('usager', 'fullName firstName birthDate sex phone address')
    .populate('experimentation', 'name code')
    .populate('cible', 'nom_cible')
    .populate('statut', 'nom_statut')
    .sort({ date_rattachement: -1 });
  
  // Créer la feuille
  const worksheet = workbook.addWorksheet('Bénéficiaires');
  
  // Définir les colonnes
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Nom', key: 'nom', width: 20 },
    { header: 'Prénom', key: 'prenom', width: 20 },
    { header: 'Date de naissance', key: 'dateNaissance', width: 15 },
    { header: 'Sexe', key: 'sexe', width: 10 },
    { header: 'Téléphone', key: 'telephone', width: 15 },
    { header: 'Adresse', key: 'adresse', width: 40 },
    { header: 'Expérimentation', key: 'experimentation', width: 20 },
    { header: 'Cible', key: 'cible', width: 15 },
    { header: 'Statut', key: 'statut', width: 15 },
    { header: 'Date de rattachement', key: 'dateRattachement', width: 20 }
  ];
  
  // Ajouter les données
  beneficiaires.forEach(beneficiaire => {
    worksheet.addRow({
      id: beneficiaire._id.toString(),
      nom: beneficiaire.usager?.fullName || 'N/A',
      prenom: beneficiaire.usager?.firstName || 'N/A',
      dateNaissance: beneficiaire.usager?.birthDate,
      sexe: beneficiaire.usager?.sex || 'N/A',
      telephone: beneficiaire.usager?.phone || 'N/A',
      adresse: beneficiaire.usager?.address || 'N/A',
      experimentation: beneficiaire.experimentation?.name || 'N/A',
      cible: beneficiaire.cible?.nom_cible || 'N/A',
      statut: beneficiaire.statut?.nom_statut || 'N/A',
      dateRattachement: beneficiaire.date_rattachement
    });
  });
  
  // Formater les dates
  worksheet.getColumn('dateNaissance').numFmt = 'dd/mm/yyyy';
  worksheet.getColumn('dateRattachement').numFmt = 'dd/mm/yyyy';
  
  // Formater les en-têtes
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F81BD' }
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
}

// Fonction utilitaire pour l'export Excel des actions
async function exporterActions(workbook, experimentationId) {
  // Construire le filtre
  let filter = {};
  if (experimentationId) {
    // Trouver les bénéficiaires de cette expérimentation
    const beneficiaires = await BeneficiaireExperimentation.find({ 
      experimentation: experimentationId 
    }).distinct('_id');
    
    filter.beneficiaire = { $in: beneficiaires };
  }
  
  // Récupérer les données
  const actions = await ActionProcessus.find(filter)
    .populate({
      path: 'beneficiaire',
      populate: [
        { path: 'usager', select: 'fullName' },
        { path: 'experimentation', select: 'name' },
        { path: 'cible', select: 'nom_cible' }
      ]
    })
    .populate('responsable', 'fullName email')
    .sort({ date_creation: -1 });
  
  // Créer la feuille
  const worksheet = workbook.addWorksheet('Actions');
  
  // Définir les colonnes
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Type d\'action', key: 'typeAction', width: 20 },
    { header: 'Étape', key: 'etape', width: 15 },
    { header: 'Statut', key: 'statut', width: 15 },
    { header: 'Bénéficiaire', key: 'beneficiaire', width: 25 },
    { header: 'Expérimentation', key: 'experimentation', width: 20 },
    { header: 'Cible', key: 'cible', width: 15 },
    { header: 'Responsable', key: 'responsable', width: 25 },
    { header: 'Date création', key: 'dateCreation', width: 20 },
    { header: 'Date réalisation', key: 'dateRealisation', width: 20 },
    { header: 'Commentaires', key: 'commentaires', width: 40 }
  ];
  
  // Ajouter les données
  actions.forEach(action => {
    worksheet.addRow({
      id: action._id.toString(),
      typeAction: action.type_action,
      etape: action.etape,
      statut: action.statut,
      beneficiaire: action.beneficiaire?.usager?.fullName || 'N/A',
      experimentation: action.beneficiaire?.experimentation?.name || 'N/A',
      cible: action.beneficiaire?.cible?.nom_cible || 'N/A',
      responsable: action.responsable?.fullName || 'N/A',
      dateCreation: action.date_creation,
      dateRealisation: action.date_realisation,
      commentaires: action.commentaires
    });
  });
  
  // Formater les dates
  worksheet.getColumn('dateCreation').numFmt = 'dd/mm/yyyy hh:mm:ss';
  worksheet.getColumn('dateRealisation').numFmt = 'dd/mm/yyyy hh:mm:ss';
  
  // Formater les en-têtes
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F81BD' }
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };
}

// Fonction utilitaire pour l'export Excel des statistiques
async function exporterStatistiques(workbook, experimentationId) {
  // Créer la feuille
  const worksheet = workbook.addWorksheet('Statistiques');
  
  // Titre
  worksheet.mergeCells('A1:F1');
  worksheet.getCell('A1').value = 'Statistiques du processus d\'inclusion';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  // Sous-titre avec la date
  worksheet.mergeCells('A2:F2');
  worksheet.getCell('A2').value = `Rapport généré le ${new Date().toLocaleDateString()}`;
  worksheet.getCell('A2').font = { size: 12, italic: true };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };
  
  // Espacement
  worksheet.addRow([]);
  
  // En-têtes des statistiques par étape
  worksheet.addRow(['Statistiques par étape du processus']);
  worksheet.getRow(4).font = { bold: true };
  worksheet.addRow(['Étape', 'Nombre de bénéficiaires', 'Pourcentage']);
  worksheet.getRow(5).font = { bold: true };
  
  // Filtrer par expérimentation si nécessaire
  let matchFilter = {};
  if (experimentationId) {
    // Trouver les bénéficiaires de cette expérimentation
    const beneficiaires = await BeneficiaireExperimentation.find({ 
      experimentation: experimentationId 
    }).distinct('_id');
    
    matchFilter.beneficiaire = { $in: beneficiaires };
  }
  
  // Statistiques par étape
  const statsParEtape = await SuiviProcessusInclusion.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$etape_courante',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  // Calculer le total
  const totalProcessus = statsParEtape.reduce((sum, stat) => sum + stat.count, 0);
  
  // Ajouter les données
  statsParEtape.forEach(stat => {
    worksheet.addRow([
      stat._id, 
      stat.count, 
      `${Math.round((stat.count / totalProcessus) * 100)}%`
    ]);
  });
  
  // Ajouter le total
  worksheet.addRow(['Total', totalProcessus, '100%']);
  worksheet.getRow(worksheet.rowCount).font = { bold: true };
  
  // Espacement
  worksheet.addRow([]);
  
  // En-têtes des temps moyens
  worksheet.addRow(['Temps moyens par étape (jours)']);
  worksheet.getRow(worksheet.rowCount).font = { bold: true };
  worksheet.addRow(['Étape', 'Durée moyenne', 'Durée minimum', 'Durée maximum', 'Nombre']);
  worksheet.getRow(worksheet.rowCount).font = { bold: true };
  
  // Temps moyens par étape
  const tempsParEtape = await SuiviProcessusInclusion.aggregate([
    { $match: matchFilter },
    {
      $unwind: '$historique'
    },
    {
      $match: {
        'historique.date_fin': { $ne: null }
      }
    },
    {
      $project: {
        etape: '$historique.etape',
        duree_jours: {
          $divide: [
            { $subtract: ['$historique.date_fin', '$historique.date_debut'] },
            1000 * 60 * 60 * 24 // Conversion en jours
          ]
        }
      }
    },
    {
      $group: {
        _id: '$etape',
        duree_moyenne: { $avg: '$duree_jours' },
        duree_min: { $min: '$duree_jours' },
        duree_max: { $max: '$duree_jours' },
        nombre: { $sum: 1 }
      }
    }
  ]);
  
  // Ajouter les données
  tempsParEtape.forEach(temps => {
    worksheet.addRow([
      temps._id, 
      Math.round(temps.duree_moyenne * 10) / 10, // Arrondir à 1 décimale
      Math.round(temps.duree_min * 10) / 10,
      Math.round(temps.duree_max * 10) / 10,
      temps.nombre
    ]);
  });
  
  // Adapter la largeur des colonnes
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, function(cell) {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength < 10 ? 10 : maxLength + 2;
  });
}

/**
 * Générer un rapport PDF
 */
exports.genererRapportPDF = async (req, res) => {
    try {
      const { 
        experimentationId, 
        type = 'general', 
        inclureBeneficiaires = 'false' 
      } = req.query;
      
      // Vérifier l'expérimentation si ID fourni
      let experimentation = null;
      if (experimentationId) {
        experimentation = await Experimentation.findById(experimentationId);
        if (!experimentation) {
          return res.status(404).json({ message: 'Expérimentation non trouvée' });
        }
      }
      
      // Création du document PDF
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        info: {
          Title: `Rapport RI2S - ${type === 'general' ? 'Général' : experimentation?.name || 'Expérimentation'}`,
          Author: 'Système RI2S',
          Subject: 'Rapport de suivi des processus d\'inclusion',
          Keywords: 'inclusion, expérimentation, ri2s, rapport',
          Creator: req.user?.fullName || 'Système',
          Producer: 'PDFKit',
          CreationDate: new Date()
        }
      });
      
      // Définir le nom du fichier
      const fileName = `rapport_ri2s_${type}_${
        experimentation ? experimentation.code : 'general'
      }_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Définir les en-têtes pour le téléchargement
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      // Pipe le PDF vers la réponse
      doc.pipe(res);
      
      // Génération du contenu selon le type
      if (type === 'general') {
        await genererRapportGeneral(doc, req.user);
      } else if (type === 'experimentation' && experimentation) {
        await genererRapportExperimentation(doc, experimentation, inclureBeneficiaires === 'true');
      } else if (type === 'efficacite') {
        await genererRapportEfficacite(doc, experimentationId);
      }
      
      // Finaliser le document
      doc.end();
      
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la génération du rapport PDF',
        error: error.message 
      });
    }
  };
  
  // Fonction pour générer un rapport général
  async function genererRapportGeneral(doc, user) {
    // En-tête
    ajouterEntete(doc, 'Rapport Général du Processus d\'Inclusion');
    
    // Informations du rapport
    doc.fontSize(12);
    doc.text(`Date de génération: ${new Date().toLocaleDateString()}`, {
      align: 'right'
    });
    doc.text(`Généré par: ${user?.fullName || 'Système RI2S'}`, {
      align: 'right'
    });
    doc.moveDown(2);
    
    // Statistiques générales
    doc.fontSize(16).font('Helvetica-Bold').text('Résumé des processus d\'inclusion');
    doc.moveDown();
    
    // Récupérer les statistiques
    const totalBeneficiaires = await BeneficiaireExperimentation.countDocuments();
    
    // Stats par étape
    const statsParEtape = await SuiviProcessusInclusion.aggregate([
      {
        $group: {
          _id: '$etape_courante',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Stats par statut
    const statsParStatut = await BeneficiaireExperimentation.aggregate([
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
          nom_statut: { $first: { $arrayElemAt: ['$statutInfo.nom_statut', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Stats par expérimentation
    const statsParExperimentation = await BeneficiaireExperimentation.aggregate([
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
          nom: { $first: { $arrayElemAt: ['$experimentationInfo.name', 0] } },
          code: { $first: { $arrayElemAt: ['$experimentationInfo.code', 0] } },
          totalBeneficiaires: { $sum: 1 }
        }
      },
      { $sort: { totalBeneficiaires: -1 } }
    ]);
    
    // Afficher les données
    doc.fontSize(12).font('Helvetica');
    doc.text(`Nombre total de bénéficiaires: ${totalBeneficiaires}`);
    doc.moveDown();
    
    // Tableau des statistiques par étape
    doc.fontSize(14).font('Helvetica-Bold').text('Statistiques par étape du processus');
    doc.moveDown();
    
    const tableParEtape = {
      headers: ['Étape', 'Nombre', 'Pourcentage'],
      rows: []
    };
    
    statsParEtape.forEach(stat => {
      const pourcentage = totalBeneficiaires > 0 ? 
        Math.round((stat.count / totalBeneficiaires) * 100) : 0;
      
      tableParEtape.rows.push([
        stat._id || 'Non défini',
        stat.count.toString(),
        `${pourcentage}%`
      ]);
    });
    
    dessinerTableau(doc, tableParEtape);
    doc.moveDown(2);
    
    // Tableau des statistiques par statut
    doc.fontSize(14).font('Helvetica-Bold').text('Statistiques par statut');
    doc.moveDown();
    
    const tableParStatut = {
      headers: ['Statut', 'Nombre', 'Pourcentage'],
      rows: []
    };
    
    statsParStatut.forEach(stat => {
      const pourcentage = totalBeneficiaires > 0 ? 
        Math.round((stat.count / totalBeneficiaires) * 100) : 0;
      
      tableParStatut.rows.push([
        stat.nom_statut || 'Non défini',
        stat.count.toString(),
        `${pourcentage}%`
      ]);
    });
    
    dessinerTableau(doc, tableParStatut);
    doc.moveDown(2);
    
    // Tableau des statistiques par expérimentation
    doc.fontSize(14).font('Helvetica-Bold').text('Statistiques par expérimentation');
    doc.moveDown();
    
    const tableParExperimentation = {
      headers: ['Expérimentation', 'Code', 'Nombre', 'Pourcentage'],
      rows: []
    };
    
    statsParExperimentation.forEach(stat => {
      const pourcentage = totalBeneficiaires > 0 ? 
        Math.round((stat.totalBeneficiaires / totalBeneficiaires) * 100) : 0;
      
      tableParExperimentation.rows.push([
        stat.nom || 'Non défini',
        stat.code || 'N/A',
        stat.totalBeneficiaires.toString(),
        `${pourcentage}%`
      ]);
    });
    
    dessinerTableau(doc, tableParExperimentation);
    doc.moveDown(2);
    
    // Pied de page
    ajouterPiedDePage(doc);
  }
  
  // Fonction pour générer un rapport spécifique à une expérimentation
  async function genererRapportExperimentation(doc, experimentation, inclureBeneficiaires) {
    // En-tête
    ajouterEntete(doc, `Rapport de l'Expérimentation "${experimentation.name}"`);
    
    // Informations de l'expérimentation
    doc.fontSize(12).font('Helvetica');
    doc.text(`Code: ${experimentation.code}`);
    doc.text(`Date de début: ${experimentation.startDate ? experimentation.startDate.toLocaleDateString() : 'Non définie'}`);
    doc.text(`Date de fin: ${experimentation.endDate ? experimentation.endDate.toLocaleDateString() : 'Non définie'}`);
    doc.text(`Entreprise: ${experimentation.entreprise || 'Non définie'}`);
    doc.text(`Version du protocole: ${experimentation.protocolVersion || 'Non définie'}`);
    doc.moveDown(2);
    
    // Statistiques de l'expérimentation
    doc.fontSize(16).font('Helvetica-Bold').text('Résumé de l\'expérimentation');
    doc.moveDown();
    
    // Récupérer les statistiques
    const totalBeneficiaires = await BeneficiaireExperimentation.countDocuments({
      experimentation: experimentation._id
    });
    
    // Obtenir les cibles de l'expérimentation
    const cibles = await CibleExperimentation.find({ 
      experimentation: experimentation._id
    });
    
    // Stats par cible
    const statsParCible = await BeneficiaireExperimentation.aggregate([
      { $match: { experimentation: experimentation._id } },
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
          nom_cible: { $first: { $arrayElemAt: ['$cibleInfo.nom_cible', 0] } },
          code_cible: { $first: { $arrayElemAt: ['$cibleInfo.code_cible', 0] } },
          totalBeneficiaires: { $sum: 1 }
        }
      }
    ]);
    
    // Stats par statut
    const statsParStatut = await BeneficiaireExperimentation.aggregate([
      { $match: { experimentation: experimentation._id } },
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
          nom_statut: { $first: { $arrayElemAt: ['$statutInfo.nom_statut', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Obtenir le nombre de bénéficiaires par étape du processus
    const etapesProcessus = {
      IDENTIFIER: await SuiviProcessusInclusion.countDocuments({
        beneficiaire: { 
          $in: await BeneficiaireExperimentation.find(
            { experimentation: experimentation._id }
          ).distinct('_id')
        },
        etape_courante: 'IDENTIFIER'
      }),
      RECONTACTER: await SuiviProcessusInclusion.countDocuments({
        beneficiaire: { 
          $in: await BeneficiaireExperimentation.find(
            { experimentation: experimentation._id }
          ).distinct('_id')
        },
        etape_courante: 'RECONTACTER'
      }),
      VISITER: await SuiviProcessusInclusion.countDocuments({
        beneficiaire: { 
          $in: await BeneficiaireExperimentation.find(
            { experimentation: experimentation._id }
          ).distinct('_id')
        },
        etape_courante: 'VISITER'
      }),
      METTRE_EN_PLACE: await SuiviProcessusInclusion.countDocuments({
        beneficiaire: { 
          $in: await BeneficiaireExperimentation.find(
            { experimentation: experimentation._id }
          ).distinct('_id')
        },
        etape_courante: 'METTRE_EN_PLACE'
      }),
      DESINSTALLER: await SuiviProcessusInclusion.countDocuments({
        beneficiaire: { 
          $in: await BeneficiaireExperimentation.find(
            { experimentation: experimentation._id }
          ).distinct('_id')
        },
        etape_courante: 'DESINSTALLER'
      })
    };
    
    // Afficher les données
    doc.fontSize(12).font('Helvetica');
    doc.text(`Nombre total de bénéficiaires: ${totalBeneficiaires}`);
    doc.text(`Nombre de cibles: ${cibles.length}`);
    doc.moveDown();
    
    // Tableau des statistiques par cible
    doc.fontSize(14).font('Helvetica-Bold').text('Statistiques par cible');
    doc.moveDown();
    
    const tableParCible = {
      headers: ['Cible', 'Code', 'Nombre', 'Pourcentage'],
      rows: []
    };
    
    statsParCible.forEach(stat => {
      const pourcentage = totalBeneficiaires > 0 ? 
        Math.round((stat.totalBeneficiaires / totalBeneficiaires) * 100) : 0;
      
      tableParCible.rows.push([
        stat.nom_cible || 'Non défini',
        stat.code_cible || 'N/A',
        stat.totalBeneficiaires.toString(),
        `${pourcentage}%`
      ]);
    });
    
    dessinerTableau(doc, tableParCible);
    doc.moveDown(2);
    
    // Tableau des statistiques par statut
    doc.fontSize(14).font('Helvetica-Bold').text('Statistiques par statut');
    doc.moveDown();
    
    const tableParStatut = {
      headers: ['Statut', 'Nombre', 'Pourcentage'],
      rows: []
    };
    
    statsParStatut.forEach(stat => {
      const pourcentage = totalBeneficiaires > 0 ? 
        Math.round((stat.count / totalBeneficiaires) * 100) : 0;
      
      tableParStatut.rows.push([
        stat.nom_statut || 'Non défini',
        stat.count.toString(),
        `${pourcentage}%`
      ]);
    });
    
    dessinerTableau(doc, tableParStatut);
    doc.moveDown(2);
    
    // Tableau des statistiques par étape du processus
    doc.fontSize(14).font('Helvetica-Bold').text('Statistiques par étape du processus');
    doc.moveDown();
    
    const tableParEtape = {
      headers: ['Étape', 'Nombre', 'Pourcentage'],
      rows: []
    };
    
    const totalEtapes = Object.values(etapesProcessus).reduce((sum, val) => sum + val, 0);
    
    Object.entries(etapesProcessus).forEach(([etape, count]) => {
      const pourcentage = totalEtapes > 0 ? 
        Math.round((count / totalEtapes) * 100) : 0;
      
      tableParEtape.rows.push([
        etape,
        count.toString(),
        `${pourcentage}%`
      ]);
    });
    
    dessinerTableau(doc, tableParEtape);
    doc.moveDown(2);
    
    // Liste des bénéficiaires (si demandé)
    if (inclureBeneficiaires) {
      doc.addPage();
      
      doc.fontSize(16).font('Helvetica-Bold').text('Liste des bénéficiaires');
      doc.moveDown();
      
      const beneficiaires = await BeneficiaireExperimentation.find({ 
        experimentation: experimentation._id 
      })
      .populate('usager', 'fullName firstName')
      .populate('cible', 'nom_cible')
      .populate('statut', 'nom_statut')
      .sort({ date_rattachement: -1 })
      .limit(50); // Limiter à 50 pour éviter un PDF trop volumineux
      
      const tableBeneficiaires = {
        headers: ['Nom', 'Prénom', 'Cible', 'Statut', 'Date de rattachement'],
        rows: []
      };
      
      beneficiaires.forEach(beneficiaire => {
        tableBeneficiaires.rows.push([
          beneficiaire.usager?.fullName || 'N/A',
          beneficiaire.usager?.firstName || 'N/A',
          beneficiaire.cible?.nom_cible || 'N/A',
          beneficiaire.statut?.nom_statut || 'N/A',
          beneficiaire.date_rattachement ? 
            beneficiaire.date_rattachement.toLocaleDateString() : 'N/A'
        ]);
      });
      
      if (beneficiaires.length > 0) {
        dessinerTableau(doc, tableBeneficiaires);
        
        if (beneficiaires.length === 50) {
          doc.moveDown();
          doc.fontSize(10).font('Helvetica-Oblique').text(
            'Note: Seuls les 50 premiers bénéficiaires sont affichés dans ce rapport.'
          );
        }
      } else {
        doc.text('Aucun bénéficiaire trouvé pour cette expérimentation.');
      }
    }
    
    // Pied de page
    ajouterPiedDePage(doc);
  }
  
  // Fonction pour générer un rapport d'efficacité des actions
  async function genererRapportEfficacite(doc, experimentationId) {
    // En-tête
    ajouterEntete(doc, 'Rapport d\'Efficacité des Actions');
    
    // Construire le filtre
    let matchFilter = {};
    if (experimentationId) {
      // Trouver les bénéficiaires de cette expérimentation
      const beneficiaires = await BeneficiaireExperimentation.find({ 
        experimentation: experimentationId 
      }).distinct('_id');
      
      matchFilter.beneficiaire = { $in: beneficiaires };
    }
    
    // Récupérer les statistiques
    const totalActions = await ActionProcessus.countDocuments(matchFilter);
    const actionsTerminees = await ActionProcessus.countDocuments({
      ...matchFilter,
      statut: 'TERMINE'
    });
    const actionsEnCours = await ActionProcessus.countDocuments({
      ...matchFilter,
      statut: 'EN_COURS'
    });
    const actionsAFaire = await ActionProcessus.countDocuments({
      ...matchFilter,
      statut: 'A_FAIRE'
    });
    
    // Calculer le taux d'achèvement
    const tauxAchevement = totalActions > 0 ? 
      Math.round((actionsTerminees / totalActions) * 100) : 0;
    
    // Titre et informations générales
    doc.fontSize(12).font('Helvetica');
    doc.text(`Date de génération: ${new Date().toLocaleDateString()}`, {
      align: 'right'
    });
    if (experimentationId) {
      const experimentation = await Experimentation.findById(experimentationId);
      if (experimentation) {
        doc.text(`Expérimentation: ${experimentation.name} (${experimentation.code})`, {
          align: 'right'
        });
      }
    }
    doc.moveDown(2);
    
    // Résumé
    doc.fontSize(16).font('Helvetica-Bold').text('Résumé des actions');
    doc.moveDown();
    
    doc.fontSize(12).font('Helvetica');
    doc.text(`Nombre total d'actions: ${totalActions}`);
    doc.text(`Actions terminées: ${actionsTerminees} (${tauxAchevement}%)`);
    doc.text(`Actions en cours: ${actionsEnCours}`);
    doc.text(`Actions à faire: ${actionsAFaire}`);
    doc.moveDown(2);
    
    // Statistiques par type d'action
    const statsParTypeAction = await ActionProcessus.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$type_action',
          total: { $sum: 1 },
          terminees: {
            $sum: { $cond: [{ $eq: ['$statut', 'TERMINE'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          tauxAchevement: { 
            $multiply: [{ $divide: ['$terminees', '$total'] }, 100] 
          }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    doc.fontSize(14).font('Helvetica-Bold').text('Statistiques par type d\'action');
    doc.moveDown();
    
    const tableParTypeAction = {
      headers: ['Type d\'action', 'Total', 'Terminées', 'Taux d\'achèvement'],
      rows: []
    };
    
    statsParTypeAction.forEach(stat => {
      tableParTypeAction.rows.push([
        stat._id,
        stat.total.toString(),
        stat.terminees.toString(),
        `${Math.round(stat.tauxAchevement)}%`
      ]);
    });
    
    dessinerTableau(doc, tableParTypeAction);
    doc.moveDown(2);
    
    // Statistiques par étape
    const statsParEtape = await ActionProcessus.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$etape',
          total: { $sum: 1 },
          terminees: {
            $sum: { $cond: [{ $eq: ['$statut', 'TERMINE'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          tauxAchevement: { 
            $multiply: [{ $divide: ['$terminees', '$total'] }, 100] 
          }
        }
      },
      { $sort: { tauxAchevement: -1 } }
    ]);
    
    doc.fontSize(14).font('Helvetica-Bold').text('Statistiques par étape');
    doc.moveDown();
    
    const tableParEtape = {
      headers: ['Étape', 'Total', 'Terminées', 'Taux d\'achèvement'],
      rows: []
    };
    
    statsParEtape.forEach(stat => {
      tableParEtape.rows.push([
        stat._id,
        stat.total.toString(),
        stat.terminees.toString(),
        `${Math.round(stat.tauxAchevement)}%`
      ]);
    });
    
    dessinerTableau(doc, tableParEtape);
    doc.moveDown(2);
    
    // Efficacité par coordinateur
    const efficaciteCoordinateurs = await ActionProcessus.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'users',
          localField: 'responsable',
          foreignField: '_id',
          as: 'responsableInfo'
        }
      },
      {
        $group: {
          _id: '$responsable',
          responsableNom: { $first: { $arrayElemAt: ['$responsableInfo.fullName', 0] } },
          totalActions: { $sum: 1 },
          actionsTerminees: {
            $sum: { $cond: [{ $eq: ['$statut', 'TERMINE'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          tauxAchevement: { 
            $multiply: [{ $divide: ['$actionsTerminees', '$totalActions'] }, 100] 
          }
        }
      },
      { $sort: { totalActions: -1 } },
      { $limit: 10 } // Limiter aux 10 premiers
    ]);
    
    if (efficaciteCoordinateurs.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Efficacité par coordinateur (Top 10)');
      doc.moveDown();
      
      const tableCoordinateurs = {
        headers: ['Coordinateur', 'Total actions', 'Terminées', 'Taux d\'achèvement'],
        rows: []
      };
      
      efficaciteCoordinateurs.forEach(coord => {
        tableCoordinateurs.rows.push([
          coord.responsableNom || 'Inconnu',
          coord.totalActions.toString(),
          coord.actionsTerminees.toString(),
          `${Math.round(coord.tauxAchevement)}%`
        ]);
      });
      
      dessinerTableau(doc, tableCoordinateurs);
    }
    
    // Pied de page
    ajouterPiedDePage(doc);
  }
  
  // Fonction utilitaire pour ajouter l'en-tête au document PDF
  function ajouterEntete(doc, titre) {
    // Logo (si disponible)
    try {
      doc.image('public/logo.png', 50, 45, { width: 100 });
    } catch (e) {
      // Pas de logo disponible
    }
    
    // Titre
    doc.fontSize(22).font('Helvetica-Bold');
    doc.text(titre, 50, 50, {
      width: 500,
      align: 'center'
    });
    
    // Ligne de séparation
    doc.moveTo(50, 85)
      .lineTo(550, 85)
      .stroke();
    
    doc.moveDown(2);
  }
  
  // Fonction utilitaire pour ajouter le pied de page au document PDF
  function ajouterPiedDePage(doc) {
    const pageHeight = doc.page.height;
    
    // Ligne de séparation
    doc.moveTo(50, pageHeight - 50)
      .lineTo(550, pageHeight - 50)
      .stroke();
    
    // Texte du pied de page
    doc.fontSize(8).font('Helvetica');
    doc.text(
      `Rapport généré par le système RI2S le ${new Date().toLocaleDateString()} - Page ${doc.page.pageNumber}`,
      50,
      pageHeight - 40,
      {
        align: 'center',
        width: 500
      }
    );
  }
  
  // Fonction utilitaire pour dessiner un tableau
  function dessinerTableau(doc, table) {
    const { headers, rows } = table;
    
    // Calculer la largeur des colonnes
    const tableWidth = 500;
    const colWidths = [];
    
    // Répartir l'espace disponible entre les colonnes
    const colCount = headers.length;
    const defaultColWidth = tableWidth / colCount;
    
    headers.forEach(() => {
      colWidths.push(defaultColWidth);
    });
    
    // Dessiner l'en-tête
    const startX = 50;
    let startY = doc.y;
    const cellPadding = 5;
    const rowHeight = 20;
    
    // Fond de l'en-tête
    doc.fillColor('#4F81BD')
      .rect(startX, startY, tableWidth, rowHeight)
      .fill();
    
    // Texte de l'en-tête
    doc.fillColor('white').font('Helvetica-Bold');
    
    headers.forEach((header, i) => {
      const x = startX + colWidths.slice(0, i).reduce((sum, width) => sum + width, 0);
      doc.text(
        header,
        x + cellPadding,
        startY + cellPadding,
        {
          width: colWidths[i] - (2 * cellPadding),
          align: 'left'
        }
      );
    });
    
    // Dessiner les lignes
    doc.fillColor('black').font('Helvetica');
    
    startY += rowHeight;
    
    rows.forEach((row, rowIndex) => {
      // Alterner les couleurs de fond
      if (rowIndex % 2 === 0) {
        doc.fillColor('#F2F2F2')
          .rect(startX, startY, tableWidth, rowHeight)
          .fill();
      }
      
      // Texte de la ligne
      doc.fillColor('black');
      
      row.forEach((cell, i) => {
        const x = startX + colWidths.slice(0, i).reduce((sum, width) => sum + width, 0);
        doc.text(
          cell,
          x + cellPadding,
          startY + cellPadding,
          {
            width: colWidths[i] - (2 * cellPadding),
            align: 'left'
          }
        );
      });
      
      startY += rowHeight;
      
      // Si on atteint le bas de la page, créer une nouvelle page
      if (startY + rowHeight > doc.page.height - 50) {
        doc.addPage();
        startY = 50;
      }
    });
    
    // Mettre à jour la position Y du document
    doc.y = startY + 10;
  }

module.exports = exports;