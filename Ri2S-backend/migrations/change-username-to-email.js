require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connecté à MongoDB');

    // 2. Opération de migration
    const db = mongoose.connection.db;
    const users = db.collection('users');

    // a) Ajout du champ email (copie de username)
    await users.updateMany(
      { username: { $exists: true }, email: { $exists: false } },
      [{ $set: { email: "$username" } }]
    );
    console.log('Champ email ajouté');

    // b) Suppression de l'index username
    await users.dropIndex('username_1');
    console.log('Index username supprimé');

    // c) Création nouvel index email
    await users.createIndex({ email: 1 }, { unique: true });
    console.log('Index email créé');

    // 3. Validation
    const count = await users.countDocuments({ email: { $exists: true } });
    console.log(`Migration terminée. ${count} utilisateurs mis à jour.`);

  } catch (err) {
    console.error('Erreur migration:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();