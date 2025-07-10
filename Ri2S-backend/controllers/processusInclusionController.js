const ProcessusInclusion = require('../models/ProcessusInclusion');
const SuiviProcessusInclusion = require('../models/SuiviProcessusInclusion');
const BeneficiaireExperimentation = require('../models/BeneficiaireExperimentation');
const Experimentation = require('../models/Experimentation');
const CibleExperimentation = require('../models/CibleExperimentation');
const StatutCible = require('../models/StatutCible');
const ChampStatut = require('../models/ChampStatut');
const PseudonymizedBeneficiary = require('../models/PseudonymizedBeneficiary');
const ActionProcessus = require('../models/ActionProcessus');
const upload = require('../config/multer');


// Créer un processus d'inclusion par défaut pour une expérimentation
exports.createDefaultProcessus = async (req, res) => {
  try {
    const { experimentationId } = req.params;

    // Vérifier si l'expérimentation existe
    const experimentation = await Experimentation.findById(experimentationId);
    if (!experimentation) {
      return res.status(404).json({ message: 'Expérimentation non trouvée' });
    }

    // Vérifier si un processus existe déjà pour cette expérimentation
    const existingProcessus = await ProcessusInclusion.findOne({ experimentation: experimentationId });
    if (existingProcessus) {
      return res.status(400).json({ message: 'Un processus d\'inclusion existe déjà pour cette expérimentation' });
    }

    // Récupérer les cibles de l'expérimentation
    const cibles = await CibleExperimentation.find({ experimentation: experimentationId });
    if (cibles.length === 0) {
      return res.status(400).json({ message: 'L\'expérimentation doit avoir au moins une cible définie' });
    }

    // Pour chaque cible, créer les statuts correspondants aux étapes du processus
    const processusParCible = [];

    for (const cible of cibles) {
      // Créer ou récupérer les statuts pour chaque étape
      const statuts = [
        { code: 'IDENTIFIER', nom: 'Identifier', ordre: 0, description: 'Identification du bénéficiaire potentiel' },
        { code: 'RECONTACTER', nom: 'Re-contacter', ordre: 1, description: 'Prise de contact avec la personne' },
        { code: 'VISITER', nom: 'Visiter', ordre: 2, description: 'Phase de visite/rencontre' },
        { code: 'METTRE_EN_PLACE', nom: 'Mettre en place le dispositif', ordre: 3, description: 'Installation du système expérimental' },
        { code: 'DESINSTALLER', nom: 'Désinstaller', ordre: 4, description: 'Fin de l\'expérimentation et retrait du dispositif' }
      ];

      // Créer des statuts pour chaque étape si nécessaire
      const statutsIds = {};
      
      for (const statutInfo of statuts) {
        // Vérifier si un statut similaire existe déjà
        let statut = await StatutCible.findOne({ 
          cible: cible._id, 
          nom_statut: { $regex: new RegExp(statutInfo.nom, 'i') }
        });

        if (!statut) {
          // Créer le statut
          statut = await StatutCible.create({
            cible: cible._id,
            nom_statut: statutInfo.nom,
            ordre: statutInfo.ordre,
            description: statutInfo.description
          });
        }

        statutsIds[statutInfo.code] = statut._id;

        // Créer des champs par défaut pour ce statut selon l'étape
        if (statutInfo.code === 'IDENTIFIER') {
          await ChampStatut.create([
            {
              statut: statut._id,
              nom_champ: 'Date d\'identification',
              type_champ: 'date',
              obligatoire: true,
              description: 'Date à laquelle le bénéficiaire a été identifié'
            },
            {
              statut: statut._id,
              nom_champ: 'Source de recrutement',
              type_champ: 'liste',
              options: ['Domicile', 'Partenaire', 'Spontané', 'Autre'],
              obligatoire: true,
              description: 'Source du recrutement'
            }
          ]);
        } else if (statutInfo.code === 'RECONTACTER') {
          await ChampStatut.create([
            {
              statut: statut._id,
              nom_champ: 'Date de contact',
              type_champ: 'date',
              obligatoire: true,
              description: 'Date du contact'
            },
            {
              statut: statut._id,
              nom_champ: 'Moyen de contact',
              type_champ: 'liste',
              options: ['Téléphone', 'Email', 'Courrier', 'En personne'],
              obligatoire: true,
              description: 'Moyen utilisé pour contacter'
            }
          ]);
        } else if (statutInfo.code === 'VISITER') {
          await ChampStatut.create([
            {
              statut: statut._id,
              nom_champ: 'Date de visite',
              type_champ: 'date',
              obligatoire: true,
              description: 'Date de la visite'
            },
            {
              statut: statut._id,
              nom_champ: 'Consentement signé',
              type_champ: 'liste',
              options: ['Oui', 'Non', 'En attente'],
              obligatoire: true,
              description: 'Statut du consentement'
            }
          ]);
        } else if (statutInfo.code === 'METTRE_EN_PLACE') {
          await ChampStatut.create([
            {
              statut: statut._id,
              nom_champ: 'Date d\'installation',
              type_champ: 'date',
              obligatoire: true,
              description: 'Date d\'installation du dispositif'
            },
            {
              statut: statut._id,
              nom_champ: 'Installateur',
              type_champ: 'texte',
              obligatoire: true,
              description: 'Nom de l\'installateur'
            }
          ]);
        } else if (statutInfo.code === 'DESINSTALLER') {
          await ChampStatut.create([
            {
              statut: statut._id,
              nom_champ: 'Date de désinstallation',
              type_champ: 'date',
              obligatoire: true,
              description: 'Date de désinstallation du dispositif'
            },
            {
              statut: statut._id,
              nom_champ: 'Motif de fin',
              type_champ: 'liste',
              options: ['Fin d\'expérimentation', 'Abandon', 'Autre'],
              obligatoire: true,
              description: 'Motif de fin'
            }
          ]);
        }
      }

      // Ajouter cette cible et ses statuts au processus
      processusParCible.push({
        cible: cible._id,
        statuts: statutsIds
      });
    }

    // Créer le processus d'inclusion avec les étapes par défaut
    const processus = await ProcessusInclusion.create({
      nom: `Processus d'inclusion - ${experimentation.name}`,
      experimentation: experimentationId,
      etapes: [
        {
          code: 'IDENTIFIER',
          nom: 'Identifier',
          description: 'Identification du bénéficiaire potentiel',
          ordre: 0,
          actions: [
            {
              nom: 'Saisir informations générales',
              description: 'Saisir les informations de base du bénéficiaire'
            },
            {
              nom: 'Vérifier éligibilité',
              description: 'Vérifier que le bénéficiaire répond aux critères'
            }
          ],
          sous_etapes: []
        },
        {
          code: 'RECONTACTER',
          nom: 'Re-contacter',
          description: 'Prise de contact avec la personne',
          ordre: 1,
          actions: [
            {
              nom: 'Planifier rendez-vous',
              description: 'Planifier un rendez-vous avec le bénéficiaire'
            }
          ],
          sous_etapes: []
        },
        {
          code: 'VISITER',
          nom: 'Visiter',
          description: 'Phase de visite/rencontre',
          ordre: 2,
          actions: [
            {
              nom: 'Présenter le projet',
              description: 'Présenter le projet au bénéficiaire'
            },
            {
              nom: 'Faire signer le consentement',
              description: 'Obtenir le consentement signé'
            }
          ],
          sous_etapes: []
        },
        {
          code: 'METTRE_EN_PLACE',
          nom: 'Mettre en place le dispositif',
          description: 'Installation du système expérimental',
          ordre: 3,
          actions: [
            {
              nom: 'Installer le matériel',
              description: 'Installer le matériel nécessaire'
            },
            {
              nom: 'Former le bénéficiaire',
              description: 'Former le bénéficiaire à l\'utilisation'
            }
          ],
          sous_etapes: []
        },
        {
          code: 'DESINSTALLER',
          nom: 'Désinstaller',
          description: 'Fin de l\'expérimentation et retrait du dispositif',
          ordre: 4,
          actions: [
            {
              nom: 'Récupérer le matériel',
              description: 'Récupérer le matériel installé'
            },
            {
              nom: 'Réaliser enquête de satisfaction',
              description: 'Faire remplir le questionnaire de satisfaction'
            }
          ],
          sous_etapes: []
        }
      ],
      active: true
    });

    // Associer les statuts appropriés aux étapes pour chaque cible
    for (const cibleProcessus of processusParCible) {
      for (const etape of processus.etapes) {
        // Associer le statut correspondant de la cible actuelle à cette étape
        await ProcessusInclusion.updateOne(
          { 
            _id: processus._id, 
            'etapes.code': etape.code 
          },
          { 
            $set: { 
              'etapes.$.statut_cible': cibleProcessus.statuts[etape.code]
            } 
          }
        );
      }
    }

    res.status(201).json({
      message: 'Processus d\'inclusion créé avec succès',
      data: await ProcessusInclusion.findById(processus._id)
    });
  } catch (error) {
    console.error('Erreur lors de la création du processus d\'inclusion:', error);
    res.status(500).json({
      message: 'Erreur lors de la création du processus d\'inclusion',
      error: error.message
    });
  }
};

