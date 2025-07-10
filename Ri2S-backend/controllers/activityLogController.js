const ActivityLog = require('../models/ActivityLog');

exports.getActivityLogs = async (req, res) => {
  try {
    const { 
      user, 
      action, 
      entityType, 
      entityId, 
      startDate, 
      endDate,
      page = 1, 
      limit = 20 
    } = req.query;
    
    // Construire les filtres
    const filter = {};
    if (user) filter.user = user;
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    
    // Filtre par date
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Calculer le nombre total d'entrées
    const total = await ActivityLog.countDocuments(filter);
    
    // Récupérer les entrées avec pagination
    const logs = await ActivityLog.find(filter)
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      limit: parseInt(limit),
      data: logs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getActivitySummary = async (req, res) => {
  try {
    // Période par défaut : 30 derniers jours
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Statistiques par action
    const actionStats = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Statistiques par entité
    const entityStats = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$entityType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Statistiques par utilisateur
    const userStats = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Récupérer les infos des utilisateurs
    const userIds = userStats.map(stat => stat._id);
    const User = require('../models/User');
    const users = await User.find({ _id: { $in: userIds } }, 'fullName email');
    
    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = { fullName: user.fullName, email: user.email };
    });
    
    const formattedUserStats = userStats.map(stat => ({
      user: userMap[stat._id] || { fullName: 'Utilisateur inconnu', email: '' },
      count: stat.count
    }));
    
    // Activité par jour
    const dailyActivity = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Formater les résultats pour l'affichage
    const formattedDailyActivity = dailyActivity.map(day => ({
      date: new Date(day._id.year, day._id.month - 1, day._id.day).toISOString().split('T')[0],
      count: day.count
    }));
    
    res.json({
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      byAction: actionStats,
      byEntity: entityStats,
      byUser: formattedUserStats,
      byDay: formattedDailyActivity,
      total: await ActivityLog.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } })
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};