// controllers/notificationController.js
const Notification = require('../models/Notification');

// Fonction pour créer une notification lors de la création d'un signal
exports.createSignalNotification = async (signal, createdBy) => {
  try {
    // Trouver les utilisateurs à notifier avec les rôles spécifiques autorisés
    const User = require('../models/User');
    const recipients = await User.find({
      role: { $in: ['admin', 'coordinateur', 'assistant_coordinateur', 'infirmier de coordination'] },
      _id: { $ne: createdBy } // Ne pas notifier le créateur du signal
    });

    // Créer une notification pour chaque destinataire
    const Notification = require('../models/Notification');
    const notifications = [];

    // Déterminer la priorité en fonction du type de signal
    let priority = 'Medium';
    const urgentTypes = ['Chute', 'Urgence', 'Douleur'];
    if (signal.signalType && urgentTypes.some(type => 
        signal.signalType.toLowerCase().includes(type.toLowerCase()))) {
      priority = 'High';
    }

    for (const recipient of recipients) {
      const notification = await Notification.create({
        user: recipient._id,
        message: `Nouveau signal de type "${signal.signalType}" enregistré`,
        relatedTo: {
          model: 'WeakSignal',
          id: signal._id
        },
        isRead: false,
        priority: priority
      });
      notifications.push(notification);
    }

    console.log(`${notifications.length} notifications créées pour le signal ${signal._id}`);
    return notifications;
  } catch (error) {
    console.error('Erreur lors de la création des notifications:', error);
    return [];
  }
};

// Récupérer les notifications d'un utilisateur
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      user: req.user._id,
      isRead: false
    }).sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    
    res.json({ message: 'Notification marquée comme lue', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Marquer toutes les notifications comme lues
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
    
    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};