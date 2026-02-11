const mongoose = require('mongoose');
const User = require('./server/models/User');
const Match = require('./server/models/Match');
require('dotenv').config();

async function migrateExistingData() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/site_rencontre';
        
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');
        
        // 1. Mettre à jour les profils existants sans profile_validation_status
        console.log('\n📋 Migration des profils...');
        const usersUpdated = await User.updateMany(
            { 
                profile_validation_status: { $exists: false },
                role: 'user'
            },
            { 
                $set: { 
                    profile_validation_status: 'approved' // Les profils existants sont considérés comme validés
                } 
            }
        );
        console.log(`✅ ${usersUpdated.modifiedCount} profils mis à jour`);
        
        // 2. Mettre à jour les matches existants sans validation_status
        console.log('\n💕 Migration des matches...');
        const matchesUpdated = await Match.updateMany(
            { 
                validation_status: { $exists: false }
            },
            { 
                $set: { 
                    validation_status: 'approved', // Les matches existants sont considérés comme validés
                    is_active: true
                } 
            }
        );
        console.log(`✅ ${matchesUpdated.modifiedCount} matches mis à jour`);
        
        // 3. Mettre à jour l'admin pour qu'il soit validé
        console.log('\n👤 Migration de l\'admin...');
        const adminUpdated = await User.updateMany(
            { 
                role: 'admin',
                profile_validation_status: { $ne: 'approved' }
            },
            { 
                $set: { 
                    profile_validation_status: 'approved'
                } 
            }
        );
        console.log(`✅ ${adminUpdated.modifiedCount} admin(s) mis à jour`);
        
        console.log('\n✅ Migration terminée avec succès !');
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

migrateExistingData();
