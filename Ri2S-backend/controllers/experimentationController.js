const Experimentation = require('../models/Experimentation');
const CibleExperimentation = require('../models/CibleExperimentation');
const StatutCible = require('../models/StatutCible');
const ChampStatut = require('../models/ChampStatut');
const ChampCommun = require('../models/ChampCommun');

// 1) Créer une expérimentation
exports.createExperimentation = async (req, res) => {
  try {
    const { name, code, description, startDate, endDate, protocolVersion, status, entreprise, contact_referent } = req.body;

    // Validation minimale
    if (!name || !code || !startDate || !protocolVersion) {
      return res.status(400).json({ error: 'name, code, startDate et protocolVersion sont obligatoires' });
    }

    // Vérifier unicité
    const existing = await Experimentation.findOne({ $or: [{ name }, { code }] });
    if (existing) {
      return res.status(409).json({ error: 'Une expérimentation avec ce nom ou code existe déjà' });
    }

    const newExp = await Experimentation.create({
      name,
      code,
      description,
      startDate,
      endDate,
      protocolVersion,
      status,
      entreprise,
      contact_referent
    });

    res.status(201).json({ message: 'Expérimentation créée', data: newExp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2) Lister toutes les expérimentations
exports.getAllExperimentations = async (_req, res) => {
  try {
    const list = await Experimentation.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3) Obtenir une expérimentation par ID
exports.getExperimentationById = async (req, res) => {
  try {
    const exp = await Experimentation.findById(req.params.id);
    if (!exp) {
      return res.status(404).json({ message: 'Expérimentation introuvable' });
    }
    res.json(exp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4) Mettre à jour une expérimentation
exports.updateExperimentation = async (req, res) => {
  try {
    const updates = req.body;
    if (updates.name) {
      const existing = await Experimentation.findOne({ name: updates.name, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(409).json({ error: 'Nom déjà utilisé' });
      }
    }

    const updated = await Experimentation.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Expérimentation introuvable' });
    }

    res.json({ message: 'Expérimentation mise à jour', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5) Supprimer une expérimentation
exports.deleteExperimentation = async (req, res) => {
  try {
    const deleted = await Experimentation.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Expérimentation introuvable' });
    }
    res.json({ message: 'Expérimentation supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6) Créer une expérimentation complète avec cibles, statuts et champs
exports.createExperimentationComplete = async (req, res) => {
  try {
    const { 
      name, 
      code, 
      description, 
      startDate, 
      endDate, 
      protocolVersion, 
      status, 
      entreprise,
      contact_referent,
      cibles,
      champs_communs
    } = req.body;

    // Validation minimale
    if (!name || !code || !startDate || !protocolVersion) {
      return res.status(400).json({ error: 'name, code, startDate et protocolVersion sont obligatoires' });
    }

    // Vérifier unicité
    const existing = await Experimentation.findOne({ $or: [{ name }, { code }] });
    if (existing) {
      return res.status(409).json({ error: 'Une expérimentation avec ce nom ou code existe déjà' });
    }

    // Créer l'expérimentation
    const newExp = await Experimentation.create({
      name,
      code,
      description,
      startDate,
      endDate,
      protocolVersion,
      status,
      entreprise,
      contact_referent
    });

    // Créer les champs communs
    if (champs_communs && champs_communs.length > 0) {
      await Promise.all(champs_communs.map(async (champ) => {
        await ChampCommun.create({
          experimentation: newExp._id,
          nom_champ: champ.nom_champ,
          type_champ: champ.type_champ,
          options: champ.options || [],
          obligatoire: champ.obligatoire || false,
          description: champ.description
        });
      }));
    }

    // Créer les cibles, statuts et champs
    if (cibles && cibles.length > 0) {
      await Promise.all(cibles.map(async (cible) => {
        // Créer la cible
        const nouvelleCible = await CibleExperimentation.create({
          experimentation: newExp._id,
          nom_cible: cible.nom_cible,
          code_cible: cible.code_cible,
          description: cible.description
        });

        // Créer les statuts
        if (cible.statuts && cible.statuts.length > 0) {
          await Promise.all(cible.statuts.map(async (statut, index) => {
            const nouveauStatut = await StatutCible.create({
              cible: nouvelleCible._id,
              nom_statut: statut.nom_statut,
              ordre: index,
              description: statut.description
            });

            // Créer les champs du statut
            if (statut.champs && statut.champs.length > 0) {
              await Promise.all(statut.champs.map(async (champ) => {
                await ChampStatut.create({
                  statut: nouveauStatut._id,
                  nom_champ: champ.nom_champ,
                  type_champ: champ.type_champ,
                  options: champ.options || [],
                  obligatoire: champ.obligatoire || false,
                  description: champ.description
                });
              }));
            }
          }));
        }
      }));
    }

    res.status(201).json({ 
      message: 'Expérimentation complète créée', 
      data: newExp 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7) Récupérer une expérimentation complète avec ses cibles, statuts et champs
exports.getExperimentationComplete = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer l'expérimentation
    const experimentation = await Experimentation.findById(id);
    if (!experimentation) {
      return res.status(404).json({ message: 'Expérimentation introuvable' });
    }

    // Récupérer les champs communs
    const champsCommuns = await ChampCommun.find({ experimentation: id });

    // Récupérer les cibles
    const cibles = await CibleExperimentation.find({ experimentation: id });

    // Pour chaque cible, récupérer ses statuts et leurs champs
    const ciblesCompletes = await Promise.all(cibles.map(async (cible) => {
      const statuts = await StatutCible.find({ cible: cible._id }).sort('ordre');

      const statutsComplets = await Promise.all(statuts.map(async (statut) => {
        const champs = await ChampStatut.find({ statut: statut._id });
        return {
          ...statut.toObject(),
          champs
        };
      }));

      return {
        ...cible.toObject(),
        statuts: statutsComplets
      };
    }));

    res.json({
      experimentation,
      champsCommuns,
      cibles: ciblesCompletes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};