// scripts/migrateAddStatutsSecondaires.js
require('dotenv').config();
const mongoose = require('mongoose');

async function migrateAddStatutsSecondaires() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connecté à MongoDB');

    // Récupérer la collection BeneficiaireExperimentation
    const db = mongoose.connection.db;
    const beneficiairesExperimentation = db.collection('beneficiaireexperimentations');

    // 1. Vérifier combien de documents n'ont pas encore le champ statuts_secondaires
    const countWithoutStatutsSecondaires = await beneficiairesExperimentation.countDocuments({
      statuts_secondaires: { $exists: false }
    });

    console.log(`🔍 ${countWithoutStatutsSecondaires} bénéficiaires d'expérimentation à mettre à jour`);

    if (countWithoutStatutsSecondaires === 0) {
      console.log('Aucun bénéficiaire d\'expérimentation à mettre à jour.');
      return;
    }

    // 2. Ajouter un tableau vide pour statuts_secondaires à tous les documents qui n'en ont pas
    const updateResult = await beneficiairesExperimentation.updateMany(
      { statuts_secondaires: { $exists: false } },
      { $set: { statuts_secondaires: [] } }
    );

    console.log(`✅ ${updateResult.modifiedCount} bénéficiaires d'expérimentation mis à jour avec statuts_secondaires: []`);

    // 3. Création d'un index pour les recherches par statuts secondaires
    await beneficiairesExperimentation.createIndex({ statuts_secondaires: 1 });
    console.log('✅ Index créé sur BeneficiaireExperimentation.statuts_secondaires');

    // 4. Ajouter des index composites pour rechercher efficacement les bénéficiaires par combinaison de statuts
    await beneficiairesExperimentation.createIndex({ 
      experimentation: 1, 
      cible: 1, 
      statut: 1, 
      statuts_secondaires: 1 
    });
    console.log('✅ Index composites créés');

    // 5. Mise à jour du modèle pour le frontend
    console.log('✅ Migration terminée avec succès');
    console.log('⚠️ IMPORTANT: Assurez-vous de mettre à jour le schéma Mongoose dans votre fichier models/BeneficiaireExperimentation.js:');
    console.log(`
  // Ajouter ce nouveau champ au schéma
  statuts_secondaires: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StatutCible'
  }],
    `);
    console.log('⚠️ IMPORTANT: Mettez également à jour votre contrôleur beneficiaireExperimentationController.js pour prendre en charge les statuts secondaires.');

  } catch (err) {
    console.error('❌ Erreur migration:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrateAddStatutsSecondaires();