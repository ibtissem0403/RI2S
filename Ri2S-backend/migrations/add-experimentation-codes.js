require('dotenv').config();
const mongoose = require('mongoose');

async function migrateExperimentations() {
  try {
    // 1. Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connecté à MongoDB');

    // 2. Récupération de la collection
    const db = mongoose.connection.db;
    const experimentations = db.collection('experimentations');

    // 3. Ajout du champ code selon le nom
    const updates = [
      {
        filter: { name: 'Presage' },
        update: { $set: { code: 'PSG' } }
      },
      {
        filter: { name: 'Telegrafik' },
        update: { $set: { code: 'TLG' } }
      }
    ];

    // 4. Exécution des mises à jour
    for (const { filter, update } of updates) {
      const result = await experimentations.updateMany(
        filter,
        update
      );
      console.log(`🔄 ${result.modifiedCount} ${filter.name} mis à jour`);
    }

    // 5. Validation
    const psgCount = await experimentations.countDocuments({ code: 'PSG' });
    const tlgCount = await experimentations.countDocuments({ code: 'TLG' });
    console.log('\n✅ Migration terminée');
    console.log(`• Expérimentations PSG: ${psgCount}`);
    console.log(`• Expérimentations TLG: ${tlgCount}`);

  } catch (err) {
    console.error('❌ Erreur migration:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// 6. Ajout de la validation de schéma
async function addSchemaValidation() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  
  await db.command({
    collMod: 'experimentations',
    validator: {
      $jsonSchema: {
        required: ['name', 'code'],
        properties: {
          code: {
            bsonType: 'string',
            enum: ['PSG', 'TLG'],
            description: 'Code à 3 lettres requis'
          }
        }
      }
    }
  });
  console.log('\n✅ Validation de schéma ajoutée');
}

// Exécution complète
async function run() {
  await migrateExperimentations();
  await addSchemaValidation();
}

run();