// Récupérer le processus d'inclusion d'une expérimentation
exports.getProcessusInclusion = async (req, res) => {
  try {
    const { experimentationId } = req.params;

    const processus = await ProcessusInclusion.findOne({ experimentation: experimentationId })
      .populate({
        path: 'etapes.statut_cible',
        model: 'StatutCible'
      });

    if (!processus) {
      return res.status(404).json({ message: 'Processus d\'inclusion non trouvé pour cette expérimentation' });
    }

    res.status(200).json(processus);
  } catch (error) {
    console.error('Erreur lors de la récupération du processus d\'inclusion:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du processus d\'inclusion',
      error: error.message
    });
  }
};

// Démarrer le processus d'inclusion pour un bénéficiaire
exports.demarrerProcessus = async (req, res) => {
  try {
    const { pseudoId, experimentationId, cibleId } = req.body;

    // Vérifier si le bénéficiaire existe
    const pseudoBeneficiary = await PseudonymizedBeneficiary.findOne({ pseudoId });
    if (!pseudoBeneficiary) {
      return res.status(404).json({ message: 'Bénéficiaire introuvable' });
    }

    // Récupérer l'ID réel
    const usagerId = pseudoBeneficiary.realBeneficiary;

    // Vérifier si le processus d'inclusion existe
    const processus = await ProcessusInclusion.findOne({ 
      experimentation: experimentationId,
      active: true
    });

    if (!processus) {
      return res.status(404).json({ message: 'Processus d\'inclusion non trouvé pour cette expérimentation' });
    }

    // Vérifier si le bénéficiaire est déjà rattaché à cette expérimentation
    let beneficiaire = await BeneficiaireExperimentation.findOne({
      usager: usagerId,
      experimentation: experimentationId,
      cible: cibleId
    });

    // Récupérer le statut correspondant à la première étape
    const premiereEtape = processus.etapes.find(e => e.ordre === 0);
    if (!premiereEtape || !premiereEtape.statut_cible) {
      return res.status(400).json({ 
        message: 'Configuration incorrecte du processus: statut manquant pour la première étape' 
      });
    }

    // Si le bénéficiaire n'est pas rattaché, le rattacher avec le statut de la première étape
    if (!beneficiaire) {
      beneficiaire = await BeneficiaireExperimentation.create({
        usager: usagerId,
        experimentation: experimentationId,
        cible: cibleId,
        statut: premiereEtape.statut_cible,
        historique_statuts: [{
          statut: premiereEtape.statut_cible,
          date_changement: new Date(),
          note: 'Démarrage du processus d\'inclusion'
        }]
      });

      // Ajouter l'expérimentation à la liste des expérimentations du bénéficiaire
      const experimentation = await Experimentation.findById(experimentationId);
      if (experimentation && !pseudoBeneficiary.experiments.includes(experimentation.name)) {
        pseudoBeneficiary.experiments.push(experimentation.name);
        await pseudoBeneficiary.save();
      }
    }

    // Vérifier si un suivi de processus existe déjà
    const suiviExistant = await SuiviProcessusInclusion.findOne({
      beneficiaire: beneficiaire._id,
      processus: processus._id
    });

    if (suiviExistant) {
      return res.status(400).json({ 
        message: 'Le processus d\'inclusion est déjà en cours pour ce bénéficiaire' 
      });
    }

    // Créer le suivi du processus
    const suivi = await SuiviProcessusInclusion.create({
      beneficiaire: beneficiaire._id,
      processus: processus._id,
      etape_courante: 'IDENTIFIER',
      historique: [{
        etape: 'IDENTIFIER',
        date_debut: new Date(),
        responsable: req.user._id,
        statut: 'EN_COURS',
        notes: 'Démarrage du processus d\'inclusion'
      }]
    });

    res.status(201).json({
      message: 'Processus d\'inclusion démarré avec succès',
      data: await SuiviProcessusInclusion.findById(suivi._id)
        .populate('beneficiaire')
        .populate('processus')
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du processus d\'inclusion:', error);
    res.status(500).json({
      message: 'Erreur lors du démarrage du processus d\'inclusion',
      error: error.message
    });
  }
};

// Passer à l'étape suivante du processus
exports.passerEtapeSuivante = async (req, res) => {
  try {
    const { suiviId } = req.params;
    const { notes, documents, valeurs_champs } = req.body;

    // Vérifier si le suivi existe
    const suivi = await SuiviProcessusInclusion.findById(suiviId)
      .populate({
        path: 'processus',
        populate: {
          path: 'etapes.statut_cible',
          model: 'StatutCible'
        }
      })
      .populate('beneficiaire');

    if (!suivi) {
      return res.status(404).json({ message: 'Suivi de processus non trouvé' });
    }

    // Récupérer l'étape courante et l'étape suivante
    const etapeCourante = suivi.processus.etapes.find(e => e.code === suivi.etape_courante);
    if (!etapeCourante) {
      return res.status(400).json({ message: 'Étape courante introuvable dans le processus' });
    }

    // Vérifier si c'est la dernière étape
    if (etapeCourante.ordre === suivi.processus.etapes.length - 1) {
      return res.status(400).json({ message: 'Le processus est déjà à la dernière étape' });
    }

    const etapeSuivante = suivi.processus.etapes.find(e => e.ordre === etapeCourante.ordre + 1);
    if (!etapeSuivante) {
      return res.status(400).json({ message: 'Étape suivante introuvable dans le processus' });
    }

    // Mettre à jour l'historique de l'étape courante
    const indexEtapeCourante = suivi.historique.findIndex(h => 
      h.etape === suivi.etape_courante && h.statut === 'EN_COURS'
    );

    if (indexEtapeCourante !== -1) {
      suivi.historique[indexEtapeCourante].date_fin = new Date();
      suivi.historique[indexEtapeCourante].notes = notes || suivi.historique[indexEtapeCourante].notes;
      suivi.historique[indexEtapeCourante].statut = 'COMPLETE';

      // Ajouter les documents si fournis
      if (documents && documents.length > 0) {
        if (!suivi.historique[indexEtapeCourante].actions_completees) {
          suivi.historique[indexEtapeCourante].actions_completees = [];
        }
        
        suivi.historique[indexEtapeCourante].actions_completees.push({
          nom: 'Documents fournis',
          date: new Date(),
          notes: 'Documents ajoutés lors du passage à l\'étape suivante',
          documents: documents
        });
      }
    }

    // Ajouter la nouvelle étape à l'historique
    suivi.historique.push({
      etape: etapeSuivante.code,
      date_debut: new Date(),
      responsable: req.user._id,
      statut: 'EN_COURS',
      notes: `Passage à l'étape: ${etapeSuivante.nom}`
    });

    // Mettre à jour l'étape courante
    suivi.etape_courante = etapeSuivante.code;
    suivi.date_derniere_modification = new Date();

    await suivi.save();

    // Mettre à jour le statut du bénéficiaire
    if (etapeSuivante.statut_cible) {
      await BeneficiaireExperimentation.findByIdAndUpdate(
        suivi.beneficiaire._id,
        {
          statut: etapeSuivante.statut_cible,
          $push: {
            historique_statuts: {
              statut: etapeSuivante.statut_cible,
              date_changement: new Date(),
              note: `Passage à l'étape: ${etapeSuivante.nom}`
            }
          }
        }
      );

      // Sauvegarder les valeurs des champs si fournies
      if (valeurs_champs && Object.keys(valeurs_champs).length > 0) {
        const ValeurChampStatut = require('../models/ValeurChampStatut');
        
        for (const champId of Object.keys(valeurs_champs)) {
          // Vérifier si une valeur existe déjà
          const existingValeur = await ValeurChampStatut.findOne({
            beneficiaire: suivi.beneficiaire._id,
            champ: champId
          });

          if (existingValeur) {
            // Mettre à jour la valeur existante
            existingValeur.valeur = valeurs_champs[champId];
            await existingValeur.save();
          } else {
            // Créer une nouvelle valeur
            await ValeurChampStatut.create({
              beneficiaire: suivi.beneficiaire._id,
              champ: champId,
              valeur: valeurs_champs[champId]
            });
          }
        }
      }
    }


const actionsACreer = [];
    
switch (etapeSuivante.code) {
  case 'IDENTIFIER':
    actionsACreer.push(
      { type_action: 'SAISIR_INFORMATIONS', commentaires: 'Saisir les informations générales du bénéficiaire' },
      { type_action: 'VERIFIER_ELIGIBILITE', commentaires: 'Vérifier que le bénéficiaire répond aux critères' }
    );
    break;
  case 'RECONTACTER':
    actionsACreer.push(
      { type_action: 'PLANIFIER_RDV', commentaires: 'Planifier un rendez-vous avec le bénéficiaire' }
    );
    break;
  case 'VISITER':
    actionsACreer.push(
      { type_action: 'PRESENTER_PROJET', commentaires: 'Présenter le projet au bénéficiaire' },
      { type_action: 'FAIRE_SIGNER_CONSENTEMENT', commentaires: 'Faire signer le formulaire de consentement' }
    );
    break;
  case 'METTRE_EN_PLACE':
    actionsACreer.push(
      { type_action: 'INSTALLER_MATERIEL', commentaires: 'Installer le matériel chez le bénéficiaire' },
      { type_action: 'FORMER_BENEFICIAIRE', commentaires: 'Former le bénéficiaire à l\'utilisation du matériel' }
    );
    break;
  case 'DESINSTALLER':
    actionsACreer.push(
      { type_action: 'RECUPERER_MATERIEL', commentaires: 'Récupérer le matériel installé' },
      { type_action: 'REALISER_ENQUETE', commentaires: 'Réaliser l\'enquête de satisfaction' }
    );
    break;
}

// Créer les actions en base de données
await Promise.all(
  actionsACreer.map(action => 
    ActionProcessus.create({
      beneficiaire: suivi.beneficiaire._id,
      etape: etapeSuivante.code,
      type_action: action.type_action,
      commentaires: action.commentaires,
      responsable: req.user._id
    })
  )
);

    res.status(200).json({
      message: `Passage à l'étape "${etapeSuivante.nom}" effectué avec succès`,
      data: await SuiviProcessusInclusion.findById(suivi._id)
        .populate('beneficiaire')
        .populate({
          path: 'processus',
          populate: {
            path: 'etapes.statut_cible',
            model: 'StatutCible'
          }
        })
    });
  } catch (error) {
    console.error('Erreur lors du passage à l\'étape suivante:', error);
    res.status(500).json({
      message: 'Erreur lors du passage à l\'étape suivante',
      error: error.message
    });
  }
};

// Récupérer le suivi du processus d'inclusion d'un bénéficiaire
exports.getSuiviProcessus = async (req, res) => {
  try {
    const { beneficiaireId } = req.params;

    const suivi = await SuiviProcessusInclusion.findOne({ 
      beneficiaire: beneficiaireId 
    })
    .populate('beneficiaire')
    .populate({
      path: 'processus',
      populate: {
        path: 'etapes.statut_cible',
        model: 'StatutCible'
      }
    })
    .populate({
      path: 'historique.responsable',
      model: 'User',
      select: 'fullName email'
    });

    if (!suivi) {
      return res.status(404).json({ 
        message: 'Suivi de processus non trouvé pour ce bénéficiaire' 
      });
    }

    res.status(200).json(suivi);
  } catch (error) {
    console.error('Erreur lors de la récupération du suivi de processus:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération du suivi de processus',
      error: error.message
    });
  }
};

