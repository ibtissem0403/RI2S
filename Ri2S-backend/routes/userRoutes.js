const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { updateUser, deleteUser } = require('../controllers/userController');

const { protect, authorize } = require('../middleware/authMiddleware');


//  Route pour que l'admin puisse voir tous les utilisateurs
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password'); // On ne retourne pas le hash du mot de passe
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, authorize('admin'), updateUser);

router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
