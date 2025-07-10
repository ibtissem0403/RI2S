import mongoose from 'mongoose';

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URI!;
console.log("MONGODB_URI:", MONGODB_URI);

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI non définie dans les variables d\'environnement');
}

let cached = global.mongooseCache || { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('Connecté à MongoDB avec succès');
  } catch (e) {
    cached.promise = null;
    throw new Error('Échec de la connexion à MongoDB');
  }

  return cached.conn;
}