// Annuler ou mettre en pause le processus d'inclusion
exports.changerStatutProcessus = async (req, res) => {
  try {
    const { suiviId } = req.params;
    const { statut, motif } = req.body;

    if (!['ANNULE', 'EN_ATTENTE', 'EN_COURS'].includes(statut)) {
      return res.status(400).json({ 
        message: 'Statut invalide. Valeurs acceptées: ANNULE, EN_ATTENTE, EN_COURS' 
      });
    }

    // Vérifier si le suivi existe
    const suivi = await SuiviProcessusInclusion.findById(suiviId);
    if (!suivi) {
      return res.status(404).json({ message: 'Suivi de processus non trouvé' });
    }

    // Mettre à jour le statut de l'étape courante
    const indexEtapeCourante = suivi.historique.findIndex(h => 
      h.etape === suivi.etape_courante && ['EN_COURS', 'EN_ATTENTE'].includes(h.statut)
    );

    if (indexEtapeCourante !== -1) {
      // Si on annule, mettre une date de fin
      if (statut === 'ANNULE') {
        suivi.historique[indexEtapeCourante].date_fin = new Date();
      }
      
      suivi.historique[indexEtapeCourante].statut = statut;
      suivi.historique[indexEtapeCourante].notes = (suivi.historique[indexEtapeCourante].notes || '') + 
        `\n[${new Date().toISOString()}] Changement de statut: ${statut}. Motif: ${motif || 'Non spécifié'}`;
    }

    suivi.date_derniere_modification = new Date();
    await suivi.save();

    res.status(200).json({
      message: `Statut du processus changé en "${statut}" avec succès`,
      data: await SuiviProcessusInclusion.findById(suivi._id)
        .populate('beneficiaire')
        .populate('processus')
    });
  } catch (error) {
    console.error('Erreur lors du changement de statut du processus:', error);
    res.status(500).json({
      message: 'Erreur lors du changement de statut du processus',
      error: error.message
    });
  }
};



