import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Map as MapIcon, List } from 'lucide-react';
import VenueMap from '../components/VenueMap';
import { Button } from '../components/ui/button';

export default function MapExplorer() {
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 glassmorphism border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  Carte des Établissements
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Découvrez les lieux musicaux près de chez vous
                </p>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                onClick={() => setViewMode('map')}
              >
                <MapIcon className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Carte</span>
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Liste</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'map' ? (
          <VenueMap />
        ) : (
          <div className="glassmorphism rounded-2xl p-6 border border-white/10">
            <p className="text-center text-muted-foreground">
              Vue liste à venir... Utilisez la carte pour l'instant 🗺️
            </p>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="glassmorphism rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <MapIcon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">Carte Interactive</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Explorez visuellement tous les établissements musicaux référencés
            </p>
          </div>

          <div className="glassmorphism rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="font-semibold">Géolocalisation</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Trouvez les lieux les plus proches de votre position actuelle
            </p>
          </div>

          <div className="glassmorphism rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
              <h3 className="font-semibold">Filtres Pratiques</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Filtrez par type d'établissement : bars, salles de concert, etc.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
