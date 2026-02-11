const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Configuration de la connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/site_rencontre';

// Options de connexion
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

// Connexion à MongoDB
mongoose.connect(MONGODB_URI, options)
    .then(() => {
        console.log('✅ Connected to MongoDB database');
    })
    .catch((err) => {
        console.error('❌ Database connection error:', err);
        process.exit(1);
    });

// Gestion des événements de connexion
mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

// Fermer proprement la connexion à l'arrêt de l'application
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
});

module.exports = mongoose;
