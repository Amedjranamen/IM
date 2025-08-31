import React, { useState, useEffect, useMemo } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useParams } from "react-router-dom";
import Header from "./components/Header";
import PropertyCard from "./components/PropertyCard";
import PropertyDetails from "./components/PropertyDetails";
import PropertyForm from "./components/PropertyForm";
import FilterSidebar from "./components/FilterSidebar";
import MapView from "./components/MapView";
import MapSearch from "./components/MapSearch";
import { Toaster } from "./components/ui/toaster";
import { AppProvider, useApp } from "./contexts/AppContext";

const Home = () => {
  const { 
    properties, 
    loading, 
    error, 
    loadProperties, 
    likeProperty,
    deleteProperty
  } = useApp();
  
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const navigate = useNavigate();

  // Charger les propriétés au démarrage
  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Recharger les propriétés quand les filtres ou la recherche changent
  useEffect(() => {
    const searchFilters = {};
    
    if (searchTerm) {
      searchFilters.search = searchTerm;
    }
    
    const combinedFilters = { ...filters, ...searchFilters };
    loadProperties(combinedFilters);
  }, [searchTerm, filters, loadProperties]);

  // Shuffle properties for random feed
  const shuffledProperties = useMemo(() => {
    return [...properties].sort(() => Math.random() - 0.5);
  }, [properties]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  const handleLike = async (propertyId, isLiked) => {
    await likeProperty(propertyId, isLiked);
  };

  const handleViewDetails = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    setSelectedProperty(property);
    setShowPropertyDetails(true);
  };

  const handlePropertySelect = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    setSelectedProperty(property);
    setShowPropertyDetails(true);
  };

  const handlePublish = () => {
    navigate('/publish');
  };

  const handleAdvancedSearch = () => {
    setShowAdvancedSearch(true);
  };

  const handleEditProperty = (property) => {
    navigate('/publish', { state: { property } });
  };

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette propriété ?')) {
      await deleteProperty(propertyId);
      setShowPropertyDetails(false);
      setSelectedProperty(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSearch={handleSearch}
        onShowMap={() => setShowMap(!showMap)}
        onPublish={handlePublish}
        onAdvancedSearch={handleAdvancedSearch}
        showMap={showMap}
      />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-600 to-orange-700 text-white py-16">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1705858246897-70ecc1d42662?w=1920)'
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            IMMO&CO
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Votre plateforme immobilière au Gabon
          </p>
          <p className="text-lg opacity-80">
            Trouvez la propriété de vos rêves ou vendez votre bien en toute simplicité
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Hidden on map view */}
          {!showMap && (
            <div className="lg:w-80 space-y-6">
              <FilterSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClear={handleClearFilters}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {showMap ? 'Carte des biens' : 'Biens immobiliers'}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({shuffledProperties.length} résultat{shuffledProperties.length !== 1 ? 's' : ''})
                </span>
              </h2>
            </div>

            {/* Map or Grid View */}
            {showMap ? (
              <MapView
                properties={shuffledProperties}
                onPropertySelect={handlePropertySelect}
                onClose={() => setShowMap(false)}
                selectedProperty={selectedProperty}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                  <div className="col-span-full text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="text-gray-500 text-lg mt-4">Chargement des propriétés...</p>
                  </div>
                ) : error ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-red-500 text-lg">{error}</p>
                  </div>
                ) : shuffledProperties.length > 0 ? (
                  shuffledProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onLike={handleLike}
                      onViewDetails={handleViewDetails}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500 text-lg">
                      Aucun bien ne correspond à vos critères de recherche.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <MapSearch
          onClose={() => setShowAdvancedSearch(false)}
        />
      )}

      {/* Property Details Modal */}
      {showPropertyDetails && selectedProperty && (
        <PropertyDetails
          property={selectedProperty}
          onClose={() => {
            setShowPropertyDetails(false);
            setSelectedProperty(null);
          }}
          onEdit={handleEditProperty}
          onDelete={handleDeleteProperty}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/publish" element={<PublishPage />} />
            <Route path="/property/:id" element={<PropertyDetailsPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AppProvider>
    </div>
  );
}

// Page de publication de propriété
const PublishPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const property = location.state?.property; // Pour l'édition

  const handleSubmit = (newProperty) => {
    // Rediriger vers la page d'accueil après soumission
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSearch={() => {}}
        onShowMap={() => {}}
        onPublish={() => navigate('/publish')}
        onAdvancedSearch={() => {}}
        showMap={false}
      />
      <PropertyForm
        property={property}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
};

// Page de détails de propriété (route séparée)
const PropertyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties, deleteProperty } = useApp();
  const [property, setProperty] = useState(null);

  useEffect(() => {
    const foundProperty = properties.find(p => p.id === id);
    setProperty(foundProperty);
  }, [id, properties]);

  const handleEditProperty = (prop) => {
    navigate('/publish', { state: { property: prop } });
  };

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette propriété ?')) {
      await deleteProperty(propertyId);
      navigate('/');
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Propriété non trouvée</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSearch={() => {}}
        onShowMap={() => {}}
        onPublish={() => navigate('/publish')}
        showMap={false}
      />
      <PropertyDetails
        property={property}
        onClose={() => navigate('/')}
        onEdit={handleEditProperty}
        onDelete={handleDeleteProperty}
      />
    </div>
  );
};

export default App;
