-- Script de seed pour créer des données de test
-- ATTENTION: Ne pas utiliser en production

-- Créer un utilisateur admin de test
-- Le mot de passe est "admin123" (hashé avec bcrypt)
INSERT INTO users (email, password_hash, first_name, last_name, gender, date_of_birth, role, gdpr_consent, gdpr_consent_date, is_active, is_verified)
VALUES (
  'admin@test.com',
  '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', -- À remplacer par un vrai hash
  'Admin',
  'Test',
  'male',
  '1990-01-01',
  'admin',
  true,
  CURRENT_TIMESTAMP,
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- Note: Pour générer un vrai hash de mot de passe, utiliser:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('votre-mot-de-passe', 10);
