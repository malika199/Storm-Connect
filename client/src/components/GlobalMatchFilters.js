import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import CountryCityAutocomplete from './CountryCityAutocomplete';
import './GlobalMatchFilters.css';

const GlobalMatchFilters = () => {
  const [filters, setFilters] = useState({
    preferred_smoker: '',
    preferred_halal: '',
    preferred_alcohol: '',
    min_height_cm: '',
    max_height_cm: '',
    preferred_city: '',
    preferred_country: '',
    preferred_country_code: ''
  });
  const [filtersSaving, setFiltersSaving] = useState(false);

  const fetchSearchCriteria = useCallback(async () => {
    try {
      const response = await axios.get('/api/users/search-criteria');
      const c = response.data.criteria;
      if (c) {
        setFilters(prev => ({
          ...prev,
          preferred_smoker: c.preferred_smoker === true ? 'yes' : c.preferred_smoker === false ? 'no' : '',
          preferred_halal: c.preferred_halal === true ? 'yes' : c.preferred_halal === false ? 'no' : '',
          preferred_alcohol: c.preferred_alcohol === true ? 'yes' : c.preferred_alcohol === false ? 'no' : '',
          min_height_cm: c.min_height_cm ?? '',
          max_height_cm: c.max_height_cm ?? '',
          preferred_city: c.preferred_city ?? '',
          preferred_country: c.preferred_country ?? '',
          preferred_country_code: ''
        }));
      }
    } catch (err) {
      console.error('Error fetching search criteria:', err);
    }
  }, []);

  useEffect(() => {
    fetchSearchCriteria();
  }, [fetchSearchCriteria]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = async () => {
    setFiltersSaving(true);
    try {
      const payload = {
        preferred_smoker: filters.preferred_smoker === '' ? null : filters.preferred_smoker === 'yes',
        preferred_halal: filters.preferred_halal === '' ? null : filters.preferred_halal === 'yes',
        preferred_alcohol: filters.preferred_alcohol === '' ? null : filters.preferred_alcohol === 'yes',
        min_height_cm: filters.min_height_cm ? parseInt(filters.min_height_cm, 10) : null,
        max_height_cm: filters.max_height_cm ? parseInt(filters.max_height_cm, 10) : null,
        preferred_city: filters.preferred_city.trim() || null,
        preferred_country: filters.preferred_country.trim() || null
      };
      await axios.post('/api/users/search-criteria', payload);
      toast.success('Filtres appliqués');
    } catch (err) {
      console.error('Error saving filters:', err);
      toast.error('Erreur lors de l\'enregistrement des filtres');
    } finally {
      setFiltersSaving(false);
    }
  };

  return (
    <div className="global-filters-wrapper">
      <div className="match-filters-card">
        <div className="match-filters-header">
          <div className="match-filters-title">
            <span className="filters-icon">🔍</span>
            <span>Filtres</span>
          </div>
        </div>
        <div className="match-filters-content">
          <div className="filters-row">
            <select name="preferred_smoker" value={filters.preferred_smoker} onChange={handleFilterChange} className="match-filter-select">
              <option value="">🚬 Fumeur : Tous</option>
              <option value="no">Non fumeur</option>
              <option value="yes">Fumeur</option>
            </select>
            <select name="preferred_halal" value={filters.preferred_halal} onChange={handleFilterChange} className="match-filter-select">
              <option value="">🍖 Halal : Tous</option>
              <option value="yes">Oui</option>
              <option value="no">Non</option>
            </select>
            <select name="preferred_alcohol" value={filters.preferred_alcohol} onChange={handleFilterChange} className="match-filter-select">
              <option value="">🍷 Alcool : Tous</option>
              <option value="no">Ne boit pas</option>
              <option value="yes">Boit</option>
            </select>
            <div className="height-filter-group">
              <label className="height-label">Taille</label>
              <div className="height-inputs-row">
                <input type="number" name="min_height_cm" value={filters.min_height_cm} onChange={handleFilterChange} placeholder="Min" className="match-filter-input" min="100" max="250" />
                <span className="height-separator">-</span>
                <input type="number" name="max_height_cm" value={filters.max_height_cm} onChange={handleFilterChange} placeholder="Max" className="match-filter-input" min="100" max="250" />
                <span className="height-unit">cm</span>
              </div>
            </div>
            <div className="geo-filter-group">
              <CountryCityAutocomplete
                value={{ country: filters.preferred_country, countryCode: filters.preferred_country_code || '', city: filters.preferred_city }}
                onChange={({ country, countryCode, city }) => setFilters(prev => ({ ...prev, preferred_country: country, preferred_country_code: countryCode || '', preferred_city: city }))}
                countryLabel="Pays"
                cityLabel="Ville"
                size="small"
              />
            </div>
            <button type="button" onClick={applyFilters} className="btn btn-primary match-filters-btn" disabled={filtersSaving}>
              {filtersSaving ? (
                <>
                  <span className="btn-spinner"></span>
                  <span>...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Appliquer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalMatchFilters;
