import React, { useState, useEffect, useCallback, useRef } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import axios from 'axios';

const DEBOUNCE_MS = 300;

/**
 * Composant réutilisable : sélection Pays + Ville avec Autocomplete MUI.
 * - Pays : chargé depuis GET /api/geo/countries
 * - Ville : chargé depuis GET /api/geo/cities?country=CODE, désactivé tant qu'aucun pays
 * - value: { country: string (nom du pays), countryCode: string, city: string }
 * - onChange: ({ country, countryCode, city }) => {}
 */
const CountryCityAutocomplete = ({
  value = { country: '', countryCode: '', city: '' },
  onChange,
  countryLabel = 'Pays',
  cityLabel = 'Ville',
  size = 'medium',
  fullWidth = true,
  disabled = false,
}) => {
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState(null);
  const [citiesError, setCitiesError] = useState(null);
  const debounceRef = useRef(null);

  const fetchCountries = useCallback(async () => {
    setCountriesLoading(true);
    setCountriesError(null);
    try {
      const res = await axios.get('/api/geo/countries');
      setCountries(res.data.countries || []);
    } catch (err) {
      setCountriesError(err.response?.data?.message || 'Impossible de charger les pays');
      setCountries([]);
    } finally {
      setCountriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // Résoudre countryCode à partir du nom si on a country mais pas countryCode (ex: données profil)
  const resolvedCountryCode = value.countryCode || (value.country && countries.length
    ? (countries.find((c) => c.name === value.country)?.code ?? '')
    : '');
  const effectiveCountryCode = value.countryCode || resolvedCountryCode;

  const fetchCities = useCallback(async (countryCode) => {
    if (!countryCode) {
      setCities([]);
      return;
    }
    setCitiesLoading(true);
    setCitiesError(null);
    try {
      const res = await axios.get(`/api/geo/cities?country=${encodeURIComponent(countryCode)}`);
      setCities(res.data.cities || []);
    } catch (err) {
      setCitiesError(err.response?.data?.message || 'Impossible de charger les villes');
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!effectiveCountryCode) {
      setCities([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchCities(effectiveCountryCode);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [effectiveCountryCode, fetchCities]);

  const selectedCountry = countries.find(
    (c) => c.code === effectiveCountryCode || c.name === value.country
  ) || (value.country ? { code: effectiveCountryCode || '', name: value.country } : null);

  const handleCountryChange = (_, newValue) => {
    const country = newValue?.name ?? '';
    const countryCode = newValue?.code ?? '';
    onChange({ ...value, country, countryCode, city: '' });
  };

  const handleCityChange = (_, newValue) => {
    const city = typeof newValue === 'string' ? newValue : (newValue ?? '');
    onChange({ ...value, city });
  };

  const cityOptions = cities;
  const cityValue = value.city || null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: fullWidth ? '100%' : 'auto' }}>
      <Autocomplete
        size={size}
        fullWidth={fullWidth}
        disabled={disabled}
        options={countries}
        getOptionLabel={(opt) => opt.name || ''}
        value={selectedCountry}
        onChange={handleCountryChange}
        loading={countriesLoading}
        isOptionEqualToValue={(opt, val) => (opt.code && val.code ? opt.code === val.code : opt.name === val.name)}
        noOptionsText={countriesError || (countries.length === 0 && !countriesLoading ? 'Aucun pays trouvé' : 'Saisir pour rechercher...')}
        renderInput={(params) => (
          <TextField
            {...params}
            label={countryLabel}
            error={!!countriesError}
            helperText={countriesError}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {countriesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
      <Autocomplete
        size={size}
        fullWidth={fullWidth}
        disabled={disabled || !value.countryCode}
        options={cityOptions}
        getOptionLabel={(opt) => opt || ''}
        value={cityValue || null}
        onChange={handleCityChange}
        freeSolo
        loading={citiesLoading}
        noOptionsText={
          citiesError
            ? citiesError
            : value.countryCode && cities.length === 0 && !citiesLoading
            ? 'Aucune ville trouvée'
            : !value.countryCode
            ? 'Sélectionnez d\'abord un pays'
            : 'Saisir pour rechercher...'
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={cityLabel}
            error={!!citiesError}
            helperText={citiesError}
            placeholder={!effectiveCountryCode ? 'Sélectionnez d\'abord un pays' : undefined}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {citiesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </Box>
  );
};

export default CountryCityAutocomplete;
