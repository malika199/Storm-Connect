const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config();

async function activateAdmin() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/site_rencontre';
        
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB\n');
        
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        
        console.log('🔓 Activation du compte admin...');
        console.log('Email:', adminEmail);
        console.log('');
        
        // Chercher l'admin
        const admin = await User.findOne({ email: adminEmail.toLowerCase() });
        
        if (!admin) {
            console.log('❌ Aucun admin trouvé avec cet email !');
            console.log('💡 Créez d\'abord l\'admin avec: node create-admin.js');
            await mongoose.connection.close();
            process.exit(1);
        }
        
        // Activer le compte
        admin.is_active = true;
        admin.is_verified = true;
        admin.profile_validation_status = 'approved';
        await admin.save();
        
        console.log('✅ Compte admin activé avec succès !');
        console.log('\n📋 Statut du compte :');
        console.log('   Actif:', admin.is_active);
        console.log('   Vérifié:', admin.is_verified);
        console.log('   Profil validé:', admin.profile_validation_status);
        console.log('\n🎉 Vous pouvez maintenant vous connecter !');
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

activateAdmin();
