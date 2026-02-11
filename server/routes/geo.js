const express = require('express');
const router = express.Router();

const GEO_API_BASE = 'https://countriesnow.space/api/v0.1';

// Cache en mémoire pour éviter des appels répétés (optionnel)
let countriesCache = null;
let countriesCacheTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 heure

/**
 * GET /api/geo/countries
 * Retourne la liste des pays (code ISO2 + nom) depuis l'API publique.
 */
router.get('/countries', async (req, res) => {
  try {
    if (countriesCache && Date.now() - countriesCacheTime < CACHE_TTL_MS) {
      return res.json({ countries: countriesCache });
    }

    let data;
    let response = await fetch(`${GEO_API_BASE}/countries/iso`);
    if (response.ok) {
      data = await response.json();
    }
    if (!data || !data.data || !Array.isArray(data.data)) {
      response = await fetch(`${GEO_API_BASE}/countries`);
      if (!response.ok) {
        throw new Error(`API pays: ${response.status} ${response.statusText}`);
      }
      data = await response.json();
    }
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Format de réponse API pays invalide');
    }

    const countries = data.data
      .filter((c) => c.name && (c.code || c.Iso2 || c.iso2))
      .map((c) => ({
        code: (c.code || c.Iso2 || c.iso2 || '').toUpperCase(),
        name: c.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

    countriesCache = countries;
    countriesCacheTime = Date.now();

    res.json({ countries });
  } catch (error) {
    console.error('[GEO] Error fetching countries:', error);
    res.status(500).json({
      message: error.message || 'Impossible de charger la liste des pays',
    });
  }
});

/**
 * GET /api/geo/cities?country=CODE
 * Retourne la liste des villes pour un pays (code ISO2).
 */
router.get('/cities', async (req, res) => {
  try {
    const countryCode = (req.query.country || '').trim().toUpperCase();
    if (!countryCode) {
      return res.status(400).json({ message: 'Paramètre country (code pays) requis' });
    }

    // Récupérer le nom du pays si on a le cache, sinon un seul fetch
    let countryName = null;
    if (countriesCache) {
      const found = countriesCache.find((c) => c.code === countryCode);
      countryName = found ? found.name : null;
    }

    if (!countryName) {
      const listRes = await fetch(`${GEO_API_BASE}/countries/iso`);
      if (!listRes.ok) throw new Error('Impossible de récupérer les pays');
      const listData = await listRes.json();
      if (listData.data && Array.isArray(listData.data)) {
        const found = listData.data.find(
          (c) => (c.Iso2 || c.code || c.iso2) && (c.Iso2 || c.code || c.iso2).toUpperCase() === countryCode
        );
        countryName = found ? (found.name || found.country) : null;
      }
    }

    if (!countryName) {
      return res.status(404).json({ message: 'Pays non trouvé' });
    }

    const response = await fetch(`${GEO_API_BASE}/countries/cities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryName }),
    });

    if (!response.ok) {
      throw new Error(`API villes: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) {
      return res.json({ cities: [] });
    }

    const cities = data.data
      .filter((c) => typeof c === 'string' && c.trim())
      .map((c) => c.trim())
      .sort((a, b) => a.localeCompare(b, 'fr'));

    res.json({ cities });
  } catch (error) {
    console.error('[GEO] Error fetching cities:', error);
    res.status(500).json({
      message: error.message || 'Impossible de charger la liste des villes',
    });
  }
});

module.exports = router;
