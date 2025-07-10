const ClinicalData = require('../models/ClinicalData');
const BeneficiaryClinicalLink = require('../models/BeneficiaryClinicalLink');
const PseudonymizedBeneficiary = require('../models/PseudonymizedBeneficiary');


//1) Créer une donnée clinique

const createClinicalData = async (req, res) => {
  try {
    const {
      beneficiaryId,
      experimentation,
      examType,
      examSubType,
      result,
      unit,
      normalRange,
      examDate,
      comment,
      isAbnormal,
      requiresFollowUp
    } = req.body;

    if (!beneficiaryId) {
      return res.status(400).json({ message: 'beneficiaryId is required' });
    }

       // Récupérer les métadonnées du fichier uploadé
       const fileUrl      = req.file ? `/uploads/${req.file.filename}` : null;
       const fileName     = req.file ? req.file.originalname       : null;
       const fileMimeType = req.file ? req.file.mimetype           : null;



    // Création de la donnée clinique
    const clinicalData = await ClinicalData.create({
      realBeneficiary: beneficiaryId,
      experimentation,
      examType,
      examSubType,
      result,
      unit,
      normalRange,
      examDate,
      comment,
      isAbnormal,
      requiresFollowUp,
      fileUrl,
      fileName,
      fileMimeType,
      recordedBy: req.user._id  // ou un autre user
    });

    // Création du lien avec le bénéficiaire
    // await BeneficiaryClinicalLink.create({
    //   beneficiary:   beneficiaryId,
    //   clinicalData:  clinicalData._id,
    //   createdBy:     req.user._id
    // });

    res.status(201).json({
      message: 'Donnée clinique et lien créés avec succès',
      clinicalData
    });
  } catch (error) {
    console.error('Erreur lors de la création :', error);
    res.status(500).json({
      message: 'Erreur lors de la création',
      error: error.message
    });
  }
};


// 2) Lister toutes les données cliniques
exports.getAllClinicalData = async (req, res) => {
  try {
    const list = await ClinicalData
      .find()
      .populate('realBeneficiary', 'fullName firstName entryDate')
      .sort({ examDate: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3) Récupérer une donnée clinique par son ID
exports.getClinicalDataById = async (req, res) => {
  try {
    const doc = await ClinicalData
      .findById(req.params.id)
      .populate('realBeneficiary', 'fullName firstName entryDate');
    if (!doc) return res.status(404).json({ message: 'Non trouvé' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4) Mettre à jour une donnée clinique
exports.updateClinicalData = async (req, res) => {
  try {
    const updates = (({ experimentation, examType, result, examDate, comment }) => 
      ({ experimentation, examType, result, examDate, comment }))(req.body);
    const doc = await ClinicalData.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Non trouvé' });
    res.json({ message: 'Mis à jour', data: doc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5) Supprimer une donnée clinique
exports.deleteClinicalData = async (req, res) => {
  try {
    const doc = await ClinicalData.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Non trouvé' });
    res.json({ message: 'Supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createClinicalData = async (req, res) => {
  try {
    const clinicalData = await ClinicalData.create(req.body);

    // Créer le lien
    await BeneficiaryClinicalLink.create({
      beneficiaryId: req.body.beneficiaryId,
      clinicalDataId: clinicalData._id
    });

    res.status(201).json(clinicalData);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création', error });
  }
};

exports.getClinicalDataByBeneficiary = async (req, res) => {
  try {
    const beneficiaryId = req.params.beneficiaryId;

    const links = await BeneficiaryClinicalLink.find({ beneficiaryId }).populate('clinicalDataId');

    const clinicalDataList = links.map(link => link.clinicalDataId);

    res.status(200).json(clinicalDataList);
  } catch (error) {
    res.status(500).json({ message: 'Erreur de récupération', error });
  }
};

// CORRIGER LA FONCTION deleteClinicalDataByBeneficiary
exports.deleteClinicalDataByBeneficiary = async (req, res) => {
  try {
    const { beneficiaryId } = req.params;

    // Trouver le realBeneficiaryId depuis le pseudonyme
    const pseudo = await PseudonymizedBeneficiary.findById(beneficiaryId);
    if (!pseudo || !pseudo.realBeneficiary) {
      return res.status(404).json({ message: 'Bénéficiaire introuvable' });
    }

    const realId = pseudo.realBeneficiary;

    const links = await BeneficiaryClinicalLink.find({ beneficiary: realId });
    const clinicalIds = links.map(l => l.clinicalData);

    await ClinicalData.deleteMany({ _id: { $in: clinicalIds } });
    await BeneficiaryClinicalLink.deleteMany({ beneficiary: realId });

    res.json({ 
      message: 'Données cliniques supprimées',
      realBeneficiary: realId,
      count: clinicalIds.length 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

