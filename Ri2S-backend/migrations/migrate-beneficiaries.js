require('dotenv').config();
const mongoose = require('mongoose');
const RealBeneficiary = require('../models/RealBeneficiary');

async function migrate() {
  try {
    // 1. Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connecté à MongoDB');

    // 2. Opérations de migration
    const db = mongoose.connection.db;
    const beneficiaries = db.collection('realbeneficiaries');

    // a) Migration des anciens champs
    const updateResult = await beneficiaries.updateMany(
      { 
        $or: [
          { caregiverName: { $exists: true } },
          { entryDate: { $exists: true } }
        ]
      },
      [
        {
          $set: {
            "caregiver.name": "$caregiverName",
            "caregiver.firstName": "$caregiverFirstName",
            inclusionDate: "$entryDate",
            recruitmentDate: { $ifNull: ["$recruitmentDate", "$createdAt"] }
          }
        },
        {
          $unset: [
            "caregiverName", 
            "caregiverFirstName", 
            "entryDate"
          ]
        }
      ]
    );
    console.log(`Documents modifiés: ${updateResult.modifiedCount}`);

    // b) Création des index
    await beneficiaries.createIndex({ "caregiver.name": 1 });
    await beneficiaries.createIndex({ inclusionDate: 1 });
    console.log('Index créés avec succès');

    // 3. Validation finale
    const count = await beneficiaries.countDocuments({
      "caregiver.name": { $exists: true }
    });
    console.log(`Migration terminée. ${count} bénéficiaires migrés.`);

  } catch (err) {
    console.error('Erreur de migration:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();