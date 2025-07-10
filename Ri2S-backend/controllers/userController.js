const User = require('../models/User');

// Modifier un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { username, role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, role },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json({ message: "Utilisateur mis à jour", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json({ message: "Utilisateur supprimé" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
