import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import CountryCityAutocomplete from '../../components/CountryCityAutocomplete';
import './Profile.css';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    city: '',
    country: '',
    countryCode: '',
    profession: '',
    education: '',
    religion: '',
    height_cm: '',
    smoker: '',
    halal: '',
    alcohol: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      const user = response.data.user;
      setProfile(user);
      setFormData({
        bio: user.bio || '',
        city: user.city || '',
        country: user.country || '',
        profession: user.profession || '',
        education: user.education || '',
        religion: user.religion || '',
        height_cm: user.height_cm || '',
        smoker: user.smoker === true ? 'yes' : user.smoker === false ? 'no' : '',
        halal: user.halal === true ? 'yes' : user.halal === false ? 'no' : '',
        alcohol: user.alcohol === true ? 'yes' : user.alcohol === false ? 'no' : ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...formData,
      smoker: formData.smoker === 'yes' ? true : formData.smoker === 'no' ? false : null,
      halal: formData.halal === 'yes' ? true : formData.halal === 'no' ? false : null,
      alcohol: formData.alcohol === 'yes' ? true : formData.alcohol === 'no' ? false : null
    };

    try {
      await axios.put('/api/users/profile', payload);
      toast.success('Profil mis à jour avec succès');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(type === 'picture' ? 'picture' : 'photos', file);

    try {
      if (type === 'picture') {
        await axios.post('/api/users/profile/picture', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Photo de profil mise à jour');
      } else {
        await axios.post('/api/users/photos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Photo ajoutée');
      }
      fetchProfile();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleIdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('id_document', file);

    try {
      await axios.post('/api/users/verification/id', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Pièce d\'identité téléchargée, en attente de vérification');
      fetchProfile();
    } catch (error) {
      console.error('Error uploading ID:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  if (loading) {
    return (
      <>
        <div className="container">
          <div className="loading">
            <div className="spinner" />
            <p>Chargement du profil...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="profile-page">
        <div className="container">
          <h1>Mon Profil</h1>
        
        <div className="card">
          <h2>Informations personnelles</h2>
          <p><strong>Nom:</strong> {profile.first_name} {profile.last_name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Genre:</strong> {profile.gender === 'male' ? 'Homme' : profile.gender === 'female' ? 'Femme' : 'Autre'}</p>
          <p><strong>Statut de vérification:</strong> 
            {profile.id_verification_status === 'verified' ? ' ✅ Vérifié' : 
             profile.id_verification_status === 'rejected' ? ' ❌ Rejeté' : 
             ' ⏳ En attente'}
          </p>
        </div>

        <div className="card">
          <h2>Photo de profil</h2>
          {profile.profile_picture_url && (
            <img src={profile.profile_picture_url} alt="Profil" style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px' }} />
          )}
          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'picture')} />
        </div>

        <div className="card">
          <h2>Photos supplémentaires</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
            {profile.photos && profile.photos.map((photo, index) => (
              <img key={index} src={photo} alt={`Photo ${index + 1}`} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
            ))}
          </div>
          <input type="file" accept="image/*" multiple onChange={(e) => handleFileUpload(e, 'photos')} />
        </div>

        <div className="card">
          <h2>Modifier mon profil</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Parlez-nous de vous..."
              />
            </div>

            <div className="form-group">
              <label>Pays et ville</label>
              <CountryCityAutocomplete
                value={{ country: formData.country, countryCode: formData.countryCode || '', city: formData.city }}
                onChange={({ country, countryCode, city }) => setFormData((prev) => ({ ...prev, country, countryCode: countryCode || '', city }))}
                countryLabel="Pays"
                cityLabel="Ville"
              />
            </div>

            <div className="form-group">
              <label>Profession</label>
              <input
                type="text"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Éducation</label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Religion</label>
                <input
                  type="text"
                  name="religion"
                  value={formData.religion}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Taille (cm)</label>
                <input
                  type="number"
                  name="height_cm"
                  value={formData.height_cm}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fumeur</label>
                <select name="smoker" value={formData.smoker} onChange={handleChange}>
                  <option value="">Non renseigné</option>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </div>
              <div className="form-group">
                <label>Viande halal</label>
                <select name="halal" value={formData.halal} onChange={handleChange}>
                  <option value="">Non renseigné</option>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </div>
              <div className="form-group">
                <label>Boit de l'alcool</label>
                <select name="alcohol" value={formData.alcohol} onChange={handleChange}>
                  <option value="">Non renseigné</option>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Vérification d'identité (optionnel)</h2>
          <p>Téléchargez une pièce d'identité pour augmenter votre crédibilité</p>
          <input type="file" accept="image/*,.pdf" onChange={handleIdUpload} />
        </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;
