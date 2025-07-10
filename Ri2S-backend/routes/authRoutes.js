const express = require('express');
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { logActivity } = require('../middleware/activityLogger');


// Route d'inscription : POST /api/auth/register
router.post('/register', logActivity(), register);

router.post('/login', logActivity(), login);

router.get('/me', protect, getMe);

router.post('/forgot-password', logActivity(), forgotPassword);

router.post('/reset-password', logActivity(), resetPassword);

module.exports = router;