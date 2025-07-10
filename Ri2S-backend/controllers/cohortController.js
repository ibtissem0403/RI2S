const Cohort = require('../models/Cohort');

// 1) CRÉER UNE COHORTE
exports.createCohort = async (req, res) => {
  try {
    const { 
      name,
      experimentation,
      code,
      startDate,
      endDate,
      inclusionCriteria,
      exclusionCriteria,
      isActive
    } = req.body;

    // Validation
    if (!name || !experimentation) {
      return res.status(400).json({ 
        error: "Le nom et l'expérimentation sont obligatoires" 
      });
    }

    // Vérifier les doublons
    const existingCohort = await Cohort.findOne({ 
      $or: [{ name }, { code }] 
    });

    if (existingCohort) {
      return res.status(409).json({ 
        error: "Une cohorte avec ce nom ou code existe déjà" 
      });
    }

    const newCohort = await Cohort.create({
      name,
      experimentation,
      code,
      startDate,
      endDate,
      inclusionCriteria: inclusionCriteria || [],
      exclusionCriteria: exclusionCriteria || [],
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      message: "Cohorte créée avec succès",
      data: newCohort
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2) LISTER TOUTES LES COHORTES
exports.getAllCohorts = async (req, res) => {
  try {
    const cohorts = await Cohort.find()
      .populate('experimentation')
      .sort({ createdAt: -1 });

    res.json(cohorts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3) OBTAINIR UNE COHORTE PAR ID
exports.getCohortById = async (req, res) => {
  try {
    const cohort = await Cohort.findById(req.params.id)
      .populate('experimentation');

    if (!cohort) {
      return res.status(404).json({ message: "Cohorte introuvable" });
    }

    res.json(cohort);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4) METTRE À JOUR UNE COHORTE
exports.updateCohort = async (req, res) => {
  try {
    const updates = req.body;
    
    // Blocage de la modification du nom/code existant
    if (updates.name || updates.code) {
      const existing = await Cohort.findOne({ 
        $or: [
          { name: updates.name }, 
          { code: updates.code }
        ],
        _id: { $ne: req.params.id }
      });

      if (existing) {
        return res.status(409).json({ 
          error: "Nom ou code déjà utilisé par une autre cohorte" 
        });
      }
    }

    const updatedCohort = await Cohort.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('experimentation');

    if (!updatedCohort) {
      return res.status(404).json({ message: "Cohorte introuvable" });
    }

    res.json({
      message: "Cohorte mise à jour avec succès",
      data: updatedCohort
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5) SUPPRIMER UNE COHORTE
exports.deleteCohort = async (req, res) => {
  try {
    const cohort = await Cohort.findByIdAndDelete(req.params.id);

    if (!cohort) {
      return res.status(404).json({ message: "Cohorte introuvable" });
    }

    res.json({ message: "Cohorte supprimée avec succès" });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};