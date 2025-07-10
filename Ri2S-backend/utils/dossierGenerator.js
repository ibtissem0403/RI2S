const DossierCounter = require('../models/DossierCounter');

const generateDossierNumber = async (experimentationCode) => {
    if (!experimentationCode || experimentationCode.length !== 3) {
      throw new Error('Code expérimentation invalide');
    }
  
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `${experimentationCode}-${year}-`;

  const counter = await DossierCounter.findOneAndUpdate(
    { prefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `${prefix}${counter.seq.toString().padStart(4, '0')}`;
};

module.exports = generateDossierNumber;