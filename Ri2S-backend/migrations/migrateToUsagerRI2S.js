// scripts/migrateToUsagerRI2S.js
require('dotenv').config();
const mongoose = require('mongoose');

async function migrateToUsagerRI2S() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connecté à MongoDB');

    // Récupérer les collections
    const db = mongoose.connection.db;
    const realBeneficiaries = db.collection('realbeneficiaries');
    const usagersRI2S = db.collection('usagerri2s');

    // 1. Créer les usagers RI2S pour tous les bénéficiaires qui n'en ont pas encore
    const result = await realBeneficiaries.aggregate([
      // Sélectionner les bénéficiaires sans lien usagerRI2S
      { $match: { usagerRI2S: { $exists: false } } },
      // Préparer les documents à insérer dans usagersRI2S
      { 
        $project: {
          fullName: 1,
          firstName: 1,
          birthDate: 1,
          sex: 1,
          address: 1,
          phone: 1,
          email: 1,
          type_usager: { $literal: 'non_pro' },
          role: { $literal: 'senior' },
          realBeneficiary: '$_id',
          createdAt: { $literal: new Date() },
          updatedAt: { $literal: new Date() }
        }
      }
    ]).toArray();

    console.log(`🔍 ${result.length} bénéficiaires à migrer`);

    if (result.length === 0) {
      console.log('Aucun bénéficiaire à migrer.');
      return;
    }

    // 2. Insertion en masse des nouveaux usagersRI2S
    const insertResult = await usagersRI2S.insertMany(result);
    console.log(`✅ ${insertResult.insertedCount} usagers RI2S créés`);

    // 3. Créer un mapping d'ID pour la mise à jour
    const updates = [];
    for (const doc of result) {
      // Trouver l'usagerRI2S qui a été créé pour ce bénéficiaire
      const usagerRI2S = await usagersRI2S.findOne({ 
        realBeneficiary: doc._id 
      });
      
      if (usagerRI2S) {
        updates.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { usagerRI2S: usagerRI2S._id } }
          }
        });
      }
    }

    // 4. Mise à jour en masse des bénéficiaires
    if (updates.length > 0) {
      const updateResult = await realBeneficiaries.bulkWrite(updates);
      console.log(`✅ ${updateResult.modifiedCount} bénéficiaires mis à jour`);
    }

    // 5. Création d'un index sur usagerRI2S
    await usagersRI2S.createIndex({ realBeneficiary: 1 }, { unique: true });
    await usagersRI2S.createIndex({ fullName: 1, firstName: 1 });
    await usagersRI2S.createIndex({ type_usager: 1, role: 1 });
    console.log('✅ Index créés sur UsagerRI2S');

    console.log('✅ Migration terminée avec succès');

  } catch (err) {
    console.error('❌ Erreur migration:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrateToUsagerRI2S();