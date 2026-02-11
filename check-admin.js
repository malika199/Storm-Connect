const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/models/User');
require('dotenv').config();

async function checkAdmin() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/site_rencontre';
        
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB\n');
        
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        console.log('📋 Vérification de l\'admin...');
        console.log('Email recherché:', adminEmail);
        console.log('Mot de passe testé:', adminPassword);
        console.log('');
        
        // Chercher l'admin
        const admin = await User.findOne({ email: adminEmail.toLowerCase() });
        
        if (!admin) {
            console.log('❌ Aucun admin trouvé avec cet email !');
            console.log('\n💡 Solutions :');
            console.log('1. Vérifiez que ADMIN_EMAIL dans .env correspond à l\'email utilisé');
            console.log('2. Exécutez: node create-admin.js pour créer l\'admin');
            console.log('3. Vérifiez tous les admins existants :');
            
            const allAdmins = await User.find({ role: 'admin' });
            if (allAdmins.length > 0) {
                console.log('\n📋 Admins existants dans la base :');
                allAdmins.forEach(a => {
                    console.log(`   - Email: ${a.email}, Actif: ${a.is_active}, Vérifié: ${a.is_verified}`);
                });
            } else {
                console.log('   Aucun admin trouvé dans la base de données');
            }
        } else {
            console.log('✅ Admin trouvé !');
            console.log('📧 Email:', admin.email);
            console.log('👤 Nom:', admin.first_name, admin.last_name);
            console.log('🔑 Rôle:', admin.role);
            console.log('✅ Actif:', admin.is_active);
            console.log('✅ Vérifié:', admin.is_verified);
            console.log('✅ Profil validé:', admin.profile_validation_status);
            console.log('');
            
            // Tester le mot de passe
            console.log('🔐 Test du mot de passe...');
            const isValidPassword = await bcrypt.compare(adminPassword, admin.password_hash);
            
            if (isValidPassword) {
                console.log('✅ Mot de passe CORRECT !');
                console.log('\n🎉 Vous pouvez vous connecter avec :');
                console.log('   Email:', adminEmail);
                console.log('   Mot de passe:', adminPassword);
            } else {
                console.log('❌ Mot de passe INCORRECT !');
                console.log('\n💡 Le mot de passe dans .env ne correspond pas au hash en base');
                console.log('Solutions :');
                console.log('1. Vérifiez ADMIN_PASSWORD dans votre .env');
                console.log('2. Réinitialisez le mot de passe avec: node reset-admin-password.js');
            }
            
            if (!admin.is_active) {
                console.log('\n⚠️  ATTENTION: Le compte admin est DÉSACTIVÉ !');
                console.log('   Activez-le avec: node activate-admin.js');
            }
        }
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

checkAdmin();
