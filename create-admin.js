const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/models/User');
const Guardian = require('./server/models/Guardian');
require('dotenv').config();

async function createAdmin() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/site_rencontre';
        
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');
        
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        // Vérifier si l'admin existe déjà
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('⚠️  Admin existe déjà !');
            console.log('Email:', adminEmail);
            await mongoose.connection.close();
            process.exit(0);
        }
        
        // Créer l'admin
        console.log('👤 Création de l\'administrateur...');
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        const admin = await User.create({
            email: adminEmail,
            password_hash: passwordHash,
            first_name: 'Admin',
            last_name: 'User',
            gender: 'male',
            date_of_birth: new Date('1990-01-01'),
            role: 'admin',
            is_verified: true,
            is_active: true,
            profile_validation_status: 'approved', // Profil validé automatiquement pour l'admin
            gdpr_consent: true,
            gdpr_consent_date: new Date()
        });
        
        console.log('✅ Admin créé avec succès !');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Mot de passe:', adminPassword);
        console.log('⚠️  IMPORTANT: Changez le mot de passe après la première connexion !');
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

createAdmin();
