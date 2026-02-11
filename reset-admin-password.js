const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/models/User');
require('dotenv').config();

async function resetAdminPassword() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/site_rencontre';
        
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB\n');
        
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        console.log('🔐 Réinitialisation du mot de passe admin...');
        console.log('Email:', adminEmail);
        console.log('Nouveau mot de passe:', adminPassword);
        console.log('');
        
        // Chercher l'admin
        const admin = await User.findOne({ email: adminEmail.toLowerCase() });
        
        if (!admin) {
            console.log('❌ Aucun admin trouvé avec cet email !');
            console.log('💡 Créez d\'abord l\'admin avec: node create-admin.js');
            await mongoose.connection.close();
            process.exit(1);
        }
        
        // Hasher le nouveau mot de passe
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        
        // Mettre à jour le mot de passe
        admin.password_hash = passwordHash;
        admin.is_active = true; // S'assurer qu'il est actif
        await admin.save();
        
        console.log('✅ Mot de passe réinitialisé avec succès !');
        console.log('\n🎉 Vous pouvez maintenant vous connecter avec :');
        console.log('   Email:', adminEmail);
        console.log('   Mot de passe:', adminPassword);
        console.log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion !');
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

resetAdminPassword();
