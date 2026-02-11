const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware d'authentification
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ message: 'Token d\'authentification manquant' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Configuration serveur incomplète (JWT_SECRET)' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Vérifier que l'utilisateur existe toujours
        const user = await User.findById(decoded.userId).select('email role is_active');

        if (!user) {
            return res.status(401).json({ message: 'Utilisateur non trouvé' });
        }

        if (!user.is_active) {
            return res.status(403).json({ message: 'Compte désactivé' });
        }

        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Token invalide',
                code: 'INVALID_TOKEN',
                expired: false
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Session expirée. Veuillez vous reconnecter.',
                code: 'SESSION_EXPIRED',
                expired: true
            });
        }
        return res.status(500).json({ message: 'Erreur d\'authentification' });
    }
};

// Middleware pour vérifier le rôle admin
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    }
    next();
};

// Middleware pour vérifier le rôle guardian
const requireGuardian = (req, res, next) => {
    if (req.user?.role !== 'guardian') {
        return res.status(403).json({ message: 'Accès réservé aux tuteurs' });
    }
    next();
};

module.exports = {
    authenticate,
    requireAdmin,
    requireGuardian
};