// Ajouter ces nouvelles fonctions au fichier processusInclusionController.js

// Création des actions spécifiques pour une étape
exports.creerActionsSpecifiques = async (req, res) => {
  try {
    const { beneficiaireId, etape } = req.params;

    // Vérifier si le bénéficiaire existe
    const beneficiaire = await BeneficiaireExperimentation.findById(beneficiaireId);
    if (!beneficiaire) {
      return res.status(404).json({ message: 'Bénéficiaire non trouvé' });
    }

    // Définir les actions spécifiques selon l'étape
    let actionsACreer = [];
    
    switch (etape) {
      case 'IDENTIFIER':
        actionsACreer = [
          { type_action: 'SAISIR_INFORMATIONS', commentaires: 'Saisir les informations générales du bénéficiaire' },
          { type_action: 'VERIFIER_ELIGIBILITE', commentaires: 'Vérifier que le bénéficiaire répond aux critères' }
        ];
        break;
      case 'RECONTACTER':
        actionsACreer = [
          { type_action: 'PLANIFIER_RDV', commentaires: 'Planifier un rendez-vous avec le bénéficiaire' }
        ];
        break;
      case 'VISITER':
        actionsACreer = [
          { type_action: 'PRESENTER_PROJET', commentaires: 'Présenter le projet au bénéficiaire' },
          { type_action: 'FAIRE_SIGNER_CONSENTEMENT', commentaires: 'Faire signer le formulaire de consentement' }
        ];
        break;
      case 'METTRE_EN_PLACE':
        actionsACreer = [
          { type_action: 'INSTALLER_MATERIEL', commentaires: 'Installer le matériel chez le bénéficiaire' },
          { type_action: 'FORMER_BENEFICIAIRE', commentaires: 'Former le bénéficiaire à l\'utilisation du matériel' }
        ];
        break;
      case 'DESINSTALLER':
        actionsACreer = [
          { type_action: 'RECUPERER_MATERIEL', commentaires: 'Récupérer le matériel installé' },
          { type_action: 'REALISER_ENQUETE', commentaires: 'Réaliser l\'enquête de satisfaction' }
        ];
        break;
      default:
        return res.status(400).json({ message: 'Étape non reconnue' });
    }

    // Créer les actions en base de données
    const actionsCreees = await Promise.all(
      actionsACreer.map(action => 
        ActionProcessus.create({
          beneficiaire: beneficiaireId,
          etape: etape,
          type_action: action.type_action,
          commentaires: action.commentaires,
          responsable: req.user._id
        })
      )
    );

    res.status(201).json({
      message: `Actions pour l'étape ${etape} créées avec succès`,
      actions: actionsCreees
    });
  } catch (error) {
    console.error('Erreur lors de la création des actions spécifiques:', error);
    res.status(500).json({
      message: 'Erreur lors de la création des actions spécifiques',
      error: error.message
    });
  }
};

