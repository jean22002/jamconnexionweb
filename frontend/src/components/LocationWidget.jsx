import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Loader2, X, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const LocationWidget = ({ token }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('manual'); // 'manual' or 'gps'
  const [manualCity, setManualCity] = useState('');
  const [manualPostalCode, setManualPostalCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    fetchLocationStatus();
    const interval = setInterval(fetchLocationStatus, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (locationStatus?.enabled && locationStatus?.expires) {
      calculateTimeRemaining();
      const interval = setInterval(calculateTimeRemaining, 1000);
      return () => clearInterval(interval);
    }
  }, [locationStatus]);

  const fetchLocationStatus = async () => {
    try {
      const response = await axios.get(`${API}/api/musicians/me/temporary-location`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocationStatus(response.data);
    } catch (error) {
      console.error('Error fetching location status:', error);
    }
  };

  const calculateTimeRemaining = () => {
    if (!locationStatus?.expires) return;
    
    const now = new Date();
    const expires = new Date(locationStatus.expires);
    const diff = expires - now;

    if (diff <= 0) {
      setTimeRemaining('Expiré');
      fetchLocationStatus(); // Refresh to get updated status
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    setTimeRemaining(`${hours}h ${minutes}min`);
  };

  const activateTemporaryLocation = async () => {
    setLoading(true);
    try {
      if (method === 'gps') {
        // Request GPS location
        if (!navigator.geolocation) {
          toast.error('Géolocalisation non supportée par votre navigateur');
          setLoading(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const response = await axios.post(
                `${API}/api/musicians/me/temporary-location`,
                {
                  method: 'gps',
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              toast.success('📍 Localisation GPS activée pour 24h !');
              fetchLocationStatus();
              setIsOpen(false);
            } catch (error) {
              toast.error(error.response?.data?.detail || 'Erreur lors de l\'activation');
            } finally {
              setLoading(false);
            }
          },
          (error) => {
            toast.error('Impossible d\'obtenir votre position GPS');
            setLoading(false);
          }
        );
      } else {
        // Manual city input
        if (!manualCity.trim()) {
          toast.error('Veuillez entrer une ville');
          setLoading(false);
          return;
        }

        const response = await axios.post(
          `${API}/api/musicians/me/temporary-location`,
          {
            method: 'manual',
            city: manualCity,
            postal_code: manualPostalCode
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        toast.success(`📍 Localisation "${manualCity}" activée pour 24h !`);
        fetchLocationStatus();
        setIsOpen(false);
        setManualCity('');
        setManualPostalCode('');
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'activation');
      setLoading(false);
    }
  };

  const deactivateTemporaryLocation = async () => {
    setLoading(true);
    try {
      await axios.delete(`${API}/api/musicians/me/temporary-location`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Localisation temporaire désactivée');
      fetchLocationStatus();
      setLoading(false);
    } catch (error) {
      toast.error('Erreur lors de la désactivation');
      setLoading(false);
    }
  };

  if (!locationStatus) return null;

  return (
    <>
      {/* Floating Widget Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all ${
            locationStatus.enabled
              ? 'bg-gradient-to-r from-primary to-cyan-500 text-white'
              : 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20'
          }`}
        >
          <MapPin className={`w-5 h-5 ${locationStatus.enabled ? 'animate-pulse' : ''}`} />
          <span className="font-medium text-sm">
            {locationStatus.enabled ? 'En déplacement' : 'Localisation'}
          </span>
          {locationStatus.enabled && timeRemaining && (
            <span className="text-xs opacity-80">({timeRemaining})</span>
          )}
        </button>
      </div>

      {/* Modal/Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Mode En déplacement</h3>
                  <p className="text-xs text-muted-foreground">Système hybride de géolocalisation</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {locationStatus.enabled ? (
                <>
                  {/* Active Status */}
                  <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/30 rounded-xl">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-primary mb-1">Localisation active</p>
                      <p className="text-sm text-muted-foreground">
                        Vous êtes visible à : <span className="font-medium text-white">{locationStatus.city}</span>
                      </p>
                      {timeRemaining && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expire dans {timeRemaining}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Profile Location Info */}
                  <div className="text-sm text-muted-foreground p-3 bg-white/5 rounded-lg">
                    <p>
                      <span className="opacity-60">Ville d'origine :</span>{' '}
                      <span className="font-medium">{locationStatus.profile_city || 'Non renseignée'}</span>
                    </p>
                  </div>

                  {/* Deactivate Button */}
                  <button
                    onClick={deactivateTemporaryLocation}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-medium transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Désactivation...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        Désactiver le mode en déplacement
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* Activation Options */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Choisissez une méthode :</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMethod('manual')}
                        className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition ${
                          method === 'manual'
                            ? 'bg-primary text-white'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        📍 Saisie manuelle
                      </button>
                      <button
                        onClick={() => setMethod('gps')}
                        className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition ${
                          method === 'gps'
                            ? 'bg-primary text-white'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        🛰️ GPS automatique
                      </button>
                    </div>
                  </div>

                  {method === 'manual' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Ville</label>
                        <input
                          type="text"
                          value={manualCity}
                          onChange={(e) => setManualCity(e.target.value)}
                          placeholder="Ex: Paris"
                          className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Code postal (optionnel)</label>
                        <input
                          type="text"
                          value={manualPostalCode}
                          onChange={(e) => setManualPostalCode(e.target.value)}
                          placeholder="Ex: 75001"
                          className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-primary"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-sm">
                      <p className="font-medium text-cyan-400 mb-1">GPS automatique</p>
                      <p className="text-muted-foreground text-xs">
                        Votre navigateur va vous demander l'autorisation d'accéder à votre position.
                      </p>
                    </div>
                  )}

                  {/* Info */}
                  <div className="text-xs text-muted-foreground p-3 bg-white/5 rounded-lg">
                    ⏱️ La localisation temporaire sera active pendant <span className="font-semibold text-white">24 heures</span>.
                    Vous apparaîtrez dans les recherches d'établissements à proximité.
                  </div>

                  {/* Activate Button */}
                  <button
                    onClick={activateTemporaryLocation}
                    disabled={loading || (method === 'manual' && !manualCity.trim())}
                    className="w-full py-3 px-4 bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Activation...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4" />
                        Activer pour 24h
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LocationWidget;
