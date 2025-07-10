require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connecté à MongoDB');

    const db = mongoose.connection.db;
    const users = db.collection('users');

    // Met à jour chaque utilisateur avec fullName = firstName + " " + lastName
    await users.updateMany(
      {
        firstName: { $exists: true },
        lastName: { $exists: true },
        fullName: { $exists: false },
      },
      [
        {
          $set: {
            fullName: { $concat: ["$firstName", " ", "$lastName"] },
          },
        },
      ]
    );

    console.log('✅ Champ fullName ajouté aux documents existants.');
  } catch (err) {
    console.error('❌ Erreur lors de la migration :', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