// Mise à jour du statut d'une action spécifique
exports.updateActionStatus = async (req, res) => {
  try {
    const { actionId } = req.params;
    const { statut, commentaires } = req.body;

    // Vérifier que l'action existe
    const action = await ActionProcessus.findById(actionId);
    if (!action) {
      return res.status(404).json({ message: 'Action non trouvée' });
    }

    // Mettre à jour le statut
    action.statut = statut;
    if (commentaires) action.commentaires = commentaires;
    
    // Si l'action est terminée, enregistrer la date de réalisation
    if (statut === 'TERMINE') {
      action.date_realisation = new Date();
    }

    await action.save();

    // Vérifier si toutes les actions de l'étape sont terminées
    const toutesActionsTerminees = await ActionProcessus.countDocuments({
      beneficiaire: action.beneficiaire,
      etape: action.etape,
      statut: { $ne: 'TERMINE' }
    }) === 0;

    res.status(200).json({
      message: `Statut de l'action mis à jour avec succès`,
      action,
      toutesActionsTerminees
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de l\'action:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du statut de l\'action',
      error: error.message
    });
  }
};

// Ajouter un document à une action
exports.ajouterDocumentAction = async (req, res) => {
  try {
    const { actionId } = req.params;
    
    // Vérifier que l'action existe
    const action = await ActionProcessus.findById(actionId);
    if (!action) {
      return res.status(404).json({ message: 'Action non trouvée' });
    }
    
    // Vérifier que le fichier a été envoyé
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }
    
    // Ajouter le document à l'action
    action.documents = action.documents || [];
    action.documents.push({
      nom: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.filename,
      fileMimeType: req.file.mimetype,
      date_ajout: new Date(),
      ajoute_par: req.user._id
    });
    
    await action.save();
    
    res.status(201).json({
      message: 'Document ajouté avec succès',
      document: action.documents[action.documents.length - 1]
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du document:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'ajout du document',
      error: error.message
    });
  }
};

// Récupérer les actions d'une étape
exports.getActionsEtape = async (req, res) => {
  try {
    const { beneficiaireId, etape } = req.params;

    const actions = await ActionProcessus.find({
      beneficiaire: beneficiaireId,
      etape: etape
    })
    .populate('responsable', 'fullName email')
    .sort({ date_creation: 1 });

    res.status(200).json(actions);
  } catch (error) {
    console.error('Erreur lors de la récupération des actions:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des actions',
      error: error.message
    });
  }
};

// Supprimer un document d'une action
exports.supprimerDocumentAction = async (req, res) => {
  try {
    const { actionId, documentId } = req.params;
    
    // Vérifier que l'action existe
    const action = await ActionProcessus.findById(actionId);
    if (!action) {
      return res.status(404).json({ message: 'Action non trouvée' });
    }
    
    // Trouver le document dans l'action
    const documentIndex = action.documents.findIndex(doc => doc._id.toString() === documentId);
    if (documentIndex === -1) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }
    
    // Supprimer le document de l'action
    action.documents.splice(documentIndex, 1);
    await action.save();
    
    res.status(200).json({
      message: 'Document supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du document:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression du document',
      error: error.message
    });
  }
};

