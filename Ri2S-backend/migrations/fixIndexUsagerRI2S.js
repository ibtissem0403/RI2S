/**
 * Script pour supprimer l'index problématique sur realBeneficiary
 * dans la collection usagerri2s
 * 
 * Usage: 
 * - Placez ce fichier dans le dossier migrations/
 * - Exécutez-le avec Node.js: node migrations/fixIndexUsagerRI2S.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// Interface pour les questions utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour demander confirmation à l'utilisateur
const askConfirmation = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui');
    });
  });
};

// Fonction principale de correction
const fixIndexes = async () => {
  try {
    console.log('🔄 Démarrage de la correction des index dans UsagerRI2S...');
    
    // Attendre explicitement que la connexion soit établie avant de continuer
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie');
    
    // Récupérer les index actuels
    const db = mongoose.connection.db;
    const collection = db.collection('usagerri2s');
    const indexes = await collection.indexes();
    
    console.log('\n📊 Index actuels sur la collection usagerri2s:');
    indexes.forEach((idx, i) => {
      console.log(`${i+1}. ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    
    // Trouver l'index realBeneficiary_1
    const realBeneficiaryIndex = indexes.find(idx => 
      idx.key && idx.key.realBeneficiary === 1
    );
    
    if (!realBeneficiaryIndex) {
      console.log('✅ Aucun index sur realBeneficiary trouvé. Aucune action nécessaire.');
      
      // Vérifions s'il y a d'autres index problématiques
      const otherIndexes = indexes.filter(idx => 
        idx.key && Object.keys(idx.key).some(k => !['_id', 'fullName', 'firstName', 'email', 'type_usager', 'role', 'pseudoId', 'usagerRI2S'].includes(k))
      );
      
      if (otherIndexes.length > 0) {
        console.log('\n⚠️ Autres index potentiellement problématiques détectés:');
        otherIndexes.forEach((idx, i) => {
          console.log(`${i+1}. ${idx.name}: ${JSON.stringify(idx.key)}`);
        });
        
        const dropOthers = await askConfirmation('\n❓ Voulez-vous supprimer ces index aussi? (y/n): ');
        
        if (dropOthers) {
          for (const idx of otherIndexes) {
            console.log(`🔄 Suppression de l'index ${idx.name}...`);
            await collection.dropIndex(idx.name);
            console.log('✅ Index supprimé avec succès');
          }
        }
      }
      
      return;
    }
    
    console.log(`\n⚠️ Index problématique trouvé: ${realBeneficiaryIndex.name}`);
    const proceed = await askConfirmation('❓ Voulez-vous supprimer cet index? (y/n): ');
    
    if (!proceed) {
      console.log('⚠️ Opération annulée par l\'utilisateur');
      return;
    }
    
    // Supprimer l'index
    console.log('🔄 Suppression de l\'index...');
    await collection.dropIndex(realBeneficiaryIndex.name);
    console.log('✅ Index supprimé avec succès');
    
    // Vérifier si le modèle UsagerRI2S a encore une référence à realBeneficiary
    console.log('\n🔍 Vérification du schéma UsagerRI2S...');
    
    try {
      // Charger le modèle et afficher son schéma
      const UsagerRI2S = require('../models/UsagerRI2S');
      const schemaFields = Object.keys(UsagerRI2S.schema.paths);
      
      console.log('📋 Champs du schéma UsagerRI2S:');
      console.log(schemaFields);
      
      if (schemaFields.includes('realBeneficiary')) {
        console.log('\n⚠️ ATTENTION: Le modèle UsagerRI2S contient encore un champ realBeneficiary.');
        console.log('Vous devriez mettre à jour le fichier models/UsagerRI2S.js pour retirer ce champ.');
      } else {
        console.log('\n✅ Le modèle UsagerRI2S ne contient pas de champ realBeneficiary.');
      }
    } catch (err) {
      console.log('\n⚠️ Impossible de charger le modèle UsagerRI2S pour vérification.');
      console.log('Assurez-vous que votre fichier models/UsagerRI2S.js ne contient plus de référence à realBeneficiary.');
    }
    
    // Vérifier si des documents existants ont encore le champ realBeneficiary
    const docsWithRealBeneficiary = await collection.countDocuments({
      realBeneficiary: { $exists: true }
    });
    
    if (docsWithRealBeneficiary > 0) {
      console.log(`\n⚠️ ATTENTION: ${docsWithRealBeneficiary} documents contiennent encore le champ realBeneficiary.`);
      
      const removeField = await askConfirmation('❓ Voulez-vous supprimer ce champ de tous les documents? (y/n): ');
      
      if (removeField) {
        console.log('🔄 Suppression du champ realBeneficiary de tous les documents...');
        
        const updateResult = await collection.updateMany(
          { realBeneficiary: { $exists: true } },
          { $unset: { realBeneficiary: "" } }
        );
        
        console.log(`✅ Champ realBeneficiary supprimé de ${updateResult.modifiedCount} documents`);
      }
    } else {
      console.log('✅ Aucun document ne contient le champ realBeneficiary.');
    }
    
    console.log('\n🎉 Correction terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    rl.close();
    // Fermer la connexion MongoDB après un délai
    setTimeout(() => {
      mongoose.connection.close();
      console.log('📢 Connexion MongoDB fermée');
    }, 1000);
  }
};

// Lancer la correction
fixIndexes();