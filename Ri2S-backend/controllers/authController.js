const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');        
const JWT_SECRET = process.env.JWT_SECRET || "MaCleSecrete123";

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Email already taken" });

    const user = await User.create({ fullName, email, password, role });
    res.status(201).json({ message: "Utilisateur inscrit", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe  } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: rememberMe ? '7d' : '1h' }
    );

    res.json({ message: "Connexion réussie", token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//récupérer l’utilisateur connecté
exports.getMe = async (req, res) => {
  try {
    // req.user vient du middleware protect et contient { id, role, iat, exp }
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



//generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000); // Génère un OTP de 6 chiffres
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "Si l'email existe, un lien a été envoyé" });
    }

    // Générer un token sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    // Créer le lien de réinitialisation
    const resetUrl = `${process.env.FRONTEND_URL}/change-password?token=${resetToken}`;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Réinitialisation de mot de passe',
      html: `
        <p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Ce lien expirera dans 1 heure.</p>
      `
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error('Erreur envoi email:', error);
        return res.status(500).json({ message: "Échec d'envoi de l'email" });
      }
      res.json({ message: "Lien de réinitialisation envoyé avec succès" });
    });

  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Mettez à jour la fonction resetPassword
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Lien invalide ou expiré' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//reset password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Vérifier que l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      console.log("Aucun utilisateur trouvé pour l'email:", email);
      return res.status(200).json({ message: "Si l'email existe, un lien a été envoyé" });
    }

    // 2. Générer et stocker le token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure

    // 3. Sauvegarder avec vérification
    await user.save();
    console.log("Token sauvegardé pour l'utilisateur:", user.email, "Token:", hashedToken);

    // 4. Générer le lien
    const resetUrl = `${process.env.FRONTEND_URL}/change-password?token=${encodeURIComponent(resetToken)}`;
    console.log("Lien de réinitialisation généré:", resetUrl);

    // ... Envoyer l'email

    res.json({ message: "Lien de réinitialisation envoyé avec succès" });

  } catch (error) {
    console.error("Erreur critique:", error);
    res.status(500).json({ message: "Échec de la génération du lien" });
  }
};




