require('dotenv').config();
const mongoose = require('mongoose');
const WeakSignal = require('../models/WeakSignal');

/**
 * Normalise une chaîne (première lettre en majuscule, reste en minuscule)
 * @param {string} str - Chaîne à normaliser
 * @returns {string} - Chaîne normalisée
 */
const normalizeString = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Migre les données des signaux faibles pour normaliser la casse
 */
async function migrateSignals() {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connexion à MongoDB réussie');

    // Récupérer tous les signaux faibles
    const signals = await WeakSignal.find({});
    console.log(`📊 Nombre de signaux trouvés: ${signals.length}`);

    // Compteurs pour les statistiques
    let sourceUpdated = 0;
    let typeUpdated = 0;
    let professionUpdated = 0;

    // Traiter chaque signal
    for (const signal of signals) {
      let isModified = false;

      // Normaliser la source
      if (signal.source) {
        const normalizedSource = normalizeString(signal.source);
        if (normalizedSource !== signal.source) {
          signal.source = normalizedSource;
          isModified = true;
          sourceUpdated++;
        }
      }

      // Normaliser le type de signal
      if (signal.signalType) {
        const normalizedType = normalizeString(signal.signalType);
        if (normalizedType !== signal.signalType) {
          signal.signalType = normalizedType;
          isModified = true;
          typeUpdated++;
        }
      }

      // Normaliser les professions des contacts
      if (signal.contacts && signal.contacts.length > 0) {
        signal.contacts.forEach((contact, index) => {
          if (contact.contactedPerson && contact.contactedPerson.profession) {
            const normalizedProfession = normalizeString(contact.contactedPerson.profession);
            if (normalizedProfession !== contact.contactedPerson.profession) {
              signal.contacts[index].contactedPerson.profession = normalizedProfession;
              isModified = true;
              professionUpdated++;
            }
          }
        });
      }

      // Sauvegarder si des modifications ont été apportées
      if (isModified) {
        await signal.save();
        console.log(`✅ Signal ${signal._id} mis à jour`);
      }
    }

    console.log('\n📈 Résumé de la migration:');
    console.log(`Sources normalisées: ${sourceUpdated}`);
    console.log(`Types de signal normalisés: ${typeUpdated}`);
    console.log(`Professions normalisées: ${professionUpdated}`);
    console.log(`Total des signaux traités: ${signals.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    // Fermer la connexion à la base de données
    await mongoose.disconnect();
    console.log('👋 Déconnexion de MongoDB');
  }
}

// Exécuter la migration
migrateSignals()
  .then(() => console.log('✨ Migration terminée avec succès'))
  .catch(err => console.error('❌ Erreur lors de la migration:', err));