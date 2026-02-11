import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const ADMIN_APP_URL = process.env.REACT_APP_ADMIN_URL || 'http://localhost:3001';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="home-navbar">
        <div className="home-navbar-content">
          <Link to="/" className="home-logo">
            ⚡ Storm Connect
          </Link>
          <div className="home-nav-links">
            {isAuthenticated ? (
              user?.role === 'admin' ? (
                <a href={ADMIN_APP_URL} className="btn-nav btn-primary-nav">Back Office</a>
              ) : (
                <Link to="/user" className="btn-nav btn-primary-nav">Mon espace</Link>
              )
            ) : (
              <>
                <Link to="/login" className="btn-nav btn-outline-nav">
                  Connexion
                </Link>
                <Link to="/register" className="btn-nav btn-primary-nav">
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            Trouvez l'amour <span className="highlight">authentique</span>
          </h1>
          <p className="hero-subtitle">
            Rejoignez des milliers de célibataires sérieux à la recherche d'une relation durable.
            Notre plateforme vous accompagne dans votre quête du bonheur.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn-hero btn-primary-hero">
              Commencer gratuitement
            </Link>
            <Link to="/login" className="btn-hero btn-secondary-hero">
              J'ai déjà un compte
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Membres actifs</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Couples formés</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">98%</span>
              <span className="stat-label">Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <h2 className="section-title">Pourquoi nous choisir ?</h2>
          <p className="section-subtitle">
            Une approche moderne et respectueuse des rencontres
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Profils vérifiés</h3>
              <p>Tous nos membres passent par une vérification d'identité pour garantir des rencontres authentiques.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💕</div>
              <h3>Matching intelligent</h3>
              <p>Notre algorithme vous propose des profils compatibles selon vos critères et vos valeurs.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">👨‍👩‍👧</div>
              <h3>Accompagnement familial</h3>
              <p>Option unique : impliquez un tuteur de confiance dans votre démarche de rencontre.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Messagerie sécurisée</h3>
              <p>Échangez en toute sécurité avec vos matchs dans un environnement bienveillant.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Intentions sérieuses</h3>
              <p>Une communauté de célibataires engagés à la recherche d'une relation durable.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🌟</div>
              <h3>Support 24/7</h3>
              <p>Notre équipe est disponible pour vous accompagner à chaque étape de votre parcours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works-section">
        <div className="section-container">
          <h2 className="section-title">Comment ça marche ?</h2>
          <p className="section-subtitle">
            Trouvez l'amour en 4 étapes simples
          </p>
          
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Créez votre profil</h3>
              <p>Inscrivez-vous gratuitement et complétez votre profil avec vos informations et photos.</p>
            </div>
            
            <div className="step-arrow">→</div>
            
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Découvrez des profils</h3>
              <p>Parcourez les profils compatibles et exprimez votre intérêt en likant.</p>
            </div>
            
            <div className="step-arrow">→</div>
            
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Matchez</h3>
              <p>Quand l'intérêt est mutuel, c'est un match ! Vous pouvez commencer à discuter.</p>
            </div>
            
            <div className="step-arrow">→</div>
            
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Rencontrez-vous</h3>
              <p>Apprenez à vous connaître et organisez votre première rencontre.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="section-container">
          <h2 className="section-title">Ils ont trouvé l'amour</h2>
          <p className="section-subtitle">
            Découvrez les témoignages de nos membres
          </p>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"Grâce à Storm Connect, j'ai rencontré l'homme de ma vie. L'approche respectueuse et l'implication de nos familles ont rendu cette rencontre encore plus spéciale."</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">S</div>
                <div className="author-info">
                  <h4>Sarah, 28 ans</h4>
                  <p>Mariée depuis 1 an</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"Je cherchais une relation sérieuse et j'ai trouvé ma future épouse ici. Le système de matching est vraiment efficace et les profils sont de qualité."</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">A</div>
                <div className="author-info">
                  <h4>Ahmed, 32 ans</h4>
                  <p>Fiancé</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"La possibilité d'impliquer un tuteur m'a rassurée. J'ai pu faire des rencontres en toute confiance et j'ai finalement trouvé mon âme sœur."</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">F</div>
                <div className="author-info">
                  <h4>Fatima, 26 ans</h4>
                  <p>En couple depuis 6 mois</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Prêt(e) à trouver l'amour ?</h2>
          <p>Rejoignez notre communauté et commencez votre histoire aujourd'hui.</p>
          <Link to="/register" className="btn-cta">
            Créer mon profil gratuitement
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>⚡ Storm Connect</h3>
            <p>La plateforme de rencontres pour les cœurs sincères.</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Navigation</h4>
              <Link to="/login">Connexion</Link>
              <Link to="/register">Inscription</Link>
            </div>
            <div className="footer-column">
              <h4>Légal</h4>
              <a href="#">Conditions d'utilisation</a>
              <a href="#">Politique de confidentialité</a>
              <a href="#">RGPD</a>
            </div>
            <div className="footer-column">
              <h4>Contact</h4>
              <a href="mailto:contact@stormconnect.com">contact@stormconnect.com</a>
              <a href="#">Support</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 Storm Connect. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
