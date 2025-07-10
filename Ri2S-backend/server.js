require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
const cors = require('cors');


const authRoutes = require('./routes/authRoutes');
const beneficiaryRoutes = require('./routes/beneficiaryRoutes');
const clinicalDataRoutes = require('./routes/clinicalDataRoutes');
const userRoutes = require('./routes/userRoutes');
const cohortRouter = require('./routes/cohortRoutes');
const experimentationRoutes = require('./routes/experimentationRoutes');
const weakSignalRoutes = require('./routes/weakSignalRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const importRoutes = require('./routes/importRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const ri2sRoutes = require('./routes/ri2sRoutes');
const processusInclusionRoutes = require('./routes/processusInclusionRoutes');
const statistiquesRoutes = require('./routes/statistiquesRoutes');
const usagerRI2SRoutes = require('./routes/usagerRI2SRoutes');
const usagerRI2SStatistiquesRoutes = require('./routes/usagerRI2SStatistiquesRoutes');



const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Définir l'encodage UTF-8 pour les fichiers texte
    if (path.endsWith('.csv') || path.endsWith('.txt') || path.endsWith('.json')) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
  }
}));
app.get('/api/ping', (req, res) => res.send('pong'));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/clinical-data', clinicalDataRoutes);
app.use('/api/cohorts', cohortRouter);
app.use('/api/experimentations', experimentationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/weak-signals', weakSignalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/import', importRoutes); 
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/ri2s', ri2sRoutes);
app.use('/api/usagers-ri2s', usagerRI2SRoutes);
app.use('/api/inclusion', processusInclusionRoutes);
app.use('/api/statistiques', statistiquesRoutes);
app.use('/api/usagers-ri2s-statistiques', usagerRI2SStatistiquesRoutes);







const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
  });
})
.catch(err => console.error('Erreur MongoDB :', err));