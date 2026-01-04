import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MapPin } from 'lucide-react';

export const CityAutocomplete = ({ value, onSelect, label = "Ville", placeholder = "Ex: Narbonne" }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Fermer les suggestions si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Rechercher les villes avec l'API geo.api.gouv.fr
  const searchCities = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(searchQuery)}&fields=nom,code,codesPostaux,codeDepartement,codeRegion,departement,region&boost=population&limit=10`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce pour éviter trop de requêtes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        searchCities(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (city) => {
    const cityData = {
      city: city.nom,
      postalCode: city.codesPostaux?.[0] || '',
      department: city.codeDepartement,
      departmentName: city.departement?.nom || '',
      region: city.region?.nom || ''
    };
    
    setQuery(city.nom);
    setShowSuggestions(false);
    onSelect(cityData);
  };

  return (
    <div ref={wrapperRef} className="relative space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="bg-black/20 border-white/10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((city) => (
            <button
              key={`${city.code}-${city.codesPostaux?.[0]}`}
              onClick={() => handleSelect(city)}
              className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-start gap-3 border-b border-white/5 last:border-0"
            >
              <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{city.nom}</p>
                <p className="text-sm text-muted-foreground">
                  {city.codesPostaux?.[0]} • {city.departement?.nom} ({city.codeDepartement}) • {city.region?.nom}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
