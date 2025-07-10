// controllers/weakSignalController.js
const WeakSignal = require('../models/WeakSignal');
const UsagerRI2S = require('../models/UsagerRI2S'); // Nouveau modèle
const notificationController = require('./notificationController');
const mongoose = require('mongoose');

/**
 * Normalise une chaîne (première lettre en majuscule, reste en minuscule)
 * @param {string} str - Chaîne à normaliser
 * @returns {string} - Chaîne normalisée
 */
const normalizeString = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Créer un nouveau signal faible
exports.createWeakSignal = async (req, res) => {
  try {
    const {
      beneficiary,
      signalType,
      description,
      source,
      notes,
      contacts,
      status
    } = req.body;

    console.log('Données reçues pour création signal:', { beneficiary, signalType, description, source });

    // Vérifier si le bénéficiaire existe (directement par _id d'UsagerRI2S)
    let usagerRI2S;
    
    if (mongoose.Types.ObjectId.isValid(beneficiary)) {
      // Si c'est un ObjectId valide, chercher directement
      usagerRI2S = await UsagerRI2S.findById(beneficiary);
    } else {
      // Si ce n'est pas un ObjectId, peut-être un pseudoId
      usagerRI2S = await UsagerRI2S.findOne({ pseudoId: beneficiary });
    }

    if (!usagerRI2S) {
      return res.status(404).json({ 
        message: 'Usager RI2S non trouvé avec l\'identifiant fourni',
        providedId: beneficiary
      });
    }

    console.log('Usager trouvé:', {
      id: usagerRI2S._id,
      fullName: usagerRI2S.fullName,
      pseudoId: usagerRI2S.pseudoId,
      role: usagerRI2S.role
    });

    // Vérifier que c'est bien un senior
    if (usagerRI2S.role !== 'senior') {
      return res.status(400).json({ 
        message: 'Les signaux faibles ne peuvent être créés que pour des seniors',
        userRole: usagerRI2S.role
      });
    }

    // Préparer les données du signal
    const signalData = {
      beneficiary: usagerRI2S._id, // Utiliser l'ID de l'UsagerRI2S
      signalType: normalizeString(signalType),
      description,
      source: normalizeString(source),
      coordinator: req.user._id,
      receptionDate: req.body.receptionDate || Date.now(),
      notes,
      status: status || 'Nouveau'
    };
    
    // Ajouter les contacts si fournis
    if (contacts && Array.isArray(contacts) && contacts.length > 0) {
      signalData.contacts = contacts.map(contact => ({
        contactedPerson: {
          name: contact.contactedPerson?.name || '',
          profession: normalizeString(contact.contactedPerson?.profession) || ''
        },
        contactDate: contact.contactDate || Date.now(),
        contactMethod: contact.contactMethod || 'Téléphone',
        contactSubject: contact.contactSubject || '',
        contactContent: contact.contactContent || '',
        contactedBy: contact.contactedBy || req.user._id,
        response: contact.response ? {
          date: contact.response.date,
          content: contact.response.content || '',
          responseMethod: contact.response.responseMethod,
          hasResponse: !!(contact.response.content)
        } : {
          hasResponse: false
        }
      }));
      
      // Mettre à jour le statut automatiquement
      if (signalData.contacts.length > 0 && !status) {
        signalData.status = 'En cours';
      }
      
      // Si au moins un contact a une réponse, considérer comme clôturé
      const hasResponses = signalData.contacts.some(contact => contact.response?.hasResponse);
      if (hasResponses && !status) {
        signalData.status = 'Clôturé';
      }
    }

    console.log('Données du signal à créer:', signalData);

    // Créer le signal
    const weakSignal = await WeakSignal.create(signalData);

    console.log('Signal créé:', weakSignal._id);

    // Créer la notification
    if (notificationController && notificationController.createSignalNotification) {
      try {
        await notificationController.createSignalNotification(weakSignal, req.user._id);
      } catch (notifError) {
        console.warn('Erreur lors de la création de la notification:', notifError);
        // Ne pas faire échouer la création du signal pour autant
      }
    }

    // Retourner le signal créé avec les relations
    const populatedSignal = await WeakSignal.findById(weakSignal._id)
      .populate({
        path: 'beneficiary',
        select: 'fullName firstName pseudoId role'
      })
      .populate('coordinator', 'fullName email')
      .populate('contacts.contactedBy', 'fullName');

    res.status(201).json({
      message: 'Signal faible créé avec succès',
      data: populatedSignal
    });
  } catch (error) {
    console.error('Erreur création signal faible:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Récupérer tous les signaux faibles
exports.getAllWeakSignals = async (req, res) => {
  try {
    // Filtres optionnels
    const filters = {};
    
    if (req.query.status) filters.status = req.query.status;
    
    // Normaliser les paramètres de recherche sensibles à la casse
    if (req.query.signalType) {
      filters.signalType = normalizeString(req.query.signalType);
    }
    
    if (req.query.source) {
      filters.source = normalizeString(req.query.source);
    }
    
    if (req.query.beneficiary) filters.beneficiary = req.query.beneficiary;
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filters.receptionDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    console.log('Filtres appliqués:', filters);

    // Récupérer les signaux avec population des UsagerRI2S
    const signals = await WeakSignal.find(filters)
      .populate({
        path: 'beneficiary',
        select: 'fullName firstName pseudoId role'
      })
      .populate('coordinator', 'fullName email')
      .populate('contacts.contactedBy', 'fullName')
      .sort({ receptionDate: -1 });

    console.log(`Trouvé ${signals.length} signaux`);

    // Transformer les signaux pour afficher les pseudonymes
    const transformedSignals = signals.map(signal => {
      const signalObj = signal.toObject();
      
      // Remplacer les informations du bénéficiaire par les données pseudonymisées
      if (signalObj.beneficiary && signalObj.beneficiary.pseudoId) {
        signalObj.beneficiary = {
          _id: signalObj.beneficiary.pseudoId, // Utiliser le pseudoId comme identifiant affiché
          fullName: signalObj.beneficiary.pseudoId, // Afficher le pseudoId au lieu du nom réel
          firstName: '',
          pseudoId: signalObj.beneficiary.pseudoId
        };
      }
      
      return signalObj;
    });

    res.json(transformedSignals);
  } catch (error) {
    console.error('Erreur lors de la récupération des signaux:', error);
    res.status(500).json({ error: error.message });
  }
};

// Récupérer un signal faible par ID
exports.getWeakSignalById = async (req, res) => {
  try {
    console.log(`Récupération du signal ID: ${req.params.id}`);
    
    const signal = await WeakSignal.findById(req.params.id)
      .populate({
        path: 'beneficiary',
        select: 'fullName firstName pseudoId role dateNaissance'
      })
      .populate('coordinator', 'fullName email')
      .populate('contacts.contactedBy', 'fullName');

    if (!signal) {
      return res.status(404).json({ message: 'Signal faible non trouvé' });
    }

    // Convertir en objet et initialiser les valeurs par défaut
    const formattedSignal = signal.toObject();
    
    // S'assurer que contacts existe
    if (!formattedSignal.contacts || !Array.isArray(formattedSignal.contacts)) {
      formattedSignal.contacts = [];
    }

    // Appliquer la pseudonymisation pour l'affichage
    if (formattedSignal.beneficiary && formattedSignal.beneficiary.pseudoId) {
      formattedSignal.beneficiary = {
        _id: formattedSignal.beneficiary.pseudoId,
        fullName: formattedSignal.beneficiary.pseudoId,
        firstName: '',
        pseudoId: formattedSignal.beneficiary.pseudoId,
        birthDate: formattedSignal.beneficiary.dateNaissance
      };
    }
    
    console.log("Signal formaté:", {
      id: formattedSignal._id,
      beneficiaryPseudo: formattedSignal.beneficiary?.pseudoId,
      contactCount: formattedSignal.contacts.length
    });

    res.json(formattedSignal);
  } catch (error) {
    console.error('Erreur getWeakSignalById:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour un signal faible
exports.updateWeakSignal = async (req, res) => {
  try {
    const currentSignal = await WeakSignal.findById(req.params.id);
    if (!currentSignal) {
      return res.status(404).json({ message: 'Signal faible non trouvé' });
    }
    
    console.log("Données reçues pour mise à jour:", JSON.stringify(req.body, null, 2));
    
    const updateData = { ...req.body };
    
    // Normaliser les champs sensibles à la casse
    if (updateData.source) {
      updateData.source = normalizeString(updateData.source);
    }
    
    if (updateData.signalType) {
      updateData.signalType = normalizeString(updateData.signalType);
    }
    
    // Gestion des contacts
    if (updateData.contacts && Array.isArray(updateData.contacts)) {
      // Remplacer complètement le tableau de contacts avec normalisation
      currentSignal.contacts = updateData.contacts.map(contact => ({
        contactedPerson: {
          name: contact.contactedPerson?.name || '',
          profession: normalizeString(contact.contactedPerson?.profession) || ''
        },
        contactDate: contact.contactDate || Date.now(),
        contactMethod: contact.contactMethod || 'Téléphone',
        contactSubject: contact.contactSubject || '',
        contactContent: contact.contactContent || '',
        contactedBy: contact.contactedBy || req.user._id,
        response: contact.response ? {
          date: contact.response.date,
          content: contact.response.content || '',
          responseMethod: contact.response.responseMethod,
          hasResponse: !!(contact.response.content)
        } : {
          hasResponse: false
        }
      }));
      
      delete updateData.contacts;
    }
    
    // Si newContact est fourni, ajouter un nouveau contact
    if (updateData.newContact) {
      const contact = {
        contactedPerson: {
          name: updateData.newContact.contactedPerson?.name || '',
          profession: normalizeString(updateData.newContact.contactedPerson?.profession) || ''
        },
        contactDate: updateData.newContact.contactDate || Date.now(),
        contactMethod: updateData.newContact.contactMethod || 'Téléphone',
        contactSubject: updateData.newContact.contactSubject || '',
        contactContent: updateData.newContact.contactContent || '',
        contactedBy: req.user._id,
        response: {
          hasResponse: false
        }
      };
      
      if (!currentSignal.contacts) {
        currentSignal.contacts = [];
      }
      
      currentSignal.contacts.push(contact);
      delete updateData.newContact;
    }
    
    // Mise à jour automatique du statut
    if (!updateData.status) {
      if (currentSignal.contacts && currentSignal.contacts.length > 0) {
        // Si il y a des contacts avec réponses, clôturer
        const hasResponses = currentSignal.contacts.some(contact => contact.response?.hasResponse);
        if (hasResponses) {
          currentSignal.status = 'Clôturé';
        } else {
          currentSignal.status = 'En cours';
        }
      }
    }
    
    // Appliquer les autres mises à jour
    Object.keys(updateData).forEach(key => {
      currentSignal[key] = updateData[key];
    });
    
    // Sauvegarder
    await currentSignal.save();
    
    // Récupérer le signal mis à jour
    const updatedSignal = await WeakSignal.findById(req.params.id)
      .populate({
        path: 'beneficiary',
        select: 'fullName firstName pseudoId role'
      })
      .populate('coordinator', 'fullName email')
      .populate('contacts.contactedBy', 'fullName');
    
    console.log("Signal mis à jour:", {
      id: updatedSignal._id,
      contactCount: updatedSignal.contacts?.length || 0
    });

    res.json({
      message: 'Signal faible mis à jour avec succès',
      data: updatedSignal
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un signal faible
exports.deleteWeakSignal = async (req, res) => {
  try {
    const signal = await WeakSignal.findByIdAndDelete(req.params.id);

    if (!signal) {
      return res.status(404).json({ message: 'Signal faible non trouvé' });
    }

    res.json({ message: 'Signal faible supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer les signaux faibles d'un bénéficiaire
exports.getWeakSignalsByBeneficiary = async (req, res) => {
  try {
    const { beneficiaryId } = req.params;
    
    const signals = await WeakSignal.find({ beneficiary: beneficiaryId })
      .populate('coordinator', 'fullName email')
      .populate('contacts.contactedBy', 'fullName')
      .sort({ receptionDate: -1 });
    
    res.json(signals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Ajouter/mettre à jour une réponse de contact
exports.updateContactResponse = async (req, res) => {
  try {
    const { signalId, contactIndex } = req.params;
    const responseData = req.body;
    
    // Vérifier que l'index est un nombre valide
    const index = parseInt(contactIndex);
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ message: 'Index de contact invalide' });
    }
    
    // Trouver le signal
    const signal = await WeakSignal.findById(signalId);
    if (!signal) {
      return res.status(404).json({ message: 'Signal non trouvé' });
    }
    
    // Vérifier que le contact existe
    if (!signal.contacts || !signal.contacts[index]) {
      return res.status(404).json({ message: 'Contact non trouvé' });
    }
    
    // Mettre à jour la réponse du contact
    signal.contacts[index].response = {
      date: responseData.date || new Date(),
      content: responseData.content || '',
      responseMethod: responseData.responseMethod || 'Téléphone',
      hasResponse: !!(responseData.content) // true si content n'est pas vide
    };
    
    // Mettre à jour le statut du signal si une réponse est ajoutée
    if (responseData.content) {
      signal.status = 'Clôturé';
    }
    
    // Sauvegarder les modifications
    await signal.save();
    
    // Récupérer le signal mis à jour avec les relations
    const updatedSignal = await WeakSignal.findById(signalId)
      .populate({
        path: 'beneficiary',
        select: 'fullName firstName pseudoId role'
      })
      .populate('coordinator', 'fullName email')
      .populate('contacts.contactedBy', 'fullName');
    
    res.status(200).json({
      message: 'Réponse enregistrée avec succès',
      data: updatedSignal
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réponse:', error);
    res.status(500).json({ error: error.message });
  }
};

// Statistiques des signaux faibles
exports.getWeakSignalStats = async (req, res) => {
  try {
    // Statistiques globales
    const totalCount = await WeakSignal.countDocuments();
    const newCount = await WeakSignal.countDocuments({ status: 'Nouveau' });
    const inProgressCount = await WeakSignal.countDocuments({ status: 'En cours' });
    const closedCount = await WeakSignal.countDocuments({ status: 'Clôturé' });
    
    // Statistiques par type de signal
    const byType = await WeakSignal.aggregate([
      { $group: { _id: "$signalType", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Statistiques par source
    const bySource = await WeakSignal.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Statistiques par type de contact
    const byContactType = await WeakSignal.aggregate([
      { $unwind: { path: '$contacts', preserveNullAndEmptyArrays: false } },
      { 
        $group: { 
          _id: "$contacts.contactedPerson.profession",
          count: { $sum: 1 } 
        } 
      },
      { $match: { _id: { $ne: null, $ne: "" } } },
      { $sort: { _id: 1 } }
    ]);
    
    // Statistiques par mois (derniers 6 mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const byMonth = await WeakSignal.aggregate([
      { $match: { receptionDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { 
            year: { $year: '$receptionDate' }, 
            month: { $month: '$receptionDate' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Temps moyen de clôture (jours)
    const closedSignals = await WeakSignal.find({
      status: 'Clôturé',
      contacts: { $elemMatch: { 'response.hasResponse': true } }
    });
    
    let avgClosureTime = 0;
    if (closedSignals.length > 0) {
      const totalDays = closedSignals.reduce((sum, signal) => {
        const receptionDate = new Date(signal.receptionDate);
        // Trouver la première réponse
        const firstResponse = signal.contacts.find(contact => contact.response?.hasResponse);
        if (firstResponse && firstResponse.response.date) {
          const closureDate = new Date(firstResponse.response.date);
          const diffTime = Math.abs(closureDate - receptionDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return sum + diffDays;
        }
        return sum;
      }, 0);
      
      avgClosureTime = totalDays / closedSignals.length;
    }
    
    res.json({
      totalCount,
      byStatus: {
        new: newCount,
        inProgress: inProgressCount,
        closed: closedCount
      },
      byType,
      bySource,
      byContactType,
      byMonth,
      avgClosureTime
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: error.message });
  }
};

// Export vers Excel (simplifié sans pseudonymisation complexe)
exports.exportToExcel = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    
    // Récupérer les filtres de la requête
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.signalType) filters.signalType = normalizeString(req.query.signalType);
    if (req.query.source) filters.source = normalizeString(req.query.source);
    if (req.query.startDate && req.query.endDate) {
      filters.receptionDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Récupérer les signaux avec les relations
    const signals = await WeakSignal.find(filters)
      .populate({
        path: 'beneficiary',
        select: 'fullName firstName pseudoId role'
      })
      .populate('coordinator', 'fullName email')
      .sort({ receptionDate: -1 });
      
    // Créer un nouveau classeur
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Système de suivi des signaux faibles';
    workbook.lastModifiedBy = req.user.fullName;
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Créer une feuille pour les signaux
    const signalsSheet = workbook.addWorksheet('Signaux');
    signalsSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Date de réception', key: 'receptionDate', width: 20 },
      { header: 'Bénéficiaire (Pseudo)', key: 'beneficiary', width: 25 },
      { header: 'Type de signal', key: 'signalType', width: 25 },
      { header: 'Source', key: 'source', width: 15 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Coordinateur', key: 'coordinator', width: 25 },
      { header: 'Statut', key: 'status', width: 15 },
      { header: 'Nb. Contacts', key: 'contactCount', width: 15 },
      { header: 'Notes', key: 'notes', width: 40 }
    ];
    
    // Ajouter les données de signaux avec pseudonymes
    signals.forEach(signal => {
      const beneficiaryName = signal.beneficiary?.pseudoId || 'N/A';
      
      signalsSheet.addRow({
        id: signal._id.toString(),
        receptionDate: signal.receptionDate,
        beneficiary: beneficiaryName,
        signalType: signal.signalType,
        source: signal.source,
        description: signal.description,
        coordinator: signal.coordinator?.fullName || 'N/A',
        status: signal.status,
        contactCount: signal.contacts?.length || 0,
        notes: signal.notes || ''
      });
    });
    
    // Formater les dates et entêtes
    signalsSheet.getColumn('receptionDate').numFmt = 'dd/mm/yyyy';
    signalsSheet.getRow(1).font = { bold: true, size: 12 };
    signalsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } };
    
    // Définir le nom du fichier et les en-têtes
    const fileName = `signals_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    
    // Envoyer le classeur
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    res.status(500).json({ error: error.message });
  }
};

// Export vers PDF (simplifié)
exports.exportToPDF = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    
    // Récupérer les signaux avec filtres
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.signalType) filters.signalType = normalizeString(req.query.signalType);
    if (req.query.source) filters.source = normalizeString(req.query.source);
    if (req.query.startDate && req.query.endDate) {
      filters.receptionDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    const signals = await WeakSignal.find(filters)
      .populate({
        path: 'beneficiary',
        select: 'fullName firstName pseudoId role'
      })
      .populate('coordinator', 'fullName email')
      .sort({ receptionDate: -1 });

    // Création du document PDF
    const doc = new PDFDocument({ margin: 30, size: 'A4', autoFirstPage: true });
    
    const fileName = `signals_export_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    
    doc.pipe(res);
    
    // Fonction helper pour formater les dates
    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('fr-FR');
    };
    
    // Titre et en-tête
    doc.fontSize(16).font('Helvetica-Bold').text('Rapport des Signaux Faibles', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Date d'export: ${formatDate(new Date())}`, { align: 'right' });
    doc.moveDown();
    
    // Résumé
    doc.fontSize(12).font('Helvetica-Bold').text('Résumé:', { underline: true });
    doc.fontSize(10).font('Helvetica').text(`Nombre total de signaux: ${signals.length}`);
    doc.moveDown(2);
    
    // Liste des signaux
    doc.fontSize(14).font('Helvetica-Bold').text('Liste des Signaux', { align: 'center' });
    doc.moveDown();
    
    signals.forEach((signal, index) => {
      if (doc.y > doc.page.height - 100) {
        doc.addPage();
      }
      
      const beneficiaryName = signal.beneficiary?.pseudoId || 'N/A';
      
      doc.fontSize(11).font('Helvetica-Bold')
        .text(`Signal ${index + 1} - ${formatDate(signal.receptionDate)}`);
      doc.fontSize(9).font('Helvetica')
        .text(`Bénéficiaire: ${beneficiaryName}`);
      doc.fontSize(9).font('Helvetica')
        .text(`Type: ${signal.signalType} | Source: ${signal.source} | Statut: ${signal.status}`);
      doc.fontSize(9).font('Helvetica')
        .text(`Description: ${signal.description}`);
      
      if (signal.contacts && signal.contacts.length > 0) {
        doc.fontSize(9).font('Helvetica')
          .text(`Contacts: ${signal.contacts.length}`);
        
        signal.contacts.forEach((contact, contactIndex) => {
          doc.fontSize(8).font('Helvetica')
            .text(`  • ${contact.contactedPerson?.name || 'N/A'} (${contact.contactedPerson?.profession || 'N/A'})`);
          doc.fontSize(8).font('Helvetica')
            .text(`    ${formatDate(contact.contactDate)} - ${contact.contactSubject || 'N/A'}`);
          
          if (contact.response && contact.response.hasResponse) {
            doc.fontSize(8).font('Helvetica-Oblique')
              .text(`    Réponse: ${contact.response.content || 'N/A'}`);
          }
        });
      }
      
      doc.moveDown();
      
      if (index < signals.length - 1) {
        doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).stroke();
        doc.moveDown(0.5);
      }
    });
    
    doc.end();
    
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    res.status(500).json({ error: error.message });
  }
};